from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.groq_client import ask_groq

router = APIRouter()

class AutocompleteRequest(BaseModel):
    code_context: str
    language: str
    cognitive_state: str = "flow"
    cursor_line: str = ""

@router.post("/api/autocomplete")
async def autocomplete(request: AutocompleteRequest):
    try:
        if request.cognitive_state in ["fatigued", "frustrated"]:
            style = "Give a very simple, minimal suggestion. One line only. Easy to understand."
        elif request.cognitive_state == "struggling":
            style = "Give a clear suggestion with a brief comment explaining what it does."
        else:
            style = "Give a concise, elegant code suggestion. No explanation needed."

        # Try RAG lazily — import inside function so it doesn't break route registration
        rag_context = ""
        try:
            from services.rag_pipeline import query_rag
            rag_result = query_rag(request.cursor_line or request.code_context[-200:])
            if rag_result and rag_result.get("answer"):
                rag_context = f"\nRelevant documentation: {rag_result['answer'][:300]}"
        except Exception:
            pass  # RAG unavailable, continue without it

        system_prompt = f"""You are an intelligent code autocomplete engine in VS Code.
You are helping a {request.language} developer.
Developer cognitive state: {request.cognitive_state}
{style}

Rules:
- Return ONLY the code completion, nothing else
- No markdown, no backticks, no explanation
- Complete the current line or add the next logical line(s)
- Max 3 lines
- Must be valid {request.language} code
{rag_context}"""

        user_message = f"""Current code context:
{request.code_context[-500:]}

Complete the code from where it ends. Return only the completion, not the existing code."""

        suggestion = ask_groq(system_prompt, user_message)
        suggestion = suggestion.strip()
        if suggestion.startswith("```"):
            lines = suggestion.split("\n")
            suggestion = "\n".join(lines[1:-1]) if len(lines) > 2 else ""

        return {
            "suggestion": suggestion,
            "cognitive_state": request.cognitive_state,
            "rag_used": bool(rag_context)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))