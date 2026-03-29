from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import ask, checkin, log, dashboard, personal_report, report_export

app = FastAPI()

# CORS lets your frontend (localhost:3000) talk to backend (localhost:8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "https://your-vercel-app.vercel.app"],
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

@app.get("/")
def root():
    return {"status": "MindFlow backend is running"}