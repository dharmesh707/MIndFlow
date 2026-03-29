import asyncio
import sys
import chromadb
from crawl4ai import AsyncWebCrawler
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

DOC_SOURCES = [
    {
        "name": "python_docs",
        "url": "https://docs.python.org/3/tutorial/index.html"
    },
    {
        "name": "javascript_docs",
        "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide"
    },
    {
        "name": "dsa_docs",
        "url": "https://docs.python.org/3/library/stdtypes.html"
    },
    {
        "name": "react_docs",
        "url": "https://react.dev/learn"
    }
]

async def fetch_doc_text(url: str) -> str:
    async with AsyncWebCrawler() as crawler:
        result = await crawler.arun(url=url)
        if result.success:
            print(f"  ✓ Fetched {len(result.markdown)} chars")
            return result.markdown
        else:
            print(f"  ✗ Failed to fetch {url}")
            return ""

async def index_all_docs():
    print("\n📚 Starting documentation indexing...\n")

    client = chromadb.PersistentClient(path="./chroma_db")

    try:
        client.delete_collection("mindflow_docs")
        print("🗑️  Cleared old ChromaDB collection")
    except:
        pass

    collection = client.create_collection("mindflow_docs")

    print("🧠 Loading embedding model...")
    model = SentenceTransformer("all-MiniLM-L6-v2")

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50
    )

    total_chunks = 0

    for source in DOC_SOURCES:
        print(f"\n🌐 Fetching {source['name']}...")
        text = await fetch_doc_text(source["url"])

        if not text:
            print(f"  ⚠️  Skipping {source['name']} — empty response")
            continue

        chunks = splitter.split_text(text)
        print(f"  ✂️  Split into {len(chunks)} chunks")

        if not chunks:
            continue

        embeddings = model.encode(chunks).tolist()
        ids = [f"{source['name']}_{i}" for i in range(len(chunks))]
        metadatas = [{"source": source["name"]} for _ in chunks]

        collection.add(
            documents=chunks,
            embeddings=embeddings,
            ids=ids,
            metadatas=metadatas
        )

        total_chunks += len(chunks)
        print(f"  ✅ Stored {len(chunks)} chunks from {source['name']}")

    print(f"\n🎉 Indexing complete! Total chunks in ChromaDB: {total_chunks}\n")

def run_indexing():
    asyncio.run(index_all_docs())

if __name__ == "__main__":
    run_indexing()