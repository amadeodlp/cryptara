# Finance Simplified - Backend

A C# backend API for the Finance Simplified application.

## Technologies Used

- ASP.NET Core 8
- Nethereum for blockchain integration
- JWT authentication

## Getting Started

### Prerequisites

- .NET 8 SDK
- Visual Studio 2022 or Visual Studio Code

### Installation

```bash
# Restore dependencies
dotnet restore

# Run the application
dotnet run
```

The API will be available at `http://localhost:5000`.

## Features

- User authentication with JWT tokens
- Integration with Ethereum blockchain
- Simple user management

## Project Structure

- `/Controllers` - API controllers
- `/Models` - Data models
- `/Services` - Business logic and services

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login

### Blockchain

- `GET /api/blockchain/balance/{address}` - Get token balance for an address

## Configuration

Update the `appsettings.json` file with your own:

- JWT secret key
- Infura URL for Ethereum network connection
- Smart contract addresses
