import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import connectDB from './config/db';
import userRoutes from './routes/userRoutes';
import authRoutes from './routes/authRoutes';
import gigRoutes from './routes/gigRoutes';
import eventRoutes from './routes/eventRoutes';
import chatRoutes from './routes/chatRoutes';
import cloudinaryRoutes from './routes/cloudinaryRoutes';
import draftRoutes from './routes/draftRoutes';
import notificationRoutes from './routes/notificationRoutes';
import proposalRoutes from './routes/proposalRoutes';
import aiRoutes from './routes/aiRoutes';
import { initializeSocket } from './utils/socketHandler';

dotenv.config();

export const createApp = () => {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Routes
  app.use('/api/users', userRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/gigs', gigRoutes);
  app.use('/api/events', eventRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/upload', cloudinaryRoutes);
  app.use('/api/drafts', draftRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/proposals', proposalRoutes);
  app.use('/api/ai', aiRoutes);

  // Health check route
  app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
  });

  return app;
}

// Create the main app
const app = createApp();
const server = createServer(app);

// Initialize Socket.IO
const io = initializeSocket(server);

// Only connect to DB and start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  connectDB();
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`WebSocket server initialized`);
  });
}

export { app };
