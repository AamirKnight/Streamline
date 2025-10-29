# StreamLine API Documentation

## Authentication

All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

## Auth Service (Port 3001)

### POST /auth/register
Register new user

**Request:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {...},
  "accessToken": "jwt-token"
}
```

### POST /auth/login
Login user

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### GET /auth/profile
Get current user profile (Protected)

### PUT /auth/profile
Update user profile (Protected)

## Workspace Service (Port 3002)

### GET /workspaces
List all workspaces for current user (Protected)

### POST /workspaces
Create new workspace (Protected)

**Request:**
```json
{
  "name": "My Workspace",
  "description": "Workspace description"
}
```

### GET /workspaces/:id
Get workspace by ID (Protected)

### PUT /workspaces/:id
Update workspace (Protected, Admin only)

### DELETE /workspaces/:id
Delete workspace (Protected, Admin only)

### GET /workspaces/:id/members
List workspace members (Protected)

### POST /workspaces/:id/invite
Invite member to workspace (Protected, Admin only)

## Document Service (Port 3003)

### GET /documents?workspaceId=1
List documents in workspace (Protected)

### POST /documents
Create new document (Protected)

**Request:**
```json
{
  "title": "My Document",
  "content": "<p>Content here</p>",
  "workspaceId": 1
}
```

### GET /documents/:id
Get document by ID (Protected)

### PUT /documents/:id
Update document (Protected)

### DELETE /documents/:id
Delete document (Protected)

### GET /documents/:id/versions
Get document version history (Protected)

### GET /documents/search?query=test&workspaceId=1
Search documents (Protected)

## Socket.io Events

### Client → Server

- `document:join` - Join document room
- `document:leave` - Leave document room
- `document:change` - Broadcast content change
- `cursor:update` - Update cursor position
- `typing:status` - Update typing status

### Server → Client

- `document:users` - List of active users
- `document:user-joined` - User joined document
- `document:user-left` - User left document
- `document:change` - Content changed by another user
- `document:updated` - Document saved to database
- `cursor:update` - Cursor position update
- `typing:status` - Typing status update

## Rate Limits

- General API: 100 requests / 15 minutes
- Write operations: 20 requests / 15 minutes
- Document creation: 10 documents / hour

## Error Responses

All errors follow this format:
```json
{
  "error": "Error message here"
}
```

Status codes:
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Too Many Requests
- 500: Internal Server Error