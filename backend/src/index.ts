import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || '';

// Middleware
app.use(cors());
app.use(express.json());

// Health check route
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import territoryRoutes from './routes/territories';
import leaderboardRoutes from './routes/leaderboard';

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/territories', territoryRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// Connect to MongoDB and start server
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: '*' }
});
// Expose io globally for controller event emission
(global as any).io = io;

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('player-move', (data) => {
    // Broadcast to all other clients
    socket.broadcast.emit('player-move', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    server.listen(PORT, () => {
      console.log(`Server with Socket.io running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
  });
