import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import 'express-async-errors';
import dotenv from 'dotenv';

import { connectDB } from './config/database.js';
import { errorHandler } from './middleware/errorHandler.js';
import { seedCategories } from './utils/seeder.js';

import authRoutes from './routes/authRoutes.js';
import businessRoutes from './routes/businessRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import inquiryRoutes from './routes/inquiryRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import storyRoutes from './routes/storyRoutes.js';
import locationRoutes from './routes/locationRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import offerRoutes from './routes/offerRoutes.js';
import { getAllReviews } from './controllers/reviewController.js';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5001;

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:3001',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Handle pre-flight OPTIONS for all routes
app.options('*', cors());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/offers', offerRoutes);
app.get('/api/reviews/all', getAllReviews);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use(errorHandler);

// Start server
const startServer = async (attempt = 1) => {
  try {
    await connectDB();
    await seedCategories();

    const server = app.listen(PORT, () => {
      console.log(`\n🚀 Server running on http://localhost:${PORT}`);
      console.log(`📝 API Documentation:`);
      console.log(`   POST   /api/auth/register`);
      console.log(`   POST   /api/auth/login`);
      console.log(`   GET    /api/businesses`);
      console.log(`   GET    /api/categories`);
      console.log(`   POST   /api/inquiries`);
      console.log(`\n✓ Ready to accept requests\n`);
    });

    // Gracefully handle port-in-use (EADDRINUSE) — retry after 1s (max 5 attempts)
    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        if (attempt >= 5) {
          console.error(`❌ Port ${PORT} still in use after 5 retries. Exiting.`);
          process.exit(1);
        }
        console.warn(`⚠️  Port ${PORT} in use — retrying in 1s... (attempt ${attempt}/5)`);
        server.close();
        setTimeout(() => startServer(attempt + 1), 1000);
      } else {
        console.error('Server error:', err);
        process.exit(1);
      }
    });

    // Clean shutdown on hot-reload / Ctrl+C (remove old listeners first)
    const shutdown = () => {
      server.close(() => {
        console.log('🛑 Server closed');
        process.exit(0);
      });
    };
    process.removeAllListeners('SIGTERM');
    process.removeAllListeners('SIGINT');
    process.once('SIGTERM', shutdown);
    process.once('SIGINT', shutdown);

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
