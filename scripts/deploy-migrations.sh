#!/bin/bash
set -e

SERVER="root@trivia.azabab.com"
REMOTE_PATH="/root/pocketbase/trivia"

echo "Deploying migrations..."
rsync -avz pb_migrations/ $SERVER:$REMOTE_PATH/pb_migrations/

echo "Restarting PocketBase to apply migrations..."
ssh $SERVER "systemctl restart pocketbase"

echo "Waiting for service to restart..."
sleep 3

ssh $SERVER "systemctl status pocketbase"

echo "Migrations deployed successfully!"

