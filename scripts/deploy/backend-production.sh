#!/bin/bash
# Production backend deployment script

# Set environment
export ASPNETCORE_ENVIRONMENT=Production

# Variables
DEPLOY_DIR="./backend-deploy-prod"
PROJECT_DIR="./backend"
ENV_FILE="./config/environments/production.env"

# Create deployment directory
mkdir -p "\$DEPLOY_DIR"

# Publish in Release configuration
cd "\$PROJECT_DIR"
dotnet restore
dotnet publish -c Release -o "../\$DEPLOY_DIR"

# Copy environment file to deployment directory
cp "\$ENV_FILE" "../\$DEPLOY_DIR/.env"

echo "Production backend deployment package created at: \$DEPLOY_DIR"