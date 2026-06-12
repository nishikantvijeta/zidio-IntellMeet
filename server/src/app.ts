import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';

import authRoutes from './routes/authRoutes';
import meetingRoutes from './routes/meetingRoutes';
import taskRoutes from './routes/taskRoutes';
import aiRoutes from './routes/aiRoutes';
import { errorHandler } from './middleware/errorMiddleware';

const app = express();

// Config CORS — allow localhost + LAN IPs (mobile on same hotspot)
app.use(
  cors({
    origin: process.env.CLIENT_URL || true,
    credentials: true
  })
);

// Built-in parser middlewares
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Serve static uploads folder (for mock file upload storage)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Mount API routers
app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/ai', aiRoutes);

// Base route for server health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Global Error Handler Middleware
app.use(errorHandler);

export default app;
