import { Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { MeetingRepository } from '../repositories/meetingRepository';
import { UserRepository } from '../repositories/userRepository';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { AIService } from '../services/aiService';
import { logger } from '../utils/logger';

// Helper to generate room code (e.g., abc-defg-hij)
const generateRoomCode = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const getSegment = (len: number) => {
    let segment = '';
    for (let i = 0; i < len; i++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return segment;
  };
  return `${getSegment(3)}-${getSegment(4)}-${getSegment(3)}`;
};

export class MeetingController {
  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title } = req.body;
      const hostId = req.user?.userId;

      if (!hostId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const roomCode = generateRoomCode();

      const meeting = await MeetingRepository.create({
        title: title || 'Quick Meeting',
        roomCode,
        hostId,
        participants: [hostId],
        isLive: true,
        transcript: [],
        attachments: []
      });

      res.status(201).json({
        success: true,
        meeting
      });
    } catch (error) {
      next(error);
    }
  }

  static async getByRoomCode(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { roomCode } = req.params;
      const meeting = await MeetingRepository.findByRoomCode(roomCode);

      if (!meeting) {
        res.status(404).json({ success: false, message: 'Meeting room not found.' });
        return;
      }

      res.status(200).json({
        success: true,
        meeting
      });
    } catch (error) {
      next(error);
    }
  }

  static async listUserMeetings(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const meetings = await MeetingRepository.listUserMeetings(userId);
      res.status(200).json({
        success: true,
        meetings
      });
    } catch (error) {
      next(error);
    }
  }

  static async join(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { roomCode } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const meeting = await MeetingRepository.findByRoomCode(roomCode);
      if (!meeting) {
        res.status(404).json({ success: false, message: 'Meeting room not found.' });
        return;
      }

      // Add to participants if not already in list
      if (!meeting.participants.includes(userId)) {
        const updatedParticipants = [...meeting.participants, userId];
        await MeetingRepository.update(meeting._id, { participants: updatedParticipants });
        meeting.participants = updatedParticipants;
      }

      res.status(200).json({
        success: true,
        meeting
      });
    } catch (error) {
      next(error);
    }
  }

  static async uploadAttachment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { roomCode } = req.params;
      const { fileName, fileData } = req.body; // base64 file data

      if (!fileName || !fileData) {
        res.status(400).json({ success: false, message: 'File name and file content are required.' });
        return;
      }

      const meeting = await MeetingRepository.findByRoomCode(roomCode);
      if (!meeting) {
        res.status(404).json({ success: false, message: 'Meeting room not found.' });
        return;
      }

      const base64Data = fileData.split(';base64,').pop() || fileData;
      let fileUrl = '';
      let isUploadedToCloudinary = false;

      const hasCloudinaryCreds = !!(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
      );

      if (hasCloudinaryCreds) {
        try {
          logger.info(`Uploading ${fileName} to Cloudinary...`);
          cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
          });

          const uploadResponse = await cloudinary.uploader.upload(
            `data:application/octet-stream;base64,${base64Data}`,
            {
              resource_type: 'auto',
              folder: 'intellmeet_attachments'
            }
          );
          fileUrl = uploadResponse.secure_url;
          isUploadedToCloudinary = true;
          logger.success(`Cloudinary upload complete: ${fileUrl}`);
        } catch (cloudinaryErr) {
          logger.error('Cloudinary upload failed, falling back to local storage server', cloudinaryErr);
        }
      }

      if (!isUploadedToCloudinary) {
        // Local upload fallback
        const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const fileExtension = path.extname(fileName);
        const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${fileExtension}`;
        const filePath = path.join(uploadsDir, uniqueFileName);

        fs.writeFileSync(filePath, base64Data, { encoding: 'base64' });

        const port = process.env.PORT || 5000;
        fileUrl = `http://localhost:${port}/uploads/${uniqueFileName}`;
        logger.info(`Saved attachment locally: ${fileUrl}`);
      }

      const newAttachment = {
        name: fileName,
        url: fileUrl,
        size: Math.round(base64Data.length * 0.75) // estimate size in bytes
      };

      const updatedAttachments = [...meeting.attachments, newAttachment];
      await MeetingRepository.update(meeting._id, { attachments: updatedAttachments });

      res.status(200).json({
        success: true,
        attachment: newAttachment
      });
    } catch (error) {
      next(error);
    }
  }

  static async summarize(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { roomCode } = req.params;
      const { duration, transcript } = req.body;

      const meeting = await MeetingRepository.findByRoomCode(roomCode);
      if (!meeting) {
        res.status(404).json({ success: false, message: 'Meeting room not found.' });
        return;
      }

      // Save the final transcript if passed
      const finalTranscript = transcript || meeting.transcript;

      // Call AI summarizer service
      const aiAnalysis = await AIService.summarizeMeeting(meeting.title, finalTranscript);

      // Save analysis results to the database
      const updatedMeeting = await MeetingRepository.update(meeting._id, {
        isLive: false,
        duration: duration || meeting.duration || 0,
        transcript: finalTranscript,
        summary: aiAnalysis.summary,
        actionItems: aiAnalysis.actionItems,
        sentimentScores: aiAnalysis.sentimentScores
      });

      res.status(200).json({
        success: true,
        meeting: updatedMeeting
      });
    } catch (error) {
      next(error);
    }
  }
}
