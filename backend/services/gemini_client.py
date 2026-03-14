import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-pro")

def ask_gemini(system_prompt: str, user_message: str) -> str:
    full_prompt = f"{system_prompt}\n\nUser: {user_message}"
    response = model.generate_content(full_prompt)
    return response.text