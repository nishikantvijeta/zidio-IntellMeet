# IntellMeet — Final Project Report

**Project**: IntellMeet: AI-Powered Enterprise Meeting & Collaboration Platform  
**Internship**: Zidio Development  
**Date**: June 2026

---

## 📋 Executive Summary

IntellMeet is a full-stack, production-grade enterprise meeting and collaboration platform. It combines real-time peer-to-peer WebRTC audio/video communication, Socket.io event-driven collaboration, AI-powered meeting summarization (via Google Gemini / OpenAI), and a Kanban task management dashboard — all built from scratch without relying on third-party meeting SDKs.

---

## 🏗️ What We Built

### Core Features Delivered

| Feature | Description | Tech Used |
|---------|-------------|-----------|
| **WebRTC Video Meetings** | Peer-to-peer mesh video/audio conferencing with ICE candidate relay | WebRTC, Socket.io signaling |
| **Real-time Chat** | Live in-meeting chat with emoji reactions and hand-raise indicators | Socket.io rooms |
| **AI Meeting Summarization** | End-of-meeting transcript analysis producing summaries, action items, and sentiment scores | Google Gemini API (with local NLP fallback) |
| **Kanban Task Board** | Drag-and-drop task management (Todo → In Progress → Done) with real-time assignment notifications | React state + Socket push alerts |
| **Authentication System** | Full auth flow: signup, email verification, login, password reset, dual-token JWT refresh | bcryptjs, JWT (Access + Refresh tokens), HttpOnly cookies |
| **Meeting Analytics Dashboard** | Visual charts showing meeting frequency trends and workspace sentiment breakdowns | Recharts (Area + Pie charts) |
| **Screen Sharing** | Native screen capture and broadcast to all room participants | `getDisplayMedia` API + WebRTC |
| **AI Bot Simulation** | Simulated multi-speaker dialogue for demo/testing without real participants | Socket.io interval broadcast |
| **Camera Fallback** | Animated soundwave canvas when camera hardware is unavailable | HTML5 Canvas API |

### Architecture Highlights

- **Database Failover**: Automatically switches from MongoDB Atlas to an in-memory JSON file store if the database is unreachable — zero configuration needed to run locally
- **AI Failover**: If no API key is configured, a local NLP heuristic parser scans transcripts for keywords to generate summaries and sentiment scores
- **SMTP Failover**: If mail server is unconfigured, verification/reset links print directly to the terminal
- **Dual-Token Auth**: 15-minute access tokens with 7-day refresh tokens stored in HttpOnly cookies, with automatic silent refresh via Axios interceptors

---

## 🛠️ Tech Stack

### Frontend
- React 19 with TypeScript
- Vite 8 (build tooling)
- Tailwind CSS v4 (CSS-first configuration)
- Framer Motion (animations)
- Lucide React (icon system)
- Recharts (data visualization)
- Socket.io Client (real-time communication)
- Axios (HTTP client with interceptor-based token refresh)

### Backend
- Node.js with Express and TypeScript
- MongoDB via Mongoose (with JSON file fallback)
- Socket.io (WebRTC signaling + collaboration events)
- JWT (dual-token authentication)
- Zod (request validation schemas)
- Nodemailer (transactional emails)
- Google Gemini API (AI summarization)

---

## 📂 Project Structure

```
intellmeet/
├── package.json                    # Root monorepo runner (concurrently)
├── client/                         # React 19 Frontend
│   ├── src/
│   │   ├── app/                    # Router, Contexts (Socket, Theme, Auth)
│   │   ├── components/             # Reusable UI (Loader, SEOHead, Layout)
│   │   ├── features/auth/          # AuthContext with token lifecycle
│   │   ├── pages/                  # 9 full pages (Landing → Meeting Room)
│   │   ├── services/               # Axios HTTP interceptors
│   │   └── types/                  # TypeScript interfaces
│   └── vite.config.ts              # Vite + Tailwind CSS v4
├── server/                         # Node Express Backend
│   ├── src/
│   │   ├── config/                 # MongoDB connector with failover
│   │   ├── controllers/            # Auth, Meetings, Tasks, AI handlers
│   │   ├── middleware/              # JWT guard, Zod validation
│   │   ├── models/                 # Mongoose schemas (User, Meeting, Task, Notification)
│   │   ├── repositories/           # Data access layer (Mongoose + Mock JSON routing)
│   │   ├── services/               # Token, Mail, AI summarization services
│   │   ├── sockets/                # WebRTC signaling + collaboration relays
│   │   └── validators/             # Zod request schemas
│   └── .env                        # Environment configuration
└── FINAL_REPORT.md                 # This file
```

---

## 🧪 How to Run Locally

### Prerequisites
- Node.js v18+
- (Optional) MongoDB running locally or Atlas connection

### Installation
```bash
# Install all dependencies (root, client, server)
npm run install:all
```

### Start Development
```bash
# Runs both frontend and backend concurrently
npm run dev
```
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

### Build for Production
```bash
npm run build
```

> **Note**: If MongoDB is not available, the app automatically uses an in-memory JSON store. All features work identically — data simply won't persist across server restarts.

---

## 🔌 API Documentation

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/signup` | Register with robot avatar selection |
| GET | `/verify?token=<token>` | Email verification callback |
| POST | `/login` | Sign in, sets JWT access + refresh cookies |
| POST | `/refresh` | Silent token refresh |
| POST | `/forgot-password` | Send password reset link |
| POST | `/reset-password` | Update password with reset token |
| POST | `/logout` | Clear tokens and cookies |
| GET | `/profile` | Get authenticated user details |
| GET | `/users` | List workspace members |
| GET | `/notifications` | Fetch user notifications |
| PUT | `/notifications` | Mark all notifications read |
| PUT | `/notifications/:id` | Mark single notification read |

### Meetings (`/api/meetings`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create meeting room (generates `xxx-xxxx-xxx` code) |
| POST | `/join` | Join active room by code |
| GET | `/user` | List past meetings with analytics |
| GET | `/:roomCode` | Get active room details |
| POST | `/:roomCode/attachment` | Upload file to meeting |
| POST | `/:roomCode/summarize` | End meeting & trigger AI analysis |

### Tasks (`/api/tasks`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Fetch workspace tasks |
| POST | `/` | Create task card (notifies assignees via WebSocket) |
| PUT | `/:id` | Update task fields/status |
| DELETE | `/:id` | Delete task card |

### WebSocket Events
| Event | Direction | Purpose |
|-------|-----------|---------|
| `join-room` | Client → Server | Join meeting room channel |
| `webrtc-signal` | Bidirectional | ICE candidates, offers, answers |
| `send-message` | Client → Server | Live chat messages |
| `raise-hand` | Client → Server | Hand raise state sync |
| `start-ai-bot` | Client → Server | Trigger AI dialogue simulation |
| `task-assigned` | Server → Client | Real-time task assignment alert |

---

## 🧠 What I Learned

### Technical Skills
1. **WebRTC Mesh Architecture**: Implemented peer-to-peer video calling from scratch, handling ICE candidate exchange, SDP offers/answers, and multi-participant mesh topology through Socket.io signaling
2. **Dual-Token JWT Security**: Built a production-grade auth system with short-lived access tokens, long-lived refresh tokens in HttpOnly cookies, and automatic silent refresh via Axios interceptors
3. **AI API Integration**: Integrated Google Gemini API for meeting summarization with structured JSON output, and built a complete local NLP fallback using regex-based keyword extraction
4. **Real-time Event Architecture**: Designed Socket.io event flows for participant tracking, chat relay, hand raising, screen share state sync, and cross-user notification dispatch
5. **Graceful Degradation Patterns**: Engineered automatic fallbacks for database, AI, SMTP, and camera hardware — ensuring the app runs anywhere without configuration

### Architecture & Design Decisions
1. **Repository Pattern**: Separated data access from business logic, allowing seamless switching between Mongoose and in-memory JSON stores
2. **Monorepo Structure**: Used `concurrently` to run frontend and backend from a single root command, simplifying development workflow
3. **Zod Validation Middleware**: Built type-safe request validation that provides clear error messages to the client
4. **Context-Based State Management**: Used React Context API strategically for auth state and socket connections, avoiding unnecessary Redux complexity

### Challenges Overcome
1. **Cross-browser WebRTC compatibility** — Handled varying browser behaviors for `getUserMedia` and `getDisplayMedia`
2. **Token refresh race conditions** — Implemented a request queue to prevent multiple simultaneous refresh calls
3. **Socket reconnection handling** — Managed socket lifecycle across page navigations and auth state changes
4. **MongoDB connection resilience** — Built transparent failover that doesn't require any code changes in controllers

---

## 📊 Build Metrics

| Metric | Value |
|--------|-------|
| **Frontend Bundle** | 809 KB (225 KB gzipped) |
| **Frontend CSS** | 58 KB (10.6 KB gzipped) |
| **Server Build** | TypeScript compiles with zero errors |
| **Client Build** | Vite builds in ~2 seconds |
| **Total Source Files** | 40+ TypeScript/TSX files |
| **API Endpoints** | 16 REST endpoints + 10 WebSocket events |

---

## 🔮 Future Enhancements (Roadmap)
- [ ] End-to-end encryption for meeting streams
- [ ] Recording & playback of meetings
- [ ] Calendar integration (Google Calendar / Outlook)
- [ ] Mobile-responsive meeting room UI
- [ ] Role-based access control (Admin/Member/Viewer)
- [ ] Meeting scheduling with reminders
- [ ] File sharing with Cloudinary CDN (partially implemented)

---

*Built with ❤️ during Zidio Development Internship — June 2026*
