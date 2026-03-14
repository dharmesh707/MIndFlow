from fastapi import APIRouter
from pydantic import BaseModel
from services.rag_pipeline import query_rag
from services.gemini_client import ask_gemini

router = APIRouter()

class AskRequest(BaseModel):
    question: str
    mode: str  # "guide" or "show"
    code_context: str = ""  # optional

SHOW_ME_PROMPT = """You are a senior developer doing a code review. The user is stuck. 
Provide the exact corrected code, explain every line of your solution clearly, 
identify precisely where the original mistake was and why it caused the problem. 
Be direct and thorough."""

@router.post("/api/ask")
async def ask(request: AskRequest):
    if request.mode == "show":
        full_question = request.question
        if request.code_context:
            full_question = f"{request.question}\n\nCode:\n{request.code_context}"
        answer = ask_gemini(SHOW_ME_PROMPT, full_question)
        return {"answer": answer, "mode_used": "show", "grounded": False}

    # Guide mode — use RAG pipeline
    result = query_rag(request.question)
    return {
        "answer": result["answer"],
        "mode_used": "guide",
        "grounded": result["grounded"]
    }