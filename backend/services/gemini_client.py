import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def ask_gemini(system_prompt: str, user_message: str) -> str:
    full_prompt = f"{system_prompt}\n\nUser: {user_message}"
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=full_prompt
    )
    return response.text