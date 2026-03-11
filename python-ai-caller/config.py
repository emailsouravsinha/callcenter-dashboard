"""
Configuration and Environment Variables
"""
import os
from dotenv import load_dotenv
from pytz import timezone
from datetime import datetime
import logging

load_dotenv()

# Logging Configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# OpenAI Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
FAISS_PATH = "vectorstore_multi_prod"

# Timezone Configuration
EST_TIMEZONE = timezone('US/Eastern')
CURRENT_EST_TIME_STR = datetime.now(EST_TIMEZONE).isoformat()

# Database Configuration
MYSQL_HOST = os.getenv("MYSQL_HOST")
MYSQL_USER = os.getenv("MYSQL_USER")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "callcenter_saas")

# Calendar API Configuration
CALENDAR_API_BASE_URL = os.getenv("CALENDAR_API_BASE_URL")

# Greeting Messages
GREETING = "Hi, I am Sophie, the AI receptionist to answer missed calls. This call will be recorded for training & quality purposes. Please let me know what can I help you with"
FIRST_TIME_GREETING = "Hello. This call will be recorded for training & quality purposes. I am Sophie the AI receptionist. I see that you are calling for the first time. May I have your name and email address. Please say My Name is and then say your name, similarly state the email address"
SUCCESS_CAPTURE = "Thank you. Please tell me how can I help you today. You may ask me questions about our company like address, hours of operation, areas covered, etc."
DEFAULT_FAIL_ANSWER = "Sorry, I am currently experiencing technical difficulties and cannot look up that information."

# Validation
if not OPENAI_API_KEY:
    logging.error("❌ FATAL ERROR: OPENAI_API_KEY environment variable is not set.")
if not CALENDAR_API_BASE_URL:
    logging.warning("⚠️ WARNING: CALENDAR_API_BASE_URL not set. Booking function disabled.")
else:
    logging.info(f"Calendar API Base URL set: {CALENDAR_API_BASE_URL}")

logging.info(f"Current EST Time for LLM context: {CURRENT_EST_TIME_STR}")
