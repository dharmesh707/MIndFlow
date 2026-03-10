# MindFlow Deployment Guide

Follow these steps precisely to deploy the frontend to Vercel and the backend to Render.

## Step 1: Push the project to GitHub
1. Go to [GitHub](https://github.com) and create a **New Repository**. Do not initialize it with a README or .gitignore (we already have those).
2. Copy the SSH or HTTPS URL of your new repository.
3. In your local terminal, run the following commands from the root directory (`c:\Users\deonm\OneDrive\Desktop\MINI PROJ SEM 6`):
   ```bash
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```
*(Note: If you haven't committed your latest changes yet, run `git add .` and `git commit -m "feat: complete mindflow"` before pushing).*

---

## Step 2: Deploy the Backend on Render
It is best to deploy the backend first, so you have the live API URL ready for the frontend.
1. Go to [Render.com](https://render.com) and sign in.
2. Click **New +** and select **Web Service**.
3. Connect your GitHub account and select your MindFlow repository.
4. **Configuration Settings:**
   * **Name**: `mindflow-backend` (or similar)
   * **Root Directory**: `backend` *(<- This is critical!)*
   * **Environment**: `Python 3`
   * **Build Command**: `pip install -r requirements.txt` (Make sure you have a `requirements.txt` in your backend folder with `supabase`, `fastapi`, `uvicorn`, etc.)
   * **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT` (Adjust this depending on what you named your main python file).
5. **Environment Variables**:
   * Click "Advanced" -> "Add Environment Variable"
   * Key: `SUPABASE_URL` | Value: *<your_supabase_url>*
   * Key: `SUPABASE_KEY` | Value: *<your_supabase_anon_key>*
6. Click **Create Web Service**. 
7. Once deployed, Render will give you a live URL (e.g., `https://mindflow-backend.onrender.com`). **Copy this URL.**

---

## Step 3: Deploy the Frontend on Vercel
1. Go to [Vercel.com](https://vercel.com) and sign in.
2. Click **Add New...** -> **Project**.
3. Import your MindFlow GitHub repository.
4. **Configuration Settings:**
   * **Root Directory**: `mindflow` *(<- This is critical! Click 'Edit' and select the mindflow folder)*
   * **Framework Preset**: Next.js (Should auto-detect).
5. **Environment Variables**:
   * Key: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Value: *<your_clerk_pub_key>*
   * Key: `CLERK_SECRET_KEY` | Value: *<your_clerk_secret_key>*
   * Key: `NEXT_PUBLIC_API_URL` | Value: *<The Render URL you copied in Step 2>*
6. Click **Deploy**. Vercel will build and host your Next.js application.

---

## Step 4: Final Considerations (CORS & Webhooks)
1. **CORS**: Ensure your Python backend CORS middleware allows requests from your new Vercel domain (e.g., `https://mindflow.vercel.app`).
2. **Supabase / Clerk Setup**: Make sure to add your new Vercel domain to the "Whitelisted Domains" or "Allowed Redirect URLs" inside the Clerk and Supabase dashboards so authentication works in production.
