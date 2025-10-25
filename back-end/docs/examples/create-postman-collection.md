# Create Postman Collection

Create a comprehensive Postman API collection for this project following the Fotus standards.

## Instructions

You are tasked with creating a complete Postman API collection for this project. Follow these guidelines carefully:

### 1. Collection Structure

- **Info Section:**
  - Generate a unique `_postman_id` (UUID format)
  - Use naming pattern: `"Fotus [Service Name] - REST API"`
  - Add comprehensive description explaining the service purpose
  - Use schema version: `"https://schema.getpostman.com/json/collection/v2.1.0/collection.json"`
  - Set `_exporter_id`: `"970379"`

### 2. Request Organization

- **Group by Domain/Resource** with emoji prefixes:
  - 👤 for Persons/Users
  - 🏢 for Companies
  - 🔗 for Integrators/Relations
  - 👨‍👩‍👧‍👦 for Customers/Groups
  - 📞 for Contacts
  - 📍 for Addresses
  - 🎭 for Roles
  - 🔑 for Permissions
  - 🔐 for Authentication
  - 💚 for Health Checks

- **Request Naming Convention:**
  - Use clear, action-oriented names: "Get All [Resource]", "Create [Resource]", "Update [Resource]"
  - Include context when needed: "Get [Resource] by ID", "Search [Resources]"
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
- For CREATE requests: Save the created ID to environment
  ```javascript
  pm.environment.set('test_[resource]_id', responseJson.data.id);
  ```
- For status changes: Validate the new status in response
- Use descriptive test names explaining what is being validated

### 5. Documentation
- Enrich document with detailed descriptions
- 



### 4. Request Format

**Headers:**
```json
{
  "key": "Authorization",
  "value": "Bearer {{access_token}}"
},
{
  "key": "Content-Type",
  "value": "application/json"
},
{
  "key": "Accept-Language",
  "value": "{{language}}",
  "type": "text"
}
```

**URL Structure:**
```json
{
  "raw": "{{base_url}}/api/v1/[resource]",
  "host": ["{{base_url}}"],
  "path": ["api", "v1", "[resource]"],
  "query": [
    {"key": "page", "value": "1"},
    {"key": "limit", "value": "20"}
  ]
}
```

**Body (for POST/PUT):**
```json
{
  "mode": "raw",
  "raw": "{\n    \"field\": \"value\"\n}"
}
```

### 5. CRUD Operations Pattern

For each resource, include these operations in order:

1. **LIST/INDEX** - `GET /api/v1/[resources]`
   - Include pagination params: `page`, `limit`, `sort`, `order`
   - Test: Verify 200 status and data array

2. **SEARCH** - `GET /api/v1/[resources]/search`
   - Include filters parameter
   - Test: Verify 200 status and data structure

3. **CREATE** - `POST /api/v1/[resources]`
   - Complete request body with all required fields
   - Test: Verify 201 status and save ID to environment

4. **GET BY ID** - `GET /api/v1/[resources]/{id}`
   - Use environment variable: `{{test_[resource]_id}}`
   - Test: Verify 200 status and data properties

5. **UPDATE** - `PUT /api/v1/[resources]/{id}`
   - Include all updatable fields
   - Test: Verify 200 status and success message

6. **DELETE** - `DELETE /api/v1/[resources]/{id}`
   - Test: Verify 200 status and deletion message

7. **CUSTOM ACTIONS** (if applicable):
   - Activate/Deactivate: `POST /api/v1/[resources]/{id}/activate|deactivate`
   - Change Status: `POST /api/v1/[resources]/{id}/status`
   - Stats/Metrics: `GET /api/v1/[resources]/stats`
   - Hierarchies: `GET /api/v1/[resources]/{id}/hierarchy`

### 6. Global Configuration

**Authentication:**
```json
{
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{access_token}}",
        "type": "string"
      }
    ]
  }
}
```

**Variables:**
```json
{
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:[PORT]",
      "description": "[Service] API base URL"
    },
    {
      "key": "access_token",
      "value": "",
      "description": "JWT access token from authentication"
    },
    {
      "key": "language",
      "value": "pt_BR",
      "description": "API language preference"
    }
  ]
}
```

**Environment Variables Pattern:**
- `base_url` - Service base URL
- `access_token` - JWT token
- `language` - Accept-Language header (pt_BR, en, es)
- `test_[resource]_id` - For each resource created in tests
- `current_user_id` - For authenticated user
- Any relationship IDs: `seller_id`, `company_id`, `integrator_id`, etc.

### 7. Event Scripts

**Pre-request Script (global):**
```json
{
  "listen": "prerequest",
  "script": {
    "type": "text/javascript",
    "packages": {},
    "exec": [""]
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
    "exec": [""]
  }
}
```

### 8. Response Examples

Include `"response": []` for each request (empty array for now, can be populated with actual examples later)

### 9. Analysis Steps

Before creating the collection:

1. **Analyze the codebase:**
   - Read all controllers in `app/Interfaces/Http/Controller/`
   - Identify all routes and their HTTP methods
   - Map domain entities and relationships
   - Identify required and optional fields from commands

2. **Review Swagger annotations:**
   - Extract endpoint descriptions and summaries
   - Get request/response schemas
   - Identify validation rules

3. **Check translations:**
   - Look for translation keys in `storage/languages/`
   - Use appropriate success/error messages

4. **Determine port:**
   - Check `docker-compose.yml` or config files for service port
   - Default ports: 9501 (User), 9502 (Customer), etc.

### 10. Special Considerations

- **Pagination:** Always include page, limit, sort, order parameters
- **Filters:** Use JSON object format in query string: `filters={"field":"value"}`
- **UUIDs:** All IDs should be UUID format v4
- **Dates:** Use ISO 8601 format: `"2020-01-15"` or `"2020-01-15T10:30:00Z"`
- **Phone Numbers:** Include country code: `"+5511987654321"`
- **Documents:** CPF (11 digits), CNPJ (14 digits) - no formatting
- **Status Values:** Common values: `active`, `inactive`, `pending`, `blocked`
- **Priority Values:** `low`, `normal`, `high`, `urgent`

### 11. File Location

Save the collection to:
```
docs/postman/Fotus [Service Name] - REST API.postman_collection.json
```

### 12. Validation Checklist

Before finalizing, verify:

- [ ] All CRUD operations are present for each resource
- [ ] Every request has test scripts
- [ ] Status codes are appropriate (200, 201, 404, etc.)
- [ ] Environment variables are defined and used consistently
- [ ] Request bodies have realistic example data
- [ ] URLs use proper variable substitution
- [ ] Authentication is configured globally
- [ ] Groups are properly organized with emojis
- [ ] Variable descriptions are clear
- [ ] Response arrays are included (even if empty)

## Example Request Structure

```json
{
  "name": "Create Person",
  "event": [
    {
      "listen": "test",
      "script": {
        "exec": [
          "pm.test('Status code is 201', function () {",
          "    pm.response.to.have.status(201);",
          "});",
          "",
          "pm.test('Response has created person ID', function () {",
          "    const responseJson = pm.response.json();",
          "    pm.expect(responseJson.data).to.have.property('id');",
          "    pm.environment.set('test_person_id', responseJson.data.id);",
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
      },
      {
        "key": "Authorization",
        "value": "Bearer {{access_token}}"
      }
    ],
    "body": {
      "mode": "raw",
      "raw": "{\n    \"first_name\": \"João\",\n    \"last_name\": \"Silva\",\n    \"cpf\": \"12345678900\"\n}"
    },
    "url": {
      "raw": "{{base_url}}/api/v1/people",
      "host": ["{{base_url}}"],
      "path": ["api", "v1", "people"]
    }
  },
  "response": []
}
```

## Output

Provide a complete, valid Postman Collection v2.1.0 JSON file that can be imported directly into Postman.