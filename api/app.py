import os
import sys
import tempfile
from typing import Optional

# Add parent directory to path for aimakerspace imports BEFORE other imports
# This works for both local development and Vercel deployment
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

# Import required FastAPI components for building the API
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
# Import Pydantic for data validation and settings management
from pydantic import BaseModel
# Import OpenAI client for interacting with OpenAI's API
from openai import OpenAI
# Import aimakerspace components for RAG (after path setup)
from aimakerspace.vectordatabase import VectorDatabase
from aimakerspace.text_utils import PDFLoader, CharacterTextSplitter

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
    api_key: str          # OpenAI API key for authentication

# Define the main chat endpoint that handles POST requests with RAG
@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        # Initialize OpenAI client with the provided API key
        client = OpenAI(api_key=request.api_key)
        
        # Retrieve relevant context from vector database
        relevant_chunks = []
        db = get_vector_db()
        if len(db.vectors) > 0:
            # Search for relevant chunks using the user's message
            search_results = db.search_by_text(
                request.user_message, 
                k=3,  # Get top 3 most relevant chunks
                return_as_text=True
            )
            relevant_chunks = search_results
        
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
        raise HTTPException(status_code=500, detail=str(e))

# Define PDF upload endpoint for indexing documents
@app.post("/api/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    try:
        # Validate file type
        if not file.filename.lower().endswith('.pdf'):
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
        
        # Add chunks to vector database
        db = get_vector_db()
        await db.abuild_from_list(chunks)
        
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
