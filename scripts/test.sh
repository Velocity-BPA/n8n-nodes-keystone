#!/bin/bash

# n8n-nodes-keystone Test Script
# Runs unit and integration tests

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "🧪 Running n8n-nodes-keystone tests..."
echo "======================================="

# Parse arguments
RUN_UNIT=true
RUN_INTEGRATION=true
COVERAGE=false
WATCH=false
VERBOSE=false

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --unit) RUN_UNIT=true; RUN_INTEGRATION=false ;;
        --integration) RUN_UNIT=false; RUN_INTEGRATION=true ;;
        --coverage) COVERAGE=true ;;
        --watch) WATCH=true ;;
        --verbose) VERBOSE=true ;;
        -h|--help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --unit         Run only unit tests"
            echo "  --integration  Run only integration tests"
            echo "  --coverage     Generate coverage report"
            echo "  --watch        Watch mode for development"
            echo "  --verbose      Verbose output"
            echo "  -h, --help     Show this help"
            exit 0
            ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
    shift
done

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build Jest command
JEST_CMD="npx jest"

if [ "$COVERAGE" = true ]; then
    JEST_CMD="$JEST_CMD --coverage"
fi

if [ "$WATCH" = true ]; then
    JEST_CMD="$JEST_CMD --watch"
fi

if [ "$VERBOSE" = true ]; then
    JEST_CMD="$JEST_CMD --verbose"
fi

# Run tests
if [ "$RUN_UNIT" = true ] && [ "$RUN_INTEGRATION" = true ]; then
    echo "📋 Running all tests..."
    $JEST_CMD
elif [ "$RUN_UNIT" = true ]; then
    echo "📋 Running unit tests..."
    $JEST_CMD --testPathPattern="test/unit"
elif [ "$RUN_INTEGRATION" = true ]; then
    echo "📋 Running integration tests..."
    $JEST_CMD --testPathPattern="test/integration"
fi

echo ""
echo "✅ Tests complete!"

# Show coverage summary if generated
if [ "$COVERAGE" = true ] && [ -d "coverage" ]; then
    echo ""
    echo "📊 Coverage report generated at: $PROJECT_ROOT/coverage/lcov-report/index.html"
fi
