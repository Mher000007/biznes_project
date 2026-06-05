# Backend Architecture Overview

## Project Structure

```
backend/
├── src/
│   ├── index.ts                      # Main Express server
│   ├── config/
│   │   └── database.ts              # MongoDB connection setup
│   ├── models/                      # Mongoose schemas
│   │   ├── User.ts                 # User model with auth
│   │   ├── Business.ts             # Business listing model
│   │   ├── Category.ts             # Business categories
│   │   ├── Inquiry.ts              # Business inquiries
│   │   └── ChatMessage.ts          # Chat messages
│   ├── controllers/                # Business logic
│   │   ├── authController.ts       # Auth operations
│   │   ├── businessController.ts   # Business CRUD
│   │   ├── categoryController.ts   # Category management
│   │   └── inquiryController.ts    # Inquiry handling
│   ├── routes/                     # API route definitions
│   │   ├── authRoutes.ts
│   │   ├── businessRoutes.ts
│   │   ├── categoryRoutes.ts
│   │   └── inquiryRoutes.ts
│   ├── middleware/                 # Custom middleware
│   │   ├── auth.ts                # JWT authentication & authorization
│   │   └── errorHandler.ts        # Global error handling
│   └── utils/                      # Helper functions
│       ├── tokenUtils.ts          # JWT utilities
│       ├── emailService.ts        # Email sending
│       └── validators.ts          # Input validation
├── dist/                           # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
├── .env.example
├── .eslintrc.json
├── README.md                       # Full API documentation
├── SETUP.md                        # Setup & deployment guide
└── ARCHITECTURE.md                 # This file
```

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Language**: TypeScript
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Validation**: Express middleware + Mongoose validation
- **CORS**: Cross-Origin Resource Sharing
- **Environment**: dotenv

## API Architecture

### Request Flow
```
Request → CORS Middleware → JSON Parser → Route Handler → 
Controller → Model → MongoDB → Response JSON
```

### Authentication Flow
```
Client submits credentials → 
Server validates → 
JWT token generated → 
Token returned to client → 
Client includes token in Authorization header → 
Server verifies token → 
Protected route accessed
```

## Database Schema

### User Collection
- Stores user information and credentials
- Passwords are hashed using bcryptjs
- Supports roles: user, business_owner, admin

### Business Collection
- Core collection for business listings
- References: Category, User (owner)
- Supports full-text search capabilities
- Tracks ratings and review counts

### Category Collection
- Business categories/industries
- Tracks number of businesses per category
- Auto-slugification from name

### Inquiry Collection
- Stores inquiries/leads for businesses
- References: Business, User (inquirer - optional)
- Status tracking: new, read, responded, closed

### ChatMessage Collection
- Stores chat/messaging history
- References: User (sender)
- Indexed for efficient querying

## Key Features

### 1. Authentication & Authorization
- User registration with validation
- Secure login with JWT tokens
- Role-based access control (RBAC)
- Protected routes with authentication middleware

### 2. Business Management
- CRUD operations for businesses
- Owner-based authorization
- Search and filter capabilities
- Slug-based URL-friendly business access

### 3. Category Management
- Pre-populated business categories
- Admin-only management
- Business count tracking

### 4. Inquiry System
- Public inquiry submission
- Business owner inquiry management
- Status tracking and responses

### 5. Error Handling
- Global error handler middleware
- Async error wrapping
- Meaningful error messages
- Proper HTTP status codes

### 6. Validation
- Email validation
- Phone validation
- Required field checking
- Database-level constraints

## Environment Variables

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/for-business
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
```

## Available Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run Jest tests (when configured) |

## Security Considerations

1. **Password Security**: Bcryptjs with salt rounds
2. **JWT Secret**: Should be strong and kept secure
3. **CORS**: Limited to frontend URL in production
4. **Input Validation**: All inputs validated before database operations
5. **Error Messages**: Generic messages in production to prevent info leakage

## Performance Features

1. **Database Indexes**: Created on frequently queried fields
2. **Pagination**: Implemented for large result sets
3. **Lean Queries**: Can be implemented for read-only operations
4. **Connection Pooling**: Built-in Mongoose connection management

## Scalability Considerations

### Current Architecture
- Single server instance
- MongoDB as primary data store
- Stateless API (JWT-based)

### Future Enhancements
- Redis caching layer
- Message queue (Bull, RabbitMQ)
- Database replication
- Load balancing
- CDN for static assets
- Microservices architecture

## Testing Strategy

### Unit Tests
- Controller logic
- Utility functions
- Validation functions

### Integration Tests
- Database operations
- API endpoints
- Authentication flow

### E2E Tests
- Full user workflows
- Business creation to inquiry

## Monitoring & Logging

Currently basic console logging. For production:
- Winston/Bunyan for structured logging
- Morgan for HTTP request logging
- Sentry for error tracking
- Datadog/New Relic for monitoring

## API Response Format

### Success Response
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "current": 1,
    "total": 5,
    "count": 10,
    "total_count": 50
  }
}
```

## Deployment Checklist

- [ ] Set strong JWT_SECRET
- [ ] Configure production MONGODB_URI
- [ ] Set NODE_ENV=production
- [ ] Configure FRONTEND_URL
- [ ] Enable HTTPS
- [ ] Set up error monitoring (Sentry)
- [ ] Configure logging
- [ ] Set up backups for MongoDB
- [ ] Configure rate limiting
- [ ] Set up automated tests in CI/CD

## Support & Resources

- [Express.js Docs](https://expressjs.com)
- [MongoDB Docs](https://docs.mongodb.com)
- [Mongoose Docs](https://mongoosejs.com)
- [JWT Docs](https://jwt.io)
- [TypeScript Docs](https://www.typescriptlang.org)
