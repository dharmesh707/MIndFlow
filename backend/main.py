from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import ask, checkin, log, dashboard, personal_report, report_export, team, cognitive, wellness_chat
import threading
import asyncio
import sys

def run_indexing_in_thread():
    from scripts.index_documents import index_all_docs
    if sys.platform == "win32":
        loop = asyncio.ProactorEventLoop()
        asyncio.set_event_loop(loop)
    else:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    loop.run_until_complete(index_all_docs())
    loop.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 MindFlow backend starting — indexing in background...")
    thread = threading.Thread(target=run_indexing_in_thread, daemon=True)
    thread.start()
    # NO thread.join() — let it index in background while server starts
    print("✅ Server ready — indexing continues in background")
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
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

@app.get("/")
def root():
    return {"status": "MindFlow backend is running"}