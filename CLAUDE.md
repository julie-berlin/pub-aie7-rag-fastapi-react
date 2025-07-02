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

### Backend (FastAPI)

Start the API server:
```bash
cd api
python app.py
```

The server runs on `http://localhost:8000` with:
- Main chat endpoint: `/api/chat` (POST)
- Health check: `/api/health` (GET)
- API docs: `/docs` and `/redoc`

Install backend dependencies:
```bash
pip install -r api/requirements.txt
```

Or using the project root:
```bash
pip install -e .
```

### Frontend (React)

The frontend directory currently contains only a README placeholder. Frontend setup instructions need to be added when the React application is implemented.

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