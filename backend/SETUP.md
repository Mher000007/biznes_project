# Backend Setup Guide

## Quick Start

### 1. Prerequisites
- **Node.js**: 16.x or higher
- **npm**: 8.x or higher
- **MongoDB**: Local installation or MongoDB Atlas account

### 2. Check Node.js Version
```bash
node --version  # Should be v16 or higher
npm --version   # Should be 8 or higher
```

### 3. Install MongoDB

#### Option A: Local MongoDB (macOS)
```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

#### Option B: MongoDB Atlas (Cloud)
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up and create a free cluster
3. Get your connection string
4. Add to `.env`: `MONGODB_URI=<your_connection_string>`

### 4. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
```

### 5. Configure Environment
Edit `.env` with your settings:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/for-business
JWT_SECRET=your_secret_key_here_change_in_production
FRONTEND_URL=http://localhost:3000
```

### 6. Start Development Server
```bash
npm run dev
```

You should see:
```
✓ MongoDB connected successfully
🚀 Server running on http://localhost:5000
✓ Ready to accept requests
```

## Testing the API

### Using cURL

#### Test Health
```bash
curl http://localhost:5000/health
```

#### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

#### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

#### Get All Categories
```bash
curl http://localhost:5000/api/categories
```

#### Get All Businesses
```bash
curl "http://localhost:5000/api/businesses?page=1&limit=10"
```

### Using Postman

1. Download [Postman](https://www.postman.com/downloads/)
2. Import the collection (create a new one or import from file)
3. Use the provided endpoints to test

## Frontend Integration

### 1. Update Frontend .env.local
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 2. Create API Client (Optional)
In your Next.js frontend:

```typescript
// lib/api.ts
export const apiCall = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const token = localStorage.getItem('token');

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
};
```

### 3. Use in Components
```typescript
import { apiCall } from '@/lib/api';

export default function LoginPage() {
  const handleLogin = async () => {
    try {
      const data = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem('token', data.token);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return <button onClick={handleLogin}>Login</button>;
}
```

## Database Seed (Optional)

To seed the database with sample data:

```typescript
// scripts/seed.ts
import { connectDB, disconnectDB } from '../src/config/database';
import Category from '../src/models/Category';

async function seedDatabase() {
  await connectDB();

  const categories = [
    { name: 'Technology', description: 'Tech companies' },
    { name: 'Healthcare', description: 'Healthcare providers' },
    { name: 'Retail', description: 'Retail stores' },
  ];

  await Category.insertMany(categories);
  console.log('✓ Database seeded');
  await disconnectDB();
}

seedDatabase().catch(console.error);
```

Run with:
```bash
npx ts-node scripts/seed.ts
```

## Common Issues & Solutions

### Issue: MONGODB_URI not found
**Solution**: 
- Verify `.env` file exists in the `backend` folder
- Restart the dev server after creating `.env`

### Issue: Cannot connect to MongoDB
**Solution**:
- Local: Ensure `mongod` is running
- Atlas: Check connection string and IP whitelist

### Issue: Port 5000 already in use
**Solution**:
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or use different port
PORT=5001 npm run dev
```

### Issue: CORS errors from frontend
**Solution**:
- Update `FRONTEND_URL` in `.env`
- Ensure frontend URL matches exactly

## Production Deployment

### Prepare for Production
```bash
npm run build
npm start
```

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=<production_mongodb_uri>
JWT_SECRET=<strong_random_secret>
FRONTEND_URL=<your_frontend_url>
```

### Deploy to Heroku
```bash
heroku create your-app-name
git push heroku main
heroku config:set MONGODB_URI=<uri>
heroku config:set JWT_SECRET=<secret>
```

### Deploy to Railway/Render
Follow their documentation for Node.js apps.

## Next Steps

1. ✅ Backend is running
2. ✅ Database is connected
3. → Connect frontend to backend
4. → Test API endpoints
5. → Deploy to production

## Support

For help:
- Check `backend/README.md` for detailed API docs
- Review error logs in terminal
- Check browser DevTools Network tab
- Open GitHub issues for bugs
