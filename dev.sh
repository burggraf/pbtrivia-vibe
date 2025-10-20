#!/bin/bash

# Development script for pbtrivia-vibe
# This script sets up the complete development environment

set -e  # Exit on any error

echo "🚀 Setting up pbtrivia-vibe development environment..."

# Kill any existing PocketBase server on port 8091
echo "🔄 Stopping any existing PocketBase server on port 8091..."
if lsof -Pi :8091 -sTCP:LISTEN -t >/dev/null ; then
    kill $(lsof -Pi :8091 -sTCP:LISTEN -t)
    echo "✅ PocketBase server on port 8091 stopped"
else
    echo "ℹ️  No PocketBase server found on port 8091"
fi

# Wait a moment for the port to be free
sleep 1

# Create/upsert superuser
echo "👤 Creating/updating superuser account..."
pocketbase superuser upsert admin@example.com Password123
echo "✅ Superuser admin@example.com created/updated"

# Start PocketBase in background with output redirected to log file
echo "🗄️  Starting PocketBase server in background..."
pocketbase serve --dev --http 0.0.0.0:8091 > pocketbase.log 2>&1 &
PB_PID=$!
echo "✅ PocketBase server started with PID $PB_PID (logs: pocketbase.log)"

# Wait for PocketBase to be ready
echo "⏳ Waiting for PocketBase to be ready..."
sleep 3

# Check if PocketBase started successfully
if kill -0 $PB_PID 2>/dev/null; then
    echo "✅ PocketBase server is running successfully"
else
    echo "❌ PocketBase server failed to start. Check pocketbase.log for details."
    exit 1
fi

# Start the frontend development server
echo "🎨 Starting frontend development server..."
echo "🌐 Your app will be available at: http://localhost:5176"
echo "🔧 PocketBase admin: http://localhost:8091/_/"
echo "📧 PocketBase admin login: admin@example.com / Password123"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Kill background processes on script exit
trap 'echo "🛑 Stopping servers..."; kill $PB_PID 2>/dev/null; exit' INT TERM

# Start npm run dev with -- --open to open browser automatically
npm run dev -- --open