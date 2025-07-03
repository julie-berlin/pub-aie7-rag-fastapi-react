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
from aimakerspace.text_utils import PDFLoader, CharacterTextSplitter

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

# Create handler with structured formatter
handler = logging.StreamHandler()
handler.setFormatter(StructuredFormatter())
logger.addHandler(handler)

# Prevent duplicate logs
logger.propagate = False

# Initialize FastAPI application with a title
app = FastAPI(title="The Information - RAG Chat API")

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
    developer_message: str  # Message from the developer/system
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
        
        # Enhance developer message with retrieved context
        enhanced_developer_message = request.developer_message
        if relevant_chunks:
            context = "\n\n".join(relevant_chunks)
            enhanced_developer_message += f"\n\nRelevant context from uploaded documents:\n{context}\n\nPlease use this context to answer the user's question when relevant."
        
        # Create an async generator function for streaming responses
        async def generate():
            # Create a streaming chat completion request
            stream = client.chat.completions.create(
                model=request.model,
                messages=[
                    {"role": "developer", "content": enhanced_developer_message},
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
@app.post("/api/upload-pdf")
async def upload_pdf(file: UploadFile = File(...), authorization: str = Header(..., alias="Authorization")):
    try:
        # Extract API key from Authorization header
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Invalid authorization header format. Expected: Bearer <token>")
        api_key = authorization.replace("Bearer ", "")
        # Validate file type
        if not file.filename or not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        
        # Save uploaded file to temporary location
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        # Load and process PDF
        pdf_loader = PDFLoader(temp_file_path)
        documents = pdf_loader.load_documents()
        
        # Split text into chunks
        chunks = text_splitter.split_texts(documents)
        
        # Add chunks to vector database with provided API key
        from aimakerspace.openai_utils.embedding import EmbeddingModel
        
        logger.info("Creating embedding model for PDF processing", extra={
            "endpoint": "/api/upload-pdf",
            "api_key_preview": api_key[:10],
            "file_name": file.filename
        })
        
        # Create embedding model with the provided API key
        embedding_model = EmbeddingModel(api_key=api_key)
        logger.info("Embedding model created successfully", extra={
            "endpoint": "/api/upload-pdf",
            "file_name": file.filename
        })
        
        # Create vector database with the embedding model and update global instance
        db = VectorDatabase(embedding_model=embedding_model)
        logger.info("Processing PDF chunks", extra={
            "endpoint": "/api/upload-pdf",
            "chunk_count": len(chunks),
            "file_name": file.filename
        })
        
        await db.abuild_from_list(chunks)
        
        # Update the global vector database
        global vector_db
        vector_db = db
        
        logger.info("Vector database build completed", extra={
            "endpoint": "/api/upload-pdf",
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
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

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

# Entry point for running the application directly
if __name__ == "__main__":
    import uvicorn
    # Start the server on all network interfaces (0.0.0.0) on port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)
