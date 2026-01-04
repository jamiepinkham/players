#!/bin/bash
# Security Configuration Verification Script
# Verifies host authorization and HTTPS enforcement

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "============================================="
echo "Security Configuration Verification"
echo "============================================="
echo ""

# Get configuration
APP_URL=${1:-"http://localhost:3000"}
APP_HOST=${2:-"players.billymartinplayersleague.com"}

echo "Testing URL: $APP_URL"
echo "Expected Host: $APP_HOST"
echo ""

# Test 1: Valid host header
echo "Test 1: Valid host header"
echo "---------------------------------------------"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Host: $APP_HOST" "$APP_URL/health" 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ PASS: Valid host accepted (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}❌ FAIL: Valid host rejected (HTTP $HTTP_CODE)${NC}"
fi

echo ""

# Test 2: Invalid host header (should be blocked in production)
echo "Test 2: Invalid host header"
echo "---------------------------------------------"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Host: evil.com" "$APP_URL/health" 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "403" ]; then
    echo -e "${GREEN}✅ PASS: Invalid host blocked (HTTP $HTTP_CODE)${NC}"
elif [ "$HTTP_CODE" = "200" ]; then
    echo -e "${YELLOW}⚠️  WARNING: Invalid host accepted (development mode?)${NC}"
else
    echo -e "${YELLOW}⚠️  INFO: Unexpected response (HTTP $HTTP_CODE)${NC}"
fi

echo ""

# Test 3: HTTPS redirect (if testing HTTP URL)
if [[ "$APP_URL" == http://* ]]; then
    echo "Test 3: HTTP to HTTPS redirect"
    echo "---------------------------------------------"
    LOCATION=$(curl -s -I -H "Host: $APP_HOST" "$APP_URL/health" | grep -i "^location:" | awk '{print $2}' | tr -d '\r\n')

    if [[ "$LOCATION" == https://* ]]; then
        echo -e "${GREEN}✅ PASS: HTTP redirects to HTTPS${NC}"
        echo "   Redirect: $LOCATION"
    else
        echo -e "${YELLOW}⚠️  INFO: No HTTPS redirect (development mode?)${NC}"
    fi
else
    echo "Test 3: HTTPS enforcement (HSTS header)"
    echo "---------------------------------------------"
    HSTS=$(curl -s -I -H "Host: $APP_HOST" "$APP_URL/health" | grep -i "strict-transport-security" | tr -d '\r\n')

    if [ -n "$HSTS" ]; then
        echo -e "${GREEN}✅ PASS: HSTS header present${NC}"
        echo "   $HSTS"
    else
        echo -e "${YELLOW}⚠️  WARNING: HSTS header not found${NC}"
    fi
fi

echo ""

# Test 4: Secure cookie flags (if HTTPS)
if [[ "$APP_URL" == https://* ]]; then
    echo "Test 4: Secure cookie flags"
    echo "---------------------------------------------"
    COOKIE=$(curl -s -I -H "Host: $APP_HOST" "$APP_URL/" | grep -i "set-cookie" | head -1 | tr -d '\r\n')

    if [[ "$COOKIE" == *"Secure"* ]]; then
        echo -e "${GREEN}✅ PASS: Cookies have Secure flag${NC}"
    else
        echo -e "${YELLOW}⚠️  WARNING: Cookies missing Secure flag${NC}"
    fi
fi

echo ""

# Test 5: Check Rails environment
echo "Test 5: Rails environment check"
echo "---------------------------------------------"
echo "Run this inside the container:"
echo "  docker exec <container> bundle exec rails runner 'puts Rails.env'"
echo "Expected: production"

echo ""

# Test 6: Check configured hosts
echo "Test 6: Configured hosts (check logs)"
echo "---------------------------------------------"
echo "Check application startup logs for:"
echo "  'Host Authorization Configured'"
echo "  'Allowed hosts:'"
echo ""
echo "View logs:"
echo "  docker logs <container> | grep 'Host Authorization'"

echo ""
echo "============================================="
echo "Verification Complete"
echo "============================================="
echo ""
echo "For production deployment:"
echo "1. Verify force_ssl is enabled in production.rb"
echo "2. Set APP_HOST environment variable"
echo "3. Set TRUSTED_HOSTS if using multiple domains"
echo "4. Ensure reverse proxy sets X-Forwarded-Proto"
echo "5. Check startup logs for allowed hosts"
echo ""
echo "Documentation: SECURITY.md"
echo "============================================="
