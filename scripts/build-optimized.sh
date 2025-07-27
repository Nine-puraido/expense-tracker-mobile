#!/bin/bash

echo "🚀 Building optimized web version..."

# Clear cache and old builds
rm -rf dist .expo/web/cache

# Set production environment
export NODE_ENV=production

# Build with optimizations
npx expo export --platform web --output-dir dist

echo "📦 Optimizing bundle size..."

# Create a simple HTML that loads faster
cat > dist/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Monthly Expense Tracker</title>
  <style>
    html, body, #root {
      height: 100%;
      margin: 0;
      background: #000;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    }
    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
    }
    .spinner {
      width: 50px;
      height: 50px;
      border: 3px solid #333;
      border-top-color: #3B82F6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div id="root">
    <div class="loading">
      <div class="spinner"></div>
      <p style="margin-top: 20px;">Loading...</p>
    </div>
  </div>
  <script src="/_expo/static/js/web/index-*.js" defer></script>
</body>
</html>
EOF

echo "✅ Optimized build complete!"
echo "📁 Deploy the 'dist' folder to Vercel"