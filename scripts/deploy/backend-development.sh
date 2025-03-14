#!/bin/bash
# Development backend deployment script

# Set environment
export ASPNETCORE_ENVIRONMENT=Development

# Variables
DEPLOY_DIR="./backend-deploy-dev"
PROJECT_DIR="./backend"
ENV_FILE="./config/environments/development.env"

# Create deployment directory
mkdir -p "\$DEPLOY_DIR"

# Publish in Debug configuration
cd "\$PROJECT_DIR"
dotnet restore
dotnet publish -c Debug -o "../\$DEPLOY_DIR"

# Copy SQLite database if it exists
if [ -f "finance.db" ]; then
  cp "finance.db" "../\$DEPLOY_DIR/"
fi

# Copy environment file to deployment directory
cp "\$ENV_FILE" "../\$DEPLOY_DIR/.env"

echo "Development backend deployment package created at: \$DEPLOY_DIR"