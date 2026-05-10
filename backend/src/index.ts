// src/index.ts
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { initSocket } from './socket';
import authRoutes from './routes/auth';
import tripRoutes from './routes/trips';
import itineraryRoutes from './routes/itinerary';
import chatRoutes from './routes/chat';
import votingRoutes from './routes/voting';
import notificationRoutes from './routes/notifications';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import placesRoutes from './routes/places';
import placeNotesRoutes from './routes/placeNotes';

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
export const io = initSocket(httpServer);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/trips', authMiddleware, tripRoutes);
app.use('/api/itinerary', authMiddleware, itineraryRoutes);
app.use('/api/chat', authMiddleware, chatRoutes);
app.use('/api/voting', authMiddleware, votingRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);
app.use('/api/places', authMiddleware, placesRoutes);
app.use('/api/places', authMiddleware, placeNotesRoutes);

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`🚀 WanderSync backend running on port ${PORT}`);
});
