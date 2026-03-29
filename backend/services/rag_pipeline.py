import os
import chromadb
from sentence_transformers import SentenceTransformer
from services.groq_client import ask_groq

# Load embedding model
embedder = SentenceTransformer("all-MiniLM-L6-v2")

# ChromaDB setup
chroma_client = chromadb.PersistentClient(path="./chroma_store")
collection = chroma_client.get_or_create_collection(name="mindflow_docs")


def get_guide_prompt(burnout_score: str, retrieved_chunks: str) -> str:

    if burnout_score == "High":
        tone = """Use very simple language. Short sentences only. 
Be warm and encouraging. Do not overwhelm with too much information.
Give just one small hint to move forward."""

    elif burnout_score == "Medium":
        tone = """Be clear and concise. Use simple examples.
Be encouraging. Give a helpful hint without the full answer."""

    else:
        tone = """Explain the concept thoroughly with technical detail.
Use proper terminology. Provide a code snippet if helpful.
Give a hint toward the solution without giving the complete answer."""

    return f"""You are a learning assistant helping a developer understand a concept.

STRICT RULES:
- Do NOT provide the final full solution
- Always guide, never directly answer
- Keep explanations aligned with the documentation
- END your response with a question to help the user think

{tone}

Documentation Context:
{retrieved_chunks}
"""


def get_fallback_prompt(burnout_score: str) -> str:

    if burnout_score == "High":
        tone = """Use very simple language. Short sentences only.
Be warm and encouraging. Give just one small hint."""

    elif burnout_score == "Medium":
        tone = """Be clear and concise. Be encouraging.
Give a helpful hint without the full answer."""

    else:
        tone = """Explain the concept thoroughly with technical detail.
Give a hint toward the solution without giving the complete answer."""

    return f"""You are a learning assistant helping a developer understand a concept.

STRICT RULES:
- Do NOT provide the final full solution
- Guide the user step-by-step
- END your response with a question

{tone}
"""


def query_rag(question: str, burnout_score: str = "Low", code_context: str = "") -> dict:

    # Step 1 — Embed question
    question_embedding = embedder.encode(question).tolist()

    # Step 2 — Retrieve top 3 chunks
    results = collection.query(
        query_embeddings=[question_embedding],
        n_results=3
    )

    # Step 3 — No docs case
    if not results["documents"] or not results["documents"][0]:
        answer = ask_groq(
            get_fallback_prompt(burnout_score),
            f"{question}\n\nUser Code:\n{code_context}"
        )
        return {"answer": answer, "grounded": False, "sources": []}

    # Step 4 — Confidence check
    top_distance = results["distances"][0][0]

    # Extract sources
    sources = []
    if "metadatas" in results and results["metadatas"][0]:
        for meta in results["metadatas"][0]:
            if meta and "source" in meta:
                sources.append(meta["source"])

    # Remove duplicates
    sources = list(set(sources))

    if top_distance > 1.4:
        answer = ask_groq(
            get_fallback_prompt(burnout_score),
            f"{question}\n\nUser Code:\n{code_context}"
        )
        return {"answer": answer, "grounded": False, "sources": []}

    # Step 5 — Build context
    chunks = "\n\n".join(results["documents"][0])

    prompt = get_guide_prompt(burnout_score, chunks)

    full_input = f"{question}\n\nUser Code:\n{code_context}"

    answer = ask_groq(prompt, full_input)

    return {
        "answer": answer,
        "grounded": True,
        "sources": sources
    }