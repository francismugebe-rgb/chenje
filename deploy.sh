#!/bin/bash
# Deployment script for Heart Home Help

APP_NAME="heart"
DEPLOY_PATH="/var/www/heart.styni.com"
PORT=3009

echo "🚀 Starting deployment for $APP_NAME..."

# Navigate to the deployment path
cd "$DEPLOY_PATH" || { echo "❌ Deployment path not found"; exit 1; }

# Basic git pull
echo "📡 Pulling latest changes from main branch..."
git pull origin main

# Install dependencies
echo "📥 Installing dependencies..."
npm install

# Build the application
echo "🛠️ Building the production bundle..."
npm run build

# Restart the application with PM2
echo "🔄 Restarting application with PM2 on Port $PORT..."

# Export variables for the server
export NODE_ENV=production
export PORT=$PORT

# Stop existing if it exists
pm2 stop "$APP_NAME" 2>/dev/null || true

# Start the server. Using tsx is easiest for directly running server.ts
# Note: On your server you may need to install tsx globally: npm install -g tsx
# Or use the local version in node_modules
if [ -f "./node_modules/.bin/tsx" ]; then
    pm2 start ./node_modules/.bin/tsx --name "$APP_NAME" -- server.ts --experimental-specifier-resolution=node
else
    pm2 start server.ts --name "$APP_NAME" --interpreter node -- --experimental-specifier-resolution=node
fi

# Save PM2 state to survive server reboots
pm2 save

echo "✅ Site updated! Check at https://heart.styni.com"
pm2 status "$APP_NAME"
