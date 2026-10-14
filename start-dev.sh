#!/bin/bash

# Schedulux Development Server Starter
# This script starts both backend and frontend servers concurrently

echo "🚀 Starting Schedulux Development Servers..."
echo ""

# Build the shared availability engine (backend and frontend import its dist/)
if [ ! -d "packages/availability-engine/dist" ]; then
  echo "📦 Building availability engine..."
  (cd packages/availability-engine && npm install && npm run build)
fi

# Check if backend dependencies are installed
if [ ! -d "backend/node_modules" ]; then
  echo "📦 Installing backend dependencies..."
  cd backend && npm install && cd ..
fi

# Check if frontend dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
  echo "📦 Installing frontend dependencies..."
  cd frontend && npm install && cd ..
fi

echo ""
echo "Starting servers..."
echo "📍 Backend:  http://localhost:3000"
echo "📍 Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Start both servers using npx concurrently
npx concurrently \
  --names "BACKEND,FRONTEND" \
  --prefix-colors "blue,magenta" \
  "cd backend && npm run dev" \
  "cd frontend && npm run dev"
