import { Router } from 'express';
import { MeetingController } from '../controllers/meetingController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.post('/', MeetingController.create);
router.post('/join', MeetingController.join);
router.get('/user', MeetingController.listUserMeetings);
router.get('/:roomCode', MeetingController.getByRoomCode);
router.post('/:roomCode/attachment', MeetingController.uploadAttachment);
router.post('/:roomCode/summarize', MeetingController.summarize);

export default router;
