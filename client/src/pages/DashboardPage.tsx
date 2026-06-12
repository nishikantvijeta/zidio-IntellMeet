import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { useSocket } from '../app/SocketContext';
import { DashboardLayout } from '../components/layouts/DashboardLayout';
import { SEOHead } from '../components/common/SEOHead';
import { api } from '../services/api';
import { Meeting, Task } from '../types';
import {
  Video,
  Plus,
  ArrowRight,
  TrendingUp,
  Clock,
  Heart,
  Calendar,
  Sparkles,
  ChevronRight,
  X,
  FileText,
  MessageSquare,
  Bot,
  Activity,
  AlertTriangle,
  User as UserIcon,
  CheckCircle2,
  Users,
  CheckSquare,
  Copy,
  Check,
  Zap,
  Shield,
  Layers,
  CheckCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  
  const [meetingTitle, setMeetingTitle] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joinError, setJoinError] = useState('');

  // Share link feedback states
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Live Workspace Feed state
  const [feedEvents, setFeedEvents] = useState<{ id: string; type: string; message: string; time: string; category: 'info' | 'ai' | 'warning' | 'success' }[]>([
    { id: '1', type: 'system', message: 'Secure WebRTC signal gateways initialized.', time: '10 mins ago', category: 'success' },
    { id: '2', type: 'auth', message: 'Workspace audit log synced with secure keys.', time: '20 mins ago', category: 'info' },
    { id: '3', type: 'ai', message: 'AI Copilot initialized and ready to join active rooms.', time: '35 mins ago', category: 'ai' }
  ]);

  // Live preview sentiment & transcript ticker
  const [mockTranscriptLine, setMockTranscriptLine] = useState("Sarah: 'We should verify the WebRTC mesh connection.'");
  const [mockSentiment, setMockSentiment] = useState(94);

  // User Activity Heatmap state
  const [hoveredCell, setHoveredCell] = useState<{ day: string; hour: string; count: number } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [meetingsRes, tasksRes] = await Promise.all([
        api.get('/meetings/user'),
        api.get('/tasks')
      ]);
      setMeetings(meetingsRes.data.meetings || []);
      setTasks(tasksRes.data.tasks || []);
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Stream mock live preview ticker lines
    const phrases = [
      "Sarah: 'We should verify the WebRTC mesh connection.'",
      "AI Copilot: 'Logged action item for Alex to audit MongoDB failover.'",
      "Alex: 'I can deploy the login schema update by Friday.'",
      "Sarah: 'Excellent. Please coordinate the API checks.'",
      "AI Copilot: 'Sentiment index is highly positive. Focus is on task resolution.'"
    ];
    let idx = 0;
    const tickerInterval = setInterval(() => {
      idx = (idx + 1) % phrases.length;
      setMockTranscriptLine(phrases[idx]);
      setMockSentiment(prev => {
        const offset = Math.floor(Math.random() * 5) - 2;
        const val = prev + offset;
        return Math.min(Math.max(val, 88), 98);
      });
    }, 4000);

    // Simulate workspace feed events
    const feedUpdates = [
      { message: 'Alex assigned task "Verify WebRTC codecs" to Sarah.', type: 'task', category: 'info' },
      { message: 'AI summary generated for "Weekly Sprint Sync".', type: 'ai', category: 'ai' },
      { message: 'Meeting "Design Alignment" started by Host.', type: 'meeting', category: 'success' },
      { message: 'Recording saved to secure Cloudinary bucket.', type: 'system', category: 'info' },
      { message: 'Workspace performance index increased by 1.2%.', type: 'metrics', category: 'success' },
      { message: 'Verification webhook triggered for user "vijeta".', type: 'system', category: 'info' }
    ];
    let feedIdx = 0;
    const feedInterval = setInterval(() => {
      const update = feedUpdates[feedIdx];
      setFeedEvents(prev => [
        {
          id: Math.random().toString(36).substring(2, 9),
          type: update.type,
          message: update.message,
          time: 'Just now',
          category: update.category as any
        },
        ...prev.slice(0, 7)
      ]);
      feedIdx = (feedIdx + 1) % feedUpdates.length;
    }, 12000);

    return () => {
      clearInterval(tickerInterval);
      clearInterval(feedInterval);
    };
  }, []);

  // Set up socket listener for live task/workspace event updates
  useEffect(() => {
    if (!socket) return;
    
    socket.on('new-notification', (notif: any) => {
      setFeedEvents(prev => [
        {
          id: notif._id || Math.random().toString(),
          type: 'notification',
          message: notif.content,
          time: 'Just now',
          category: 'warning'
        },
        ...prev.slice(0, 7)
      ]);
    });

    return () => {
      socket.off('new-notification');
    };
  }, [socket]);

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      const res = await api.post('/meetings', { title: meetingTitle || 'Product Sync' });
      const roomCode = res.data.meeting.roomCode;
      navigate(`/meeting/${roomCode}`);
    } catch (err) {
      console.error('Failed to create meeting', err);
    } finally {
      setCreating(false);
    }
  };

  const handleJoinMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCodeInput.trim()) return;

    try {
      setJoinError('');
      setJoining(true);
      const cleanCode = roomCodeInput.trim();
      await api.post('/meetings/join', { roomCode: cleanCode });
      navigate(`/meeting/${cleanCode}`);
    } catch (err: any) {
      setJoinError(err.response?.data?.message || 'Invalid room code.');
    } finally {
      setJoining(false);
    }
  };

  const copyToClipboard = (meetingId: string, roomCode: string) => {
    const link = `${window.location.origin}/meeting/${roomCode}`;
    navigator.clipboard.writeText(link);
    setCopiedId(meetingId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Sparkline data helpers
  const sparklineData = (values: number[]) => values.map((v, i) => ({ name: i, val: v }));

  // Recharts Chart Mock Data
  const getFrequencyData = () => {
    return [
      { name: 'Mon', count: 2 },
      { name: 'Tue', count: 5 },
      { name: 'Wed', count: 4 },
      { name: 'Thu', count: 6 },
      { name: 'Fri', count: meetings.length || 3 },
      { name: 'Sat', count: 1 },
      { name: 'Sun', count: 2 }
    ];
  };

  const getCompletionData = () => {
    const done = tasks.filter(t => t.status === 'Done').length || 6;
    const progress = tasks.filter(t => t.status === 'InProgress').length || 3;
    const review = tasks.filter(t => t.status as string === 'Review').length || 2;
    const todo = tasks.filter(t => t.status === 'Todo').length || 4;
    return [
      { name: 'To Do', value: todo, fill: '#64748b' },
      { name: 'In Progress', value: progress, fill: '#0066ff' },
      { name: 'Review', value: review, fill: '#ec4899' },
      { name: 'Done', value: done, fill: '#10b981' }
    ];
  };

  const getAiUsageData = () => {
    return [
      { name: 'Week 1', usage: 40 },
      { name: 'Week 2', usage: 55 },
      { name: 'Week 3', usage: 78 },
      { name: 'Week 4', usage: 92 }
    ];
  };

  const getProductivityTrends = () => {
    return [
      { name: 'Day 1', score: 88 },
      { name: 'Day 2', score: 90 },
      { name: 'Day 3', score: 89 },
      { name: 'Day 4', score: 94 },
      { name: 'Day 5', score: 93 },
      { name: 'Day 6', score: 96 },
      { name: 'Day 7', score: 94.8 }
    ];
  };

  // Activity Heatmap Parameters
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const hours = ['09:00', '11:00', '13:00', '15:00', '17:00'];
  const getHeatmapValue = (dayIdx: number, hourIdx: number) => {
    // Generate a static yet dynamic-looking seed for the heatmap block
    const values = [
      [1, 3, 0, 2, 4],
      [2, 4, 1, 3, 0],
      [0, 2, 4, 1, 3],
      [3, 1, 2, 4, 0],
      [4, 0, 3, 2, 1]
    ];
    return values[dayIdx % 5][hourIdx % 5];
  };

  const getHeatmapColor = (level: number) => {
    switch (level) {
      case 0: return 'bg-slate-50 border-slate-100';
      case 1: return 'bg-purple-100/70 border-purple-200/50';
      case 2: return 'bg-purple-200 border-purple-300/40';
      case 3: return 'bg-purple-400 border-purple-500/30';
      case 4: return 'bg-purple-600 border-purple-700/20';
      default: return 'bg-slate-50 border-slate-100';
    }
  };

  return (
    <DashboardLayout>
      <SEOHead title="AI Command Center" />

      <div className="space-y-8 text-left font-sans max-w-[1400px] mx-auto">
        
        {/* Top welcome row */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-2 border-b border-[#e2e8f0]">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 font-display">AI Command Center</h1>
            <p className="text-xs text-slate-450 mt-1">Real-time collaboration metrics, automated AI transcript logs, and copilot insights.</p>
          </div>
          <div className="flex items-center space-x-2 mt-4 md:mt-0 bg-purple-50 border border-purple-100 rounded-full px-3 py-1 text-[10px] font-bold text-purple-700">
            <Zap className="w-3.5 h-3.5" />
            <span>AI Model active: Gemini 1.5 Pro</span>
          </div>
        </div>

        {/* Quick Meetings Action Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Create Instant Meeting */}
          <div className="bg-white border border-[#e2e8f0] p-6 rounded-3xl shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl group-hover:scale-150 transition-all duration-300" />
            <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center space-x-2">
              <Plus className="w-4 h-4 text-blue-600" />
              <span>Host New Meeting</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">Launch a secure room code with real-time video streaming, transcribing logs, and Gemini AI analysis.</p>
            <form onSubmit={handleCreateMeeting} className="flex space-x-3">
              <input
                type="text"
                value={meetingTitle}
                onChange={e => setMeetingTitle(e.target.value)}
                placeholder="Meeting Title (e.g. Design Alignment)"
                className="flex-1 px-4 py-2.5 rounded-xl glass-input text-xs border"
              />
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 shrink-0 transition-colors"
              >
                <span>Launch</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Join Meeting via Code */}
          <div className="bg-white border border-[#e2e8f0] p-6 rounded-3xl shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl group-hover:scale-150 transition-all duration-300" />
            <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center space-x-2">
              <Video className="w-4 h-4 text-purple-600" />
              <span>Join via Code</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">Input a room code (e.g., abc-defg-hij) to join your teammates in an active real-time sync.</p>
            <form onSubmit={handleJoinMeeting} className="flex space-x-3">
              <input
                type="text"
                required
                value={roomCodeInput}
                onChange={e => setRoomCodeInput(e.target.value)}
                placeholder="Enter room code (xxx-xxxx-xxx)"
                className="flex-1 px-4 py-2.5 rounded-xl glass-input text-xs border"
              />
              <button
                type="submit"
                disabled={joining}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 shrink-0 transition-colors"
              >
                <span>Join</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
            {joinError && <p className="text-[10px] text-red-500 mt-2 font-semibold">{joinError}</p>}
          </div>
        </div>

        {/* 1. AI Command Center Metrics (6 Cards with Sparklines) */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          
          {/* Card 1: Meetings Today */}
          <div className="bg-white border border-[#e2e8f0] p-5 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="flex justify-between items-start">
              <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block">Meetings Today</span>
              <div className="p-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                <Video className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline space-x-1 mt-4">
              <h3 className="text-2xl font-black text-slate-900 font-display">2</h3>
              <span className="text-[9px] text-emerald-500 font-bold font-mono">+20%</span>
            </div>
            <div className="h-8 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparklineData([1, 2, 1, 3, 2, 4, 2])}>
                  <Area type="monotone" dataKey="val" stroke="#0066ff" strokeWidth={1.5} fill="rgba(0, 102, 255, 0.05)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Card 2: Active Participants */}
          <div className="bg-white border border-[#e2e8f0] p-5 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="flex justify-between items-start">
              <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block">Active Participants</span>
              <div className="p-1 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline space-x-1 mt-4">
              <h3 className="text-2xl font-black text-slate-900 font-display">3</h3>
              <span className="text-[9px] text-emerald-500 font-bold font-mono">+5%</span>
            </div>
            <div className="h-8 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparklineData([1, 2, 2, 3, 1, 2, 3])}>
                  <Area type="monotone" dataKey="val" stroke="#6366f1" strokeWidth={1.5} fill="rgba(99, 102, 241, 0.05)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Card 3: AI Summaries Generated */}
          <div className="bg-white border border-[#e2e8f0] p-5 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="flex justify-between items-start">
              <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block">AI Summaries</span>
              <div className="p-1 rounded-lg bg-purple-50 text-purple-600 border border-purple-100">
                <FileText className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline space-x-1 mt-4">
              <h3 className="text-2xl font-black text-slate-900 font-display">{meetings.length || 4}</h3>
              <span className="text-[9px] text-purple-600 font-bold font-mono">+34%</span>
            </div>
            <div className="h-8 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparklineData([2, 2, 3, 4, 3, 5, meetings.length || 4])}>
                  <Area type="monotone" dataKey="val" stroke="#7c3aed" strokeWidth={1.5} fill="rgba(124, 58, 237, 0.05)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Card 4: Productivity Score */}
          <div className="bg-white border border-[#e2e8f0] p-5 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="flex justify-between items-start">
              <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block">Productivity Score</span>
              <div className="p-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline space-x-1 mt-4">
              <h3 className="text-2xl font-black text-slate-900 font-display">94.8%</h3>
              <span className="text-[9px] text-emerald-500 font-bold font-mono">+1.2%</span>
            </div>
            <div className="h-8 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparklineData([90, 92, 91, 93, 92, 95, 94.8])}>
                  <Area type="monotone" dataKey="val" stroke="#10b981" strokeWidth={1.5} fill="rgba(16, 185, 129, 0.05)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Card 5: Open Tasks */}
          <div className="bg-white border border-[#e2e8f0] p-5 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="flex justify-between items-start">
              <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block">Open Tasks</span>
              <div className="p-1 rounded-lg bg-slate-50 text-slate-650 border border-slate-200">
                <CheckSquare className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline space-x-1 mt-4">
              <h3 className="text-2xl font-black text-slate-900 font-display">{tasks.filter(t => t.status !== 'Done').length || 6}</h3>
              <span className="text-[9px] text-red-500 font-bold font-mono">-10%</span>
            </div>
            <div className="h-8 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparklineData([10, 8, 9, 7, 8, 6, tasks.filter(t => t.status !== 'Done').length || 6])}>
                  <Area type="monotone" dataKey="val" stroke="#64748b" strokeWidth={1.5} fill="rgba(100, 116, 139, 0.05)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Card 6: Team Engagement */}
          <div className="bg-white border border-[#e2e8f0] p-5 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="flex justify-between items-start">
              <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block">Team Engagement</span>
              <div className="p-1 rounded-lg bg-pink-50 text-pink-600 border border-pink-100">
                <Heart className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline space-x-1 mt-4">
              <h3 className="text-2xl font-black text-slate-900 font-display">96.2%</h3>
              <span className="text-[9px] text-emerald-500 font-bold font-mono">+2.5%</span>
            </div>
            <div className="h-8 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparklineData([91, 93, 92, 95, 96, 94, 96.2])}>
                  <Area type="monotone" dataKey="val" stroke="#ec4899" strokeWidth={1.5} fill="rgba(236, 72, 153, 0.05)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* 2. Analytics Section (4 Charts Grid) */}
        <div className="grid lg:grid-cols-12 gap-6">
          
          {/* Chart 1: Meeting Frequency */}
          <div className="lg:col-span-6 bg-white border border-[#e2e8f0] p-5 rounded-3xl shadow-sm">
            <h4 className="text-xs font-bold text-slate-950 uppercase tracking-wider mb-4 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span>Meeting Frequency Trend</span>
            </h4>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={getFrequencyData()} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="#0066ff" strokeWidth={2} fill="rgba(0, 102, 255, 0.03)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Team Productivity */}
          <div className="lg:col-span-6 bg-white border border-[#e2e8f0] p-5 rounded-3xl shadow-sm">
            <h4 className="text-xs font-bold text-slate-950 uppercase tracking-wider mb-4 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Team Productivity Index</span>
            </h4>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getProductivityTrends()} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} domain={[85, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2.5} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Action Item Completion */}
          <div className="lg:col-span-6 bg-white border border-[#e2e8f0] p-5 rounded-3xl shadow-sm">
            <h4 className="text-xs font-bold text-slate-950 uppercase tracking-wider mb-4 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span>Action Items Completion Rate</span>
            </h4>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getCompletionData()} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: User Activity Heatmap */}
          <div className="lg:col-span-6 bg-white border border-[#e2e8f0] p-5 rounded-3xl shadow-sm flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-950 uppercase tracking-wider mb-2 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span>User Activity Heatmap</span>
              </h4>
              <p className="text-[10px] text-slate-400 mb-4">Hover over time block cells to view logged task allocations and check-ins.</p>
            </div>

            {/* Heatmap Grid Layout */}
            <div className="flex flex-col space-y-2 select-none relative pb-2">
              {/* Tooltip Overlay */}
              {hoveredCell && (
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2.5 py-1.5 rounded-lg shadow-md z-15 pointer-events-none border border-slate-800">
                  <span className="font-bold">{hoveredCell.day} @ {hoveredCell.hour}</span>: {hoveredCell.count} actions logged
                </div>
              )}

              {/* Header row (Hours) */}
              <div className="flex items-center">
                <div className="w-10 shrink-0" />
                <div className="flex-1 grid grid-cols-5 gap-2 text-center text-[9px] font-bold text-slate-400">
                  {hours.map(h => <span key={h}>{h}</span>)}
                </div>
              </div>

              {/* Rows (Days) */}
              {days.map((day, dayIdx) => (
                <div key={day} className="flex items-center">
                  <span className="w-10 text-[9px] font-bold text-slate-450 text-left">{day}</span>
                  <div className="flex-1 grid grid-cols-5 gap-2">
                    {hours.map((hour, hourIdx) => {
                      const value = getHeatmapValue(dayIdx, hourIdx);
                      return (
                        <div
                          key={hour}
                          onMouseEnter={() => setHoveredCell({ day, hour, count: value * 3 })}
                          onMouseLeave={() => setHoveredCell(null)}
                          className={`h-7 rounded-lg border transition-all cursor-crosshair ${getHeatmapColor(value)} hover:scale-105`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-end space-x-1.5 text-[8px] font-bold text-slate-400 pt-2 border-t border-slate-100">
              <span>Less</span>
              <span className="w-2.5 h-2.5 bg-slate-50 border border-slate-200 rounded" />
              <span className="w-2.5 h-2.5 bg-purple-100 border border-purple-200 rounded" />
              <span className="w-2.5 h-2.5 bg-purple-200 border border-purple-300 rounded" />
              <span className="w-2.5 h-2.5 bg-purple-400 border border-purple-500 rounded" />
              <span className="w-2.5 h-2.5 bg-purple-600 border border-purple-700 rounded" />
              <span>More</span>
            </div>
          </div>

        </div>

        {/* 3. Past AI Summaries List */}
        <div className="grid lg:grid-cols-12 gap-6">
          
          {/* Past Meetings List */}
          <div className="lg:col-span-12 bg-white border border-[#e2e8f0] p-6 rounded-3xl shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <FileText className="w-4 h-4 text-purple-600" />
                  <span>Archived AI Summary Logs</span>
                </h4>
                <span className="text-[10px] text-slate-400 font-bold">{meetings.length} Records</span>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar">
                {meetings.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">No past session logs found.</p>
                ) : (
                  meetings.map(m => (
                    <div
                      key={m._id}
                      onClick={() => setSelectedMeeting(m)}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/50 hover:bg-slate-100/50 hover:border-slate-300/60 cursor-pointer transition-all duration-150"
                    >
                      <div className="flex items-center space-x-3.5 min-w-0 text-left">
                        <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-slate-900 truncate leading-snug">{m.title}</h5>
                          <div className="flex items-center space-x-1.5 mt-0.5 text-[9px] font-semibold text-slate-400">
                            <span className="font-mono text-blue-600 bg-blue-50 px-1 py-0.5 rounded">{m.roomCode}</span>
                            <span>&bull;</span>
                            <span>{new Date(m.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>

        {/* 6. Task Management Panel (Kanban Preview Widget) */}
        <div className="bg-white border border-[#e2e8f0] p-6 rounded-3xl shadow-sm">
          <div className="flex justify-between items-center pb-3 border-b border-slate-150 mb-5">
            <h4 className="text-xs font-bold text-slate-950 uppercase tracking-wider flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              <span>Workspace Kanban Task Board Preview</span>
            </h4>
            <button
              onClick={() => navigate('/tasks')}
              className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
            >
              <span>Go to Kanban board</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Kanban Columns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Column 1: To Do */}
            <div className="bg-[#fafafa] border border-slate-200/60 rounded-2xl p-3 flex flex-col min-h-[160px]">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span>To Do</span>
                </span>
                <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-md text-[9px] font-bold text-slate-500">
                  {tasks.filter(t => t.status === 'Todo').length}
                </span>
              </div>
              <div className="space-y-2 flex-1">
                {tasks.filter(t => t.status === 'Todo').slice(0, 2).map(task => (
                  <div key={task._id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs text-left">
                    <h5 className="font-bold text-slate-900 text-xs truncate">{task.title}</h5>
                    <span className="mt-2 inline-block px-1.5 py-0.5 rounded bg-slate-100 text-[8px] font-bold text-slate-500">
                      {task.priority}
                    </span>
                  </div>
                ))}
                {tasks.filter(t => t.status === 'Todo').length === 0 && (
                  <p className="text-[10px] text-slate-400 py-6 text-center">No tasks pending</p>
                )}
              </div>
            </div>

            {/* Column 2: In Progress */}
            <div className="bg-[#fafafa] border border-slate-200/60 rounded-2xl p-3 flex flex-col min-h-[160px]">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <span>In Progress</span>
                </span>
                <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-md text-[9px] font-bold text-blue-600">
                  {tasks.filter(t => t.status === 'InProgress').length}
                </span>
              </div>
              <div className="space-y-2 flex-1">
                {tasks.filter(t => t.status === 'InProgress').slice(0, 2).map(task => (
                  <div key={task._id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs text-left">
                    <h5 className="font-bold text-slate-900 text-xs truncate">{task.title}</h5>
                    <span className="mt-2 inline-block px-1.5 py-0.5 rounded bg-blue-50 text-[8px] font-bold text-blue-600">
                      {task.priority}
                    </span>
                  </div>
                ))}
                {tasks.filter(t => t.status === 'InProgress').length === 0 && (
                  <p className="text-[10px] text-slate-400 py-6 text-center">No tasks in progress</p>
                )}
              </div>
            </div>

            {/* Column 3: Review */}
            <div className="bg-[#fafafa] border border-slate-200/60 rounded-2xl p-3 flex flex-col min-h-[160px]">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-pink-500" />
                  <span>Review</span>
                </span>
                <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-md text-[9px] font-bold text-pink-600">
                  {tasks.filter(t => t.status as string === 'Review').length}
                </span>
              </div>
              <div className="space-y-2 flex-1">
                {tasks.filter(t => t.status as string === 'Review').slice(0, 2).map(task => (
                  <div key={task._id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs text-left">
                    <h5 className="font-bold text-slate-900 text-xs truncate">{task.title}</h5>
                    <span className="mt-2 inline-block px-1.5 py-0.5 rounded bg-pink-50 text-[8px] font-bold text-pink-600">
                      {task.priority}
                    </span>
                  </div>
                ))}
                {tasks.filter(t => t.status as string === 'Review').length === 0 && (
                  <p className="text-[10px] text-slate-400 py-6 text-center">No tasks in review</p>
                )}
              </div>
            </div>

            {/* Column 4: Done */}
            <div className="bg-[#fafafa] border border-slate-200/60 rounded-2xl p-3 flex flex-col min-h-[160px]">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Done</span>
                </span>
                <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-md text-[9px] font-bold text-emerald-600">
                  {tasks.filter(t => t.status === 'Done').length}
                </span>
              </div>
              <div className="space-y-2 flex-1">
                {tasks.filter(t => t.status === 'Done').slice(0, 2).map(task => (
                  <div key={task._id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs text-left">
                    <h5 className="font-bold text-slate-900 text-xs truncate">{task.title}</h5>
                    <span className="mt-2 inline-block px-1.5 py-0.5 rounded bg-emerald-50 text-[8px] font-bold text-emerald-600">
                      {task.priority}
                    </span>
                  </div>
                ))}
                {tasks.filter(t => t.status === 'Done').length === 0 && (
                  <p className="text-[10px] text-slate-400 py-6 text-center">No tasks completed</p>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Meeting Details Modal */}
      {selectedMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-fade-in">
          {/* Overlay */}
          <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs" onClick={() => setSelectedMeeting(null)} />
          {/* Modal Container */}
          <div className="relative w-full max-w-2xl bg-white border border-[#e2e8f0] rounded-3xl p-6 shadow-2xl z-10 animate-scale-in text-slate-800 max-h-[85vh] overflow-y-auto">
            {/* Close */}
            <button
              onClick={() => setSelectedMeeting(null)}
              className="absolute top-4 right-4 p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-450 hover:text-slate-650 transition-colors cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            {/* Header */}
            <div className="pb-4 border-b border-slate-100 mb-6 text-left">
              <h3 className="text-base font-bold text-slate-900">{selectedMeeting.title}</h3>
              <p className="text-[10px] text-slate-400 mt-1">
                Room: <span className="font-mono text-blue-600">{selectedMeeting.roomCode}</span> &bull; {new Date(selectedMeeting.createdAt).toLocaleString()}
              </p>
            </div>

            {/* Content */}
            <div className="space-y-6 text-left text-xs leading-relaxed">
              {/* Summary */}
              <div className="space-y-2">
                <h4 className="font-bold text-purple-600 flex items-center space-x-2 text-[10px] uppercase tracking-wider">
                  <FileText className="w-4 h-4" />
                  <span>AI Executive Summary</span>
                </h4>
                <p className="text-slate-600 bg-slate-50 border border-slate-150 p-4 rounded-2xl leading-relaxed">
                  {selectedMeeting.summary || 'Summary log could not be loaded.'}
                </p>
              </div>

              {/* Action items */}
              <div className="space-y-2">
                <h4 className="font-bold text-blue-600 flex items-center space-x-2 text-[10px] uppercase tracking-wider">
                  <CheckSquare className="w-4 h-4" />
                  <span>Action Items Captured</span>
                </h4>
                <ul className="space-y-2 bg-slate-50 border border-slate-150 p-4 rounded-2xl">
                  {selectedMeeting.actionItems && selectedMeeting.actionItems.length > 0 ? (
                    selectedMeeting.actionItems.map((item, idx) => (
                      <li key={idx} className="flex items-start space-x-2 text-slate-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))
                  ) : (
                    <p className="text-slate-400">No tasks detected.</p>
                  )}
                </ul>
              </div>

              {/* Transcripts */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 flex items-center space-x-2 text-[10px] uppercase tracking-wider">
                  <MessageSquare className="w-4 h-4" />
                  <span>Transcript Record</span>
                </h4>
                <div className="max-h-48 overflow-y-auto space-y-3 bg-[#f8fafc] border border-slate-200/60 p-4 rounded-2xl">
                  {selectedMeeting.transcript && selectedMeeting.transcript.length > 0 ? (
                    selectedMeeting.transcript.map((entry, idx) => (
                      <div key={idx} className="text-slate-600 text-xs">
                        <span className="font-bold text-blue-600">{entry.sender}:</span>{' '}
                        <span>{entry.text}</span>
                        <span className="text-[9px] text-slate-450 block mt-0.5">
                          {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-450 text-center py-4">No transcripts recorded.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default DashboardPage;
