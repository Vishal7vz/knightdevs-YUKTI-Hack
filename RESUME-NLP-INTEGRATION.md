# Connecting Python NLP (Resume Critiquer) to the React Frontend

## Can you use the Python source code as is?

**No.** The code you have is a **Streamlit app** (a full UI). To connect it to your React app, the logic must be exposed as an **API** that the frontend can call. You have two options.

---

## Option 1: Use the built-in Next.js API (recommended, no Python)

The same “AI Resume Critiquer” behavior is now in your Next.js app:

1. **API:** `POST /api/critique-resume`  
   - Body: `{ "resumeText": "...", "jobRole": "optional" }`  
   - Response: `{ "analysis": "narrative feedback..." }`  
   - Uses your existing `OPENROUTER_API_KEY` or `OPENAI_API_KEY` from `.env`.

2. **UI:** On the **Analyze** page (`/analyze`):
   - Upload a resume (PDF).
   - Optionally enter **Target job role for AI critique**.
   - Click **“Get AI narrative critique”** to get the same style of feedback as your Python app.

No Python process to run; React and backend stay in one stack.

---

## Option 2: Run the Python backend (FastAPI)

If you want the NLP to run in Python:

1. **Use the FastAPI project** in `python-resume-api/` (same logic as your Streamlit app, exposed as REST API).

2. **Fix for your original Python code:**  
   - **Wrong:** `OPENAI_API_KEY = os.getenv("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")`  
   - **Right:** `OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")`  
   The argument to `os.getenv()` is the **name** of the env var (e.g. `OPENAI_API_KEY`). The **value** (your key) goes in a `.env` file:  
   `OPENAI_API_KEY=sk-your-actual-key-here`  
   Never put the key inside the code or in `getenv()`.

3. **Setup and run:**
   ```bash
   cd python-resume-api
   python -m venv venv
   venv\Scripts\activate   # Windows
   pip install -r requirements.txt
   # Create .env with OPENAI_API_KEY=your-key
   uvicorn main:app --reload --port 8000
   ```

4. **Call from React:**  
   - Python API: `POST http://localhost:8000/analyze` with `multipart/form-data` (`file` + optional `job_role`).  
   - CORS is enabled for `http://localhost:3000`.  
   - You can either call `http://localhost:8000/analyze` from the frontend or add a small Next.js API route that forwards the request to the Python server.

---

## Summary

| Goal                         | What to do                                                                 |
|-----------------------------|----------------------------------------------------------------------------|
| Use Python logic in React   | Run `python-resume-api` (FastAPI) and call `/analyze` from the frontend.   |
| Easiest integration         | Use the built-in **Next.js** `/api/critique-resume` and the **Get AI narrative critique** button on `/analyze`. |
| Fix Streamlit app env key   | Use `os.getenv("OPENAI_API_KEY")` and set `OPENAI_API_KEY` in `.env`.      |

The **critique** (narrative feedback) is now available in both the Next.js API and the optional Python API; the **structured** analysis (skill gap, roadmap) remains in the existing `/api/analyze-resume` flow.
