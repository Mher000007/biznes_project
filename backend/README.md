# For Business Backend

Express.js + MongoDB backend API for the For Business application.

## Features

- ✅ User Authentication (Register, Login, JWT)
- ✅ Business Management (Create, Read, Update, Delete)
- ✅ Category Management
- ✅ Inquiry System
- ✅ Role-based Authorization (User, Business Owner, Admin)
- ✅ Error Handling & Validation
- ✅ CORS Support
- ✅ TypeScript Support

## Prerequisites

- Node.js 16+ and npm
- MongoDB 4.0+
- Git

## Installation

1. **Clone the repository** (if not already done):
```bash
git clone <repository-url>
cd backend
```

2. **Install dependencies**:
```bash
npm install
```

3. **Create environment file**:
```bash
cp .env.example .env
```

4. **Configure MongoDB**:
   - Update `MONGODB_URI` in `.env` with your MongoDB connection string
   - Local development: `mongodb://localhost:27017/for-business`
   - Production: Use MongoDB Atlas or your hosted instance

5. **Update other environment variables** as needed:
```env
JWT_SECRET=your_secret_key_here
FRONTEND_URL=http://localhost:3000
```

## Running the Server

### Development Mode
```bash
npm run dev
```
Server will run on `http://localhost:5000` with hot-reload enabled.

### Production Mode
```bash
npm run build
npm start
```

### Check Health
```bash
curl http://localhost:5000/health
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)
- `PUT /api/auth/profile` - Update user profile (protected)

### Businesses
- `GET /api/businesses` - Get all businesses (with filtering)
- `GET /api/businesses/:id` - Get business by ID
- `GET /api/businesses/slug/:slug` - Get business by slug
- `POST /api/businesses` - Create business (protected)
- `PUT /api/businesses/:id` - Update business (protected, owner only)
- `DELETE /api/businesses/:id` - Delete business (protected, owner only)
- `GET /api/businesses/me/all` - Get user's businesses (protected)

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:slug` - Get category by slug
- `POST /api/categories` - Create category (protected, admin only)
- `PUT /api/categories/:id` - Update category (protected, admin only)
- `DELETE /api/categories/:id` - Delete category (protected, admin only)

### Inquiries
- `POST /api/inquiries` - Create inquiry (public)
- `GET /api/inquiries/business/:businessId` - Get business inquiries (protected, owner only)
- `PUT /api/inquiries/:inquiryId` - Update inquiry status (protected, owner only)
- `GET /api/inquiries/user/all` - Get user's inquiries (protected)

## Database Models

### User
```typescript
{
  name: string;
  email: string;
  password: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  businessType?: string;
  location?: string;
  verified: boolean;
  role: 'user' | 'business_owner' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}
```

### Business
```typescript
{
  name: string;
  slug: string;
  description: string;
  category: ObjectId;
  owner: ObjectId;
  email: string;
  phone: string;
  website?: string;
  logo?: string;
  images?: string[];
  address: string;
  city: string;
  country: string;
  coordinates?: { latitude: number; longitude: number };
  rating: number;
  reviewCount: number;
  tags?: string[];
  verified: boolean;
  featured: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Category
```typescript
{
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image?: string;
  businessCount: number;
  createdAt: Date;
}
```

### Inquiry
```typescript
{
  business: ObjectId;
  inquirer?: ObjectId;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'responded' | 'closed';
  response?: string;
  respondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Getting a Token

1. **Register**:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

2. **Login**:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

## Frontend Integration

Update your frontend `.env` file to point to the backend:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Connecting Frontend to Backend

### Example: Registering a User from Frontend

```typescript
const response = await fetch('http://localhost:5000/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
  }),
});

const data = await response.json();
localStorage.setItem('token', data.token);
```

### Example: Fetching Businesses from Frontend

```typescript
const response = await fetch('http://localhost:5000/api/businesses?category=tech&city=New%20York', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});

const data = await response.json();
```

## Development

### Project Structure
```
backend/
├── src/
│   ├── index.ts              # Main server file
│   ├── config/
│   │   └── database.ts       # MongoDB connection
│   ├── models/               # Database models
│   ├── controllers/          # Business logic
│   ├── routes/               # API routes
│   ├── middleware/           # Custom middleware
│   └── utils/                # Utility functions
├── dist/                     # Compiled JavaScript
├── package.json
├── tsconfig.json
└── .env.example
```

### Build
```bash
npm run build
```

### Lint
```bash
npm run lint
```

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod` (local) or check your connection string
- Verify `MONGODB_URI` in `.env`

### Port Already in Use
- Change `PORT` in `.env` to an available port
- Or kill the process: `lsof -ti:5000 | xargs kill -9` (macOS/Linux)

### CORS Errors
- Update `FRONTEND_URL` in `.env` to match your frontend URL
- Example: `FRONTEND_URL=http://localhost:3000`

## Deployment

### Vercel/Netlify (API Routes Only)
Use the frontend's API routes or deploy separately.

### Heroku
```bash
heroku login
heroku create your-app-name
git push heroku main
```

### Railway, Render, or Other Providers
Follow their documentation for Node.js deployment.

## License

ISC

## Support

For issues or questions, create a GitHub issue or contact the development team.
