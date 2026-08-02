# RAG System

A full-stack Retrieval-Augmented Generation app.

- **Backend:** FastAPI + LangChain + FAISS + HuggingFace embeddings + OpenAI chat model
- **Frontend:** React + Vite + Tailwind CSS

## Project Structure

```
rag-system/
├── backend/
│   ├── app/
│   │   ├── api/            # route handlers (upload, chat, health)
│   │   ├── services/       # business logic (pdf, splitting, embeddings, vector store, retriever, llm, pipeline)
│   │   ├── models/         # pydantic request/response schemas
│   │   ├── database/faiss_index/   # persisted vector index (auto-generated)
│   │   ├── uploads/         # uploaded PDFs (auto-generated)
│   │   ├── config.py
│   │   ├── main.py
│   │   └── requirements.txt
│   └── .env
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── services/
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    └── package.json
```

## Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r app/requirements.txt
```

Edit `backend/.env` and set your real key:

```
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx
```

Run the server (from the `backend/` folder, so `app` is importable as a package):

```bash
uvicorn app.main:app --reload --port 8000
```

Backend will be live at: **http://localhost:8000**
Interactive API docs: **http://localhost:8000/docs**

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend will be live at: **http://localhost:5173**

## Usage

1. Start the backend, then the frontend.
2. Open http://localhost:5173
3. Upload a PDF from the sidebar.
4. Ask questions in the chat — answers show source citations and a confidence score.
5. Use "Reset Knowledge Base" to clear the FAISS index and start fresh.

## Notes

- Embeddings run **locally** via `sentence-transformers` — no API key needed for that part.
- Text generation uses `ChatOpenAI` — requires a valid `OPENAI_API_KEY`.
- To swap in a different LLM (Anthropic, Ollama, etc.), edit only `backend/app/services/llm.py`.
