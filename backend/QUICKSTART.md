# Backend Quick Start Guide

Get your backend running in 5 minutes.

## Prerequisites Checklist
- [ ] Node.js 16+ installed (`node --version`)
- [ ] npm 8+ installed (`npm --version`)
- [ ] MongoDB running (local or Atlas)

## Step 1: Install Dependencies
```bash
cd backend
npm install
```

Expected output:
```
added 152 packages in 45s
```

## Step 2: Setup Environment
```bash
cp .env.example .env
```

Edit `.env` with your settings:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/for-business
JWT_SECRET=my_secret_key_123
FRONTEND_URL=http://localhost:3000
```

## Step 3: Start Development Server
```bash
npm run dev
```

Expected output:
```
✓ MongoDB connected successfully
🚀 Server running on http://localhost:5000
✓ Ready to accept requests
```

## Step 4: Test the API
### In another terminal:
```bash
# Health check
curl http://localhost:5000/health

# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"123456"}'

# Get all categories
curl http://localhost:5000/api/categories
```

## Step 5: Connect Frontend
Update your Next.js `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Restart Next.js dev server:
```bash
cd ..
npm run dev
```

## ✅ You're Done!

- Backend: http://localhost:5000
- Frontend: http://localhost:3000

## Documentation Reference

| Document | Purpose |
|----------|---------|
| [README.md](README.md) | Full API documentation |
| [SETUP.md](SETUP.md) | Detailed setup & deployment |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System architecture |
| [API-TESTING.md](API-TESTING.md) | Complete API testing guide |

## Common Commands

```bash
# Development
npm run dev

# Build
npm run build

# Production
npm start

# Lint
npm run lint

# Watch TypeScript changes
npm run watch
```

## MongoDB Setup

### Option A: Local (macOS)
```bash
brew services start mongodb-community
```

### Option B: MongoDB Atlas (Cloud)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Update `.env`: `MONGODB_URI=<connection_string>`

## Next Steps

1. Read [README.md](README.md) for full API docs
2. Check [API-TESTING.md](API-TESTING.md) for endpoint examples
3. Review [ARCHITECTURE.md](ARCHITECTURE.md) for system overview
4. Deploy following [SETUP.md](SETUP.md) instructions

## Troubleshooting

### Port 5000 already in use
```bash
PORT=5001 npm run dev
```

### MongoDB connection error
```bash
# Check if MongoDB is running
mongosh  # or mongo for older versions
```

### Module not found errors
```bash
rm -rf node_modules package-lock.json
npm install
```

## Support

For issues:
1. Check error messages in terminal
2. Review `SETUP.md` troubleshooting section
3. Check `API-TESTING.md` for endpoint examples
4. Review `.env` configuration

---

**Happy coding!** 🚀
