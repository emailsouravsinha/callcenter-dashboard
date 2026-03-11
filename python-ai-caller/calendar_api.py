"""
Calendar API Integration - Schedule, Cancel, Reschedule meetings
"""
import logging
import httpx
from typing import Tuple, Optional
from datetime import datetime
from config import CALENDAR_API_BASE_URL
from database import create_appointment, track_usage


async def schedule_meeting_api(organization_id: int, contact_id: int, title: str, 
                               start_time: str, attendee_email: Optional[str], 
                               caller_phone: str, doc_id: str) -> Tuple[bool, Optional[str]]:
    """
    Schedules a meeting via external calendar API and creates database record
    Returns: (success: bool, event_id or error_code: str)
    """
    logging.info("--- Starting schedule_meeting_api call ---")
    
    if not CALENDAR_API_BASE_URL:
        logging.error("Booking failed: CALENDAR_API_BASE_URL is not set.")
        return False, "config_fail"
    
    url = f"{CALENDAR_API_BASE_URL}/events"
    headers = {"Content-Type": "application/json"}
    data = {
        "title": title,
        "start_time": start_time,
        "attendee_email": attendee_email,
        "caller_phone": caller_phone,
        "attendees": [{"email": attendee_email}] if attendee_email else []
    }
    params = {"tenant_id": doc_id}
    
    logging.info(f"Calendar API Endpoint: {url}")
    logging.info(f"Tenant ID (doc_id): {doc_id}")
    logging.info(f"Request Payload: {data}")
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, params=params, headers=headers, json=data)
            
        logging.info(f"Received API Response Status Code: {response.status_code}")
        logging.info(f"Received API Response Text: {response.text}")
        
        if response.status_code == 201:
            event_id = response.json().get("event_id", "NO_ID")
            logging.info(f"✅ Event booked successfully. Event ID: {event_id}")
            
            # Create appointment record in database
            appointment_id = create_appointment(
                organization_id=organization_id,
                contact_id=contact_id,
                appointment_date=start_time,
                service_type=title,
                notes=f"Booked via AI caller. External Event ID: {event_id}"
            )
            
            if appointment_id:
                logging.info(f"✅ Appointment record created in database. ID: {appointment_id}")
            
            # Track API usage
            track_usage(organization_id, 'api_requests', 1)
            
            return True, event_id
            
        elif response.status_code == 409:
            logging.warning("⚠️ Event booking conflict detected (409).")
            return False, "conflict"
        else:
            logging.error(f"❌ Calendar API Schedule Failed ({response.status_code}): {response.text}")
            return False, "error"
            
    except Exception as e:
        logging.error(f"❌ HTTP request (schedule) failed with an exception: {e}")
        return False, "system_fail"
    finally:
        logging.info("--- schedule_meeting_api call finished ---")


async def cancel_meeting_api(organization_id: int, event_id: str, doc_id: str) -> bool:
    """
    Cancels a meeting via external calendar API
    """
    if not CALENDAR_API_BASE_URL:
        return False
    
    url = f"{CALENDAR_API_BASE_URL}/events/{event_id}"
    headers = {"Content-Type": "application/json"}
    params = {"tenant_id": doc_id}
    
    logging.info(f"Attempting to cancel event ID {event_id} at {url}")
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.delete(url, params=params, headers=headers)
        
        logging.info(f"Cancel Response Status Code: {response.status_code}")
        
        if response.status_code in (200, 204):
            logging.info(f"✅ Event cancelled (ID: {event_id}).")
            
            # Track API usage
            track_usage(organization_id, 'api_requests', 1)
            
            return True
        else:
            logging.error(f"❌ Calendar API Cancel Failed ({response.status_code}): {response.text}")
            return False
            
    except Exception as e:
        logging.error(f"❌ HTTP request (cancel) failed: {e}")
        return False


async def reschedule_meeting_api(organization_id: int, event_id: str, 
                                 new_start_time: str, doc_id: str) -> bool:
    """
    Reschedules a meeting via external calendar API
    """
    if not CALENDAR_API_BASE_URL:
        return False
    
    url = f"{CALENDAR_API_BASE_URL}/events/{event_id}"
    headers = {"Content-Type": "application/json"}
    data = {"start_time": new_start_time}
    params = {"tenant_id": doc_id}
    
    logging.info(f"Attempting to reschedule event ID {event_id} to {new_start_time} at {url}")
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.patch(url, params=params, headers=headers, json=data)
        
        logging.info(f"Reschedule Response Status Code: {response.status_code}")
        
        if response.status_code in (200, 204):
            logging.info(f"✅ Event rescheduled (ID: {event_id}) to {new_start_time}.")
            
            # Track API usage
            track_usage(organization_id, 'api_requests', 1)
            
            return True
        else:
            logging.error(f"❌ Calendar API Reschedule Failed ({response.status_code}): {response.text}")
            return False
            
    except Exception as e:
        logging.error(f"❌ HTTP request (reschedule) failed: {e}")
        return False


async def handle_meeting_request(extracted_details: dict, organization_id: int, 
                                 contact_id: int, doc_id: str, 
                                 attendee_email: Optional[str], caller_phone: str) -> str:
    """
    Handles the execution of scheduling, canceling, or rescheduling a meeting
    """
    logging.info(f"--- Handling meeting request: Action is {extracted_details.get('action')} ---")
    
    action = extracted_details.get("action")
    start_time_str = extracted_details.get("start_time")
    title = extracted_details.get("title")
    event_id = extracted_details.get("event_id")
    
    if action in ("system_fail", "unknown"):
        logging.warning(f"Failed to process request. Action: {action}. Details: {extracted_details}")
        return "I had trouble understanding your request to schedule, cancel, or reschedule. Could you please clearly state what you'd like to do, including the date, time & the purpose if you're booking."
    
    # --- Schedule Action ---
    if action == "schedule":
        logging.info("Routing to SCHEDULE action.")
        if not start_time_str:
            logging.warning("Schedule failure: start_time is missing.")
            return "I heard you want to schedule a meeting, but I need a specific date, time & the purpose to check availability. Please state the full date and time you'd like to book."
        
        final_title = title if title else "Meeting"
        
        booking_success, status_or_id = await schedule_meeting_api(
            organization_id, contact_id, final_title, start_time_str, 
            attendee_email, caller_phone, doc_id
        )
        
        logging.info(f"Schedule API call result: Success={booking_success}, Status/ID={status_or_id}")
        
        if booking_success:
            formatted_time = datetime.fromisoformat(start_time_str).strftime('%A, %B %d at %I:%M %p')
            return f"Confirmation: I have successfully booked your meeting titled '{final_title}' on {formatted_time}. The appointment ID is {status_or_id}."
        elif status_or_id == "conflict":
            formatted_time = datetime.fromisoformat(start_time_str).strftime('%A, %B %d at %I:%M %p')
            return f"I'm sorry, the requested time slot on {formatted_time} is unavailable. Please try a different time."
        elif status_or_id == "config_fail":
            return "I'm sorry, the meeting system configuration is invalid. Please contact technical support."
        else:
            return "I'm sorry, I was unable to schedule the meeting due to a system error. Please try calling back later."
    
    # --- Cancel Action ---
    elif action == "cancel":
        logging.info("Routing to CANCEL action.")
        if not event_id:
            logging.warning("Cancel failure: event_id is missing.")
            return "I heard you want to cancel a meeting. Do you have the appointment ID for the meeting you want to cancel?"
        
        cancel_success = await cancel_meeting_api(organization_id, event_id, doc_id)
        
        if cancel_success:
            return f"The meeting with ID {event_id} has been successfully cancelled. Is there anything else I can help you with?"
        else:
            return f"I was unable to find or cancel the meeting with ID {event_id}. Please ensure the ID is correct."
    
    # --- Reschedule Action ---
    elif action == "reschedule":
        logging.info("Routing to RESCHEDULE action.")
        if not event_id or not start_time_str:
            logging.warning("Reschedule failure: event_id or start_time is missing.")
            return "To reschedule, I need both the appointment ID and the new date and time. Please provide both clearly."
        
        reschedule_success = await reschedule_meeting_api(organization_id, event_id, start_time_str, doc_id)
        
        if reschedule_success:
            formatted_time = datetime.fromisoformat(start_time_str).strftime('%A, %B %d at %I:%M %p')
            return f"The meeting with ID {event_id} has been successfully moved to {formatted_time}."
        else:
            return f"I was unable to reschedule meeting ID {event_id} to {datetime.fromisoformat(start_time_str).strftime('%A, %B %d at %I:%M %p')}. The new slot may be unavailable."
    
    return "I'm sorry, I couldn't process that request. Please try again."
