# For Business - Full Stack Project

## What's Inside

This project contains both Frontend and Backend.

### Frontend (Next.js)
- Located in: `src/` directory
- Features: Landing page, business discovery, user dashboard, etc.
- Run: `npm run dev`

### Backend (Express.js + MongoDB)
- Located in: `backend/` directory
- API server with user auth, business management, inquiries
- Run: `cd backend && npm run dev`

---

## Getting Started

### 1. Start Backend First
```bash
cd backend
npm install
cp .env.example .env
# Configure .env with your MongoDB URI
npm run dev
# Should see: "🚀 Server running on http://localhost:5000"
```

### 2. Update Frontend Env
In root directory, create/update `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3. Start Frontend
```bash
npm install  # if not already done
npm run dev
# Frontend will be at http://localhost:3000
```

---

## Backend Documentation

Navigate to `backend/` folder:

| File | Purpose |
|------|---------|
| **QUICKSTART.md** | ⚡ 5-minute setup guide |
| **README.md** | 📚 Complete API documentation |
| **SETUP.md** | 🔧 Detailed setup & deployment |
| **ARCHITECTURE.md** | 🏗️ System architecture overview |
| **API-TESTING.md** | 🧪 Full API testing guide with examples |

---

## API Endpoints Summary

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Businesses
- `GET /api/businesses` - Get all businesses
- `GET /api/businesses/:id` - Get business by ID
- `POST /api/businesses` - Create business (protected)
- `PUT /api/businesses/:id` - Update business (protected)
- `DELETE /api/businesses/:id` - Delete business (protected)

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category (admin)

### Inquiries
- `POST /api/inquiries` - Submit inquiry
- `GET /api/inquiries/business/:businessId` - Get inquiries (owner)
- `PUT /api/inquiries/:id` - Update inquiry status (owner)

---

## Project Structure

```
for_business-master/
├── src/                          # Frontend (Next.js)
│   ├── app/
│   ├── components/
│   ├── context/
│   └── ...
├── backend/                      # Backend (Express.js)
│   ├── src/
│   │   ├── models/              # MongoDB schemas
│   │   ├── controllers/         # Business logic
│   │   ├── routes/              # API routes
│   │   ├── middleware/          # Auth, error handling
│   │   └── index.ts             # Server entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── package.json                 # Frontend dependencies
└── README.md
```

---

## Key Features

### Frontend
✅ User authentication  
✅ Business discovery & search  
✅ User dashboard  
✅ Business management  
✅ Inquiry system  
✅ Map integration  
✅ Category browsing  

### Backend
✅ JWT authentication  
✅ Business CRUD operations  
✅ Category management  
✅ Inquiry tracking  
✅ Role-based access control  
✅ MongoDB database  
✅ Error handling  
✅ TypeScript support  

---

## Database Models

### User
- name, email, password, phone, avatar, bio
- role (user, business_owner, admin)
- verified status

### Business
- name, description, category, owner
- contact info (email, phone, website)
- location (address, city, country, coordinates)
- images, logo, rating, verified, featured

### Category
- name, description, icon, image
- business count tracking

### Inquiry
- business, inquirer, name, email, phone
- subject, message
- status (new, read, responded, closed)

### ChatMessage
- conversationId, sender, message
- attachments, read status

---

## Environment Setup

### Backend `.env.example` → `.env`
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/for-business
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
```

### Frontend `.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## Testing the System

### 1. Register a User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### 2. Get All Categories
```bash
curl http://localhost:5000/api/categories
```

### 3. Create a Business (requires token)
```bash
curl -X POST http://localhost:5000/api/businesses \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Business",
    "description": "Description here",
    "category": "CATEGORY_ID",
    "email": "business@example.com",
    "phone": "+1234567890",
    "address": "123 Main St",
    "city": "New York",
    "country": "USA"
  }'
```

See [backend/API-TESTING.md](backend/API-TESTING.md) for complete testing guide.

---

## Development Workflow

### Terminal 1: Backend
```bash
cd backend
npm run dev
# Port 5000
```

### Terminal 2: Frontend
```bash
npm run dev
# Port 3000
```

### Terminal 3: Database (if local MongoDB)
```bash
mongod  # or: brew services start mongodb-community (macOS)
```

---

## Common Issues

### Backend Connection Error
- Check MongoDB is running
- Verify `MONGODB_URI` in `.env`

### CORS Errors
- Update `FRONTEND_URL` in backend `.env`
- Ensure ports match (3000 for frontend)

### Port Already in Use
```bash
# Change PORT in backend/.env
PORT=5001 npm run dev
```

### Module Not Found
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

---

## Next Steps

1. ✅ Backend created
2. → Install dependencies: `cd backend && npm install`
3. → Configure MongoDB in `backend/.env`
4. → Start backend: `npm run dev`
5. → Configure frontend `.env.local`
6. → Start frontend: `npm run dev`
7. → Test endpoints with curl or Postman
8. → Deploy to production

---

## Deployment

### Backend Deployment Options
- Heroku
- Railway
- Render
- AWS
- DigitalOcean

### Frontend Deployment Options
- Vercel
- Netlify
- AWS
- DigitalOcean

See [backend/SETUP.md](backend/SETUP.md#production-deployment) for deployment instructions.

---

## Resources

- [Backend Documentation](backend/README.md)
- [Quick Start Guide](backend/QUICKSTART.md)
- [API Testing Guide](backend/API-TESTING.md)
- [Architecture Overview](backend/ARCHITECTURE.md)
- [Setup & Deployment](backend/SETUP.md)

---

## Support

For help:
1. Check relevant documentation files
2. Review error messages in terminal
3. Check `.env` configuration
4. See troubleshooting sections in docs

---

**Ready to build something amazing!** 🚀

Questions? Check the backend documentation files for detailed guides.
