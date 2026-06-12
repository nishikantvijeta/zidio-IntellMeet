import { Router } from 'express';
import { AIController } from '../controllers/aiController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.post('/analyze', authenticate, AIController.analyzeTranscript);

export default router;
