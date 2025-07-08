import os
import sys
import tempfile
import logging
import json
from datetime import datetime
from typing import Optional

# Add parent directory to path for aimakerspace imports BEFORE other imports
# This works for both local development and Vercel deployment
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

# Import required FastAPI components for building the API
from fastapi import FastAPI, HTTPException, UploadFile, File, Header
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
# Import Pydantic for data validation and settings management
from pydantic import BaseModel
# Import OpenAI client for interacting with OpenAI's API
from openai import OpenAI, AsyncOpenAI
# Import aimakerspace components for RAG (after path setup)
from aimakerspace.vectordatabase import VectorDatabase
from aimakerspace.text_utils import PDFLoader, CharacterTextSplitter, WordDocLoader, TextFileLoader

# Configure structured logging
class StructuredFormatter(logging.Formatter):
    def format(self, record):
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }

        # Add extra fields if they exist
        if hasattr(record, 'user_id'):
            log_entry['user_id'] = record.user_id
        if hasattr(record, 'request_id'):
            log_entry['request_id'] = record.request_id
        if hasattr(record, 'endpoint'):
            log_entry['endpoint'] = record.endpoint
        if hasattr(record, 'api_key_preview'):
            log_entry['api_key_preview'] = record.api_key_preview
        if hasattr(record, 'file_name'):
            log_entry['file_name'] = record.file_name
        if hasattr(record, 'chunk_count'):
            log_entry['chunk_count'] = record.chunk_count
        if hasattr(record, 'error'):
            log_entry['error'] = record.error
        if hasattr(record, 'error_type'):
            log_entry['error_type'] = record.error_type

        return json.dumps(log_entry)

# Create structured logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Create logging handler with structured formatter
log_handler = logging.StreamHandler()
log_handler.setFormatter(StructuredFormatter())
logger.addHandler(log_handler)

# Prevent duplicate logs
logger.propagate = False

# Initialize FastAPI application with a title
app = FastAPI(title="CoachCatalyst - Leadership Coaching API")

# CoachCatalyst system prompt for leadership coaching
COACH_CATALYST_SYSTEM_PROMPT = """You are CoachCatalyst, a professional leadership coach and mentor. Your role is to provide thoughtful, actionable leadership advice based EXCLUSIVELY on the user's uploaded documents.

**CRITICAL REQUIREMENTS:**
- You MUST use the provided documents as your PRIMARY and ONLY source for answers
- You MUST cite which specific document(s) you got information from in your response
- If the user's question cannot be answered from the uploaded documents, you MUST respond with: "There are no resources in your library for that topic."
- Do NOT provide general leadership advice unless it comes directly from the user's documents

**Your Approach:**
- Act as a supportive, experienced leadership coach
- Provide specific, actionable advice tailored to the user's situation
- Draw insights ONLY from the user's uploaded leadership resources
- Ask clarifying questions when needed to better understand their challenges
- Offer practical strategies and frameworks found in their documents
- Be encouraging while maintaining professional standards

**Response Requirements:**
- Always cite the specific document name when providing information
- Use format: "According to [Document Name]..." or "As mentioned in [Document Name]..."
- If synthesizing from multiple documents, cite all sources used
- Be conversational yet professional
- Provide concrete examples and actionable steps from their documents
- Structure advice clearly with bullet points or numbered lists when helpful

**When Documents Are Available:**
- Search thoroughly through all provided documents before responding
- Clearly indicate which document(s) you're drawing from
- Synthesize information from multiple sources when relevant, citing each
- Help them connect theoretical concepts from their documents to practical application
- Point out key insights from their materials and how they apply to their specific situation

**When Information Is Not Available:**
- If the question cannot be answered from the provided documents, respond exactly with: "There are no resources in your library for that topic."
- Do NOT add general advice or knowledge outside of their documents

Remember: You can ONLY provide guidance based on what's in their personal leadership library. Your value comes from helping them access and apply the knowledge they've already collected."""

# Initialize global components (vector database will be initialized when first used)
vector_db = None
text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=200)

def get_vector_db():
    global vector_db
    if vector_db is None:
        vector_db = VectorDatabase()
    return vector_db

# Configure CORS (Cross-Origin Resource Sharing) middleware
# Only allow requests from localhost (dev) and Vercel (production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Local development
        "https://*.vercel.app",   # Vercel production/preview
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Define the data model for chat requests using Pydantic
# This ensures incoming request data is properly validated
class ChatRequest(BaseModel):
    user_message: str      # Message from the user
    model: Optional[str] = "gpt-4.1-mini"  # Optional model selection with default

# Define the main chat endpoint that handles POST requests with RAG
@app.post("/api/chat")
async def chat(request: ChatRequest, authorization: str = Header(..., alias="Authorization")):
    try:
        logger.info("Chat request received", extra={
            "endpoint": "/api/chat",
            "api_key_preview": authorization[:20] if authorization else 'None',
            "user_message_preview": request.user_message[:50] if request.user_message else 'None'
        })

        # Extract API key from Authorization header
        if not authorization or not authorization.startswith("Bearer "):
            logger.error("Invalid authorization header format", extra={
                "endpoint": "/api/chat",
                "authorization_preview": authorization[:20] if authorization else 'None'
            })
            raise HTTPException(status_code=401, detail="Invalid authorization header format. Expected: Bearer <token>")
        api_key = authorization.replace("Bearer ", "")

        # Initialize OpenAI client with the provided API key
        client = OpenAI(api_key=api_key)

        # Retrieve relevant context from vector database
        relevant_chunks = []
        db = get_vector_db()
        if len(db.vectors) > 0:
            try:
                logger.info("Starting vector search", extra={
                    "endpoint": "/api/chat",
                    "query_preview": request.user_message[:50],
                    "vector_count": len(db.vectors)
                })

                # Create embedding model with API key for query embedding only
                from aimakerspace.openai_utils.embedding import EmbeddingModel
                logger.info("Creating embedding model", extra={
                    "endpoint": "/api/chat",
                    "api_key_preview": api_key[:10]
                })
                embedding_model = EmbeddingModel(api_key=api_key)
                logger.info("Embedding model created successfully", extra={"endpoint": "/api/chat"})

                # Get embedding for the user's message
                logger.info("Getting embedding for query", extra={"endpoint": "/api/chat"})
                query_embedding = embedding_model.get_embedding(request.user_message)
                logger.info("Query embedding received", extra={
                    "endpoint": "/api/chat",
                    "embedding_length": len(query_embedding)
                })

                # Search existing vectors (no API key needed for this part)
                import numpy as np
                search_results = db.search(np.array(query_embedding), k=3)

                # Extract the text content from the search results
                relevant_chunks = [result[0] for result in search_results]
                logger.info("Vector search completed", extra={
                    "endpoint": "/api/chat",
                    "chunks_found": len(relevant_chunks)
                })

            except Exception as e:
                logger.error("Error during vector search", extra={
                    "endpoint": "/api/chat",
                    "error": str(e),
                    "error_type": type(e).__name__
                })
                relevant_chunks = []

        # Create system message with CoachCatalyst prompt and context
        system_message = COACH_CATALYST_SYSTEM_PROMPT
        if relevant_chunks:
            context = "\n\n".join(relevant_chunks)
            system_message += f"\n\nDocuments in the user's leadership library:\n{context}"

        # Create an async generator function for streaming responses
        async def generate():
            # Create a streaming chat completion request
            stream = client.chat.completions.create(
                model=request.model,
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": request.user_message}
                ],
                stream=True  # Enable streaming response
            )

            # Yield each chunk of the response as it becomes available
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content

        # Return a streaming response to the client
        return StreamingResponse(generate(), media_type="text/plain")

    except Exception as e:
        # Handle any errors that occur during processing
        logger.error("Chat request failed", extra={
            "endpoint": "/api/chat",
            "error": str(e),
            "error_type": type(e).__name__
        })
        raise HTTPException(status_code=500, detail=str(e))

# Define PDF upload endpoint for indexing documents
@app.post("/api/upload")
async def upload(file: UploadFile = File(...), authorization: str = Header(..., alias="Authorization")):
    try:
        # Extract API key from Authorization header
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Invalid authorization header format. Expected: Bearer <token>")
        api_key = authorization.replace("Bearer ", "")
        # Validate file type
        if not file.filename or not (
            file.filename.lower().endswith('.pdf') or
            file.filename.lower().endswith('.docx') or
            file.filename.lower().endswith('.doc') or
            file.filename.lower().endswith('.txt') or
            file.filename.lower().endswith('.md')
        ):
            raise HTTPException(status_code=400, detail="Only PDF, Word, text, or markdown files are allowed")

        # Determine file extension for temp file
        if file.filename.lower().endswith('.pdf'):
            suffix = ".pdf"
        elif file.filename.lower().endswith('.docx'):
            suffix = ".docx"
        elif file.filename.lower().endswith('.doc'):
            suffix = ".doc"
        elif file.filename.lower().endswith('.md'):
            suffix = ".md"
        else:
            suffix = ".txt"

        # Save uploaded file to temporary location
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name

        # Load and process document
        if suffix == ".pdf":
            loader = PDFLoader(temp_file_path)
        elif suffix in [".docx", ".doc"]:
            loader = WordDocLoader(temp_file_path)
        else:
            loader = TextFileLoader(temp_file_path)
        documents = loader.load_documents()

        # Split text into chunks
        chunks = text_splitter.split_texts(documents)

        # Add chunks to vector database with provided API key
        from aimakerspace.openai_utils.embedding import EmbeddingModel

        logger.info("Creating embedding model for document processing", extra={
            "endpoint": "/api/upload",
            "api_key_preview": api_key[:10],
            "file_name": file.filename
        })

        # Create embedding model with the provided API key
        embedding_model = EmbeddingModel(api_key=api_key)
        logger.info("Embedding model created successfully", extra={
            "endpoint": "/api/upload",
            "file_name": file.filename
        })

        # Create vector database with the embedding model and update global instance
        db = VectorDatabase(embedding_model=embedding_model)
        logger.info("Processing document chunks", extra={
            "endpoint": "/api/upload",
            "chunk_count": len(chunks),
            "file_name": file.filename
        })

        await db.abuild_from_list(chunks)

        # Update the global vector database
        global vector_db
        vector_db = db

        logger.info("Vector database build completed", extra={
            "endpoint": "/api/upload",
            "chunk_count": len(chunks),
            "file_name": file.filename
        })

        # Clean up temporary file
        import os
        os.unlink(temp_file_path)

        return {
            "message": f"Successfully indexed {file.filename}",
            "chunks_created": len(chunks),
            "filename": file.filename
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")

# Define a simple test endpoint
@app.get("/api/test")
async def test_endpoint():
    return {"message": "FastAPI is working on Vercel!", "status": "success"}

# Define a health check endpoint to verify API status
@app.get("/api/health")
async def health_check():
    # Don't initialize vector DB without API key, just check if it exists
    document_count = len(vector_db.vectors) if vector_db is not None else 0
    return {"status": "ok", "indexed_documents": document_count}

# Entry point removed for Vercel compatibility
# For local development, use: uvicorn api.app:app --reload
