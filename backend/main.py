from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import ask, checkin, log, dashboard, personal_report, report_export, team, cognitive, wellness_chat,  autocomplete
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    if not os.getenv("RENDER"):
        import threading, asyncio, sys
        def run_indexing():
            try:
                from scripts.index_documents import index_all_docs
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                loop.run_until_complete(index_all_docs())
                loop.close()
            except Exception as e:
                print(f"Indexing error: {e}")
        threading.Thread(target=run_indexing, daemon=True).start()
        print("✅ Local mode — indexing in background")
    else:
        print("✅ Render mode — skipping indexing")
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ask.router)
app.include_router(checkin.router)
app.include_router(log.router)
app.include_router(dashboard.router)
app.include_router(personal_report.router)
app.include_router(report_export.router)
app.include_router(team.router)
app.include_router(cognitive.router)
app.include_router(wellness_chat.router)
app.include_router(autocomplete.router)

@app.get("/")
def root():
    return {"status": "MindFlow backend is running"}

@app.get("/health")
def health():
    return {"status": "ok"}