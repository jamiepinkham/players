#!/bin/bash
# Environment Variables Validation Script
# Run this before deploying to production to validate environment configuration

set -e

ENVIRONMENT=${1:-production}
ENV_FILE=".env.${ENVIRONMENT}"

echo "============================================"
echo "Environment Variables Validation"
echo "============================================"
echo "Environment: ${ENVIRONMENT}"
echo "File: ${ENV_FILE}"
echo ""

# Check if environment file exists
if [ ! -f "${ENV_FILE}" ]; then
    echo "❌ ERROR: ${ENV_FILE} not found"
    echo ""
    echo "Create it from the example:"
    echo "  cp .env.${ENVIRONMENT}.example ${ENV_FILE}"
    echo ""
    exit 1
fi

echo "✓ Environment file exists: ${ENV_FILE}"
echo ""

# Load environment file
set -a
source "${ENV_FILE}"
set +a

# Define required variables
REQUIRED_VARS=(
    "SECRET_KEY_BASE"
    "DATABASE_HOST"
    "DATABASE_USER"
    "DATABASE_PASSWORD"
    "DATABASE_NAME"
)

RECOMMENDED_VARS=(
    "RAILS_ENV"
    "RAILS_LOG_TO_STDOUT"
    "RAILS_SERVE_STATIC_FILES"
)

# Validation functions
check_required_var() {
    local var_name=$1
    local var_value="${!var_name}"

    if [ -z "${var_value}" ]; then
        echo "❌ ${var_name}: NOT SET"
        return 1
    fi

    # Check for placeholder values
    if echo "${var_value}" | grep -qi "your_\|change\|example\|xxx"; then
        echo "⚠️  ${var_name}: PLACEHOLDER VALUE DETECTED"
        return 1
    fi

    # Check SECRET_KEY_BASE length
    if [ "${var_name}" == "SECRET_KEY_BASE" ] && [ ${#var_value} -lt 32 ]; then
        echo "⚠️  ${var_name}: TOO SHORT (${#var_value} chars, minimum 32)"
        return 1
    fi

    echo "✓ ${var_name}: configured (${#var_value} chars)"
    return 0
}

check_recommended_var() {
    local var_name=$1
    local var_value="${!var_name}"

    if [ -z "${var_value}" ]; then
        echo "⚠️  ${var_name}: not set (recommended)"
        return 1
    fi

    echo "✓ ${var_name}: ${var_value}"
    return 0
}

# Check required variables
echo "Checking required variables..."
echo "-------------------------------------------"
all_required_ok=true
for var in "${REQUIRED_VARS[@]}"; do
    if ! check_required_var "${var}"; then
        all_required_ok=false
    fi
done
echo ""

# Check recommended variables
echo "Checking recommended variables..."
echo "-------------------------------------------"
for var in "${RECOMMENDED_VARS[@]}"; do
    check_recommended_var "${var}" || true
done
echo ""

# Check RAILS_ENV
if [ "${RAILS_ENV}" != "${ENVIRONMENT}" ]; then
    echo "⚠️  WARNING: RAILS_ENV (${RAILS_ENV}) does not match environment (${ENVIRONMENT})"
    echo ""
fi

# Final result
echo "============================================"
if [ "${all_required_ok}" = true ]; then
    echo "✅ VALIDATION PASSED"
    echo ""
    echo "All required variables are configured."
    echo "You can deploy to ${ENVIRONMENT}."
    echo ""
    exit 0
else
    echo "❌ VALIDATION FAILED"
    echo ""
    echo "Some required variables are missing or invalid."
    echo "Please update ${ENV_FILE} before deploying."
    echo ""
    echo "To fix:"
    echo "  1. Edit ${ENV_FILE}"
    echo "  2. Set all required variables with real values"
    echo "  3. Generate SECRET_KEY_BASE: rails secret"
    echo "  4. Re-run this script: $0 ${ENVIRONMENT}"
    echo ""
    exit 1
fi
