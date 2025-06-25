#!/bin/bash

# AI Bot Development Script with uv
# Usage: ./dev.sh [command]

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[DEV]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

check_uv() {
    if ! command -v uv &> /dev/null; then
        warn "uv not found. Installing uv..."
        curl -LsSf https://astral.sh/uv/install.sh | sh
        export PATH="$HOME/.cargo/bin:$PATH"
    fi
}

setup() {
    log "Setting up development environment..."
    check_uv
    
    log "Creating virtual environment..."
    uv venv
    
    log "Installing dependencies in development mode..."
    source .venv/bin/activate
    uv pip install -e ".[dev]"
    
    log "Development environment ready!"
    info "Activate with: source .venv/bin/activate"
}

install() {
    log "Installing dependencies..."
    check_uv
    
    if [ -f ".venv/bin/activate" ]; then
        source .venv/bin/activate
    fi
    
    uv pip install -e ".[dev]"
    log "Dependencies installed!"
}

test() {
    log "Running tests..."
    
    if [ -f ".venv/bin/activate" ]; then
        source .venv/bin/activate
    fi
    
    pytest -v
}

format() {
    log "Formatting code..."
    
    if [ -f ".venv/bin/activate" ]; then
        source .venv/bin/activate
    fi
    
    black .
    isort .
    log "Code formatted!"
}

lint() {
    log "Linting code..."
    
    if [ -f ".venv/bin/activate" ]; then
        source .venv/bin/activate
    fi
    
    flake8 .
    mypy .
    log "Linting complete!"
}

run() {
    log "Running AI bot..."
    
    if [ -f ".venv/bin/activate" ]; then
        source .venv/bin/activate
    fi
    
    python bot.py
}

clean() {
    log "Cleaning up..."
    rm -rf .venv
    rm -rf __pycache__
    rm -rf *.egg-info
    rm -rf .pytest_cache
    rm -rf .mypy_cache
    log "Cleanup complete!"
}

docker_build() {
    log "Building Docker image..."
    cd ..
    docker build -t matrix-ai-bot ./ai-bot
    log "Docker image built!"
}

docker_run() {
    log "Running Docker container..."
    docker run -p 8080:8080 --env-file .env matrix-ai-bot
}

usage() {
    echo "AI Bot Development Script"
    echo ""
    echo "Usage: ./dev.sh [command]"
    echo ""
    echo "Commands:"
    echo "  setup          Set up development environment"
    echo "  install        Install dependencies"
    echo "  test           Run tests"
    echo "  format         Format code with black and isort"
    echo "  lint           Run linting (flake8, mypy)"
    echo "  run            Run the AI bot"
    echo "  clean          Clean up temporary files"
    echo "  docker-build   Build Docker image"
    echo "  docker-run     Run Docker container"
    echo "  help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./dev.sh setup     # Initial setup"
    echo "  ./dev.sh test      # Run tests"
    echo "  ./dev.sh format    # Format code"
    echo "  ./dev.sh run       # Run bot locally"
}

case "${1:-help}" in
    setup)
        setup
        ;;
    install)
        install
        ;;
    test)
        test
        ;;
    format)
        format
        ;;
    lint)
        lint
        ;;
    run)
        run
        ;;
    clean)
        clean
        ;;
    docker-build)
        docker_build
        ;;
    docker-run)
        docker_run
        ;;
    help|--help|-h)
        usage
        ;;
    *)
        warn "Unknown command: $1"
        usage
        exit 1
        ;;
esac