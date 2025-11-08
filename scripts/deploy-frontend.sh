#!/bin/bash
set -e

SERVER="root@trivia.azabab.com"
REMOTE_PATH="/root/pocketbase/trivia"

echo "Building frontend..."
if ! pnpm run build; then
    echo "❌ Build failed! Deployment aborted."
    exit 1
fi
echo "✓ Build successful"

echo "Deploying to server..."
rsync -avz --delete dist/ $SERVER:$REMOTE_PATH/pb_public/

echo "✓ Frontend deployed successfully!"
echo "Visit https://trivia.azabab.com"

