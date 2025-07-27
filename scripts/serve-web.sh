#!/bin/bash

echo "🚀 Building optimized web version..."

# Build for production
npx expo export --platform web --output-dir dist

echo "🌐 Starting local web server..."

# Serve the built files (much faster than dev server)
npx serve dist -p 3000

echo "✅ Open http://localhost:3000 in your browser"