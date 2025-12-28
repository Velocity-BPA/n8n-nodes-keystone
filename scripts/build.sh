#!/bin/bash

# n8n-nodes-keystone Build Script
# Builds the package for distribution

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "🔨 Building n8n-nodes-keystone..."
echo "================================"

# Clean previous build
echo "📁 Cleaning previous build..."
rm -rf dist/

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run linting
echo "🔍 Running linter..."
npm run lint || {
    echo "⚠️  Linting warnings found (continuing build)"
}

# Compile TypeScript
echo "🔄 Compiling TypeScript..."
npm run build

# Run Gulp tasks (copy icons, etc.)
echo "📋 Running Gulp tasks..."
npx gulp build:icons 2>/dev/null || echo "ℹ️  No Gulp icon task (icons may be inline)"

# Verify build output
if [ -d "dist" ]; then
    echo ""
    echo "✅ Build successful!"
    echo ""
    echo "📊 Build statistics:"
    echo "   Files: $(find dist -name '*.js' | wc -l) JavaScript files"
    echo "   Size:  $(du -sh dist | cut -f1)"
    echo ""
    echo "📁 Output directory: $PROJECT_ROOT/dist/"
else
    echo "❌ Build failed - no dist directory created"
    exit 1
fi

echo "🎉 Build complete!"
