#!/bin/bash

echo "🌐 Building Expo Web Version..."

# Clear any existing dist
rm -rf dist

# Build for web
npx expo export --platform web

echo "✅ Web build complete!"
echo "📁 Files are in the 'dist' folder"
echo "🚀 Ready for deployment to Vercel, Netlify, or any static host"