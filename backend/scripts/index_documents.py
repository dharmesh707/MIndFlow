import sys
import os

# This makes sure Python can find the services folder
# when we run this script from the scripts/ directory
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import chromadb
from sentence_transformers import SentenceTransformer

print("Loading embedding model...")
embedder = SentenceTransformer("all-MiniLM-L6-v2")

print("Connecting to ChromaDB...")
chroma_client = chromadb.PersistentClient(path="./chroma_store")

# Delete existing collection and recreate fresh
# This prevents duplicate entries if you run the script twice
try:
    chroma_client.delete_collection(name="mindflow_docs")
    print("Cleared existing collection")
except:
    pass

collection = chroma_client.create_collection(name="mindflow_docs")

# List of all documentation files to index
# Add new .txt files here whenever you create them
doc_files = [
    "./docs/python_basics.txt",
    "./docs/javascript_basics.txt",
    "./docs/dsa_basics.txt",
]

def split_into_chunks(text, chunk_size=500, overlap=50):
    # Split text into overlapping chunks
    # overlap means each chunk shares 50 characters with the next
    # This prevents important context from being cut off at boundaries
    # Think of it like overlapping tiles on a roof — no gaps
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        if chunk.strip():  # skip empty chunks
            chunks.append(chunk)
        start = end - overlap  # step back by overlap amount
    return chunks

all_chunks = []
all_embeddings = []
all_ids = []
all_metadata = []

for doc_path in doc_files:
    if not os.path.exists(doc_path):
        print(f"WARNING: {doc_path} not found, skipping")
        continue

    print(f"Processing {doc_path}...")

    with open(doc_path, "r", encoding="utf-8") as f:
        text = f.read()

    chunks = split_into_chunks(text)
    print(f"  Split into {len(chunks)} chunks")

    for i, chunk in enumerate(chunks):
        # Create a unique ID for each chunk
        doc_name = os.path.basename(doc_path).replace(".txt", "")
        chunk_id = f"{doc_name}_chunk_{i}"

        # Convert chunk text into coordinates (embedding vector)
        embedding = embedder.encode(chunk).tolist()

        all_chunks.append(chunk)
        all_embeddings.append(embedding)
        all_ids.append(chunk_id)
        all_metadata.append({"source": doc_name})

print(f"\nIndexing {len(all_chunks)} total chunks into ChromaDB...")

# Store everything in ChromaDB in one batch
collection.add(
    documents=all_chunks,
    embeddings=all_embeddings,
    ids=all_ids,
    metadatas=all_metadata
)

print(f"Done! {len(all_chunks)} chunks indexed successfully.")
print("ChromaDB is ready for RAG queries.")