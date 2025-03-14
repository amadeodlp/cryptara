# Use the .NET 8 SDK as the build environment
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build-env
WORKDIR /app

# Copy everything and restore dependencies
COPY . ./
RUN dotnet restore

# Build and publish the app
RUN dotnet publish -c Release -o /app/publish

# Use the ASP.NET Core runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build-env /app/publish .

# Set the entrypoint
CMD ["dotnet", "COSMOS.dll"]