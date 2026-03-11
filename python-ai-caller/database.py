"""
Database Helper Functions for Multi-Tenant SaaS
All functions ensure data isolation by organization_id
"""
import logging
import mysql.connector
from typing import Optional, Tuple, Dict, Any
from datetime import datetime
from config import MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE


def get_db_connection():
    """Establishes MySQL connection to the SaaS database"""
    logging.info("Attempting to connect to MySQL database.")
    if not all([MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE]):
        logging.error("❌ MySQL connection details are missing or incomplete.")
        return None
    try:
        conn = mysql.connector.connect(
            host=MYSQL_HOST,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            database=MYSQL_DATABASE
        )
        logging.info("✅ MySQL connection successful.")
        return conn
    except mysql.connector.Error as err:
        logging.error(f"❌ MySQL connection error: {err}")
        return None


def get_organization_from_phone(twilio_phone: str) -> Tuple[Optional[int], Optional[str], Optional[str]]:
    """
    Maps Twilio phone number to organization
    Returns: (organization_id, doc_id, organization_name)
    """
    conn = get_db_connection()
    if not conn:
        return None, None, None
    
    logging.info(f"Mapping Twilio number {twilio_phone} to organization.")
    try:
        cursor = conn.cursor()
        query = """
            SELECT dm.organization_id, dm.vector_store_id, o.name
            FROM doc_mappings dm
            INNER JOIN organizations o ON dm.organization_id = o.id
            WHERE dm.phone_number = %s 
            AND dm.is_active = TRUE 
            AND o.status IN ('active', 'trial')
            LIMIT 1
        """
        cursor.execute(query, (twilio_phone,))
        result = cursor.fetchone()
        
        if result:
            org_id, doc_id, org_name = result
            logging.info(f"✅ Mapping found: Org ID {org_id}, Doc ID '{doc_id}', Org '{org_name}'")
            return org_id, doc_id, org_name
        
        logging.warning(f"⚠️ No mapping found for Twilio phone number {twilio_phone}.")
        return None, None, None
    except mysql.connector.Error as err:
        logging.error(f"❌ MySQL Error during organization lookup: {err}")
        return None, None, None
    finally:
        if conn and conn.is_connected():
            conn.close()


def get_or_create_contact(caller_phone: str, organization_id: int, name: Optional[str] = None, 
                          email: Optional[str] = None) -> Optional[int]:
    """
    Get existing contact or create new one for the organization
    Returns: contact_id
    """
    conn = get_db_connection()
    if not conn:
        return None
    
    logging.info(f"Looking up contact for phone: {caller_phone} in org {organization_id}")
    try:
        cursor = conn.cursor(dictionary=True)
        
        # Check if contact exists
        query = """
            SELECT id, name, email, status
            FROM contacts
            WHERE organization_id = %s AND phone = %s
            LIMIT 1
        """
        cursor.execute(query, (organization_id, caller_phone))
        result = cursor.fetchone()
        
        if result:
            contact_id = result['id']
            logging.info(f"✅ Existing contact found. ID: {contact_id}, Name: {result.get('name')}")
            
            # Update if new info provided
            if name or email:
                update_query = """
                    UPDATE contacts 
                    SET name = COALESCE(%s, name), 
                        email = COALESCE(%s, email),
                        last_contact_date = NOW(),
                        total_calls = total_calls + 1
                    WHERE id = %s
                """
                cursor.execute(update_query, (name, email, contact_id))
                conn.commit()
                logging.info(f"✅ Contact updated with new information.")
            
            return contact_id
        
        # Create new contact
        logging.info(f"Creating new contact for {caller_phone} in org {organization_id}")
        
        # Use 'Unknown Caller' if name is not provided
        contact_name = name if name else 'Unknown Caller'
        
        insert_query = """
            INSERT INTO contacts (
                organization_id, phone, name, email, 
                status, first_contact_date, total_calls
            ) VALUES (%s, %s, %s, %s, 'active', NOW(), 1)
        """
        cursor.execute(insert_query, (organization_id, caller_phone, contact_name, email))
        conn.commit()
        contact_id = cursor.lastrowid
        logging.info(f"✅ New contact created. ID: {contact_id}")
        return contact_id
        
    except mysql.connector.Error as err:
        logging.error(f"❌ MySQL Error during contact lookup/creation: {err}")
        return None
    finally:
        if conn and conn.is_connected():
            conn.close()


def log_call_record(organization_id: int, caller_phone: str, caller_name: Optional[str],
                   caller_email: Optional[str], transcript: str, ai_summary: str,
                   sentiment: str, intent: str, outcome: str, duration: int = 0) -> Optional[int]:
    """
    Log complete call record with AI analysis
    Returns: call_id
    """
    conn = get_db_connection()
    if not conn:
        return None
    
    logging.info(f"Logging call for org {organization_id}, phone {caller_phone}")
    try:
        cursor = conn.cursor()
        query = """
            INSERT INTO calls (
                organization_id, caller_phone, caller_name, caller_email,
                start_time, end_time, duration, status, outcome,
                transcript, ai_summary, sentiment, intent,
                first_contact_resolution, created_at
            ) VALUES (
                %s, %s, %s, %s,
                NOW() - INTERVAL %s SECOND, NOW(), SEC_TO_TIME(%s), 'answered', %s,
                %s, %s, %s, %s,
                TRUE, NOW()
            )
        """
        cursor.execute(query, (
            organization_id, caller_phone, caller_name, caller_email,
            duration, duration, outcome,
            transcript, ai_summary, sentiment, intent
        ))
        conn.commit()
        call_id = cursor.lastrowid
        logging.info(f"✅ Call logged successfully. Call ID: {call_id}")
        return call_id
    except mysql.connector.Error as err:
        logging.error(f"❌ MySQL Error during call logging: {err}")
        return None
    finally:
        if conn and conn.is_connected():
            conn.close()


def track_usage(organization_id: int, metric_type: str, quantity: int = 1):
    """
    Track usage for billing (calls, API requests, storage, etc.)
    """
    conn = get_db_connection()
    if not conn:
        return
    
    logging.info(f"Tracking usage: Org {organization_id}, Type {metric_type}, Qty {quantity}")
    try:
        cursor = conn.cursor()
        today = datetime.now().date()
        
        # Check if record exists for today
        check_query = """
            SELECT id, quantity FROM usage_metrics
            WHERE organization_id = %s 
            AND metric_type = %s 
            AND period_start = %s
        """
        cursor.execute(check_query, (organization_id, metric_type, today))
        result = cursor.fetchone()
        
        if result:
            # Update existing record
            update_query = """
                UPDATE usage_metrics 
                SET quantity = quantity + %s
                WHERE id = %s
            """
            cursor.execute(update_query, (quantity, result[0]))
        else:
            # Insert new record
            insert_query = """
                INSERT INTO usage_metrics (
                    organization_id, metric_type, quantity, 
                    period_start, period_end
                ) VALUES (%s, %s, %s, %s, %s)
            """
            cursor.execute(insert_query, (
                organization_id, metric_type, quantity, today, today
            ))
        
        conn.commit()
        logging.info(f"✅ Usage tracked successfully.")
    except mysql.connector.Error as err:
        logging.error(f"❌ MySQL Error during usage tracking: {err}")
    finally:
        if conn and conn.is_connected():
            conn.close()


def get_conversation_history(organization_id: int, caller_phone: str, limit: int = 5) -> str:
    """
    Get recent conversation history for context
    """
    conn = get_db_connection()
    if not conn:
        return ""
    
    history = []
    try:
        logging.info(f"Retrieving last {limit} calls for {caller_phone} in org {organization_id}")
        cursor = conn.cursor(dictionary=True)
        query = """
            SELECT transcript, ai_summary
            FROM calls
            WHERE organization_id = %s 
            AND caller_phone = %s 
            AND transcript IS NOT NULL
            ORDER BY created_at DESC 
            LIMIT %s
        """
        cursor.execute(query, (organization_id, caller_phone, limit))
        results = cursor.fetchall()
        
        for turn in reversed(results):
            if turn['transcript']:
                history.append(f"User: {turn['transcript']}")
            if turn['ai_summary']:
                history.append(f"Assistant: {turn['ai_summary']}")
        
        if history:
            logging.info(f"✅ Retrieved {len(results)} conversation turns.")
            return "\n".join(history)
        
        logging.info("No conversation history found.")
        return ""
    except mysql.connector.Error as err:
        logging.error(f"❌ MySQL Error during history retrieval: {err}")
        return ""
    finally:
        if conn and conn.is_connected():
            conn.close()


def create_appointment(organization_id: int, contact_id: int, appointment_date: str,
                      service_type: str, notes: str, call_id: Optional[int] = None) -> Optional[int]:
    """
    Create appointment record in database
    """
    conn = get_db_connection()
    if not conn:
        return None
    
    logging.info(f"Creating appointment for org {organization_id}, contact {contact_id}")
    try:
        cursor = conn.cursor()
        query = """
            INSERT INTO appointments (
                organization_id, call_id, contact_id,
                appointment_date, service_type, status, notes
            ) VALUES (%s, %s, %s, %s, %s, 'scheduled', %s)
        """
        cursor.execute(query, (
            organization_id, call_id, contact_id,
            appointment_date, service_type, notes
        ))
        conn.commit()
        appointment_id = cursor.lastrowid
        logging.info(f"✅ Appointment created. ID: {appointment_id}")
        return appointment_id
    except mysql.connector.Error as err:
        logging.error(f"❌ MySQL Error during appointment creation: {err}")
        return None
    finally:
        if conn and conn.is_connected():
            conn.close()
