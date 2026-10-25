#!/usr/bin/env bash
# AI Document Assistant - Local Development Launcher
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "=========================================================="
echo " Starting AI Document Assistant on Localhost"
echo "=========================================================="

# Check Python environment
if [ -d "backend/venv" ]; then
    PYTHON_CMD="$DIR/backend/venv/bin/python"
    UVICORN_CMD="$DIR/backend/venv/bin/uvicorn"
else
    PYTHON_CMD="python3"
    UVICORN_CMD="uvicorn"
fi

# Ensure local .env exists if not present
if [ ! -f "backend/.env" ]; then
    echo "Creating backend/.env from template..."
    cp backend/.env.example backend/.env
fi

if [ ! -f "frontend/.env" ]; then
    echo "Creating frontend/.env from template..."
    cp frontend/.env.example frontend/.env
fi

cleanup() {
    echo ""
    echo "Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# Start Backend on port 8000
echo "[1/2] Starting FastAPI Backend on http://localhost:8000..."
cd "$DIR/backend"
$UVICORN_CMD app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Start Frontend on port 5173
echo "[2/2] Starting Vite React Frontend on http://localhost:5173..."
cd "$DIR/frontend"
npm run dev -- --host 0.0.0.0 &
FRONTEND_PID=$!

echo ""
echo "=========================================================="
echo " Applications Running:"
echo "   - Frontend UI:  http://localhost:5173"
echo "   - Backend API:  http://localhost:8000"
echo "   - Swagger Docs: http://localhost:8000/api/docs"
echo " Press Ctrl+C to stop both servers."
echo "=========================================================="

wait
