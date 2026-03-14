import os
import chromadb
from sentence_transformers import SentenceTransformer
from services.groq_client import ask_groq

# Load the embedding model once when the server starts
embedder = SentenceTransformer("all-MiniLM-L6-v2")

# Connect to ChromaDB (stored locally in a folder called chroma_store)
chroma_client = chromadb.PersistentClient(path="./chroma_store")
collection = chroma_client.get_or_create_collection(name="mindflow_docs")

GUIDE_ME_PROMPT = """You are a learning assistant helping a developer understand a concept. 
Using only the following documentation context, explain the relevant concept clearly, 
provide a small illustrative code snippet if helpful, and give a hint toward the solution 
without providing the complete answer. Encourage the user to reason through the final step themselves.
Context: {retrieved_chunks}"""

FALLBACK_GUIDE_PROMPT = """You are a learning assistant helping a developer understand a concept.
Explain the relevant concept clearly, provide a small illustrative code snippet if helpful, 
and give a hint toward the solution without providing the complete answer. 
Encourage the user to reason through the final step themselves."""

def query_rag(question: str) -> dict:
    # Embed the user's question
    question_embedding = embedder.encode(question).tolist()

    # Search ChromaDB for top 3 most relevant chunks
    results = collection.query(
        query_embeddings=[question_embedding],
        n_results=3
    )

    # Check if we got any results and if confidence is high enough
    if not results["documents"][0]:
        # No documents indexed yet — use fallback
        answer = ask_groq(FALLBACK_GUIDE_PROMPT, question)
        return {"answer": answer, "grounded": False}

    # ChromaDB returns distances — lower distance = more similar
    # We convert to a similarity check (distance < 1.4 is roughly > 0.3 similarity)
    top_distance = results["distances"][0][0]

    if top_distance > 1.4:
        # Not confident enough — fallback to direct Groq
        answer = ask_groq(FALLBACK_GUIDE_PROMPT, question)
        return {"answer": answer, "grounded": False}

    # Good match found — send chunks to Groq with Guide Me prompt
    chunks = "\n\n".join(results["documents"][0])
    prompt_with_context = GUIDE_ME_PROMPT.format(retrieved_chunks=chunks)
    answer = ask_groq(prompt_with_context, question)
    return {"answer": answer, "grounded": True}