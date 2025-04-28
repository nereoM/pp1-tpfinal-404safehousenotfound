#!/bin/bash

# Descargar allure para generar reportes: https://allurereport.org/docs/install/

# Find the directory where the script itself is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Go to the project root (assuming script is inside server/scripts/)
PROJECT_ROOT="$SCRIPT_DIR/.."

# Set paths relative to the project root
REPORTS_DIR="$PROJECT_ROOT/tests/reports"

# Set PYTHONPATH to project root
export PYTHONPATH="$PYTHONPATH:$PROJECT_ROOT"

# Run tests
pytest "$PROJECT_ROOT/tests/functional" --cov=routes --alluredir="$REPORTS_DIR" -v

# Serve report
allure serve "$REPORTS_DIR"
