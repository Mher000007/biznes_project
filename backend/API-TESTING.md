# API Testing Guide

Complete guide for testing all backend API endpoints. Use with cURL, Postman, or any HTTP client.

## Base URL
```
http://localhost:5000/api
```

## Authentication Header
```
Authorization: Bearer <JWT_TOKEN>
```

---

## 1. Authentication Endpoints

### Register User
**POST** `/auth/register`

Request:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890"
}
```

Response:
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

cURL:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "phone": "+1234567890"
  }'
```

---

### Login User
**POST** `/auth/login`

Request:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

cURL:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

---

### Get Current User
**GET** `/auth/me` (Protected)

Request:
```
Authorization: Bearer <TOKEN>
```

Response:
```json
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "role": "user",
    "verified": false,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

cURL:
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### Update Profile
**PUT** `/auth/profile` (Protected)

Request:
```json
{
  "name": "Jane Doe",
  "phone": "+9876543210",
  "bio": "Business owner from New York",
  "avatar": "https://example.com/avatar.jpg",
  "location": "New York, USA"
}
```

Response:
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Jane Doe",
    "email": "john@example.com",
    "phone": "+9876543210",
    "bio": "Business owner from New York",
    "location": "New York, USA",
    "role": "user"
  }
}
```

cURL:
```bash
curl -X PUT http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "bio": "Business owner",
    "location": "New York, USA"
  }'
```

---

## 2. Business Endpoints

### Get All Businesses
**GET** `/businesses`

Query Parameters:
- `page` (default: 1)
- `limit` (default: 10)
- `category` - Category ID or slug
- `city` - City name
- `search` - Search in name, description, tags
- `featured` - true/false

Request:
```
GET /api/businesses?page=1&limit=10&city=New%20York&featured=true
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Tech Startup Inc",
      "slug": "tech-startup-inc",
      "description": "Leading tech company",
      "category": "507f1f77bcf86cd799439020",
      "owner": "507f1f77bcf86cd799439011",
      "email": "contact@techstartup.com",
      "phone": "+1234567890",
      "address": "123 Tech St",
      "city": "New York",
      "country": "USA",
      "website": "https://techstartup.com",
      "rating": 4.5,
      "reviewCount": 23,
      "verified": true,
      "featured": true,
      "active": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "current": 1,
    "total": 5,
    "count": 10,
    "total_count": 50
  }
}
```

cURL:
```bash
curl "http://localhost:5000/api/businesses?page=1&limit=10&city=New%20York"
```

---

### Get Business by ID
**GET** `/businesses/:id`

Request:
```
GET /api/businesses/507f1f77bcf86cd799439012
```

Response:
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Tech Startup Inc",
    "description": "Leading tech company",
    "category": {
      "_id": "507f1f77bcf86cd799439020",
      "name": "Technology",
      "slug": "technology"
    },
    "owner": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "rating": 4.5,
    "verified": true,
    "featured": true
  }
}
```

cURL:
```bash
curl http://localhost:5000/api/businesses/507f1f77bcf86cd799439012
```

---

### Get Business by Slug
**GET** `/businesses/slug/:slug`

Request:
```
GET /api/businesses/slug/tech-startup-inc
```

cURL:
```bash
curl http://localhost:5000/api/businesses/slug/tech-startup-inc
```

---

### Create Business
**POST** `/businesses` (Protected)

Request:
```json
{
  "name": "My New Business",
  "description": "A great business",
  "category": "507f1f77bcf86cd799439020",
  "email": "business@example.com",
  "phone": "+1234567890",
  "address": "456 Business Ave",
  "city": "San Francisco",
  "country": "USA",
  "website": "https://mybusiness.com"
}
```

Response:
```json
{
  "success": true,
  "message": "Business created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "My New Business",
    "slug": "my-new-business",
    "category": "507f1f77bcf86cd799439020",
    "owner": "507f1f77bcf86cd799439011",
    "verified": false,
    "featured": false,
    "active": true
  }
}
```

cURL:
```bash
curl -X POST http://localhost:5000/api/businesses \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My New Business",
    "description": "A great business",
    "category": "507f1f77bcf86cd799439020",
    "email": "business@example.com",
    "phone": "+1234567890",
    "address": "456 Business Ave",
    "city": "San Francisco",
    "country": "USA"
  }'
```

---

### Update Business
**PUT** `/businesses/:id` (Protected - Owner only)

Request:
```json
{
  "name": "Updated Business Name",
  "description": "Updated description",
  "phone": "+9876543210",
  "website": "https://updated.com"
}
```

cURL:
```bash
curl -X PUT http://localhost:5000/api/businesses/507f1f77bcf86cd799439013 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Business Name",
    "description": "Updated description"
  }'
```

---

### Delete Business
**DELETE** `/businesses/:id` (Protected - Owner only)

cURL:
```bash
curl -X DELETE http://localhost:5000/api/businesses/507f1f77bcf86cd799439013 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### Get My Businesses
**GET** `/businesses/me/all` (Protected)

cURL:
```bash
curl http://localhost:5000/api/businesses/me/all \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 3. Category Endpoints

### Get All Categories
**GET** `/categories`

Response:
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "name": "Technology",
      "slug": "technology",
      "description": "Tech companies and services",
      "businessCount": 15,
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439021",
      "name": "Healthcare",
      "slug": "healthcare",
      "businessCount": 8,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

cURL:
```bash
curl http://localhost:5000/api/categories
```

---

### Get Category by Slug
**GET** `/categories/:slug`

cURL:
```bash
curl http://localhost:5000/api/categories/technology
```

---

### Create Category
**POST** `/categories` (Protected - Admin only)

Request:
```json
{
  "name": "Finance",
  "description": "Financial services",
  "icon": "💰",
  "image": "https://example.com/finance.jpg"
}
```

cURL:
```bash
curl -X POST http://localhost:5000/api/categories \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Finance",
    "description": "Financial services"
  }'
```

---

## 4. Inquiry Endpoints

### Create Inquiry
**POST** `/inquiries` (Public)

Request:
```json
{
  "businessId": "507f1f77bcf86cd799439012",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "subject": "Partnership Inquiry",
  "message": "I'm interested in partnering with your business..."
}
```

Response:
```json
{
  "success": true,
  "message": "Inquiry submitted successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439030",
    "business": "507f1f77bcf86cd799439012",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+1234567890",
    "subject": "Partnership Inquiry",
    "status": "new",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

cURL:
```bash
curl -X POST http://localhost:5000/api/inquiries \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "507f1f77bcf86cd799439012",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+1234567890",
    "subject": "Partnership Inquiry",
    "message": "I'\''m interested..."
  }'
```

---

### Get Business Inquiries
**GET** `/inquiries/business/:businessId` (Protected - Owner only)

Query Parameters:
- `status` - Filter by status (new, read, responded, closed)
- `page` (default: 1)
- `limit` (default: 10)

cURL:
```bash
curl "http://localhost:5000/api/inquiries/business/507f1f77bcf86cd799439012?status=new" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### Update Inquiry Status
**PUT** `/inquiries/:inquiryId` (Protected - Owner only)

Request:
```json
{
  "status": "responded",
  "response": "Thank you for your inquiry. We are interested in exploring this partnership opportunity."
}
```

cURL:
```bash
curl -X PUT http://localhost:5000/api/inquiries/507f1f77bcf86cd799439030 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "responded",
    "response": "Thank you for your inquiry..."
  }'
```

---

### Get User Inquiries
**GET** `/inquiries/user/all` (Protected)

Query Parameters:
- `page` (default: 1)
- `limit` (default: 10)

cURL:
```bash
curl "http://localhost:5000/api/inquiries/user/all?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Testing Workflow

### 1. Register & Get Token
```bash
# Register
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }' | grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo "Token: $TOKEN"
```

### 2. Create Business
```bash
curl -X POST http://localhost:5000/api/businesses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Business",
    "description": "Test description",
    "category": "507f1f77bcf86cd799439020",
    "email": "business@test.com",
    "phone": "+1234567890",
    "address": "123 Test St",
    "city": "Test City",
    "country": "Test Country"
  }'
```

### 3. Submit Inquiry
```bash
curl -X POST http://localhost:5000/api/inquiries \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "507f1f77bcf86cd799439012",
    "name": "Inquirer Name",
    "email": "inquirer@example.com",
    "phone": "+1234567890",
    "subject": "Test Inquiry",
    "message": "This is a test inquiry"
  }'
```

---

## Error Examples

### Missing Required Fields
```json
{
  "success": false,
  "message": "Please provide all required fields"
}
```

### Unauthorized
```json
{
  "success": false,
  "message": "No token provided"
}
```

### Not Found
```json
{
  "success": false,
  "message": "Business not found"
}
```

### Duplicate Email
```json
{
  "success": false,
  "message": "User already exists with that email"
}
```

---

## Testing Tools

### Postman Collection
Import this JSON into Postman to get started:
[Create a collection with the above endpoints]

### VS Code REST Client
Install "REST Client" extension and create a `.rest` file:
```rest
### Get all businesses
GET http://localhost:5000/api/businesses

### Login
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Thunderclient
VS Code built-in extension for API testing.

---

## Tips

1. **Save Token**: After login, copy and use the token for protected routes
2. **Check Status Codes**: 
   - 200/201: Success
   - 400: Bad request
   - 401: Unauthorized
   - 403: Forbidden
   - 404: Not found
   - 500: Server error
3. **Use IDs**: Capture IDs from responses to use in subsequent requests
4. **Pagination**: Use `page` and `limit` for large datasets
5. **Filters**: Combine query parameters to narrow down results
