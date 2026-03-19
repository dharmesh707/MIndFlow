from services.groq_client import ask_groq

SHOW_ME_PROMPT = """You are a senior developer doing a code review. The user is stuck.
Provide the exact corrected code, explain every line of your solution clearly,
identify precisely where the original mistake was and why it caused the problem.
Be direct and thorough."""

def ask_gemini(system_prompt: str, user_message: str) -> str:
    # Using Groq instead of Gemini — same speed, no quota issues
    return ask_groq(system_prompt, user_message)