#!/bin/bash

# Configuration
APP_NAME="heart"
DEPLOY_PATH="/var/www/heart.styni.com"
GIT_REPO="https://github.com/francismugebe-rgb/chenje.git"

echo "🚀 Starting deployment for $APP_NAME..."

# Navigate to the deployment path
cd "$DEPLOY_PATH" || { echo "❌ Deployment path not found"; exit 1; }

# Check if it's already a git repo, if not, clone
if [ ! -d ".git" ]; then
    echo "📦 Not a git repository. Cloning..."
    # If the directory is not empty, move contents away or warn
    if [ "$(ls -A)" ]; then
        echo "⚠️ Directory not empty. Moving current files to heart_backup_$(date +%Y%m%d_%H%M%S)"
        mkdir -p "../heart_backups"
        mv ./* "../heart_backups/heart_backup_$(date +%Y%m%d_%H%M%S)"
    fi
    git clone "$GIT_REPO" .
else
    echo "📡 Pulling latest changes from main branch..."
    git pull origin main
fi

# Install dependencies
echo "📥 Installing dependencies..."
npm install

# Build the application
echo "🛠️ Building the production bundle..."
npm run build

# Restart the application with PM2
echo "🔄 Restarting application with PM2..."
# Check if the process is already running
if pm2 list | grep -q "$APP_NAME"; then
    pm2 restart "$APP_NAME"
else
    # Start fresh if not running. We use server.ts with tsx or node depending on build
    # Assuming the server is run via npm script or directly
    pm2 start server.ts --name "$APP_NAME" -- --experimental-specifier-resolution=node
fi

# Check status
pm2 status "$APP_NAME"

echo "✅ Deployment complete! Check your site at https://heart.styni.com"
