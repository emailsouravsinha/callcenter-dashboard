"""
AI Helper Functions - LLM interactions and analysis
"""
import logging
import json
from typing import Optional, Dict, Any
from openai import OpenAI
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings
from datetime import datetime, timedelta
from config import OPENAI_API_KEY, FAISS_PATH, EST_TIMEZONE, CURRENT_EST_TIME_STR, DEFAULT_FAIL_ANSWER
import os


def load_vectorstore(path: str) -> Optional[FAISS]:
    """Load FAISS vectorstore from disk"""
    if not os.path.exists(path) or not os.path.exists(os.path.join(path, "index.faiss")):
        logging.error(f"❌ Persistent Vectorstore files not found at: {path}")
        return None
    
    if not OPENAI_API_KEY:
        logging.error("❌ Cannot load embeddings without OPENAI_API_KEY.")
        return None
    
    try:
        logging.info(f"Loading FAISS vectorstore from {path}...")
        embeddings = OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY)
        
        # Try with allow_dangerous_deserialization first (newer versions)
        try:
            loaded_db = FAISS.load_local(path, embeddings, allow_dangerous_deserialization=True)
        except TypeError:
            # Fallback for older langchain versions
            logging.info("Using older langchain version without allow_dangerous_deserialization parameter")
            loaded_db = FAISS.load_local(path, embeddings)
        
        logging.info("✅ FAISS vectorstore loaded successfully.")
        return loaded_db
    except Exception as e:
        logging.error(f"❌ Error loading FAISS database: {e}")
        return None


def get_ai_answer(query: str, doc_id: str, db: Optional[FAISS], 
                  client: Optional[OpenAI], history: str) -> str:
    """
    Generate AI answer using RAG (Retrieval Augmented Generation)
    """
    logging.info(f"--- RAG/Chat Generation Started for Doc ID: {doc_id} ---")
    
    if not db or not client:
        logging.error("AI function aborted: DB or OpenAI client not initialized.")
        return DEFAULT_FAIL_ANSWER
    
    try:
        # 1. Similarity Search (Retrieval)
        logging.info(f"Performing similarity search for query: '{query[:30]}...'")
        docs = db.similarity_search(query, k=10)
        
        # Debug: Log metadata from first document
        if docs:
            logging.info(f"Sample document metadata: {docs[0].metadata}")
        
        # Try multiple metadata field names for doc_id
        filtered_docs = []
        for d in docs:
            metadata = d.metadata
            # Check various possible field names
            doc_identifier = (
                metadata.get("doc_id") or 
                metadata.get("document_id") or 
                metadata.get("tenant_id") or
                metadata.get("client_id") or
                metadata.get("source", "").split("/")[0]  # Try extracting from source path
            )
            
            # If doc_id matches or no doc_id in metadata (use all docs)
            if doc_identifier == doc_id or not doc_identifier:
                filtered_docs.append(d)
        
        # If no filtering happened, use all docs (backward compatibility)
        if not filtered_docs and docs:
            logging.warning(f"⚠️ No doc_id metadata found. Using all {len(docs)} documents.")
            filtered_docs = docs
        
        context = "\n".join([d.page_content for d in filtered_docs])
        
        logging.info(f"Found {len(docs)} total documents. Using {len(filtered_docs)} documents for doc_id '{doc_id}'.")
        
        if not context.strip():
            logging.warning("⚠️ No context found after filtering.")
            if history:
                logging.info("Attempting to answer using conversation history only.")
                return client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "You are a helpful and concise company assistant. Continue the conversation naturally based on the provided history."},
                        {"role": "user", "content": f"Conversation History:\n{history}\n\nUser Query: {query}\nAnswer:"}
                    ],
                    temperature=0.0
                ).choices[0].message.content.strip()
            else:
                return "I couldn't find any information in the knowledge base. Could you please rephrase your question?"
        
        # 2. Construct Prompt (Augmentation)
        prompt = f"""You are a helpful company assistant.
Firstly attempt to answer questions concisely based on the context and conversation history below.
If you do not understand the question then politely ask the caller to repeat and then rephrase the question in your own words and ask for a confirmation.
Do not mention document IDs, prefixes, or client names in the final answer.
If the answer is not found in the context or history, politely inform the caller that you do not have an answer available in the company details provided.
If the caller asks to speak with a human, respond politely and explain that you are an AI missed-call responder. let them know the best option is to schedule a callback with a company representative at a date and time that works for them, which you can help arrange, or they can choose to call back again later.

Context (for document ID: {doc_id}):
{context}

Conversation History:
{history}

User Query: {query}
Answer:"""
        
        # 3. Call OpenAI API (Generation)
        logging.info("Calling OpenAI API for final answer generation.")
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful and concise company assistant. Answer based only on the provided context and history."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.0
        )
        
        final_answer = resp.choices[0].message.content.strip()
        logging.info(f"✅ AI answer generated. Length: {len(final_answer)}")
        return final_answer
        
    except Exception as e:
        logging.error(f"❌ An unexpected error occurred during AI generation: {e}")
        return DEFAULT_FAIL_ANSWER
    finally:
        logging.info("--- RAG/Chat Generation Finished ---")


def extract_user_details_with_llm(raw_text: str, client: Optional[OpenAI]) -> Dict[str, Optional[str]]:
    """Extract name and email from user's voice transcription"""
    logging.info("Starting LLM-based user detail extraction.")
    
    try:
        if not client:
            logging.error("LLM client not available for extraction.")
            return {"name": None, "email": None}
        
        logging.info(f"LLM extraction input: '{raw_text[:50]}...'")
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": """You are a highly efficient data extraction bot.
Your task is to extract the full name and the email address from the user's transcription.
Respond STRICTLY with a JSON object containing two keys: 'name' and 'email'.
If a piece of information is missing or unclear, set its value to null.
Example output: {"name": "John Doe", "email": "john.doe@example.com"}"""},
                {"role": "user", "content": f"Extract details from this voice transcription: '{raw_text}'"}
            ],
            response_format={"type": "json_object"},
            temperature=0.0
        )
        
        json_output = response.choices[0].message.content
        logging.info(f"LLM extraction raw output: {json_output}")
        extracted_data = json.loads(json_output)
        
        logging.info(f"✅ Extracted details: Name='{extracted_data.get('name')}', Email='{extracted_data.get('email')}'")
        return {
            "name": extracted_data.get("name"),
            "email": extracted_data.get("email")
        }
    except Exception as e:
        logging.error(f"❌ Error during LLM data extraction: {e}")
        return {"name": None, "email": None}


def analyze_sentiment(text: str, client: Optional[OpenAI]) -> str:
    """
    Analyze sentiment of conversation
    Returns: 'positive', 'neutral', or 'negative'
    """
    if not client or not text:
        return "neutral"
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Analyze the sentiment of the text. Respond with ONLY one word: positive, neutral, or negative"},
                {"role": "user", "content": text}
            ],
            temperature=0.0
        )
        sentiment = response.choices[0].message.content.strip().lower()
        
        if sentiment in ['positive', 'neutral', 'negative']:
            return sentiment
        return "neutral"
    except Exception as e:
        logging.error(f"Error analyzing sentiment: {e}")
        return "neutral"


def extract_intent(text: str, client: Optional[OpenAI]) -> str:
    """
    Extract the main intent/purpose of the call
    """
    if not client or not text:
        return "General Inquiry"
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Extract the main intent/purpose from this call in 2-4 words. Examples: 'Schedule Appointment', 'Product Inquiry', 'Support Request', 'Pricing Question'"},
                {"role": "user", "content": text}
            ],
            temperature=0.0
        )
        intent = response.choices[0].message.content.strip()
        return intent[:100]  # Limit length
    except Exception as e:
        logging.error(f"Error extracting intent: {e}")
        return "General Inquiry"


async def extract_meeting_details(caller_input: str, client: Optional[OpenAI], 
                                  user_name: Optional[str], user_email: Optional[str]) -> Dict[str, Optional[str]]:
    """
    Extract meeting/appointment details from user input
    Returns: dict with action, title, start_time, event_id
    """
    logging.info("--- Starting LLM meeting detail extraction ---")
    
    if not client:
        logging.error("LLM client not available for meeting detail extraction.")
        return {"action": None, "title": None, "start_time": None, "event_id": None}
    
    future_limit = (datetime.now(EST_TIMEZONE) + timedelta(days=10)).strftime('%Y-%m-%d')
    user_context = f"The caller's name is {user_name or 'N/A'} and email is {user_email or 'N/A'}. Use this information to formulate the meeting title."
    
    system_prompt = f"""You are a meeting assistant. Your task is to extract the user's explicit intent (action) and relevant details from their voice transcription. Confirm with the user before proceeding with the action.

{user_context}

The current date and time is: {CURRENT_EST_TIME_STR}. All requested times must be calculated relative to this time and must be in the FUTURE. Do not suggest a time later than {future_limit}.

Respond STRICTLY with a JSON object containing the following keys:
1. 'action': (string) MUST be one of: 'schedule', 'cancel', 'reschedule', or 'unknown'.
2. 'start_time': (string/null) The exact desired date and time for SCHEDULING/RESCHEDULING in ISO 8601 format (YYYY-MM-DDTHH:MM:00). Must be null if the action is 'cancel' or if time is unclear/past/too far in future.
3. 'title': (string/null) A short title for the meeting which reflects why the user called. If the caller's name is known, include it in the title (e.g., 'Call with John Doe for hours of operation'). Null if action is 'cancel'.
4. 'event_id': (string/null) The unique ID of the event the user wants to CANCEL or RESCHEDULE. Infer this ID only if explicitly mentioned (e.g., "ID 123")."""
    
    logging.info(f"LLM extraction query: '{caller_input}'")
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"The user said: '{caller_input}'"}
            ],
            response_format={"type": "json_object"},
            temperature=0.0
        )
        
        raw_json_output = response.choices[0].message.content
        extracted_data = json.loads(raw_json_output)
        
        # Normalize: Ensure empty strings are treated as None
        final_details = {k: v if v != "" else None for k, v in extracted_data.items()}
        
        logging.info(f"LLM raw JSON output: {raw_json_output}")
        logging.info(f"✅ Parsed/Normalized details: {final_details}")
        return final_details
        
    except Exception as e:
        logging.error(f"❌ Error extracting meeting details with LLM: {e}")
        return {"action": "system_fail", "title": None, "start_time": None, "event_id": None}
    finally:
        logging.info("--- LLM meeting detail extraction finished ---")
