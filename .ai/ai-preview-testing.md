# AI Preview Endpoint - Testing Guide

This document provides a comprehensive testing checklist for the AI Preview endpoint (`POST /api/recipes/:id/ai-preview`).

## Test Environment Setup

### Prerequisites
- Development server running (`npm run dev`)
- Test user with ID: `ce4988b8-5c26-4741-b5c3-fd372088ed89` (DEFAULT_USER)
- At least one recipe in the database owned by test user
- Supabase database accessible

### Test Data Setup

1. **Create test recipe** (if not exists):
```bash
# Use Supabase client or API to create a test recipe
POST /api/recipes
{
  "title": "Test Chocolate Cake",
  "ingredients": "2 cups flour, 1 cup sugar, 3 eggs, 1 cup milk",
  "instructions": "Mix ingredients and bake at 350°F for 30 minutes",
  "is_ai_generated": false,
  "parent_recipe_id": null
}
```

2. **Set dietary preferences**:
```bash
PUT /api/profile/dietary-preferences
{
  "diet_type": "vegan",
  "allergies": ["gluten"],
  "disliked_ingredients": []
}
```

## Testing Checklist

### ✅ Happy Path Tests

#### Test 1: Valid Request with All Preferences
**Scenario**: User with complete dietary preferences requests AI preview

**Setup**:
- User has `diet_type`, `allergies`, and `disliked_ingredients` set
- Recipe exists and belongs to user

**Request**:
```bash
POST /api/recipes/{valid-recipe-id}/ai-preview
Headers: Authorization: Bearer {valid-token}
```

**Expected Result**:
- ✅ Status: 200 OK
- ✅ Response contains `original_recipe` with correct data
- ✅ Response contains `modified_recipe` with modifications
- ✅ Response contains `ai_metadata` with model, provider, duration, raw_response
- ✅ Response contains `applied_preferences` matching user preferences
- ✅ Modified recipe reflects dietary restrictions (e.g., vegan substitutions)
- ✅ Explanation field describes the changes made
- ✅ Log entry shows successful generation with duration

---

#### Test 2: Valid Request with Minimal Preferences
**Scenario**: User with only `diet_type` set

**Setup**:
- User has only `diet_type: "vegetarian"`
- `allergies` and `disliked_ingredients` are null or empty arrays

**Request**:
```bash
POST /api/recipes/{valid-recipe-id}/ai-preview
```

**Expected Result**:
- ✅ Status: 200 OK
- ✅ Response structure matches Test 1
- ✅ Modified recipe reflects vegetarian diet only
- ✅ `applied_preferences.allergies` is null or empty array
- ✅ `applied_preferences.disliked_ingredients` is null or empty array

---

### ❌ Error Scenario Tests

#### Test 3: Invalid UUID Format
**Scenario**: Recipe ID is not a valid UUID

**Request**:
```bash
POST /api/recipes/invalid-uuid/ai-preview
```

**Expected Result**:
- ✅ Status: 400 Bad Request
- ✅ Response body:
```json
{
  "error": "Invalid input",
  "message": "Recipe ID must be a valid UUID"
}
```
- ✅ Log entry shows validation warning

---

#### Test 4: Non-Existent Recipe ID
**Scenario**: Valid UUID but recipe doesn't exist

**Request**:
```bash
POST /api/recipes/00000000-0000-0000-0000-000000000000/ai-preview
```

**Expected Result**:
- ✅ Status: 404 Not Found
- ✅ Response body:
```json
{
  "error": "Not found",
  "message": "Recipe not found or you don't have access to it"
}
```
- ✅ Log entry shows "Recipe not found or unauthorized"

---

#### Test 5: Recipe Owned by Different User
**Scenario**: Recipe exists but belongs to another user

**Setup**:
- Create recipe with different owner_id
- Request with DEFAULT_USER credentials

**Request**:
```bash
POST /api/recipes/{other-users-recipe-id}/ai-preview
```

**Expected Result**:
- ✅ Status: 404 Not Found (same as Test 4 for security)
- ✅ Does not reveal that recipe exists
- ✅ Log entry shows "Recipe not found or unauthorized"

---

#### Test 6: No Dietary Preferences Set
**Scenario**: User has no dietary preferences configured

**Setup**:
- Set all preference fields to null:
```bash
PUT /api/profile/dietary-preferences
{
  "diet_type": null,
  "allergies": [],
  "disliked_ingredients": []
}
```

**Request**:
```bash
POST /api/recipes/{valid-recipe-id}/ai-preview
```

**Expected Result**:
- ✅ Status: 400 Bad Request
- ✅ Response body:
```json
{
  "error": "No dietary preferences",
  "message": "Please set your dietary preferences before modifying recipes.",
  "action": "Navigate to profile settings to add dietary preferences"
}
```
- ✅ Log entry shows "No dietary preferences set"

---

#### Test 7: Empty Dietary Preferences (All Null)
**Scenario**: Preferences row exists but all fields are null

**Setup**:
- User has dietary_preferences row with all NULL values

**Request**:
```bash
POST /api/recipes/{valid-recipe-id}/ai-preview
```

**Expected Result**:
- ✅ Status: 400 Bad Request (same as Test 6)
- ✅ Response matches Test 6

---

### 🚦 Rate Limiting Tests

#### Test 8: Within Rate Limit (10 Requests)
**Scenario**: User makes 10 requests within 1 minute

**Procedure**:
1. Clear rate limit cache (if possible) or wait 60 seconds
2. Make 10 consecutive requests to the endpoint

**Expected Result**:
- ✅ First 10 requests return 200 OK
- ✅ Each request processes successfully
- ✅ No rate limit errors

---

#### Test 9: Rate Limit Exceeded (11th Request)
**Scenario**: User makes 11th request within 1 minute

**Procedure**:
1. Make 10 requests (as in Test 8)
2. Immediately make 11th request

**Expected Result**:
- ✅ Status: 429 Too Many Requests
- ✅ Response body:
```json
{
  "error": "Rate limit exceeded",
  "message": "You've made too many AI modification requests. Please wait before trying again.",
  "retry_after": 60
}
```
- ✅ Response header includes `Retry-After: 60`
- ✅ Log entry shows rate limit warning with retry_after value

---

#### Test 10: Rate Limit Reset After 60 Seconds
**Scenario**: User waits 60 seconds and tries again

**Procedure**:
1. Trigger rate limit (11 requests)
2. Wait 60 seconds
3. Make another request

**Expected Result**:
- ✅ Status: 200 OK
- ✅ Request processes successfully
- ✅ Rate limit counter has reset

---

### 🔍 Data Validation Tests

#### Test 11: Response Structure Validation
**Scenario**: Verify response matches AIPreviewResponseDTO

**Validation Checklist**:
- ✅ `original_recipe.id` is UUID
- ✅ `original_recipe.title` matches source recipe
- ✅ `original_recipe.ingredients` matches source recipe
- ✅ `original_recipe.instructions` matches source recipe
- ✅ `modified_recipe.title` is different from original
- ✅ `modified_recipe.ingredients` contains substitutions
- ✅ `modified_recipe.instructions` may contain modifications
- ✅ `modified_recipe.explanation` is non-empty string
- ✅ `ai_metadata.model` is "anthropic/claude-3.5-sonnet"
- ✅ `ai_metadata.provider` is "openrouter"
- ✅ `ai_metadata.generation_duration` is positive integer
- ✅ `ai_metadata.raw_response` contains valid OpenRouter response structure
- ✅ `applied_preferences` matches user's dietary preferences

---

#### Test 12: No Database Writes
**Scenario**: Verify endpoint doesn't save anything to database

**Procedure**:
1. Count recipes in database before request
2. Make AI preview request
3. Count recipes in database after request
4. Check recipe_ai_metadata table

**Expected Result**:
- ✅ Recipe count unchanged
- ✅ No new recipes created
- ✅ No new ai_metadata entries created
- ✅ Original recipe not modified

---

### ⚡ Performance Tests

#### Test 13: Response Time
**Scenario**: Verify acceptable response time

**Expected Result**:
- ✅ Response time < 5 seconds (including 1-3s mock latency)
- ✅ Average response time ~2.5 seconds
- ✅ Log shows `duration_ms` in success log

---

#### Test 14: Parallel Requests from Same User
**Scenario**: User makes multiple simultaneous requests

**Procedure**:
1. Make 5 parallel requests simultaneously
2. Observe rate limiting behavior

**Expected Result**:
- ✅ Each request counted separately
- ✅ Rate limit applies across parallel requests
- ✅ If within limit, all succeed
- ✅ If exceeding limit, appropriate 429 responses

---

### 🛡️ Security Tests

#### Test 15: Unauthenticated Request
**Scenario**: Request without authentication token (handled by middleware)

**Request**:
```bash
POST /api/recipes/{valid-recipe-id}/ai-preview
# No Authorization header
```

**Expected Result**:
- ✅ Status: 401 Unauthorized (handled by middleware)
- ✅ Request doesn't reach endpoint handler

---

#### Test 16: SQL Injection Attempt
**Scenario**: Try to inject SQL via recipe ID

**Request**:
```bash
POST /api/recipes/'; DROP TABLE recipes; --/ai-preview
```

**Expected Result**:
- ✅ Status: 400 Bad Request (UUID validation fails)
- ✅ No SQL executed
- ✅ Validation error message returned

---

### 🧪 Edge Cases

#### Test 17: Very Long Recipe Content
**Scenario**: Recipe near 10,000 character limit

**Setup**:
- Create recipe with ingredients + instructions totaling ~9,900 characters

**Expected Result**:
- ✅ Status: 200 OK
- ✅ Modified recipe generated successfully
- ✅ Response time may be slightly longer
- ✅ No errors or truncation

---

#### Test 18: Special Characters in Recipe
**Scenario**: Recipe contains special characters, emojis, unicode

**Setup**:
- Recipe with ingredients like: "½ cup milk, 2 🥚 eggs, ¼ tsp salt"

**Expected Result**:
- ✅ Status: 200 OK
- ✅ Special characters preserved in response
- ✅ No encoding issues

---

#### Test 19: Multiple Allergies
**Scenario**: User has many allergies

**Setup**:
```json
{
  "diet_type": "vegan",
  "allergies": ["gluten", "dairy", "nuts", "soy", "eggs"],
  "disliked_ingredients": ["mushrooms", "olives"]
}
```

**Expected Result**:
- ✅ Status: 200 OK
- ✅ All allergies reflected in substitutions
- ✅ Explanation mentions all allergies
- ✅ Disliked ingredients replaced

---

## Logging Verification

For each test, verify appropriate log entries:

### Success Logs (Info Level)
```json
{
  "timestamp": "2025-12-07T...",
  "level": "info",
  "message": "AI preview generation completed",
  "context": {
    "user_id": "...",
    "endpoint": "/api/recipes/.../ai-preview",
    "duration_ms": 2500
  }
}
```

### Warning Logs
- Invalid UUID format
- Rate limit exceeded
- Recipe not found
- No dietary preferences

### Error Logs
- AI service failures
- Database errors
- Unexpected errors (with stack trace)

## Test Automation Recommendations

Consider automating these tests using:
- **Integration Tests**: Vitest or Jest with Supertest
- **Load Testing**: k6 or Artillery for rate limiting
- **Contract Testing**: Ensure response matches TypeScript types

## Manual Testing Tools

### Recommended Tools
- **Postman/Insomnia**: For manual API testing
- **curl**: For command-line testing
- **Browser DevTools**: For inspecting requests/responses

### Example curl Commands

```bash
# Test 1: Happy path
curl -X POST http://localhost:3000/api/recipes/{recipe-id}/ai-preview \
  -H "Content-Type: application/json"

# Test 3: Invalid UUID
curl -X POST http://localhost:3000/api/recipes/invalid-uuid/ai-preview \
  -H "Content-Type: application/json"

# Test 9: Rate limit test (run 11 times quickly)
for i in {1..11}; do
  echo "Request $i"
  curl -X POST http://localhost:3000/api/recipes/{recipe-id}/ai-preview \
    -H "Content-Type: application/json"
  echo ""
done
```

## Coverage Checklist

- ✅ All happy path scenarios tested
- ✅ All error scenarios tested
- ✅ Rate limiting tested (within limit, exceeded, reset)
- ✅ Data validation tested
- ✅ Performance tested
- ✅ Security tested
- ✅ Edge cases tested
- ✅ Logging verified for all scenarios
- ✅ No database writes verified
- ✅ Response structure matches types

## Known Limitations (MVP)

1. **In-Memory Rate Limiting**: Rate limits don't persist across server restarts
2. **Mocked AI Service**: No actual OpenRouter integration
3. **Single User Auth**: Uses DEFAULT_USER constant instead of real JWT auth
4. **No Distributed Rate Limiting**: Won't work correctly with multiple server instances

These limitations are acceptable for MVP and documented for future improvements.
