# API Documentation

Complete reference for all Equestrian Event Management API endpoints.

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://yourdomain.vercel.app/api`

## Authentication

All protected endpoints require JWT token in Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Response Format

All API responses follow this structure:

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "error": null
}
```

Error responses:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {
      "field": ["Error messages for field"]
    }
  }
}
```

---

## 🔐 Authentication Endpoints

### POST `/auth/login`

Authenticate user and get JWT token.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "roles": [
        { "id": "role-uuid", "name": "ADMIN" }
      ]
    }
  }
}
```

**Error Responses**:
- `401 UNAUTHORIZED`: Invalid credentials
- `400 BAD_REQUEST`: Missing email or password
- `500 INTERNAL_SERVER_ERROR`: Server error

---

### POST `/auth/signup`

Create new user account.

**Request Body**:
```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@example.com",
  "password": "SecurePassword123"
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-uuid",
      "email": "jane@example.com",
      "firstName": "Jane",
      "lastName": "Doe"
    }
  }
}
```

**Error Responses**:
- `400 DUPLICATE_EMAIL`: Email already registered
- `400 BAD_REQUEST`: Validation failed
- `500 INTERNAL_SERVER_ERROR`: Server error

---

## 📅 Event Endpoints

### GET `/events`

List all events with pagination and filters.

**Query Parameters**:
- `page` (number): Page number, default 1
- `pageSize` (number): Items per page, default 10, max 100
- `search` (string): Search event name or description
- `eventType` (string): Filter by type (KSEC, EPL, EIRS Show)
- `status` (string): Filter by status (published, draft)
- `startDate` (ISO date): Filter events starting from this date
- `endDate` (ISO date): Filter events ending before this date

**Example**:
```
GET /events?page=1&pageSize=20&search=championship&eventType=KSEC
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "event-uuid",
        "name": "Spring Championship 2024",
        "eventType": "KSEC",
        "startDate": "2024-05-01T00:00:00Z",
        "endDate": "2024-05-03T00:00:00Z",
        "venueName": "Elite Equestrian Club",
        "registrations": [
          // Registration count
        ]
      }
    ],
    "total": 45,
    "page": 1,
    "pageSize": 20,
    "totalPages": 3
  }
}
```

**Required Roles**: ADMIN

---

### POST `/events`

Create new event.

**Request Body**:
```json
{
  "eventType": "KSEC",
  "name": "Summer Championship 2024",
  "description": "Annual summer championship",
  "startDate": "2024-07-01",
  "endDate": "2024-07-05",
  "startTime": "08:00",
  "endTime": "18:00",
  "venueName": "Grand Equestrian Park",
  "venueAddress": "123 Horse Lane, City, State",
  "venueLat": 40.7128,
  "venueLng": -74.0060,
  "termsAndConditions": "Terms here...",
  "categoryIds": ["category-uuid-1", "category-uuid-2"]
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "id": "event-uuid",
    "name": "Summer Championship 2024",
    "eventType": "KSEC",
    // ... full event object
  }
}
```

**Error Responses**:
- `400 BAD_REQUEST`: Invalid date or missing required fields
- `401 UNAUTHORIZED`: Not authenticated
- `403 FORBIDDEN`: Insufficient permissions

**Required Roles**: ADMIN

---

### GET `/events/:id`

Get event details with registrations.

**Parameters**:
- `id` (string, required): Event UUID

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "event-uuid",
    "name": "Summer Championship 2024",
    "eventType": "KSEC",
    "startDate": "2024-07-01T00:00:00Z",
    "endDate": "2024-07-05T00:00:00Z",
    "registrations": [
      {
        "id": "reg-uuid",
        "rider": {
          "id": "rider-uuid",
          "firstName": "John",
          "lastName": "Doe"
        },
        "horse": {
          "id": "horse-uuid",
          "name": "Thunder"
        },
        "paymentStatus": "COMPLETED"
      }
    ]
  }
}
```

**Error Responses**:
- `404 NOT_FOUND`: Event not found
- `500 INTERNAL_SERVER_ERROR`: Server error

---

### PUT `/events/:id`

Update event details.

**Parameters**:
- `id` (string, required): Event UUID

**Request Body** (all fields optional):
```json
{
  "name": "Updated Event Name",
  "description": "Updated description",
  "startDate": "2024-07-02",
  "endDate": "2024-07-06",
  "isPublished": true,
  "categoryIds": ["category-uuid-1"]
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "event-uuid",
    "name": "Updated Event Name",
    // ... updated event object
  }
}
```

**Error Responses**:
- `404 NOT_FOUND`: Event not found
- `400 BAD_REQUEST`: Invalid data

**Required Roles**: ADMIN

---

### DELETE `/events/:id`

Delete event (only if no registrations).

**Parameters**:
- `id` (string, required): Event UUID

**Response (200 OK)**:
```json
{
  "success": true,
  "data": { "id": "event-uuid" }
}
```

**Error Responses**:
- `404 NOT_FOUND`: Event not found
- `400 BAD_REQUEST`: Cannot delete event with registrations

**Required Roles**: ADMIN

---

## 👥 Rider Endpoints

### GET `/riders`

List all riders.

**Query Parameters**:
- `page` (number): Page number, default 1
- `pageSize` (number): Items per page, max 100
- `search` (string): Search by first/last name or email
- `clubId` (string): Filter by club
- `competitionLevel` (string): Filter by level (BEGINNER, INTERMEDIATE, ADVANCED, PROFESSIONAL)

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "rider-uuid",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "competitionLevel": "ADVANCED",
        "club": {
          "id": "club-uuid",
          "name": "Elite Equestrian Club"
        },
        "horses": [{ "id": "horse-uuid", "name": "Thunder" }],
        "_count": {
          "horses": 2,
          "registrations": 5
        }
      }
    ],
    "total": 120,
    "page": 1,
    "pageSize": 10,
    "totalPages": 12
  }
}
```

**Required Roles**: ADMIN, CLUB_MANAGER

---

### POST `/riders`

Create new rider.

**Request Body**:
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "dateOfBirth": "1995-05-15",
  "gender": "FEMALE",
  "clubId": "club-uuid",
  "competitionLevel": "ADVANCED",
  "emergencyContactName": "John Smith",
  "emergencyContactPhone": "+1234567891"
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "id": "rider-uuid",
    "firstName": "Jane",
    "lastName": "Smith",
    // ... full rider object
  }
}
```

**Required Roles**: ADMIN, CLUB_MANAGER

---

### GET `/riders/:id`

Get rider details.

**Parameters**:
- `id` (string, required): Rider UUID

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "rider-uuid",
    "firstName": "Jane",
    "lastName": "Smith",
    "horses": [
      {
        "id": "horse-uuid",
        "name": "Thunder",
        "breed": "Arabian",
        "color": "Bay"
      }
    ],
    "registrations": [
      {
        "id": "reg-uuid",
        "event": {
          "id": "event-uuid",
          "name": "Championship"
        }
      }
    ]
  }
}
```

---

### PUT `/riders/:id`

Update rider information.

**Parameters**:
- `id` (string, required): Rider UUID

**Request Body** (optional fields):
```json
{
  "firstName": "Janet",
  "lastName": "Johnson",
  "email": "janet@example.com",
  "competitionLevel": "PROFESSIONAL"
}
```

---

### DELETE `/riders/:id`

Delete rider (only if no registrations).

**Required Roles**: ADMIN, CLUB_MANAGER

---

## 🐴 Horse Endpoints

### GET `/horses`

List all horses.

**Query Parameters**:
- `page` (number): Page number, default 1
- `pageSize` (number): Items per page, max 100
- `search` (string): Search by name or registration number
- `riderId` (string): Filter by rider
- `breed` (string): Filter by breed

**Required Roles**: ADMIN, CLUB_MANAGER

---

### POST `/horses`

Create new horse.

**Request Body**:
```json
{
  "name": "Thunder",
  "breed": "Arabian",
  "color": "Bay",
  "registrationNumber": "AR-2023-001",
  "dateOfBirth": "2019-03-20",
  "riderId": "rider-uuid",
  "description": "Strong jumper"
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "id": "horse-uuid",
    "name": "Thunder",
    "breed": "Arabian",
    // ... full horse object
  }
}
```

**Required Roles**: ADMIN, CLUB_MANAGER

---

### GET `/horses/:id`

Get horse details with registrations.

---

### PUT `/horses/:id`

Update horse information.

---

### DELETE `/horses/:id`

Delete horse (only if no registrations).

---

## 📝 Registration Endpoints

### GET `/registrations`

List event registrations.

**Query Parameters**:
- `page` (number): Page number
- `pageSize` (number): Items per page
- `eventId` (string): Filter by event
- `riderId` (string): Filter by rider
- `paymentStatus` (string): PENDING, PARTIAL, COMPLETED

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "reg-uuid",
        "event": { "id": "event-uuid", "name": "Championship" },
        "rider": { "id": "rider-uuid", "firstName": "John", "lastName": "Doe" },
        "horse": { "id": "horse-uuid", "name": "Thunder" },
        "category": { "id": "cat-uuid", "name": "Jumping" },
        "fee": 250,
        "gst": 45,
        "totalAmount": 295,
        "paymentStatus": "PENDING"
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 10,
    "totalPages": 5
  }
}
```

**Required Roles**: ADMIN, CLUB_MANAGER

---

### POST `/registrations`

Register rider for event.

**Request Body**:
```json
{
  "eventId": "event-uuid",
  "riderId": "rider-uuid",
  "horseId": "horse-uuid",
  "categoryId": "category-uuid",
  "fee": 250,
  "gst": 45,
  "notes": "Special dietary requirements..."
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "id": "reg-uuid",
    "event": { ... },
    "rider": { ... },
    "horse": { ... },
    "category": { ... },
    "fee": 250,
    "gst": 45,
    "totalAmount": 295,
    "paymentStatus": "PENDING"
  }
}
```

**Error Responses**:
- `400 BAD_REQUEST`: Rider already registered for this event
- `400 BAD_REQUEST`: Invalid event, rider, horse, or category

**Required Roles**: ADMIN, CLUB_MANAGER

---

## 💰 Financial Endpoints

### GET `/financial`

List payment transactions.

**Query Parameters**:
- `page` (number): Page number
- `pageSize` (number): Items per page
- `registrationId` (string): Filter by registration
- `paymentMethod` (string): CASH, CARD, BANK_TRANSFER, CHEQUE
- `startDate` (ISO date): Filter from date
- `endDate` (ISO date): Filter to date

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "txn-uuid",
        "registrationId": "reg-uuid",
        "registration": {
          "event": { "name": "Championship" },
          "rider": { "firstName": "John", "lastName": "Doe" }
        },
        "amount": 295,
        "paymentMethod": "CARD",
        "referenceNumber": "TXN-2024-001",
        "transactionDate": "2024-05-01T10:30:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 10,
    "totalPages": 10,
    "totalAmount": 29500
  }
}
```

**Required Roles**: ADMIN, CLUB_MANAGER

---

### POST `/financial`

Record payment transaction.

**Request Body**:
```json
{
  "registrationId": "reg-uuid",
  "amount": 295,
  "paymentMethod": "CARD",
  "referenceNumber": "TXN-2024-001",
  "notes": "Payment received via Stripe"
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "id": "txn-uuid",
    "registrationId": "reg-uuid",
    "amount": 295,
    "paymentMethod": "CARD",
    "referenceNumber": "TXN-2024-001",
    "transactionDate": "2024-05-01T10:30:00Z"
  }
}
```

**Error Responses**:
- `400 BAD_REQUEST`: Payment exceeds registration amount
- `400 BAD_REQUEST`: Invalid payment method

**Required Roles**: ADMIN, CLUB_MANAGER

---

## 👨‍💼 Users Endpoints (Admin Only)

### GET `/users`

List system users.

**Query Parameters**:
- `page` (number): Page number
- `pageSize` (number): Items per page
- `search` (string): Search by email, first/last name
- `isActive` (boolean): Filter by active status

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "user-uuid",
        "email": "admin@example.com",
        "firstName": "Admin",
        "lastName": "User",
        "phone": "+1234567890",
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00Z",
        "roles": [
          { "id": "role-uuid", "name": "ADMIN" }
        ]
      }
    ],
    "total": 25,
    "page": 1,
    "pageSize": 10,
    "totalPages": 3
  }
}
```

**Required Roles**: ADMIN

---

### POST `/users`

Create new system user.

**Request Body**:
```json
{
  "email": "newuser@example.com",
  "firstName": "New",
  "lastName": "User",
  "phone": "+1234567890",
  "roleIds": ["role-uuid-admin"]
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "email": "newuser@example.com",
    "firstName": "New",
    "lastName": "User",
    "tempPassword": "TempPass123456",
    "roles": [{ "id": "role-uuid", "name": "ADMIN" }]
  }
}
```

**Note**: `tempPassword` should be sent to user via secure email

**Required Roles**: ADMIN

---

### GET `/users/:id`

Get user details.

---

### PUT `/users/:id`

Update user information.

---

### DELETE `/users/:id`

Delete user (cannot delete last admin user).

---

## ⚙️ Settings Endpoints (Admin Only)

### GET `/settings`

Get all system settings.

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "PLATFORM_NAME": "Equestrian Event Manager",
    "GST_PERCENTAGE": 18,
    "MAX_RIDERS_PER_EVENT": 100,
    "REGISTRATION_DEADLINE_DAYS": 7
  }
}
```

---

### POST `/settings`

Update system setting.

**Request Body**:
```json
{
  "key": "GST_PERCENTAGE",
  "value": "18"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "key": "GST_PERCENTAGE",
    "value": 18
  }
}
```

**Required Roles**: ADMIN

---

## 📋 Audit Log Endpoints (Admin Only)

### GET `/audit`

View system audit logs.

**Query Parameters**:
- `page` (number): Page number
- `pageSize` (number): Items per page
- `userId` (string): Filter by user
- `entityType` (string): Filter by entity type (Event, Rider, Horse, etc.)
- `action` (string): CREATE, UPDATE, DELETE, VIEW, EXPORT
- `startDate` (ISO date): Filter from date
- `endDate` (ISO date): Filter to date

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "audit-uuid",
        "userId": "user-uuid",
        "user": { "email": "admin@example.com", "firstName": "Admin" },
        "entityType": "Event",
        "entityId": "event-uuid",
        "action": "UPDATE",
        "changes": ["name", "description"],
        "oldValues": { "name": "Old Name" },
        "newValues": { "name": "New Name" },
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0...",
        "description": "Updated Event: name, description",
        "createdAt": "2024-05-01T10:30:00Z"
      }
    ],
    "total": 500,
    "page": 1,
    "pageSize": 10,
    "totalPages": 50
  }
}
```

**Required Roles**: ADMIN

---

## 🔄 Pagination

All list endpoints support pagination:

```json
{
  "data": [...],
  "total": 150,
  "page": 1,
  "pageSize": 10,
  "totalPages": 15
}
```

- `page`: Current page (1-indexed)
- `pageSize`: Items per page (1-100, default 10)
- `total`: Total number of records
- `totalPages`: Total number of pages

Query example: `GET /events?page=2&pageSize=20`

---

## 🔑 Role Hierarchy

- **ADMIN**: Full system access
- **CLUB_MANAGER**: Manage own club's resources
- **RIDER**: View own registrations
- **VIEWER**: Read-only access

---

## 📊 HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200  | OK - Request successful |
| 201  | Created - Resource created |
| 400  | Bad Request - Invalid input |
| 401  | Unauthorized - Missing authentication |
| 403  | Forbidden - Insufficient permissions |
| 404  | Not Found - Resource doesn't exist |
| 405  | Method Not Allowed - HTTP method not supported |
| 500  | Internal Server Error - Server error |

---

## 🧪 Example Requests

### Complete Flow: Register Rider for Event

```bash
# 1. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "AdminPass123"
  }' | jq -r '.data.token' > token.txt

TOKEN=$(cat token.txt)

# 2. Create event
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "eventType": "KSEC",
    "name": "Spring Championship",
    "startDate": "2024-05-01",
    "endDate": "2024-05-03",
    "venueName": "Elite Club"
  }'

# 3. Create rider
curl -X POST http://localhost:3000/api/riders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "competitionLevel": "ADVANCED"
  }'

# 4. Create horse
curl -X POST http://localhost:3000/api/horses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Thunder",
    "breed": "Arabian",
    "riderId": "RIDER_UUID"
  }'

# 5. Register for event
curl -X POST http://localhost:3000/api/registrations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "eventId": "EVENT_UUID",
    "riderId": "RIDER_UUID",
    "horseId": "HORSE_UUID",
    "categoryId": "CATEGORY_UUID",
    "fee": 250,
    "gst": 45
  }'

# 6. Record payment
curl -X POST http://localhost:3000/api/financial \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "registrationId": "REG_UUID",
    "amount": 295,
    "paymentMethod": "CARD",
    "referenceNumber": "TXN-001"
  }'
```

---

## ⚠️ Rate Limiting

(Future implementation)

Currently unlimited. Will implement rate limiting:
- 100 requests per minute per IP
- 1000 requests per hour per authenticated user

---

## 📞 Support

For API issues or questions:
- Check error code in response
- Review audit logs for state changes
- Check documentation at `/README.md`
