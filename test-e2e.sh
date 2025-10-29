#!/bin/bash

echo "🧪 StreamLine End-to-End Testing"
echo "=================================="
echo ""

BASE_URL_AUTH="http://localhost:3001"
BASE_URL_WORKSPACE="http://localhost:3002"
BASE_URL_DOCUMENT="http://localhost:3003"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Test function
test_endpoint() {
  local name=$1
  local method=$2
  local url=$3
  local data=$4
  local expected_status=$5
  local token=$6

  echo -n "Testing: $name... "

  if [ -n "$token" ]; then
    response=$(curl -s -w "\n%{http_code}" -X $method "$url" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $token" \
      ${data:+-d "$data"})
  else
    response=$(curl -s -w "\n%{http_code}" -X $method "$url" \
      -H "Content-Type: application/json" \
      ${data:+-d "$data"})
  fi

  status=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  if [ "$status" -eq "$expected_status" ]; then
    echo -e "${GREEN}✓ PASSED${NC} (Status: $status)"
    PASSED=$((PASSED + 1))
    echo "$body"
  else
    echo -e "${RED}✗ FAILED${NC} (Expected: $expected_status, Got: $status)"
    FAILED=$((FAILED + 1))
    echo "$body"
  fi
  echo ""
}

# 1. Health Checks
echo "1. Health Checks"
echo "----------------"
test_endpoint "Auth Health" GET "$BASE_URL_AUTH/health" "" 200
test_endpoint "Workspace Health" GET "$BASE_URL_WORKSPACE/health" "" 200
test_endpoint "Document Health" GET "$BASE_URL_DOCUMENT/health" "" 200

# 2. Authentication Flow
echo "2. Authentication Flow"
echo "----------------------"

# Register
REGISTER_DATA='{"email":"test-'$(date +%s)'@example.com","username":"testuser","password":"password123","firstName":"Test","lastName":"User"}'
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL_AUTH/auth/register" \
  -H "Content-Type: application/json" \
  -d "$REGISTER_DATA")

TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
  echo -e "${GREEN}✓ Registration successful${NC}"
  echo "Token: ${TOKEN:0:20}..."
  PASSED=$((PASSED + 1))
else
  echo -e "${RED}✗ Registration failed${NC}"
  echo "$REGISTER_RESPONSE"
  FAILED=$((FAILED + 1))
  exit 1
fi
echo ""

# Get Profile
test_endpoint "Get Profile" GET "$BASE_URL_AUTH/auth/profile" "" 200 "$TOKEN"

# 3. Workspace Flow
echo "3. Workspace Flow"
echo "-----------------"

# Create Workspace
WORKSPACE_DATA='{"name":"Test Workspace","description":"Created by test script"}'
WORKSPACE_RESPONSE=$(curl -s -X POST "$BASE_URL_WORKSPACE/workspaces" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$WORKSPACE_DATA")

WORKSPACE_ID=$(echo $WORKSPACE_RESPONSE | grep -o '"id":[0-9]*' | cut -d':' -f2 | head -1)

if [ -n "$WORKSPACE_ID" ]; then
  echo -e "${GREEN}✓ Workspace created${NC} (ID: $WORKSPACE_ID)"
  PASSED=$((PASSED + 1))
else
  echo -e "${RED}✗ Workspace creation failed${NC}"
  echo "$WORKSPACE_RESPONSE"
  FAILED=$((FAILED + 1))
fi
echo ""

# Get Workspaces
test_endpoint "Get Workspaces" GET "$BASE_URL_WORKSPACE/workspaces" "" 200 "$TOKEN"

# Get Workspace by ID
test_endpoint "Get Workspace by ID" GET "$BASE_URL_WORKSPACE/workspaces/$WORKSPACE_ID" "" 200 "$TOKEN"

# 4. Document Flow
echo "4. Document Flow"
echo "----------------"

# Create Document
DOCUMENT_DATA='{"title":"Test Document","content":"<p>This is test content</p>","workspaceId":'$WORKSPACE_ID'}'
DOCUMENT_RESPONSE=$(curl -s -X POST "$BASE_URL_DOCUMENT/documents" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$DOCUMENT_DATA")

DOCUMENT_ID=$(echo $DOCUMENT_RESPONSE | grep -o '"_id":"[^"]*' | cut -d'"' -f4)

if [ -n "$DOCUMENT_ID" ]; then
  echo -e "${GREEN}✓ Document created${NC} (ID: $DOCUMENT_ID)"
  PASSED=$((PASSED + 1))
else
  echo -e "${RED}✗ Document creation failed${NC}"
  echo "$DOCUMENT_RESPONSE"
  FAILED=$((FAILED + 1))
fi
echo ""

# Get Documents
test_endpoint "Get Documents" GET "$BASE_URL_DOCUMENT/documents?workspaceId=$WORKSPACE_ID" "" 200 "$TOKEN"

# Get Document by ID
test_endpoint "Get Document by ID" GET "$BASE_URL_DOCUMENT/documents/$DOCUMENT_ID" "" 200 "$TOKEN"

# Update Document
UPDATE_DATA='{"title":"Updated Title","content":"<p>Updated content</p>"}'
test_endpoint "Update Document" PUT "$BASE_URL_DOCUMENT/documents/$DOCUMENT_ID" "$UPDATE_DATA" 200 "$TOKEN"

# 5. Security Tests
echo "5. Security Tests"
echo "-----------------"

# Test without auth
test_endpoint "Protected route without auth" GET "$BASE_URL_WORKSPACE/workspaces" "" 401

# Test rate limiting (uncomment to test)
# echo "Testing rate limiting (making 101 requests)..."
# for i in {1..101}; do
#   curl -s -o /dev/null -w "%{http_code}" "$BASE_URL_DOCUMENT/health"
# done

# 6. Cleanup (Optional)
echo "6. Cleanup"
echo "----------"

# Delete Document
test_endpoint "Delete Document" DELETE "$BASE_URL_DOCUMENT/documents/$DOCUMENT_ID" "" 200 "$TOKEN"

# Delete Workspace
test_endpoint "Delete Workspace" DELETE "$BASE_URL_WORKSPACE/workspaces/$WORKSPACE_ID" "" 200 "$TOKEN"

# Final Summary
echo ""
echo "=================================="
echo "Test Summary"
echo "=================================="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ Some tests failed${NC}"
  exit 1
fi