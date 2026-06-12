import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { useSocket } from '../app/SocketContext';
import { SEOHead } from '../components/common/SEOHead';
import { api } from '../services/api';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Monitor,
  Hand,
  LogOut,
  Send,
  Sparkles,
  MessageSquare,
  FileText,
  Users,
  ChevronRight,
  ArrowRight,
  TrendingUp,
  BrainCircuit,
  Volume2,
  Copy,
  Check,
  Settings,
  Radio,
  Signal,
  Smile,
  Info,
  CheckCircle2,
  Clock,
  X,
  Shield,
  Heart,
  MoreHorizontal,
  ChevronUp,
  Grid
} from 'lucide-react';

interface PeerParticipant {
  socketId: string;
  userId: string;
  username: string;
  avatarUrl: string;
  stream?: MediaStream;
  isHandRaised?: boolean;
  speaking?: boolean;
  role?: 'Host' | 'Attendee' | 'AI Copilot';
  connectionQuality?: 'Excellent' | 'Good' | 'Fair';
  micActive?: boolean;
  camActive?: boolean;
}

export const MeetingRoomPage: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();

  // Meeting parameters
  const [meetingTitle, setMeetingTitle] = useState('Sync Room');
  const [participants, setParticipants] = useState<PeerParticipant[]>([]);
  const [chatMessages, setChatMessages] = useState<{ id: string; sender: string; text: string; timestamp: Date }[]>([]);
  const [chatInput, setChatInput] = useState('');
  
  // Controls
  const [micActive, setMicActive] = useState(false); // default muted matching Zoom starting screenshot
  const [camActive, setCamActive] = useState(false); // default camera disabled matching Zoom starting screenshot
  const [screenSharing, setScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);

  // Screen share tracking: who is sharing (null = nobody)
  const [screenSharer, setScreenSharer] = useState<{ socketId: string; username: string } | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(true);
  
  // Timer & Recording
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  // Settings overlay state
  const [showSettings, setShowSettings] = useState(false);
  const [audioInputDevice, setAudioInputDevice] = useState('Default Microphone');
  const [videoInputDevice, setVideoInputDevice] = useState('Default Camera');

  // Emoji picker overlay & floating animations
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState<{ id: string; emoji: string; left: number }[]>([]);

  // UI Tabs / Right Sidebar Toggle
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'transcript' | 'ai' | 'participants'>('chat');

  // View Settings & Layout Modes
  const [viewMode, setViewMode] = useState<'gallery' | 'speaker'>('gallery');
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  
  const [aiAnalysis, setAiAnalysis] = useState<{
    summary: string;
    decisions: string[];
    actionItems: { task: string; owner: string; deadline: string }[];
    sentiment: { positive: number; neutral: number; negative: number };
    healthScore: number;
  }>({
    summary: 'AI is active and monitoring the conversation. Simulators can be invited via the AI Companion tool below.',
    decisions: ['Initialize WebRTC gateways on port 5173 fallback routing.'],
    actionItems: [
      { task: 'Verify MongoDB failover configuration parameters', owner: 'Alex', deadline: 'Friday' },
      { task: 'Check WebRTC camera permissions on iOS layouts', owner: 'Sarah', deadline: 'Wednesday' }
    ],
    sentiment: { positive: 75, neutral: 20, negative: 5 },
    healthScore: 96
  });

  // Typing & notifications states
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Media Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const peerConnections = useRef<{ [socketId: string]: RTCPeerConnection }>({});
  const canvasInterval = useRef<any>(null);

  // Time tracking ref
  const startTime = useRef<number>(Date.now());

  // Invite bots indicator
  const [botsActive, setBotsActive] = useState(false);

  // Load meeting details
  useEffect(() => {
    const fetchMeetingDetails = async () => {
      try {
        const res = await api.get(`/meetings/${roomCode}`);
        setMeetingTitle(res.data.meeting.title);
      } catch (err) {
        console.error('Failed to get meeting details', err);
      }
    };
    fetchMeetingDetails();
  }, [roomCode]);

  // Meeting Timer tick
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };

  // Setup Local Media Stream (Camera or Simulated Canvas fallback)
  const initLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 480, height: 360 },
        audio: true
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.warn('Camera fallback triggered (Standard for environments without hardware media inputs).');
      const canvas = document.createElement('canvas');
      canvas.width = 480;
      canvas.height = 360;
      const ctx = canvas.getContext('2d')!;

      // Draw premium grid fallback loop to mock speaker camera feed
      let frame = 0;
      canvasInterval.current = setInterval(() => {
        frame++;
        ctx.fillStyle = '#151515';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // draw grid grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
        ctx.lineWidth = 1;
        for (let i = 0; i < canvas.width; i += 20) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, canvas.height);
          ctx.stroke();
        }
        for (let j = 0; j < canvas.height; j += 20) {
          ctx.beginPath();
          ctx.moveTo(0, j);
          ctx.lineTo(canvas.width, j);
          ctx.stroke();
        }

        // draw glowing soundwaves
        ctx.strokeStyle = micActive ? '#0E71EB' : '#475569';
        ctx.lineWidth = 4;
        ctx.beginPath();
        for (let i = 20; i < canvas.width - 20; i += 8) {
          const factor = Math.sin(i * 0.02 + frame * 0.15) * Math.cos(i * 0.005);
          const height = Math.abs(factor) * 80 * (micActive ? 1.0 : 0.05);
          ctx.moveTo(i, canvas.height / 2 - height / 2);
          ctx.lineTo(i, canvas.height / 2 + height / 2);
        }
        ctx.stroke();

        // draw center text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(user?.username || 'Local Host', canvas.width / 2, canvas.height / 2 - 60);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px sans-serif';
        ctx.fillText(micActive ? 'Speaking...' : 'Muted', canvas.width / 2, canvas.height / 2 + 70);
      }, 33);

      const mockStream = (canvas as any).captureStream(30);
      setLocalStream(mockStream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = mockStream;
      }
      return mockStream;
    }
  };

  // WebRTC Mesh & Sockets Setup
  useEffect(() => {
    if (!socket || !roomCode) return;

    let localMediaStream: MediaStream | null = null;

    const setupSocketsAndPeer = async () => {
      localMediaStream = await initLocalStream();

      socket.emit('join-room', {
        roomCode,
        userId: user?.id || '',
        username: user?.username || 'Guest',
        avatarUrl: user?.avatarUrl || ''
      });

      socket.on('room-participants', (usersList: any[]) => {
        const activePeers = usersList
          .filter(u => u.userId !== user?.id)
          .map(u => ({
            socketId: u.socketId,
            userId: u.userId,
            username: u.username,
            avatarUrl: u.avatarUrl,
            isHandRaised: u.isHandRaised,
            speaking: false,
            role: 'Attendee' as const,
            connectionQuality: 'Excellent' as const,
            micActive: u.micActive !== undefined ? u.micActive : true,
            camActive: u.camActive !== undefined ? u.camActive : true
          }));
        
        setParticipants(activePeers);
      });

      socket.on('new-message', (msg: any) => {
        setChatMessages(prev => [...prev, {
          id: msg.id,
          sender: msg.sender,
          text: msg.text,
          timestamp: new Date(msg.timestamp)
        }]);

        // Mark unread messages if sidebar is closed or on other tabs
        if (!sidebarOpen || activeTab !== 'chat') {
          setUnreadMessages(prev => prev + 1);
        }

        // Adjust real-time AI summary analysis state based on bots and text dialogues
        if (msg.sender !== user?.username) {
          // Simulate active speaking status on incoming message
          setParticipants(prev =>
            prev.map(p => p.username === msg.sender ? { ...p, speaking: true } : { ...p, speaking: false })
          );
          setTimeout(() => {
            setParticipants(prev => prev.map(p => ({ ...p, speaking: false })));
          }, 3000);

          setAiAnalysis(prev => {
            const nextSentiment = { ...prev.sentiment };
            if (msg.text.toLowerCase().includes('critical') || msg.text.toLowerCase().includes('fail')) {
              nextSentiment.negative = Math.min(nextSentiment.negative + 5, 20);
              nextSentiment.positive = 100 - nextSentiment.neutral - nextSentiment.negative;
            } else {
              nextSentiment.positive = Math.min(nextSentiment.positive + 2, 90);
              nextSentiment.neutral = 100 - nextSentiment.positive - nextSentiment.negative;
            }

            // Extract decisions or action items
            const newDecisions = [...prev.decisions];
            const newActions = [...prev.actionItems];

            if (msg.text.toLowerCase().includes('action') || msg.text.toLowerCase().includes('todo')) {
              newActions.push({
                task: msg.text.substring(msg.text.toLowerCase().indexOf('action') + 7, 70),
                owner: msg.sender.split(' ')[0],
                deadline: 'Immediate'
              });
            } else if (msg.text.toLowerCase().includes('decid') || msg.text.toLowerCase().includes('agree')) {
              newDecisions.push(`Agreed: "${msg.text.slice(0, 60)}"`);
            }

            return {
              ...prev,
              summary: `Collaborative discussion ongoing. Host ${user?.username} and attendee ${msg.sender} are reviewing platform integrations.`,
              decisions: [...new Set(newDecisions)],
              actionItems: newActions,
              sentiment: nextSentiment,
              healthScore: Math.max(90, Math.min(99, 100 - nextSentiment.negative))
            };
          });
        }
      });

      socket.on('user-joined', async (data: { socketId: string; username: string }) => {
        showToastNotification(`${data.username} joined the workspace`);
        createPeerConnection(data.socketId, localMediaStream!);
      });

      socket.on('webrtc-signal', async (data: { senderSocketId: string; signal: any }) => {
        const { senderSocketId, signal } = data;
        let pc = peerConnections.current[senderSocketId];

        if (!pc) {
          pc = createPeerConnection(senderSocketId, localMediaStream!);
        }

        if (signal.sdp) {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          if (signal.sdp.type === 'offer') {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('webrtc-signal', {
              targetSocketId: senderSocketId,
              signal: { sdp: pc.localDescription }
            });
          }
        } else if (signal.candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } catch (e) {
            console.error('Error adding ice candidate', e);
          }
        }
      });

      socket.on('hand-raised', (data: { userId: string; username: string; isHandRaised: boolean }) => {
        if (data.isHandRaised) {
          showToastNotification(`${data.username} raised their hand`);
        }
        setParticipants(prev =>
          prev.map(p => (p.userId === data.userId ? { ...p, isHandRaised: data.isHandRaised } : p))
        );
      });

      socket.on('user-left', (data: { socketId: string }) => {
        const peer = participants.find(p => p.socketId === data.socketId);
        if (peer) {
          showToastNotification(`${peer.username} left the workspace`);
        }
        if (peerConnections.current[data.socketId]) {
          peerConnections.current[data.socketId].close();
          delete peerConnections.current[data.socketId];
        }
        setParticipants(prev => prev.filter(p => p.socketId !== data.socketId));
      });

      // Synchronize state changes (mute, camera toggles)
      socket.on('participant-state-changed', (data: { socketId: string; micActive: boolean; camActive: boolean }) => {
        setParticipants(prev =>
          prev.map(p => (p.socketId === data.socketId ? { ...p, micActive: data.micActive, camActive: data.camActive } : p))
        );
      });

      // Synchronize reactions emoji overlays
      socket.on('new-reaction', (data: { id: string; username: string; emoji: string }) => {
        const reactionId = data.id || Math.random().toString();
        const leftPos = 15 + Math.random() * 70; // Float emojis inside center frame
        setFloatingReactions(prev => [...prev, { id: reactionId, emoji: data.emoji, left: leftPos }]);
        
        setTimeout(() => {
          setFloatingReactions(prev => prev.filter(r => r.id !== reactionId));
        }, 3000);
      });

      // Remote screen share started
      socket.on('screen-share-started', (data: { socketId: string; userId: string; username: string }) => {
        setScreenSharer({ socketId: data.socketId, username: data.username });
        showToastNotification(`${data.username} is sharing their screen`);
      });

      // Remote screen share stopped
      socket.on('screen-share-stopped', (data: { socketId: string }) => {
        setScreenSharer(null);
        showToastNotification('Screen sharing ended');
      });
    };

    setupSocketsAndPeer();

    return () => {
      socket.off('room-participants');
      socket.off('new-message');
      socket.off('user-joined');
      socket.off('webrtc-signal');
      socket.off('hand-raised');
      socket.off('user-left');
      socket.off('participant-state-changed');
      socket.off('new-reaction');
      socket.off('screen-share-started');
      socket.off('screen-share-stopped');
      
      if (canvasInterval.current) {
        clearInterval(canvasInterval.current);
      }

      if (localMediaStream) {
        localMediaStream.getTracks().forEach(track => track.stop());
      }

      Object.values(peerConnections.current).forEach(pc => pc.close());
      peerConnections.current = {};
    };
  }, [socket, roomCode, user?.id]);

  const createPeerConnection = (peerSocketId: string, stream: MediaStream) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    peerConnections.current[peerSocketId] = pc;

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('webrtc-signal', {
          targetSocketId: peerSocketId,
          signal: { candidate: event.candidate }
        });
      }
    };

    pc.ontrack = (event) => {
      setParticipants(prev =>
        prev.map(p => {
          if (p.socketId === peerSocketId) {
            return { ...p, stream: event.streams[0] };
          }
          return p;
        })
      );
    };

    pc.onnegotiationneeded = async () => {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        if (socket) {
          socket.emit('webrtc-signal', {
            targetSocketId: peerSocketId,
            signal: { sdp: pc.localDescription }
          });
        }
      } catch (err) {
        console.error('Negotiation error:', err);
      }
    };

    return pc;
  };

  const showToastNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };
  const toggleCam = () => {
    const nextState = !camActive;
    setCamActive(nextState);
    
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = nextState;
      }
    }
    
    if (socket && roomCode) {
      socket.emit('participant-state', { roomCode, micActive, camActive: nextState });
    }
  };

  const toggleMic = () => {
    const nextState = !micActive;
    setMicActive(nextState);
    
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = nextState;
      }
    }
    
    if (socket && roomCode) {
      socket.emit('participant-state', { roomCode, micActive: nextState, camActive });
    }
  };

  const toggleHandRaise = () => {
    const newState = !handRaised;
    setHandRaised(newState);
    if (socket && roomCode) {
      socket.emit('raise-hand', { roomCode, isHandRaised: newState });
    }
  };

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStreamRef.current = screenStream;
      setScreenSharing(true);
      setScreenSharer({ socketId: socket?.id || 'local', username: user?.username || 'You' });
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
      }
      
      // Replace the video track in all active peer connections so remote users see the screen
      const screenVideoTrack = screenStream.getVideoTracks()[0];
      Object.values(peerConnections.current).forEach(pc => {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(screenVideoTrack);
        }
      });

      // Notify other participants via socket
      if (socket && roomCode) {
        socket.emit('screen-share-started', { roomCode });
      }
      
      // Stop screen sharing if native overlay button is clicked
      screenVideoTrack.onended = () => {
        stopScreenShare();
      };
      
      showToastNotification('Screen sharing active.');
    } catch (err) {
      console.error('Failed to share screen:', err);
      showToastNotification('Screen share aborted.');
    }
  };

  const stopScreenShare = () => {
    const screenStream = screenStreamRef.current;
    if (screenStream) {
      screenStream.getTracks().forEach((track: any) => track.stop());
      screenStreamRef.current = null;
    }
    setScreenSharing(false);
    setScreenSharer(null);
    
    // Restore original camera video track in all peer connections
    if (localStream) {
      const cameraVideoTrack = localStream.getVideoTracks()[0];
      if (cameraVideoTrack) {
        Object.values(peerConnections.current).forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(cameraVideoTrack);
          }
        });
      }
    }

    // Restore local video element
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }

    // Notify other participants via socket
    if (socket && roomCode) {
      socket.emit('screen-share-stopped', { roomCode });
    }

    showToastNotification('Screen sharing stopped.');
  };

  const toggleScreenShare = () => {
    if (screenSharing) {
      stopScreenShare();
    } else {
      startScreenShare();
    }
  };

  const triggerReaction = (emoji: string) => {
    if (socket && roomCode) {
      socket.emit('send-reaction', { roomCode, emoji });
    }
    setShowEmojiPicker(false);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !socket || !roomCode) return;

    socket.emit('send-message', {
      roomCode,
      message: chatInput.trim(),
      senderName: user?.username || 'Nishikant Vijeta'
    });

    setChatInput('');
  };

  const handleInviteBots = () => {
    if (!socket || !roomCode) return;
    setBotsActive(true);
    socket.emit('start-ai-bot', { roomCode });

    // Mock bot participants addition to visual tiles
    const botSarah: PeerParticipant = {
      socketId: 'bot-sarah-socket',
      userId: 'bot-sarah-id',
      username: 'Sarah (Product Mgr)',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Sarah',
      speaking: false,
      role: 'Attendee',
      connectionQuality: 'Excellent',
      micActive: true,
      camActive: true
    };

    const botAlex: PeerParticipant = {
      socketId: 'bot-alex-socket',
      userId: 'bot-alex-id',
      username: 'Alex (Lead Dev)',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Alex',
      speaking: false,
      role: 'Attendee',
      connectionQuality: 'Good',
      micActive: true,
      camActive: true
    };

    const botCopilot: PeerParticipant = {
      socketId: 'bot-copilot-socket',
      userId: 'bot-copilot-id',
      username: 'AI Copilot Assistant',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Copilot',
      speaking: false,
      role: 'AI Copilot',
      connectionQuality: 'Excellent',
      micActive: true,
      camActive: true
    };

    // Add them to visual participants array after 500ms
    setTimeout(() => {
      setParticipants(prev => [...prev, botSarah, botAlex, botCopilot]);
      showToastNotification('AI Copilots and simulators joined room.');
    }, 500);

    // Simulate typing indicators
    let step = 0;
    const typingInterval = setInterval(() => {
      if (step === 0) setTypingUser('Sarah (Product Mgr)');
      else if (step === 1) {
        setTypingUser(null);
        setTypingUser('Alex (Lead Dev)');
      } else if (step === 2) {
        setTypingUser(null);
        setTypingUser('AI Copilot');
      } else {
        setTypingUser(null);
        clearInterval(typingInterval);
      }
      step++;
    }, 4500);
  };

  const handleCopyLink = () => {
    const inviteLink = `${window.location.origin}/meeting/${roomCode}`;
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    showToastNotification('Meeting invite link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const toggleSidebarTab = (tab: 'chat' | 'transcript' | 'ai' | 'participants') => {
    if (sidebarOpen && activeTab === tab) {
      setSidebarOpen(false);
    } else {
      setActiveTab(tab);
      setSidebarOpen(true);
    }
  };

  const handleExitMeeting = async () => {
    if (!roomCode) return;

    try {
      const durationSecs = Math.round((Date.now() - startTime.current) / 1000);
      const transcriptPayload = chatMessages.map(msg => ({
        sender: msg.sender,
        text: msg.text,
        timestamp: msg.timestamp.toISOString()
      }));

      if (transcriptPayload.length === 0) {
        transcriptPayload.push({
          sender: user?.username || 'Nishikant Vijeta',
          text: 'Conducted standard meeting check-in and task delegation.',
          timestamp: new Date().toISOString()
        });
      }

      await api.post(`/meetings/${roomCode}/summarize`, {
        duration: durationSecs,
        transcript: transcriptPayload
      });

      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
      }

      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to end meeting', err);
      navigate('/dashboard');
    }
  };

  // Determine grid columns dynamically based on tile count
  const allTilesCount = participants.length + 1;
  const getGridConfigClass = () => {
    if (allTilesCount === 1) return 'grid-cols-1 max-w-[800px] h-[80%] mx-auto';
    if (allTilesCount === 2) return 'grid-cols-2 max-w-[1200px] h-[75%] mx-auto';
    if (allTilesCount === 3 || allTilesCount === 4) return 'grid-cols-2 max-w-[1200px] h-[90%] mx-auto';
    return 'grid-cols-3 max-w-[1300px] h-[90%] mx-auto';
  };

  // User Initial for avatar fallback
  const hostName = user?.username || 'Nishikant Vijeta';
  const hostInitial = hostName.charAt(0).toUpperCase();

  const getParticipantInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const renderHostTile = (isThumbnail = false) => (
    <div className={`relative w-full h-full bg-[#1a1a1c] border-2 transition-all rounded ${
      isThumbnail ? 'min-w-[160px] max-w-[160px] h-[90px] border-zinc-800' : (micActive && !handRaised ? 'border-[#0E71EB] shadow-[0_0_8px_rgba(14,113,235,0.25)]' : 'border-zinc-800')
    } flex items-center justify-center`}>
      {/* Always mount video element to prevent srcObject binding delays */}
      <video
        ref={localVideoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover transform scale-x-[-1] ${camActive ? 'block' : 'hidden'}`}
      />
      {!camActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1c]">
          <div className={`${isThumbnail ? 'w-8 h-8 text-[14px]' : 'w-16 h-16 text-[28px]'} bg-[#0E71EB] text-white font-bold flex items-center justify-center rounded shadow-md`}>
            {hostInitial}
          </div>
        </div>
      )}
      <div className="absolute bottom-2.5 left-2.5 bg-black/60 px-2 py-0.5 rounded text-[10px] text-zinc-200 flex items-center space-x-1.5 border border-white/5 z-10">
        {!micActive ? (
          <div className="p-0.5 rounded-full bg-red-650 text-white">
            <MicOff className="w-3 h-3" />
          </div>
        ) : (
          <Mic className="w-3 h-3 text-zinc-350" />
        )}
        <span className="font-medium text-zinc-105">{hostName}</span>
        {handRaised && <Hand className="w-2.5 h-2.5 text-yellow-550 fill-yellow-500 animate-bounce" />}
      </div>
      <span className="absolute top-2.5 left-2.5 bg-blue-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Host</span>
    </div>
  );

  const renderPeerTile = (peer: PeerParticipant, isThumbnail = false) => (
    <div
      key={peer.socketId}
      className={`relative w-full h-full bg-[#1a1a1c] border-2 transition-all rounded ${
        isThumbnail ? 'min-w-[160px] max-w-[160px] h-[90px] border-zinc-800' : (peer.speaking ? 'border-[#0E71EB] shadow-[0_0_8px_rgba(14,113,235,0.25)]' : 'border-zinc-800')
      } flex items-center justify-center`}
    >
      {peer.stream && peer.camActive ? (
        <video
          autoPlay
          playsInline
          ref={(el) => {
            if (el && peer.stream) el.srcObject = peer.stream;
          }}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1c]">
          <div className={`${isThumbnail ? 'w-8 h-8 text-[14px]' : 'w-16 h-16 text-[28px]'} bg-[#52525b] text-white font-bold flex items-center justify-center rounded`}>
            {getParticipantInitial(peer.username)}
          </div>
        </div>
      )}
      <div className="absolute bottom-2.5 left-2.5 bg-black/60 px-2 py-0.5 rounded text-[10px] text-zinc-200 flex items-center space-x-1.5 border border-white/5 z-10">
        {!peer.micActive ? (
          <div className="p-0.5 rounded-full bg-red-650 text-white">
            <MicOff className="w-3 h-3" />
          </div>
        ) : (
          <Mic className="w-3 h-3 text-zinc-350" />
        )}
        <span className="font-medium text-zinc-105">{peer.username}</span>
        {peer.isHandRaised && <Hand className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500 animate-bounce" />}
      </div>
      <span className={`absolute top-2.5 left-2.5 text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
        peer.role === 'AI Copilot' ? 'bg-purple-600' : 'bg-[#52525b]'
      }`}>
        {peer.role || 'Attendee'}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-slate-100 flex flex-col font-sans overflow-hidden">
      <SEOHead title={`${meetingTitle} - Zoom Suite`} />

      {/* Embedded CSS style tag for floating emoji animations */}
      <style>{`
        @keyframes floatUp {
          0% {
            transform: translateY(0) scale(0.5);
            opacity: 0;
          }
          15% {
            transform: translateY(-20px) scale(1.2);
            opacity: 1;
          }
          80% {
            transform: translateY(-130px) scale(1);
            opacity: 0.8;
          }
          100% {
            transform: translateY(-220px) scale(0.7);
            opacity: 0;
          }
        }
        .animate-float-up {
          animation: floatUp 3s ease-out forwards;
        }
      `}</style>

      {/* Live Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-zinc-800 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg z-50 flex items-center space-x-2 border border-zinc-700 animate-slide-in">
          <Info className="w-3.5 h-3.5 text-[#0E71EB]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* IntellMeet Premium Header */}
      <header className="h-12 px-6 bg-[#0f0f0f] border-b border-zinc-900 flex items-center justify-between shrink-0 z-10 text-xs">
        <div className="flex items-center space-x-2">
          {/* IntellMeet Workplace branding */}
          <span className="font-bold text-[13px] text-white tracking-wide">IntellMeet</span>
          <span className="text-[13px] text-[#0E71EB] font-semibold ml-1">Workplace</span>
        </div>

        {/* Blinking REC indicator & Timer / Connection Badge */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-1.5 text-zinc-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500/10" />
            <span className="hidden md:inline text-[11px]">Connected</span>
          </div>

          <div className="flex items-center space-x-2 text-zinc-400">
            <Clock className="w-4 h-4 text-zinc-500" />
            <span className="font-mono text-[11px] font-semibold">{formatTimer(secondsElapsed)}</span>
          </div>

          {isRecording ? (
            <button
              onClick={() => {
                setIsRecording(false);
                showToastNotification('Recording stopped.');
              }}
              className="flex items-center space-x-1.5 bg-red-950/40 border border-red-900/50 text-red-500 px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer hover:bg-red-900/30 transition-colors"
              title="Stop Recording"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span>REC</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setIsRecording(true);
                showToastNotification('Recording started.');
              }}
              className="flex items-center space-x-1.5 bg-zinc-800 border border-zinc-700 text-zinc-400 px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer hover:bg-zinc-700 transition-colors"
              title="Start Recording"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
              <span>Record</span>
            </button>
          )}
        </div>

        {/* View Grid Selector */}
        <div className="flex items-center space-x-2">
          <div className="relative">
            <button 
              onClick={() => setShowViewDropdown(prev => !prev)}
              className="flex items-center space-x-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded border border-zinc-700 transition-colors cursor-pointer"
            >
              <Grid className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-[11px]">View</span>
            </button>
            
            {showViewDropdown && (
              <div className="absolute right-0 mt-1.5 w-36 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl py-1.5 z-50 text-left">
                <button
                  onClick={() => {
                    setViewMode('gallery');
                    setShowViewDropdown(false);
                  }}
                  className={`w-full px-3.5 py-2 text-[11px] font-semibold text-left flex items-center space-x-2 hover:bg-zinc-800 transition-colors ${viewMode === 'gallery' ? 'text-[#0E71EB] bg-zinc-800/40' : 'text-zinc-350'}`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>Gallery View</span>
                </button>
                <button
                  onClick={() => {
                    setViewMode('speaker');
                    setShowViewDropdown(false);
                  }}
                  className={`w-full px-3.5 py-2 text-[11px] font-semibold text-left flex items-center space-x-2 hover:bg-zinc-800 transition-colors ${viewMode === 'speaker' ? 'text-[#0E71EB] bg-zinc-800/40' : 'text-zinc-355'}`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Speaker View</span>
                </button>
              </div>
            )}
          </div>
          
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 text-white text-[10px] font-bold flex items-center justify-center border border-zinc-800 shadow-sm hover:scale-105 transition-transform" title="IntellMeet Profile">
            im
          </div>
        </div>
      </header>

      {/* Main Split Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative bg-[#0a0a0a]">
        
        {/* Left Side: Video Grid Area */}
        <div className="flex-1 p-6 flex flex-col justify-center overflow-y-auto min-h-0 relative">
          
          {/* Real-time floating reactions emoji stream container */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
            {floatingReactions.map(r => (
              <div
                key={r.id}
                style={{ left: `${r.left}%` }}
                className="absolute bottom-16 text-3xl animate-float-up select-none"
              >
                {r.emoji}
              </div>
            ))}
          </div>

          {/* Screen share active: show shared screen as main + thumbnails at bottom */}
          {screenSharer ? (
            <div className="flex-1 flex flex-col justify-between h-full space-y-4 max-h-[85vh] w-full">
              {/* Shared Screen - Large Featured View */}
              <div className="flex-1 min-h-0 bg-[#1a1a1c] border-2 border-emerald-600 rounded-xl flex items-center justify-center relative overflow-hidden max-w-[950px] w-full mx-auto shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                {/* Screen share indicator badge */}
                <div className="absolute top-3 left-3 z-20 flex items-center space-x-2 bg-emerald-600/90 backdrop-blur-sm px-3 py-1 rounded-full">
                  <Monitor className="w-3.5 h-3.5 text-white animate-pulse" />
                  <span className="text-[10px] font-bold text-white tracking-wide">
                    {screenSharer.socketId === (socket?.id || 'local') ? 'You are sharing' : `${screenSharer.username}'s screen`}
                  </span>
                </div>
                {screenSharer.socketId === (socket?.id || 'local') ? (
                  /* Local screen share: show local video ref (already set to screen stream) */
                  renderHostTile(false)
                ) : (
                  /* Remote screen share: show peer's stream which now contains the screen */
                  (() => {
                    const sharingPeer = participants.find(p => p.socketId === screenSharer.socketId);
                    return sharingPeer ? renderPeerTile(sharingPeer, false) : renderHostTile(false);
                  })()
                )}
              </div>

              {/* All Participants (Thumbnails Row at the bottom) */}
              <div className="h-[110px] flex items-center gap-3 overflow-x-auto py-2 px-4 max-w-[950px] w-full mx-auto border border-zinc-900 bg-black/25 rounded-xl">
                {renderHostTile(true)}
                {participants.map(peer => renderPeerTile(peer, true))}
              </div>
            </div>
          ) : viewMode === 'gallery' ? (
            <div className={`grid gap-4 w-full justify-center items-center ${getGridConfigClass()}`}>
              
              {/* Local Host Video Tile (Zoom Workplace Style) */}
              {renderHostTile(false)}

              {/* Remote Participants Video Containers */}
              {participants.map((peer) => renderPeerTile(peer, false))}

            </div>
          ) : (
            /* Speaker View Layout */
            <div className="flex-1 flex flex-col justify-between h-full space-y-4 max-h-[85vh] w-full">
              {/* Featured Speaker (Large Aspect Ratio Card) */}
              <div className="flex-1 min-h-0 bg-[#1a1a1c] border-2 border-zinc-800 rounded-xl flex items-center justify-center relative overflow-hidden max-w-[850px] w-full mx-auto shadow-lg aspect-video">
                {participants.find(p => p.speaking) ? renderPeerTile(participants.find(p => p.speaking)!, false) : renderHostTile(false)}
              </div>

              {/* Other Participants (Thumbnails Row at the bottom) */}
              <div className="h-[120px] flex items-center gap-3 overflow-x-auto py-2 px-4 max-w-[900px] w-full mx-auto border border-zinc-900 bg-black/25 rounded-xl scrollbar">
                {participants.find(p => p.speaking) ? renderHostTile(true) : null}
                {participants
                  .filter(peer => !participants.find(p => p.speaking) || peer.socketId !== participants.find(p => p.speaking)!.socketId)
                  .map(peer => renderPeerTile(peer, true))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Tabbed Right Sidebar (Chat / Transcript / Notes) */}
        {sidebarOpen && (
          <aside className="w-full md:w-[380px] bg-[#16161a] border-t md:border-t-0 md:border-l border-zinc-850 flex flex-col shrink-0 min-h-[350px] md:min-h-0 z-10 text-left">
            {/* Sidebar Tab Header */}
            <div className="flex border-b border-zinc-800 bg-[#121215]">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-3 text-[11px] font-bold border-b-2 flex items-center justify-center space-x-1.5 ${
                  activeTab === 'chat'
                    ? 'border-[#0E71EB] text-white bg-[#16161a]'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat</span>
              </button>
              <button
                onClick={() => setActiveTab('transcript')}
                className={`flex-1 py-3 text-[11px] font-bold border-b-2 flex items-center justify-center space-x-1.5 ${
                  activeTab === 'transcript'
                    ? 'border-[#0E71EB] text-white bg-[#16161a]'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Transcript</span>
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                className={`flex-1 py-3 text-[11px] font-bold border-b-2 flex items-center justify-center space-x-1.5 ${
                  activeTab === 'ai'
                    ? 'border-[#0E71EB] text-white bg-[#16161a]'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>AI Notes</span>
              </button>
              <button
                onClick={() => setActiveTab('participants')}
                className={`flex-1 py-3 text-[11px] font-bold border-b-2 flex items-center justify-center space-x-1.5 ${
                  activeTab === 'participants'
                    ? 'border-[#0E71EB] text-white bg-[#16161a]'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>People</span>
              </button>
            </div>

            {/* Content Container */}
            <div className="flex-1 overflow-y-auto p-4 min-h-0 text-xs bg-[#16161a] text-zinc-300">
              
              {/* TAB: Chat */}
              {activeTab === 'chat' && (
                <div className="h-full flex flex-col justify-between">
                  <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 mb-4 max-h-[35vh] md:max-h-none">
                    {chatMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-24 text-zinc-500 space-y-2">
                        <MessageSquare className="w-8 h-8 opacity-25 text-zinc-450" />
                        <p>No messages in room chat.</p>
                      </div>
                    ) : (
                      chatMessages.map((msg) => (
                        <div key={msg.id} className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800">
                          <div className="flex justify-between items-center mb-1">
                            <span className={`font-bold ${msg.sender === user?.username ? 'text-[#0E71EB]' : 'text-purple-450'}`}>
                              {msg.sender}
                            </span>
                            <span className="text-[8px] text-zinc-555">
                              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-300 leading-relaxed">{msg.text}</p>
                        </div>
                      ))
                    )}

                    {typingUser && (
                      <div className="text-[10px] text-zinc-550 italic flex items-center space-x-1.5 pl-1 py-1">
                        <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" />
                        <span>{typingUser} is typing...</span>
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleSendMessage} className="flex space-x-2 border-t border-zinc-800 pt-3">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      placeholder="Type message to room..."
                      className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-xs text-white focus:outline-none focus:border-[#0E71EB]"
                    />
                    <button
                      type="submit"
                      className="p-2 bg-[#0E71EB] hover:bg-[#0c62cc] text-white rounded cursor-pointer flex items-center justify-center w-8 h-8 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              )}

              {/* TAB: Transcript Stream */}
              {activeTab === 'transcript' && (
                <div className="space-y-4">
                  <div className="inline-flex items-center space-x-2 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded text-[9px] text-[#0E71EB] font-bold">
                    <Radio className="w-3.5 h-3.5 text-[#0E71EB] animate-pulse" />
                    <span>Real-time Speech Capture active</span>
                  </div>
                  <div className="space-y-3 bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl max-h-[50vh] md:max-h-none overflow-y-auto">
                    {chatMessages.length === 0 ? (
                      <p className="text-zinc-550 text-center py-6">No transcript items logged. Active dialogues will render here.</p>
                    ) : (
                      chatMessages.map((msg, idx) => (
                        <div key={idx} className="text-zinc-300 text-xs border-b border-zinc-800 pb-2 last:border-0">
                          <div className="flex items-center space-x-1.5 text-[9px] font-bold text-zinc-555 mb-0.5">
                            <span>{msg.sender}</span>
                            <span>&bull;</span>
                            <span>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="italic text-zinc-400">"{msg.text}"</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB: AI Summary Notes */}
              {activeTab === 'ai' && (
                <div className="space-y-4">
                  
                  {/* Summary only */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-purple-400 flex items-center space-x-1.5 uppercase text-[9px] tracking-wider">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Real-time Summary</span>
                    </h4>
                    <p className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 leading-relaxed text-zinc-350 italic">
                      {aiAnalysis.summary}
                    </p>
                  </div>

                </div>
              )}

              {/* TAB: Attendee List */}
              {activeTab === 'participants' && (
                <div className="space-y-4">
                  <h4 className="font-bold text-white uppercase text-[9px] tracking-wider pb-1 border-b border-zinc-850">
                    Participants List
                  </h4>
                  <div className="space-y-2.5">
                    {/* Host */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-800 bg-zinc-900/60">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded bg-[#0E71EB] text-white font-bold text-[10px] flex items-center justify-center">
                          {hostInitial}
                        </div>
                        <div className="text-left">
                          <h5 className="font-bold text-white leading-none">{hostName}</h5>
                          <span className="text-[8px] text-zinc-500 mt-0.5 block">Meeting Host</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Signal className="w-3.5 h-3.5 text-emerald-500" />
                        {micActive ? <Mic className="w-3.5 h-3.5 text-zinc-450" /> : <MicOff className="w-3.5 h-3.5 text-red-500" />}
                      </div>
                    </div>

                    {/* Remote peers */}
                    {participants.map(peer => (
                      <div key={peer.socketId} className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-800 bg-zinc-900/40">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded bg-zinc-700 text-white font-bold text-[10px] flex items-center justify-center">
                            {getParticipantInitial(peer.username)}
                          </div>
                          <div className="text-left">
                            <h5 className="font-bold text-white leading-none truncate max-w-[130px]">{peer.username}</h5>
                            <span className="text-[8px] text-zinc-555 mt-0.5 block">{peer.role || 'Attendee'}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Signal className="w-3.5 h-3.5 text-emerald-500" />
                          {peer.micActive ? <Mic className="w-3.5 h-3.5 text-zinc-450" /> : <MicOff className="w-3.5 h-3.5 text-red-500" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </aside>
        )}
      </div>

      {/* Settings Modal Overlay */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setShowSettings(false)} />
          <div className="relative w-full max-w-sm bg-[#16161a] border border-zinc-800 rounded-3xl p-6 shadow-2xl z-10 text-slate-200 text-left">
            <button
              onClick={() => setShowSettings(false)}
              className="absolute top-4 right-4 p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-450 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <h4 className="text-sm font-bold text-white mb-4 flex items-center space-x-1.5 pb-2 border-b border-zinc-800">
              <Settings className="w-4.5 h-4.5 text-[#0E71EB]" />
              <span>Audio & Video Diagnostics</span>
            </h4>
            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-zinc-400 block">Microphone Selection</label>
                <select
                  value={audioInputDevice}
                  onChange={e => setAudioInputDevice(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-800 bg-zinc-900 rounded focus:border-[#0E71EB] focus:outline-none text-white text-xs"
                >
                  <option>Default Microphone (System Audio)</option>
                  <option>Virtual Audio Controller (Simulated)</option>
                  <option>High Definition Audio Array</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-zinc-400 block">Camera Video Input</label>
                <select
                  value={videoInputDevice}
                  onChange={e => setVideoInputDevice(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-800 bg-zinc-900 rounded focus:border-[#0E71EB] focus:outline-none text-white text-xs"
                >
                  <option>Default Camera (Hardware Interface)</option>
                  <option>Simulated soundwaves grid simulator</option>
                  <option>OBS Virtual Camera Driver</option>
                </select>
              </div>

              <button
                onClick={() => {
                  setShowSettings(false);
                  showToastNotification('Diagnostics parameters applied.');
                }}
                className="w-full mt-4 py-2.5 bg-[#0E71EB] hover:bg-[#0c62cc] text-white rounded font-semibold transition-colors cursor-pointer text-center"
              >
                Apply changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Control Dock (Zoom Workplace Bottom Bar) */}
      <footer className="h-16 bg-[#161618] border-t border-zinc-900 flex items-center justify-between px-6 shrink-0 z-10 text-white font-sans text-xs">
        
        {/* Left spacing/join-share indicator for alignment */}
        <div className="w-12 hidden md:block" />

        {/* Center Main Controls Row */}
        <div className="flex items-center space-x-1.5 mx-auto relative">
          
          {/* Reaction Emoji Selection Popover Overlay */}
          {showEmojiPicker && (
            <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-zinc-900 border border-zinc-800 p-2.5 rounded-xl flex space-x-3.5 shadow-2xl z-40 animate-scale-in">
              {['❤️', '👍', '👏', '😂', '🎉', '😮'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => triggerReaction(emoji)}
                  className="text-2xl hover:scale-125 transition-transform cursor-pointer select-none"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Mute / Unmute (Mic) with dropdown arrow */}
          <div className="flex items-center group">
            <button
              onClick={toggleMic}
              className="flex flex-col items-center justify-center text-zinc-400 hover:text-white transition-colors py-1 pl-3 pr-1 min-w-[56px] relative cursor-pointer"
              title={micActive ? 'Mute Audio' : 'Unmute Audio'}
            >
              {micActive ? (
                <Mic className="w-5 h-5 text-white" />
              ) : (
                <div className="relative">
                  <Mic className="w-5 h-5 text-zinc-450" />
                  <span className="absolute inset-0 flex items-center justify-center text-red-500 scale-150 rotate-[-45deg] font-light">|</span>
                </div>
              )}
              <span className={`text-[10px] mt-1.5 ${!micActive ? 'text-red-550 font-semibold' : ''}`}>
                {micActive ? 'Mute' : 'Unmute'}
              </span>
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="text-zinc-550 hover:text-zinc-300 py-1 pr-2 cursor-pointer self-end mb-1 transition-colors"
            >
              <ChevronUp className="w-3 h-3" />
            </button>
          </div>

          {/* Start Video / Stop Video (Camera) with dropdown arrow */}
          <div className="flex items-center group">
            <button
              onClick={toggleCam}
              className="flex flex-col items-center justify-center text-zinc-400 hover:text-white transition-colors py-1 pl-3 pr-1 min-w-[56px] relative cursor-pointer"
              title={camActive ? 'Stop Video' : 'Start Video'}
            >
              {camActive ? (
                <VideoIcon className="w-5 h-5 text-white" />
              ) : (
                <div className="relative">
                  <VideoIcon className="w-5 h-5 text-zinc-450" />
                  <span className="absolute inset-0 flex items-center justify-center text-red-500 scale-150 rotate-[-45deg] font-light">|</span>
                </div>
              )}
              <span className={`text-[10px] mt-1.5 ${!camActive ? 'text-red-550 font-semibold' : ''}`}>
                {camActive ? 'Stop Video' : 'Start Video'}
              </span>
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="text-zinc-550 hover:text-zinc-300 py-1 pr-2 cursor-pointer self-end mb-1 transition-colors"
            >
              <ChevronUp className="w-3 h-3" />
            </button>
          </div>

          <div className="h-6 w-[1px] bg-zinc-800 self-center mx-2" />

          {/* Participants */}
          <div className="flex items-center">
            <button
              onClick={() => toggleSidebarTab('participants')}
              className="flex flex-col items-center justify-center text-zinc-450 hover:text-white transition-colors py-1 px-3 min-w-[64px] relative cursor-pointer"
              title="Participants list"
            >
              <div className="relative">
                <Users className="w-5 h-5" />
                <span className="absolute -top-1 -right-1.5 bg-[#0E71EB] text-white rounded-full text-[8px] font-bold px-1.5 py-0.2">
                  {allTilesCount}
                </span>
              </div>
              <span className="text-[10px] mt-1.5">Participants</span>
            </button>
          </div>

          {/* Chat */}
          <div className="flex items-center">
            <button
              onClick={() => toggleSidebarTab('chat')}
              className="flex flex-col items-center justify-center text-zinc-450 hover:text-white transition-colors py-1 px-3 min-w-[64px] relative cursor-pointer"
              title="Open Chat"
            >
              <div className="relative">
                <MessageSquare className="w-5 h-5" />
                {unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1.5 bg-blue-600 text-white rounded-full text-[8px] font-bold px-1.5 py-0.2">
                    {unreadMessages}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1.5">Chat</span>
            </button>
          </div>

          {/* React (Emoji Toggles) */}
          <div className="flex items-center">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`flex flex-col items-center justify-center transition-colors py-1 px-3 min-w-[64px] relative cursor-pointer ${
                showEmojiPicker ? 'text-[#0E71EB]' : 'text-zinc-450 hover:text-white'
              }`}
              title="React"
            >
              <Heart className="w-5 h-5" />
              <span className="text-[10px] mt-1.5">React</span>
            </button>
          </div>

          {/* Share Screen */}
          <div className="flex items-center">
            <button
              onClick={toggleScreenShare}
              className="flex flex-col items-center justify-center text-zinc-450 hover:text-white transition-colors py-1 px-3 min-w-[64px] relative cursor-pointer"
              title={screenSharing ? 'Stop Share Screen' : 'Start Share Screen'}
            >
              <Monitor className={`w-5 h-5 ${screenSharing ? 'text-emerald-500 animate-pulse' : 'text-emerald-450'}`} />
              <span className="text-[10px] mt-1.5 text-emerald-450 font-medium">
                {screenSharing ? 'Stop Share' : 'Share'}
              </span>
            </button>
          </div>

          {/* Host tools */}
          <div className="flex items-center">
            <button
              onClick={() => showToastNotification('Host tools: Room security guidelines active.')}
              className="flex flex-col items-center justify-center text-zinc-450 hover:text-white transition-colors py-1 px-3 min-w-[64px] relative cursor-pointer"
              title="Host Tools"
            >
              <Shield className="w-5 h-5 text-zinc-350" />
              <span className="text-[10px] mt-1.5">Host tools</span>
            </button>
          </div>

          {/* AI Companion (Trigger simulated bots / opens notes) */}
          <div className="flex items-center">
            <button
              onClick={() => {
                toggleSidebarTab('ai');
                if (!botsActive) handleInviteBots();
              }}
              className="flex flex-col items-center justify-center text-zinc-450 hover:text-white transition-colors py-1 px-3 min-w-[64px] relative cursor-pointer group"
              title="AI Companion insights"
            >
              <Sparkles className={`w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform ${botsActive ? 'animate-pulse' : ''}`} />
              <span className="text-[10px] mt-1.5 font-medium text-purple-400">AI Companion</span>
            </button>
          </div>

          {/* More / Raise Hand */}
          <div className="flex items-center">
            <button
              onClick={() => toggleHandRaise()}
              className="flex flex-col items-center justify-center text-zinc-450 hover:text-white transition-colors py-1 px-3 min-w-[64px] relative cursor-pointer"
              title={handRaised ? 'Lower Hand' : 'Raise Hand'}
            >
              <Hand className={`w-5 h-5 ${handRaised ? 'text-yellow-500 fill-yellow-500 animate-bounce' : ''}`} />
              <span className="text-[10px] mt-1.5">
                {handRaised ? 'Lower Hand' : 'Raise Hand'}
              </span>
            </button>
          </div>

        </div>

        {/* Right side: Red Exit Meeting Box */}
        <div className="flex items-center pr-4">
          <button
            onClick={handleExitMeeting}
            className="px-3.5 py-1.5 bg-[#f43f5e] hover:bg-[#e11d48] text-white text-[11px] font-bold rounded cursor-pointer transition-colors"
          >
            End
          </button>
        </div>

      </footer>
    </div>
  );
};

export default MeetingRoomPage;
