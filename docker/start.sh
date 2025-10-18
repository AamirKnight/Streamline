#!/bin/bash

echo "🚀 Starting StreamLine development environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Start services
echo "📦 Starting services with Docker Compose..."
docker-compose -f docker/docker-compose.dev.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check health
echo "✅ Services started!"
echo ""
echo "📊 Access points:"
echo "   MySQL: localhost:3306 (root:root)"
echo "   MongoDB: localhost:27017"
echo "   Redis: localhost:6379"
echo "   RabbitMQ: http://localhost:15672 (guest:guest)"
echo ""
echo "Run 'npm run setup:services' to install dependencies"
echo "Run 'npm run dev:services' to start backend services"