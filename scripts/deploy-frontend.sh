#!/bin/bash
set -e

SERVER="root@trivia.azabab.com"
REMOTE_PATH="/root/pocketbase/trivia"

echo "Building frontend..."
pnpm run build

echo "Deploying to server..."
rsync -avz --delete dist/ $SERVER:$REMOTE_PATH/pb_public/

echo "Frontend deployed successfully!"
echo "Visit https://trivia.azabab.com"

