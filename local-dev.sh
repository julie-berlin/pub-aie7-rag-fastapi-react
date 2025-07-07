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

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Install backend dependencies using uv
echo "Installing backend dependencies with uv..."
cd "$SCRIPT_DIR"
uv sync
if [ $? -eq 0 ]; then
    echo "Backend dependencies installed successfully"
else
    echo "Failed to install backend dependencies"
    exit 1
fi

# Start FastAPI backend using uv
echo "Starting FastAPI backend on http://localhost:8000"
cd "$SCRIPT_DIR/api"
uv run python app.py > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Wait a moment for backend to start
sleep 3

# Check if backend started successfully
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "Backend failed to start. Check backend.log for errors:"
    tail -10 ../backend.log
    exit 1
fi

# Check and install frontend dependencies
echo "Checking frontend dependencies..."
cd "$SCRIPT_DIR/frontend"
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "Failed to install frontend dependencies"
        kill $BACKEND_PID 2>/dev/null
        exit 1
    fi
else
    echo "Frontend dependencies already installed"
fi

# Start Next.js frontend
echo "Starting Next.js frontend on http://localhost:3000"
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"

# Return to script directory
cd "$SCRIPT_DIR"

echo ""
echo "🚀 Development servers started!"
echo "   Backend:  http://localhost:8000"
echo "   Frontend: http://localhost:3000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "Logs:"
echo "   Backend:  tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for background processes
wait