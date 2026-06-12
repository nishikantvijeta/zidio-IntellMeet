import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export let isMockDb = false;

export const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/intellmeet';
  
  try {
    logger.info('Connecting to MongoDB...');
    // Attempt Mongoose connection with a 3-second timeout
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000,
    });
    logger.success('MongoDB Connected Successfully.');
  } catch (error: any) {
    isMockDb = true;
    logger.warn('------------------------------------------------------------');
    logger.warn('WARNING: Could not connect to MongoDB.');
    logger.warn(`Reason: ${error.message || error}`);
    logger.warn('IntellMeet will fall back to an In-Memory Database store.');
    logger.warn('All features (Auth, Meetings, Kanban) will remain fully functional,');
    logger.warn('but data will reset when the server restarts.');
    logger.warn('------------------------------------------------------------');
  }
};
