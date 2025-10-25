# Create Postman Collection

Create a comprehensive Postman API collection for the RaioX Recognize medical imaging analysis back-end.

## Instructions

You are tasked with creating a complete Postman API collection for this project. Follow these guidelines carefully:

### 1. Collection Structure

- **Info Section:**
  - Generate a unique `_postman_id` (UUID format)
  - Use naming pattern: `"RaioX Recognize - Medical Imaging Analysis API"`
  - Add comprehensive description explaining the service purpose
  - Use schema version: `"https://schema.getpostman.com/json/collection/v2.1.0/collection.json"`

### 2. Request Organization

- **Group by Domain/Resource** with emoji prefixes:
  - 📤 for Upload/Image Processing
  - 🔍 for Search/Similarity
  - 🩺 for Medical Analysis
  - 📊 for SSE/Real-time Updates
  - 💚 for Health Checks

- **Request Naming Convention:**
  - Use clear, action-oriented names: "Upload Image", "Search Similar Images", "Get Diagnosis Stream"
  - Include context when needed: "Process Image from Folder", "Get Medical Description"
  - Use proper HTTP method verbs in names

### 3. Test Scripts

Every request MUST include test scripts following this pattern:

```json
{
  "listen": "test",
  "script": {
    "exec": [
      "pm.test('Status code is [EXPECTED_CODE]', function () {",
      "    pm.response.to.have.status([EXPECTED_CODE]);",
      "});",
      "",
      "pm.test('[SPECIFIC_VALIDATION]', function () {",
      "    const responseJson = pm.response.json();",
      "    pm.expect(responseJson).to.have.property('[PROPERTY]');",
      "    // Additional assertions",
      "});"
    ],
    "type": "text/javascript",
    "packages": {}
  }
}
```

**Test Script Rules:**
- Always test status code first
- Test response structure (has expected properties)
- For UPLOAD requests: Save the returned hash/ID to environment
  ```javascript
  pm.environment.set('test_image_hash', responseJson.sha256);
  pm.environment.set('test_session_id', responseJson.sessionId);
  ```
- For search results: Validate similarity scores and descriptions
- Use descriptive test names explaining what is being validated

### 4. Request Format

**Headers:**
```json
{
  "key": "Content-Type",
  "value": "application/json"
}
```

For multipart uploads:
```json
{
  "key": "Content-Type",
  "value": "multipart/form-data"
}
```

**URL Structure:**
```json
{
  "raw": "{{base_url}}/[endpoint]",
  "host": ["{{base_url}}"],
  "path": ["[endpoint]"]
}
```

**Body (for POST/PUT):**
```json
{
  "mode": "raw",
  "raw": "{\n    \"query\": \"melanoma maligno\",\n    \"k\": 5\n}"
}
```

For file uploads:
```json
{
  "mode": "formdata",
  "formdata": [
    {
      "key": "file",
      "type": "file",
      "src": "/path/to/xray.jpg"
    }
  ]
}
```

### 5. API Endpoints Pattern

For this medical imaging analysis system, include these operations:

#### 📤 Upload & Processing
1. **Upload Image** - `POST /upload` (or similar endpoint)
   - Multipart file upload
   - Test: Verify 200/201 status and save session ID

#### 🔍 Search & Similarity
2. **Search Similar Images** - `POST /search`
   - Body: `{ "query": "description or condition", "k": 5 }`
   - Test: Verify 200 status and results array with similarity scores

#### 🩺 Medical Analysis
3. **Get Image Description** - May be part of upload response
   - Test: Verify medical description is present and meaningful

#### 📊 Real-time Updates (SSE)
4. **Connect to Diagnosis Stream** - `GET /resposta/:sessionId`
   - SSE endpoint for streaming responses
   - Test: Verify 200 status and Content-Type is text/event-stream

#### 💚 Health Check
5. **Health Check** - `GET /`
   - Test: Verify 200 status and `{ "status": "ok" }`

### 6. Global Configuration

**Variables:**
```json
{
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3000",
      "description": "RaioX Recognize API base URL"
    },
    {
      "key": "test_session_id",
      "value": "",
      "description": "Session ID from upload for SSE connection"
    },
    {
      "key": "test_image_hash",
      "value": "",
      "description": "SHA-256 hash of uploaded image"
    }
  ]
}
```

**Environment Variables Pattern:**
- `base_url` - Service base URL (default: http://localhost:3000)
- `test_session_id` - For SSE connections
- `test_image_hash` - SHA-256 hash for tracking uploaded images
- `test_image_filename` - Filename of uploaded image

### 7. Event Scripts

**Pre-request Script (global):**
```json
{
  "listen": "prerequest",
  "script": {
    "type": "text/javascript",
    "packages": {},
    "exec": [
      "// Set timestamp for this request",
      "pm.environment.set('timestamp', new Date().toISOString());"
    ]
  }
}
```

**Test Script (global):**
```json
{
  "listen": "test",
  "script": {
    "type": "text/javascript",
    "packages": {},
    "exec": [
      "// Log response time",
      "console.log('Response time: ' + pm.response.responseTime + 'ms');"
    ]
  }
}
```

### 8. Response Examples

Include `"response": []` for each request (empty array for now, can be populated with actual examples later)

### 9. Analysis Steps

Before creating the collection:

1. **Analyze the codebase:**
   - Read all controllers in `src/controllers/`
   - Read all routes in `src/routes/`
   - Identify all endpoints and their HTTP methods
   - Check `src/server.ts` for base configuration
   - Review `package.json` for PORT configuration

2. **Review route files:**
   - Extract endpoint paths and descriptions
   - Get request/response schemas
   - Identify required and optional fields

3. **Check environment configuration:**
   - Look for `.env.example` or documentation for required env vars
   - Determine default port (PORT=3000 is default)

### 10. Special Considerations

- **File Uploads:** Use multipart/form-data with file field
- **Image Formats:** Support JPG, PNG (common medical imaging formats)
- **Hashes:** SHA-256 hashes are used for deduplication
- **Embeddings:** Text embeddings are generated for similarity search
- **SSE Connections:** Keep-alive connections for streaming responses
- **CORS:** Frontend runs on http://localhost:4200
- **Query Format:** Search accepts string or object format
- **Similarity Scores:** Results include cosine similarity scores

### 11. File Location

Save the collection to:
```
docs/postman/RaioX Recognize - Medical Imaging Analysis API.postman_collection.json
```

### 12. Validation Checklist

Before finalizing, verify:

- [ ] All main endpoints are present (upload, search, SSE, health)
- [ ] Every request has test scripts
- [ ] Status codes are appropriate (200, 201, 400, 500)
- [ ] Environment variables are defined and used consistently
- [ ] Request bodies have realistic medical example data
- [ ] URLs use proper variable substitution
- [ ] Multipart file uploads are properly configured
- [ ] Groups are properly organized with emojis
- [ ] Variable descriptions are clear
- [ ] Response arrays are included (even if empty)
- [ ] SSE endpoint configuration is correct

## Example Upload Request Structure

```json
{
  "name": "Upload X-Ray Image",
  "event": [
    {
      "listen": "test",
      "script": {
        "exec": [
          "pm.test('Status code is 200', function () {",
          "    pm.response.to.have.status(200);",
          "});",
          "",
          "pm.test('Response has image hash and description', function () {",
          "    const responseJson = pm.response.json();",
          "    pm.expect(responseJson).to.have.property('sha256');",
          "    pm.expect(responseJson).to.have.property('description');",
          "    pm.environment.set('test_image_hash', responseJson.sha256);",
          "    if (responseJson.sessionId) {",
          "        pm.environment.set('test_session_id', responseJson.sessionId);",
          "    }",
          "});"
        ],
        "type": "text/javascript",
        "packages": {}
      }
    }
  ],
  "request": {
    "method": "POST",
    "header": [],
    "body": {
      "mode": "formdata",
      "formdata": [
        {
          "key": "file",
          "type": "file",
          "src": "/path/to/melanoma-xray.jpg",
          "description": "Medical X-Ray or skin lesion image"
        }
      ]
    },
    "url": {
      "raw": "{{base_url}}/upload",
      "host": ["{{base_url}}"],
      "path": ["upload"]
    },
    "description": "Upload a medical image for analysis. The system will generate a description using OpenAI Vision API and create embeddings for similarity search."
  },
  "response": []
}
```

## Example Search Request Structure

```json
{
  "name": "Search Similar Lesions",
  "event": [
    {
      "listen": "test",
      "script": {
        "exec": [
          "pm.test('Status code is 200', function () {",
          "    pm.response.to.have.status(200);",
          "});",
          "",
          "pm.test('Response has results array', function () {",
          "    const responseJson = pm.response.json();",
          "    pm.expect(responseJson).to.have.property('results');",
          "    pm.expect(responseJson.results).to.be.an('array');",
          "    if (responseJson.results.length > 0) {",
          "        pm.expect(responseJson.results[0]).to.have.property('similarity');",
          "        pm.expect(responseJson.results[0]).to.have.property('description');",
          "    }",
          "});"
        ],
        "type": "text/javascript",
        "packages": {}
      }
    }
  ],
  "request": {
    "method": "POST",
    "header": [
      {
        "key": "Content-Type",
        "value": "application/json"
      }
    ],
    "body": {
      "mode": "raw",
      "raw": "{\n    \"query\": \"melanoma maligno com bordas irregulares\",\n    \"k\": 5\n}"
    },
    "url": {
      "raw": "{{base_url}}/search",
      "host": ["{{base_url}}"],
      "path": ["search"]
    },
    "description": "Search for similar medical images based on textual description or medical condition"
  },
  "response": []
}
```

## Output

Provide a complete, valid Postman Collection v2.1.0 JSON file that can be imported directly into Postman.
