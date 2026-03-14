import os
import chromadb
from sentence_transformers import SentenceTransformer
from services.groq_client import ask_groq

# Load the embedding model once when the server starts
# This model converts text into coordinates (vectors)
embedder = SentenceTransformer("all-MiniLM-L6-v2")

# Connect to ChromaDB — this is our local vector database
# It stores the coordinates of all our documentation chunks
chroma_client = chromadb.PersistentClient(path="./chroma_store")
collection = chroma_client.get_or_create_collection(name="mindflow_docs")


def get_guide_prompt(burnout_score: str, retrieved_chunks: str) -> str:
    # This function picks the right system prompt tone
    # based on how burned out the user currently is

    if burnout_score == "High":
        # User is exhausted — keep it simple, short, gentle
        tone = """Use very simple language. Short sentences only. 
Be warm and encouraging. Do not overwhelm with too much information.
Give just one small hint to move forward."""

    elif burnout_score == "Medium":
        # User is getting tired — be clear and supportive
        tone = """Be clear and concise. Use simple examples.
Be encouraging. Give a helpful hint without the full answer."""

    else:
        # User is fresh (Low burnout) — full technical depth
        tone = """Explain the concept thoroughly with technical detail.
Use proper terminology. Provide a code snippet if helpful.
Give a hint toward the solution without giving the complete answer."""

    return f"""You are a learning assistant helping a developer understand a concept.
Using only the following documentation context, {tone}
Encourage the user to reason through the final step themselves.
Context: {retrieved_chunks}"""


# This is the fallback prompt — used when ChromaDB finds nothing relevant
# It also adapts to burnout score
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
{tone} Encourage the user to reason through the final step themselves."""


def query_rag(question: str, burnout_score: str = "Low") -> dict:
    # burnout_score defaults to "Low" if not provided
    # so existing code that calls query_rag(question) still works

    # Step 1 — Convert the user's question into coordinates
    question_embedding = embedder.encode(question).tolist()

    # Step 2 — Search ChromaDB for the 3 closest documentation chunks
    results = collection.query(
        query_embeddings=[question_embedding],
        n_results=3
    )

    # Step 3 — If no documents are indexed yet, use fallback
    if not results["documents"][0]:
        answer = ask_groq(get_fallback_prompt(burnout_score), question)
        return {"answer": answer, "grounded": False}

    # Step 4 — Check confidence of the top result
    # ChromaDB returns distance — lower = more similar
    # Distance above 1.4 means the match is too weak
    top_distance = results["distances"][0][0]

    if top_distance > 1.4:
        answer = ask_groq(get_fallback_prompt(burnout_score), question)
        return {"answer": answer, "grounded": False}

    # Step 5 — Good match found — build prompt with doc chunks
    chunks = "\n\n".join(results["documents"][0])
    prompt = get_guide_prompt(burnout_score, chunks)

    answer = ask_groq(prompt, question)
    return {"answer": answer, "grounded": True}