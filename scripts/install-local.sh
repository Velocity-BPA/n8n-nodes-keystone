#!/bin/bash

# n8n-nodes-keystone Local Installation Script
# Installs the package locally for testing with n8n

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "📦 Installing n8n-nodes-keystone locally..."
echo "============================================"

# Detect n8n custom nodes directory
N8N_CUSTOM_DIR=""

# Check common locations
if [ -d "$HOME/.n8n/custom" ]; then
    N8N_CUSTOM_DIR="$HOME/.n8n/custom"
elif [ -d "$HOME/.n8n/nodes" ]; then
    N8N_CUSTOM_DIR="$HOME/.n8n/nodes"
elif [ -n "$N8N_CUSTOM_EXTENSIONS" ]; then
    N8N_CUSTOM_DIR="$N8N_CUSTOM_EXTENSIONS"
fi

# Allow override via argument
if [ -n "$1" ]; then
    N8N_CUSTOM_DIR="$1"
fi

if [ -z "$N8N_CUSTOM_DIR" ]; then
    echo "⚠️  Could not detect n8n custom nodes directory."
    echo ""
    echo "Usage: $0 [path-to-custom-nodes-dir]"
    echo ""
    echo "Common locations:"
    echo "  ~/.n8n/custom"
    echo "  ~/.n8n/nodes"
    echo ""
    echo "Or set N8N_CUSTOM_EXTENSIONS environment variable."
    echo ""
    echo "Creating default directory at ~/.n8n/custom..."
    N8N_CUSTOM_DIR="$HOME/.n8n/custom"
    mkdir -p "$N8N_CUSTOM_DIR"
fi

echo "📁 Target directory: $N8N_CUSTOM_DIR"

# Build the package first
echo ""
echo "🔨 Building package..."
./scripts/build.sh

# Create package tarball
echo ""
echo "📦 Creating package..."
npm pack

# Find the created tarball
TARBALL=$(ls -t *.tgz 2>/dev/null | head -1)

if [ -z "$TARBALL" ]; then
    echo "❌ Failed to create package tarball"
    exit 1
fi

echo "📦 Created: $TARBALL"

# Install to n8n custom directory
echo ""
echo "📥 Installing to n8n..."

# Remove old installation if exists
rm -rf "$N8N_CUSTOM_DIR/node_modules/n8n-nodes-keystone"

# Extract to custom directory
mkdir -p "$N8N_CUSTOM_DIR/node_modules"
cd "$N8N_CUSTOM_DIR/node_modules"
tar -xzf "$PROJECT_ROOT/$TARBALL"
mv package n8n-nodes-keystone

# Install package dependencies
cd n8n-nodes-keystone
npm install --production 2>/dev/null || true

# Clean up tarball
rm -f "$PROJECT_ROOT/$TARBALL"

echo ""
echo "✅ Installation complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Restart n8n if it's running"
echo "   2. Look for 'Keystone' nodes in the node palette"
echo "   3. Add KeystoneDevice or KeystoneSdk credentials"
echo ""
echo "🔧 To uninstall:"
echo "   rm -rf $N8N_CUSTOM_DIR/node_modules/n8n-nodes-keystone"
echo ""
echo "📖 Documentation: See README.md for usage examples"
