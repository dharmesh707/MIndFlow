# MindFlow

MindFlow is a full-stack wellness and productivity assistant with:

- FastAPI backend
- Next.js frontend
- Supabase storage
- Groq and Gemini model integrations

## Deployment Architecture

- Backend: Render
- Frontend: Vercel

## 1) Deploy Backend on Render

This repo includes [render.yaml](render.yaml), so you can use Render Blueprint deploy.

### Render Service Settings

- Service type: Web Service
- Root directory: `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Backend Environment Variables (Render)

Use [backend/.env.example](backend/.env.example) as reference and set these in Render:

- `SUPABASE_URL`
- `SUPABASE_KEY`
- `GROQ_API_KEY`
- `GEMINI_API_KEY`
- `CORS_ORIGINS`:
  - Example: `https://your-frontend.vercel.app,http://localhost:3000`

### Backend Health Check

- Root: `/`
- Health: `/health`

After deploy, note your backend URL, for example:

`https://mindflow-backend.onrender.com`

## 2) Deploy Frontend on Vercel

Create a Vercel project pointing to the `frontend` directory.

### Build Settings (usually auto-detected)

- Framework: Next.js
- Root directory: `frontend`

### Frontend Environment Variables (Vercel)

Use [frontend/.env.example](frontend/.env.example) as reference:

- `NEXT_PUBLIC_API_URL`:
  - Set to your Render backend URL (for example `https://mindflow-backend.onrender.com`)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`

## 3) Local Development

Backend:

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Notes

- Backend indexing is automatically skipped on Render using the `RENDER` environment check in [backend/main.py](backend/main.py).
- CORS is now controlled via `CORS_ORIGINS` for safe production access.
