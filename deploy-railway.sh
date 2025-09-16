#!/bin/bash

# Railway Backend Deployment Script
echo "🚀 Deploying Xeno Shopify Backend to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Login to Railway (if not already logged in)
echo "🔑 Logging into Railway..."
railway login

# Initialize Railway project
echo "📦 Initializing Railway project..."
railway init

# Set environment variables
echo "🔧 Setting environment variables..."
railway variables:set NODE_ENV=production
railway variables:set JWT_SECRET="xeno-super-secret-jwt-key-2025-production-grade"
railway variables:set JWT_EXPIRES_IN="7d"
railway variables:set EMAIL_APP_PASSWORD="lhxu knfc jbly mdye"

# Deploy to Railway
echo "🚀 Deploying to Railway..."
railway up

echo "✅ Backend deployment complete!"
echo "🌐 Your backend will be available at: https://your-service-name.railway.app"
echo "📝 Don't forget to update your frontend environment variables!"