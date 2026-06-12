import dotenv from 'dotenv';
// Load environment variables before importing other dependencies
dotenv.config();

import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import { connectDB } from './config/db';
import { socketHandlers } from './sockets/socketHandlers';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect database (handles Mongoose or logs warning & runs Memory-fallback)
  await connectDB();

  // Create HTTP Server
  const server = http.createServer(app);

  // Initialize Socket.io Server
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || true,
      credentials: true
    }
  });

  // Load socket handlers
  socketHandlers(io);

  // Start listening
  server.listen(PORT, () => {
    logger.success(`IntellMeet Backend Server listening on http://localhost:${PORT}`);
    logger.success(`Health Check: http://localhost:${PORT}/health`);
  });
};

startServer().catch(err => {
  logger.error('Critical failure starting server:', err);
});
// Trigger reload after manual db verification - user deleted again
