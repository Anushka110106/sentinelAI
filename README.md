# SentinelAI Intelligence Engine

Cross-document intelligence analysis platform with contradiction detection, research gap identification, and interactive knowledge graph navigation.

## 🚀 Quick Start (GitHub Codespaces)

If using **GitHub Codespaces**, the `.devcontainer` config will auto-install dependencies. After the Codespace loads:

### Start the Backend
```bash
cd sentinelai-backend
pip install -r requirements.txt
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

### Start the Frontend
```bash
cd sentinelai-frontend
npm install
npm run dev
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 🏗️ Project Structure

```
sentinelai/
├── sentinelai-backend/       # FastAPI backend
│   ├── src/
│   │   ├── main.py           # App entry point
│   │   ├── claim_extractor.py
│   │   ├── contradiction_detector.py
│   │   ├── gap_detector.py
│   │   ├── graph_builder.py
│   │   ├── faiss_optimizer.py
│   │   ├── llm.py
│   │   └── routes/           # API endpoints
│   ├── tests/
│   └── requirements.txt
├── sentinelai-frontend/      # React + Vite frontend
│   ├── src/
│   ├── package.json
│   └── vite.config.js
└── .devcontainer/            # Codespaces config
```

## 🛠️ Tech Stack

- **Backend**: FastAPI, FAISS, Sentence Transformers, LangChain
- **Frontend**: React 19, Vite, Three.js, Framer Motion, TailwindCSS
- **AI/ML**: FAISS vector search, sentence embeddings, LLM-powered analysis
