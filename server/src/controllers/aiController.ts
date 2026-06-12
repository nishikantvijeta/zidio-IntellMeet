import { Request, Response, NextFunction } from 'express';
import { AIService } from '../services/aiService';

export class AIController {
  static async analyzeTranscript(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title, transcript } = req.body;

      if (!transcript || !Array.isArray(transcript)) {
        res.status(400).json({
          success: false,
          message: 'Transcript array is required.'
        });
        return;
      }

      const analysis = await AIService.summarizeMeeting(title || 'Custom Analysis', transcript);

      res.status(200).json({
        success: true,
        analysis
      });
    } catch (error) {
      next(error);
    }
  }
}
