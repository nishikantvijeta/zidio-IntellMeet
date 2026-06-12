import { Server, Socket } from 'socket.io';
import { logger } from '../utils/logger';
import { NotificationRepository } from '../repositories/notificationRepository';

interface IParticipant {
  socketId: string;
  userId: string;
  username: string;
  avatarUrl: string;
  isHandRaised?: boolean;
  micActive?: boolean;
  camActive?: boolean;
}

// Maps roomCode -> array of participants
const roomsMap = new Map<string, IParticipant[]>();

// Maps userId -> socketId (for private notifications)
const userSocketsMap = new Map<string, string>();

const SIMULATED_MESSAGES = [
  { sender: 'AI Copilot', text: "Welcome to IntellMeet! Let's get this product sync started. Today we are aligning on our Q3 sprint milestones." },
  { sender: 'Sarah (Product Mgr)', text: "I'll start. The designs for the glassmorphic dashboards are ready, but we need to verify responsiveness on mobile devices." },
  { sender: 'Alex (Lead Dev)', text: "Awesome. I've finished the authentication API endpoints and the dual-token refresh mechanism. Ready to push to production." },
  { sender: 'Sarah (Product Mgr)', text: "Excellent, Alex. Please check if the MongoDB failovers work under load. That's a critical action item." },
  { sender: 'AI Copilot', text: "Noted. I am creating an action item for Alex to verify DB failovers. Please let me know when it's resolved." },
  { sender: 'Alex (Lead Dev)', text: "I can do that by Friday. I'll also check if our Redis token blacklisting works on local environments." },
  { sender: 'Sarah (Product Mgr)', text: "Thanks, Alex. Let's verify that the WebRTC stream quality maintains high FPS. Does anyone have feedback?" },
  { sender: 'AI Copilot', text: "Sentiment check: The overall tone of this conversation is highly positive and collaborative." }
];

export const socketHandlers = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Track user socket mapping for private system notifications
    socket.on('register-user', (userId: string) => {
      if (userId) {
        userSocketsMap.set(userId, socket.id);
        logger.info(`User registered to socket mapping: User ID ${userId} -> Socket ${socket.id}`);
      }
    });

    // Room join handler
    socket.on('join-room', (data: { roomCode: string; userId: string; username: string; avatarUrl: string }) => {
      const { roomCode, userId, username, avatarUrl } = data;
      const cleanRoom = roomCode.trim();

      socket.join(cleanRoom);
      
      // Store user metadata on the socket instance
      (socket as any).roomCode = cleanRoom;
      (socket as any).userId = userId;
      (socket as any).username = username;
      (socket as any).avatarUrl = avatarUrl;

      // Register mapping
      userSocketsMap.set(userId, socket.id);

      // Add to room tracking
      let participants = roomsMap.get(cleanRoom) || [];
      
      // Prevent duplicates
      participants = participants.filter(p => p.userId !== userId);
      participants.push({
        socketId: socket.id,
        userId,
        username,
        avatarUrl,
        isHandRaised: false
      });
      roomsMap.set(cleanRoom, participants);

      logger.info(`User ${username} (${userId}) joined room: ${cleanRoom}`);

      // Notify others in room
      socket.to(cleanRoom).emit('user-joined', {
        socketId: socket.id,
        userId,
        username,
        avatarUrl
      });

      // Send the current list of participants to the joiner and the room
      io.to(cleanRoom).emit('room-participants', participants);
    });

    // WebRTC Signaling relays
    socket.on('webrtc-signal', (data: { targetSocketId: string; signal: any }) => {
      const { targetSocketId, signal } = data;
      // Send the offer, answer, or candidate directly to the destination socket
      io.to(targetSocketId).emit('webrtc-signal', {
        senderSocketId: socket.id,
        signal
      });
    });

    // Chat Message relay
    socket.on('send-message', (data: { roomCode: string; message: string; senderName: string }) => {
      const { roomCode, message, senderName } = data;
      const cleanRoom = roomCode.trim();

      const messagePayload = {
        id: Math.random().toString(36).substring(2, 9),
        sender: senderName,
        text: message,
        timestamp: new Date()
      };

      io.to(cleanRoom).emit('new-message', messagePayload);
      logger.info(`Message in room ${cleanRoom} from ${senderName}: ${message}`);
    });

    // Hand Raising sync
    socket.on('raise-hand', (data: { roomCode: string; isHandRaised: boolean }) => {
      const { roomCode, isHandRaised } = data;
      const cleanRoom = roomCode.trim();
      const userId = (socket as any).userId;

      const participants = roomsMap.get(cleanRoom) || [];
      const userIndex = participants.findIndex(p => p.userId === userId);
      if (userIndex !== -1) {
        participants[userIndex].isHandRaised = isHandRaised;
        roomsMap.set(cleanRoom, participants);
      }

      // Broadcast list updates & visual toasts
      io.to(cleanRoom).emit('hand-raised', {
        userId,
        username: (socket as any).username || 'A participant',
        isHandRaised
      });
      io.to(cleanRoom).emit('room-participants', participants);
    });

    // Sync participant mic/cam states
    socket.on('participant-state', (data: { roomCode: string; micActive: boolean; camActive: boolean }) => {
      const { roomCode, micActive, camActive } = data;
      const cleanRoom = roomCode.trim();
      const userId = (socket as any).userId;
      
      const participantsList = roomsMap.get(cleanRoom) || [];
      const userIndex = participantsList.findIndex(p => p.userId === userId);
      if (userIndex !== -1) {
        participantsList[userIndex].micActive = micActive;
        participantsList[userIndex].camActive = camActive;
        roomsMap.set(cleanRoom, participantsList);
      }
      io.to(cleanRoom).emit('room-participants', participantsList);
      socket.to(cleanRoom).emit('participant-state-changed', {
        socketId: socket.id,
        micActive,
        camActive
      });
    });

    // Screen Share state broadcast
    socket.on('screen-share-started', (data: { roomCode: string }) => {
      const cleanRoom = data.roomCode.trim();
      const username = (socket as any).username || 'A participant';
      logger.info(`Screen share started by ${username} in room ${cleanRoom}`);
      socket.to(cleanRoom).emit('screen-share-started', {
        socketId: socket.id,
        userId: (socket as any).userId,
        username
      });
    });

    socket.on('screen-share-stopped', (data: { roomCode: string }) => {
      const cleanRoom = data.roomCode.trim();
      const username = (socket as any).username || 'A participant';
      logger.info(`Screen share stopped by ${username} in room ${cleanRoom}`);
      socket.to(cleanRoom).emit('screen-share-stopped', {
        socketId: socket.id,
        userId: (socket as any).userId,
        username
      });
    });

    // Sync emojis / reactions
    socket.on('send-reaction', (data: { roomCode: string; emoji: string }) => {
      const { roomCode, emoji } = data;
      const cleanRoom = roomCode.trim();
      io.to(cleanRoom).emit('new-reaction', {
        id: Math.random().toString(),
        username: (socket as any).username || 'Someone',
        emoji
      });
    });

    // AI Bot Simulation Activator
    socket.on('start-ai-bot', (data: { roomCode: string }) => {
      const { roomCode } = data;
      const cleanRoom = roomCode.trim();
      logger.info(`AI Bot Simulation requested for Room: ${cleanRoom}`);

      let messageIndex = 0;
      
      const intervalId = setInterval(() => {
        // Verify room is still active
        const participants = roomsMap.get(cleanRoom) || [];
        if (participants.length === 0 || messageIndex >= SIMULATED_MESSAGES.length) {
          clearInterval(intervalId);
          logger.info(`AI Bot simulation stopped for Room: ${cleanRoom}`);
          return;
        }

        const msg = SIMULATED_MESSAGES[messageIndex];
        const botPayload = {
          id: `bot-${Math.random().toString(36).substring(2, 9)}-${messageIndex}`,
          sender: msg.sender,
          text: msg.text,
          timestamp: new Date()
        };

        io.to(cleanRoom).emit('new-message', botPayload);
        messageIndex++;
      }, 5000); // Send message every 5 seconds
      
      // Store bot interval on socket to clear on disconnect
      (socket as any).botIntervalId = intervalId;
    });

    // Task Allocation Alert Broadcast
    socket.on('task-assigned', async (data: { taskTitle: string; assigneeId: string; assignerName: string }) => {
      const { taskTitle, assigneeId, assignerName } = data;
      
      // Store in DB first (so it shows up on their login)
      try {
        const notif = await NotificationRepository.create({
          recipientId: assigneeId,
          senderId: 'system',
          content: `${assignerName} assigned you a task: "${taskTitle}"`,
          isRead: false,
          link: '/tasks'
        });

        // Check if assignee is online right now
        const targetSocketId = userSocketsMap.get(assigneeId);
        if (targetSocketId) {
          io.to(targetSocketId).emit('new-notification', notif);
          logger.info(`Dispatched real-time notification to User: ${assigneeId} via Socket: ${targetSocketId}`);
        }
      } catch (err) {
        logger.error('Error handling socket task-assigned event', err);
      }
    });

    // Handle Disconnect
    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
      
      const roomCode = (socket as any).roomCode;
      const userId = (socket as any).userId;
      const username = (socket as any).username;

      // Clear any running bot intervals
      if ((socket as any).botIntervalId) {
        clearInterval((socket as any).botIntervalId);
      }

      if (roomCode) {
        let participants = roomsMap.get(roomCode) || [];
        participants = participants.filter(p => p.socketId !== socket.id);
        
        if (participants.length === 0) {
          roomsMap.delete(roomCode);
        } else {
          roomsMap.set(roomCode, participants);
          // Notify room
          io.to(roomCode).emit('user-left', { socketId: socket.id, userId });
          io.to(roomCode).emit('room-participants', participants);
        }
        logger.info(`User ${username} left room: ${roomCode}`);
      }

      // Remove from socket map
      if (userId) {
        userSocketsMap.delete(userId);
      }
    });
  });
};
