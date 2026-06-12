# IntellMeet: AI-Powered Enterprise Meeting & Collaboration Platform

IntellMeet is an industry-grade, feature-rich meeting and project workspace platform. It combines real-time P2P WebRTC audio/video sync, Socket.io collaboration events, automated AI summarization, sentiment scores tracking, and a Kanban task dashboard.

---

## 🚀 Tech Stack & Core Architecture

### Frontend
- **Framework**: React 19, Vite, TypeScript
- **Styling**: Tailwind CSS v4 (CSS-first variables, @theme tokens, modern animations)
- **Icons & Transitions**: Lucide React, CSS keyframes
- **State & Querying**: React Context API, Axios (configured with automated 401 token refresh interceptors)
- **Real-Time Sockets**: Socket.io-client
- **Meeting Analytics**: Recharts (Area charts for meeting frequencies, Pie charts for workspace sentiment metrics)

### Backend
- **Framework**: Node.js, Express, TypeScript (run via hot-reloader `tsx watch`)
- **Database**: MongoDB (via Mongoose)
- **Real-Time Signaling**: Socket.io (coordinates rooms, user catalogs, WebRTC mesh handshakes, collaboration alerts)
- **Security**: Dual-token JWT (15-minute Access Token, 7-day Refresh Token stored in HttpOnly cookies), bcryptjs
- **Validation**: Zod schema request validation middleware
- **Mail Server fallback**: NodeMailer (automatically prints verification and password resets links directly inside the console terminal if SMTP is unconfigured)

---

## 🛠️ Out-of-the-Box Development Fallbacks
To ensure IntellMeet runs seamlessly immediately after installation, the backend includes **automatic fallback states**:
1. **Database Fallback**: If local MongoDB is not running or connection fails, the platform switches to a filesystem-based store (`server/src/config/mock-db-store.json`). User accounts, meetings, and Kanban card changes persist across server hot-reloads!
2. **AI Summarization Fallback**: If `OPENAI_API_KEY` is missing in `.env`, the server triggers a local Natural Language Processing (NLP) mock parser. It scans transcript logs for keywords (e.g., `todo`, `need to`, `will do`) to generate summaries, action items, and sentiment scores.
3. **SMTP Mail Fallback**: If SMTP settings are unconfigured, registration verification links and password recovery tokens print in a prominent terminal log frame.
4. **Camera/WebRTC Fallback**: If camera hardware is not connected or permission is denied, the client generates an animated soundwave stream on an HTML5 Canvas to populate video tags.

---

## 📂 Project Directory Structure

```
d:/coding/zidio/
├── package.json               # Root Workspace Concurrently Executor
├── client/                    # React 19 Frontend Project
│   ├── package.json
│   ├── vite.config.ts         # Injected with Tailwind CSS v4 compiler plugin
│   └── src/
│       ├── app/               # Router config & Store Contexts
│       ├── components/        # Layout shells & reusable Loader / SEOHead
│       ├── features/          # Auth Context triggers & form models
│       ├── pages/             # Landing, Login, Dashboard, Tasks Board, Meeting Room
│       └── services/          # Axios HTTP Interceptors
└── server/                    # Node Express Backend
    ├── package.json
    ├── .env                   # Environment configurations
    └── src/
        ├── app.ts             # Express Routing & middleware mappings
        ├── server.ts          # Server bootstrap & HTTP Sockets attachment
        ├── config/            # Mongoose DB connector with failover checkers
        ├── controllers/       # Auth, Meetings, Kanban Tasks API handlers
        ├── repositories/      # Mongoose and Mock JSON DB routing wrappers
        ├── services/          # Token, nodemailer mailer, and AI summarizers
        └── sockets/           # Sockets signaling relays and AI conversation loops
```

---

## 🏁 Quick Start & Installation

### 1. Prerequisite Installations
- Ensure [Node.js (v18+)](https://nodejs.org) is installed on your system.
- (Optional) A local [MongoDB](https://www.mongodb.com/try/download/community) server running on `mongodb://localhost:27017`. If MongoDB is not running, the application will use the JSON fallback database automatically.

### 2. Install Dependencies
Run the install command in the root workspace folder:
```bash
npm run install:all
```
This command installs root scripts, client-side packages (React 19, Recharts, Framer Motion), and server-side configurations.

### 3. Run Development Environments
Run both client and server concurrently with one command:
```bash
npm run dev
```
- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)

---

## 🔌 API Endpoints Documentation

### Authentication (`/api/auth`)
- `POST /signup` - Register a new user profile with selected robot avatar seed.
- `GET /verify?token=<token>` - Callback to verify registration and activate user.
- `POST /login` - Sign in. Sets access token and refresh cookies.
- `POST /refresh` - Generates new access and refresh credentials.
- `POST /forgot-password` - Sends password reset link.
- `POST /reset-password` - Updates user password.
- `POST /logout` - Clears refresh tokens and wipes cookie state.
- `GET /profile` - Fetches authenticated user account details.
- `GET /users` - Lists registered workspace developers.
- `GET /notifications` - Fetches logged alerts.
- `PUT /notifications` - Marks all user notifications read.
- `PUT /notifications/:id` - Marks single alert read.

### Meetings (`/api/meetings`)
- `POST /` - Host/Create room. Generates room code `xxx-xxxx-xxx`.
- `POST /join` - Join an active meeting room by room code.
- `GET /user` - Lists past meeting histories and summary metrics.
- `GET/:roomCode` - Fetches active room details.
- `POST /:roomCode/attachment` - Uploads file (saved locally to `server/uploads/`).
- `POST /:roomCode/summarize` - Ends meeting, parses transcripts, and triggers AI analysis.

### Kanban Tasks (`/api/tasks`)
- `GET /` - Fetches workspace tasks.
- `POST /` - Creates task card, and alerts assignees via websocket.
- `PUT /:id` - Updates task card fields or status column (Todo, InProgress, Done).
- `DELETE /:id` - Deletes task card.

---

## 🧪 Real-time Sockets & WebRTC Protocols

### Relays Managed via Sockets:
1. `join-room`: Attaches socket instance metadata and joins room channels. Emits `room-participants` lists to peers.
2. `webrtc-signal`: Relays ICE candidates, offers, and answers between clients directly.
3. `send-message`: Emits live room chat messages.
4. `raise-hand`: Emits user hand-raising states.
5. `start-ai-bot`: Triggers the background chatbot dialogue simulation.
6. `task-assigned`: Pushes database alerts to online developers immediately.
