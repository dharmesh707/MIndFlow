from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from services.rag_pipeline import query_rag
from services.gemini_client import ask_gemini

router = APIRouter()

class AskRequest(BaseModel):
    question: str
    mode: str
    code_context: str = ""
    burnout_score: str = "Low"

SHOW_ME_PROMPT = """You are a senior developer doing a code review. The user is stuck.
Provide the exact corrected code, explain every line of your solution clearly,
identify precisely where the original mistake was and why it caused the problem.
Be direct and thorough."""

@router.post("/api/ask")
async def ask(request: AskRequest):
    try:
        if not request.question or not request.question.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Question cannot be empty"
            )

        if request.mode == "show":
            full_question = request.question
            if request.code_context:
                full_question += f"\n\nCode:\n{request.code_context}"

            answer = ask_gemini(SHOW_ME_PROMPT, full_question)

            return {
                "answer": answer,
                "mode_used": "show",
                "grounded": False,
                "sources": []
            }

        # GUIDE MODE
        result = query_rag(
            request.question,
            request.burnout_score,
            request.code_context
        )

        return {
            "answer": result["answer"],
            "mode_used": "guide",
            "grounded": result["grounded"],
            "sources": result.get("sources", [])
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing question: {str(e)}"
        )