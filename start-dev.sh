#!/bin/bash

# Start development servers for both backend and frontend
echo "Starting development servers..."

# Function to handle cleanup when script is interrupted
cleanup() {
    echo "Shutting down servers..."
    kill $(jobs -p) 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start FastAPI backend
echo "Starting FastAPI backend on http://localhost:8000"
cd api && python3 app.py &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Start Next.js frontend
echo "Starting Next.js frontend on http://localhost:3000"
cd frontend && npm run dev &
FRONTEND_PID=$!

echo ""
echo "🚀 Development servers started!"
echo "   Backend:  http://localhost:8000"
echo "   Frontend: http://localhost:3000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for background processes
wait