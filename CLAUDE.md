# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI Makerspace Bootcamp project for building a RAG (Retrieval-Augmented Generation) web application using FastAPI and React.js. The project allows users to upload PDFs for addition to a knowledge base and chat with the system using OpenAI's API.

## Architecture

The project is organized into several key components:

- **FastAPI Backend** (`api/`): RESTful API server with streaming chat endpoint
- **React Frontend** (`frontend/`): Web interface for user interactions (currently minimal)
- **AI Utilities** (`aimakerspace/`): Custom modules for OpenAI integration and vector operations
  - `openai_utils/`: Chat models, embeddings, and prompts
  - `vectordatabase.py`: In-memory vector database with cosine similarity search
  - `text_utils.py`: Text processing utilities

## Development Commands

### Start Both Servers

Use the included script to start both backend and frontend servers simultaneously:
```bash
./local-dev.sh
```

This script will:
- Install backend dependencies using `uv sync`
- Start the FastAPI backend on `http://localhost:8000`
- Install frontend dependencies with `npm install` (if needed)
- Start the Next.js frontend on `http://localhost:3000`

### Backend (FastAPI)

Start the API server individually:
```bash
cd api
uv sync
uv run python3 app.py
```

The server runs on `http://localhost:8000` with:
- Main chat endpoint: `/api/chat` (POST)
- Health check: `/api/health` (GET)
- API docs: `/docs` and `/redoc`

Install backend dependencies:
```bash
uv sync
```

### Frontend (Next.js)

Start the development server:
```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:3000` with:
- Development server with Turbopack enabled
- Hot reloading for development

Build for production:
```bash
npm run build
npm start
```

Run linting:
```bash
npm run lint
```

### Vector Database & Embeddings

Run vector database examples:
```bash
python aimakerspace/vectordatabase.py
python aimakerspace/openai_utils/embedding.py
```

## Environment Setup

Required environment variables:
- `OPENAI_API_KEY`: Your OpenAI API key for chat completions and embeddings

The project uses `python-dotenv` to load environment variables from `.env` files.

## Key Dependencies

- **FastAPI**: Web framework with automatic API documentation
- **OpenAI**: Official OpenAI Python client for chat and embeddings
- **NumPy**: Vector operations and similarity calculations
- **Uvicorn**: ASGI server for FastAPI
- **Pydantic**: Data validation and settings management

## API Integration

The chat endpoint expects:
```json
{
    "developer_message": "system instructions",
    "user_message": "user query",
    "model": "gpt-4.1-mini",
    "api_key": "your-openai-api-key"
}
```

Returns streaming text responses from OpenAI's chat completion API.

## Vector Search

The `VectorDatabase` class provides:
- Text-to-vector embedding using OpenAI's `text-embedding-3-small`
- Cosine similarity search for semantic retrieval
- Async batch processing for multiple texts
- Key-based vector storage and retrieval
