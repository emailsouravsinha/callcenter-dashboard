"""
AI Call Answering System - SaaS Multi-Tenant Version
Main FastAPI application with Twilio integration
"""
import logging
from typing import Optional
from fastapi import FastAPI, Form
from fastapi.responses import PlainTextResponse, JSONResponse
from twilio.twiml.voice_response import VoiceResponse
from openai import OpenAI

# Import our modules
from config import (
    OPENAI_API_KEY, FAISS_PATH, GREETING, FIRST_TIME_GREETING, 
    SUCCESS_CAPTURE, DEFAULT_FAIL_ANSWER
)
from database import (
    get_organization_from_phone, get_or_create_contact, 
    log_call_record, track_usage, get_conversation_history
)
from ai_helpers import (
    load_vectorstore, get_ai_answer, extract_user_details_with_llm,
    analyze_sentiment, extract_intent, extract_meeting_details
)
from calendar_api import handle_meeting_request

logging.info("=== AI Call Answering System Starting ===")
logging.info("Multi-Tenant SaaS Version with Complete Data Isolation")

# Initialize OpenAI Client
openai_client: Optional[OpenAI] = None
try:
    if OPENAI_API_KEY:
        openai_client = OpenAI(api_key=OPENAI_API_KEY)
        logging.info("✅ OpenAI client initialized.")
except Exception as e:
    logging.error(f"❌ Could not initialize OpenAI client: {e}")

# Initialize FAISS Vector Store
db = load_vectorstore(FAISS_PATH)

# Initialize FastAPI
app = FastAPI(title="AI Call Answering System - Multi-Tenant")


async def process_user_turn(caller_input: str, twilio_phone: str, caller_phone: str) -> str:
    """
    Core logic processing for each conversation turn
    Handles multi-tenant data isolation and AI responses
    """
    logging.info("\n\n=============== STARTING LOGIC PROCESSING ===============")
    logging.info(f"Input: '{caller_input[:50]}...' | Twilio: {twilio_phone} | Caller: {caller_phone}")
    
    # 1. Map Twilio Phone to Organization (CRITICAL FOR MULTI-TENANCY)
    org_id, doc_id, org_name = get_organization_from_phone(twilio_phone)
    
    if not org_id:
        logging.error(f"❌ No organization found for Twilio number: {twilio_phone}")
        return "This phone number is not configured. Please contact support."
    
    logging.info(f"✅ Organization identified: ID={org_id}, Name={org_name}, DocID={doc_id}")
    
    # 2. Track usage for billing
    track_usage(org_id, 'calls', 1)
    
    # 3. Check if contact exists (for first-time caller detection)
    from database import get_db_connection
    conn = get_db_connection()
    is_first_time_caller = False
    contact_id = None
    contact_name = None
    contact_email = None
    
    if conn:
        try:
            cursor = conn.cursor(dictionary=True)
            query = "SELECT id, name, email FROM contacts WHERE organization_id = %s AND phone = %s LIMIT 1"
            cursor.execute(query, (org_id, caller_phone))
            result = cursor.fetchone()
            
            if result:
                contact_id = result['id']
                contact_name = result['name']
                contact_email = result['email']
                logging.info(f"✅ Returning caller: {contact_name} (ID: {contact_id})")
            else:
                is_first_time_caller = True
                logging.info("🆕 First-time caller detected!")
        finally:
            if conn.is_connected():
                conn.close()
    
    # 4. Get conversation history for context
    history = get_conversation_history(org_id, caller_phone, limit=5) if contact_id else ""
    
    # 5. Check if this is initial greeting (empty input)
    if not caller_input:
        if is_first_time_caller:
            # First-time caller greeting
            answer = FIRST_TIME_GREETING
            logging.info("Returning first-time caller greeting.")
        else:
            # Returning caller greeting
            if org_name:
                answer = f"This call will be recorded for training & quality purposes. Hello, I am Sophie the AI Receptionist of {org_name}. How can I help you today?"
            else:
                answer = GREETING
            logging.info("Returning greeting for returning caller.")
        return answer
    
    # 6. Handle first-time caller information capture
    if is_first_time_caller:
        logging.info("Processing first-time caller information capture...")
        
        # Extract name and email using LLM
        extracted_details = extract_user_details_with_llm(caller_input, openai_client)
        extracted_name = extracted_details.get("name")
        extracted_email = extracted_details.get("email")
        
        logging.info(f"Extracted: Name='{extracted_name}', Email='{extracted_email}'")
        
        # Check if we have both name and email
        if extracted_name and extracted_email:
            # Create contact with extracted details
            contact_id = get_or_create_contact(
                caller_phone, org_id, 
                name=extracted_name, 
                email=extracted_email
            )
            
            if contact_id:
                logging.info(f"✅ New contact created: {extracted_name} ({extracted_email})")
                answer = SUCCESS_CAPTURE
                return answer
            else:
                logging.error("❌ Failed to create contact")
                return "I'm sorry, I had trouble saving your information. Please try again."
        
        elif extracted_name and not extracted_email:
            # Have name, need email
            contact_id = get_or_create_contact(caller_phone, org_id, name=extracted_name)
            answer = f"Thank you, {extracted_name}. Could you please provide your email address?"
            return answer
        
        elif not extracted_name and extracted_email:
            # Have email, need name
            contact_id = get_or_create_contact(caller_phone, org_id, email=extracted_email)
            answer = "Thank you for providing your email. Could you please tell me your name?"
            return answer
        
        else:
            # Don't have either - ask again
            answer = "I didn't quite catch that. Please say 'My name is' followed by your name, and then provide your email address."
            return answer
    
    # 7. Ensure we have a contact_id for returning callers
    if not contact_id:
        contact_id = get_or_create_contact(caller_phone, org_id)
        if not contact_id:
            logging.error("❌ Failed to get/create contact")
            return DEFAULT_FAIL_ANSWER
    
    # 8. Check for farewell/hangup intent
    lower_input = caller_input.lower()
    farewell_phrases = ["thank you", "thanks", "bye", "goodbye", "that's all", "end call", "hang up"]
    if any(phrase in lower_input for phrase in farewell_phrases):
        logging.info("Detected farewell phrase.")
        return "Thank you for calling. Have a great day!"
    
    # 9. Detect intent type - IMPROVED DETECTION
    booking_keywords = [
        # Scheduling words
        "meeting", "schedule", "book", "appointment", "set up", "setup",
        # Callback words
        "call back", "callback", "call me back", "return call", "reach out",
        # Time-related
        "tomorrow", "next week", "monday", "tuesday", "wednesday", "thursday", 
        "friday", "saturday", "sunday", "today", "later",
        # Action words
        "cancel", "reschedule", "change", "move", "postpone",
        # Meeting types
        "consultation", "demo", "discussion", "chat", "talk", "speak with"
    ]
    
    is_booking_intent = any(keyword in lower_input for keyword in booking_keywords)
    
    # Also check if LLM detects scheduling intent
    if not is_booking_intent and openai_client:
        try:
            intent_check = openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "Determine if the user wants to schedule a meeting, appointment, or callback. Respond with only 'yes' or 'no'."},
                    {"role": "user", "content": caller_input}
                ],
                temperature=0.0
            ).choices[0].message.content.strip().lower()
            
            if intent_check == "yes":
                is_booking_intent = True
                logging.info("🤖 LLM detected scheduling intent")
        except Exception as e:
            logging.error(f"Error in LLM intent detection: {e}")
    
    answer = DEFAULT_FAIL_ANSWER
    call_outcome = "info_only"
    
    # 10. Process based on intent
    if is_booking_intent:
        logging.info("🗓️ Detected booking/scheduling intent")
        
        # Extract meeting details using LLM
        extracted_details = await extract_meeting_details(
            caller_input, openai_client, contact_name, contact_email
        )
        
        # Handle the meeting request
        answer = await handle_meeting_request(
            extracted_details, org_id, contact_id, doc_id, contact_email, caller_phone
        )
        
        # Determine outcome
        if "successfully booked" in answer.lower():
            call_outcome = "appointment_booked"
        elif "cancelled" in answer.lower():
            call_outcome = "appointment_cancelled"
        
    else:
        logging.info("💬 Detected general inquiry/RAG intent")
        
        if db and doc_id:
            # Use RAG to answer from knowledge base
            answer = get_ai_answer(caller_input, doc_id, db, openai_client, history)
        else:
            answer = "I can help answer your questions, but I'm having trouble accessing the knowledge base right now. Please try again."
    
    # 9. Analyze sentiment and intent
    sentiment = analyze_sentiment(answer, openai_client)
    intent = extract_intent(caller_input, openai_client)
    
    # 10. Log complete call record
    call_id = log_call_record(
        organization_id=org_id,
        caller_phone=caller_phone,
        caller_name=None,  # Could be extracted from contact
        caller_email=None,
        transcript=caller_input,
        ai_summary=answer[:500],  # Truncate for summary
        sentiment=sentiment,
        intent=intent,
        outcome=call_outcome,
        duration=30  # Estimate, could track actual
    )
    
    if call_id:
        logging.info(f"✅ Call logged with ID: {call_id}")
    
    logging.info("=============== LOGIC PROCESSING FINISHED ===============\n")
    return answer


@app.post("/voice", response_class=PlainTextResponse)
async def voice(
    To: str = Form(default=""),
    From: str = Form(default=""),
    SpeechResult: str = Form(default="")
):
    """
    Main Twilio webhook endpoint
    Handles incoming calls and generates TwiML responses
    """
    logging.info("\n\n=============== /VOICE INCOMING REQUEST ===============")
    
    caller_input = (SpeechResult or "").strip()
    twilio_phone = To.strip()
    caller_phone = From.strip()
    
    logging.info(f"From: {caller_phone} | To: {twilio_phone}")
    logging.info(f"Speech Input: '{caller_input}'")
    
    # Process the conversation turn
    answer = await process_user_turn(caller_input, twilio_phone, caller_phone)
    
    # Generate TwiML Response
    resp = VoiceResponse()
    
    # Truncate if too long for Twilio TTS
    if len(answer) > 400:
        logging.warning("⚠️ Truncating long answer for Twilio TTS.")
        answer = answer[:400] + "..."
    
    # Check if this is a farewell response (should hang up)
    lower_answer = answer.lower()
    is_farewell = any(phrase in lower_answer for phrase in [
        "thank you for calling", "have a great day", "goodbye", 
        "talk to you later", "bye"
    ])
    
    # Check if caller said farewell
    lower_input = caller_input.lower() if caller_input else ""
    caller_said_farewell = any(phrase in lower_input for phrase in [
        "thank you", "thanks", "bye", "goodbye", "that's all", 
        "end call", "hang up", "that is all"
    ])
    
    if is_farewell or caller_said_farewell:
        # Say goodbye and hang up
        logging.info("🔚 Detected farewell - hanging up call")
        resp.say(answer, voice="Polly.Joanna-Neural")
        resp.hangup()
    else:
        # Continue conversation - gather next input
        gather = resp.gather(
            input="speech",
            action="/voice",
            method="POST",
            speechTimeout="auto",
            timeout=5
        )
        gather.say(answer, voice="Polly.Joanna-Neural")
        
        # Fallback if no speech detected
        resp.say("I didn't hear anything. Please call back if you need assistance. Goodbye!", voice="Polly.Joanna-Neural")
        resp.hangup()
    
    logging.info(f"Returning TwiML with answer: '{answer[:50]}...'")
    logging.info("=============== /VOICE REQUEST COMPLETE ===============\n")
    
    return str(resp)


@app.get("/health")
async def health_check():
    """
    Health check endpoint for monitoring
    """
    status = {
        "status": "OK",
        "service": "AI Call Answering System - Multi-Tenant",
        "faiss_loaded": db is not None,
        "openai_client_initialized": openai_client is not None,
        "database": "MySQL SaaS Multi-Tenant",
        "features": [
            "Multi-tenant data isolation",
            "Organization-based routing",
            "Contact management",
            "Call logging with transcripts",
            "Usage tracking for billing",
            "Sentiment analysis",
            "Intent detection",
            "Appointment scheduling"
        ]
    }
    
    logging.info(f"Health Check Status: {status}")
    return JSONResponse(content=status)


@app.get("/debug/faiss")
async def debug_faiss():
    """
    Debug endpoint to check FAISS vector store
    """
    if not db:
        return JSONResponse(content={
            "error": "FAISS database not loaded",
            "faiss_path": FAISS_PATH
        }, status_code=500)
    
    try:
        # Test search
        test_docs = db.similarity_search("test", k=3)
        
        sample_metadata = []
        for doc in test_docs:
            sample_metadata.append({
                "metadata": doc.metadata,
                "content_preview": doc.page_content[:100]
            })
        
        return JSONResponse(content={
            "status": "FAISS loaded successfully",
            "faiss_path": FAISS_PATH,
            "total_documents_sampled": len(test_docs),
            "sample_documents": sample_metadata,
            "metadata_fields_found": list(test_docs[0].metadata.keys()) if test_docs else []
        })
    except Exception as e:
        return JSONResponse(content={
            "error": str(e),
            "faiss_path": FAISS_PATH
        }, status_code=500)


@app.get("/")
def read_root():
    """
    Root endpoint with system information
    """
    return {
        "message": "AI Call Answering System - Multi-Tenant SaaS",
        "version": "2.0.0",
        "endpoints": {
            "voice": "POST /voice - Twilio webhook for call handling",
            "health": "GET /health - System health check"
        },
        "features": [
            "Multi-tenant organization support",
            "Complete data isolation by organization_id",
            "FAISS vector database for RAG",
            "OpenAI GPT-4 integration",
            "Appointment scheduling",
            "Usage tracking and billing",
            "Sentiment analysis",
            "Call transcription and logging"
        ]
    }


if __name__ == "__main__":
    import uvicorn
    logging.info("🚀 Starting FastAPI server...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
