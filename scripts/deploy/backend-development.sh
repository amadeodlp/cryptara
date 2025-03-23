#!/bin/bash
# Development backend deployment script with better error handling

# Enable error tracing
set -e

# Log function
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Error handling function
handle_error() {
  log "ERROR: An error occurred on line $1"
  # Keep the window open on error
  read -p "Press Enter to exit..."
  exit 1
}

# Set trap for error handling
trap 'handle_error $LINENO' ERR

# Set environment
export ASPNETCORE_ENVIRONMENT=Development

# Variables
DEPLOY_DIR="./backend-deploy-dev"
PROJECT_DIR="./backend"
ENV_FILE="./config/environments/development.env"

log "Starting development backend deployment..."

# Check if project directory exists
if [ ! -d "$PROJECT_DIR" ]; then
  log "ERROR: Project directory $PROJECT_DIR not found!"
  read -p "Press Enter to exit..."
  exit 1
fi

# Create deployment directory
log "Creating deployment directory: $DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

# Check for environment file
if [ ! -f "$ENV_FILE" ]; then
  log "WARNING: Environment file $ENV_FILE not found. Creating from template..."
  if [ -f "./config/environments/development.template.env" ]; then
    cp "./config/environments/development.template.env" "$ENV_FILE"
    log "Created $ENV_FILE from template. Please edit with your actual values."
  else
    log "ERROR: Template file not found. Cannot continue without environment configuration."
    read -p "Press Enter to exit..."
    exit 1
  fi
fi

# Publish in Debug configuration
log "Navigating to project directory and publishing application..."
cd "$PROJECT_DIR" || { log "ERROR: Failed to change directory to $PROJECT_DIR"; read -p "Press Enter to exit..."; exit 1; }

log "Restoring NuGet packages..."
dotnet restore || { log "ERROR: Failed to restore NuGet packages"; read -p "Press Enter to exit..."; exit 1; }

log "Publishing application in Debug mode..."
dotnet publish -c Debug -o "../$DEPLOY_DIR" || { log "ERROR: Failed to publish application"; read -p "Press Enter to exit..."; exit 1; }

# Copy SQLite database if it exists
if [ -f "finance.db" ]; then
  log "Copying SQLite database to deployment directory..."
  cp "finance.db" "../$DEPLOY_DIR/"
else
  log "WARNING: SQLite database file not found. A new one will be created on first run."
fi

# Copy environment file to deployment directory
log "Copying environment file to deployment directory..."
cp "../$ENV_FILE" "../$DEPLOY_DIR/.env"

log "Development backend deployment package successfully created at: $DEPLOY_DIR"
log "To run the application: cd $DEPLOY_DIR && dotnet COSMOS.dll"

# Keep the window open
read -p "Deployment complete. Press Enter to exit..."