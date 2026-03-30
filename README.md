# Video Streaming Platform

A full-stack web application for video uploading, sensitivity analysis, and streaming.

## Live Demo

**Frontend:** [https://video-streaming-app-alpha-amber.vercel.app](https://video-streaming-app-alpha-amber.vercel.app)

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@videostream.com` | `Admin123!` |
| **Editor** | `test@test.com` | `test@test.com` |
| **Viewer** | `test1@test1.com` | `test1@test1.com` |

> **Admin** — Full access: user management, video management, upload, streaming  
> **Editor** — Can upload and manage own videos, stream  
> **Viewer** — Can only watch videos

## Technologies

### Backend
- **Node.js** + **Express.js** — REST API
- **MongoDB** + **Mongoose** — Database
- **Socket.io** — Real-time notifications
- **JWT** — Authentication (access + refresh token)
- **Multer** — File upload
- **bcryptjs** — Password hashing

### Frontend
- **React 18** + **Vite** — UI framework
- **Tailwind CSS** — Styling
- **React Router v6** — Routing
- **Axios** — HTTP requests
- **Socket.io Client** — Real-time connection
- **Context API** — State management

## Features

- User registration and login system (JWT-based)
- Role-based access control (viewer, editor, admin)
- Video upload (drag & drop, max 100MB)
- Simulated sensitivity analysis (real-time progress via Socket.io)
- Video streaming with HTTP Range Requests
- Video library with search, filtering and pagination
- Admin panel (user management, video management)
- Responsive design

## Setup

### Requirements
- Node.js v18+
- MongoDB (local or Atlas)

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env file (MongoDB URI, JWT secret, etc.)
npm install
npm run dev
```

Backend runs on `http://localhost:5000` by default.

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` by default.

### Environment Variables

#### Backend (.env)
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/video-streaming
JWT_SECRET=your-secret-key
JWT_EXPIRE=15m
REFRESH_SECRET=your-refresh-secret
REFRESH_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
MAX_FILE_SIZE=104857600
NODE_ENV=development
```

#### Frontend (.env)
```
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Token refresh |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Current user info |

### Videos
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/videos/upload` | Upload video (editor/admin) |
| GET | `/api/videos` | List user's videos |
| GET | `/api/videos/all` | List all videos (admin) |
| GET | `/api/videos/:id` | Video details |
| PUT | `/api/videos/:id` | Update video |
| DELETE | `/api/videos/:id` | Delete video |
| GET | `/api/videos/stream/:id` | Stream video |

### Users (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users |
| GET | `/api/users/:id` | User details |
| PUT | `/api/users/:id/role` | Update user role |
| DELETE | `/api/users/:id` | Delete user |

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/         # Database, multer, env settings
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/      # Auth, role check, error handling
│   │   ├── models/          # Mongoose models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic (token, video processing)
│   │   ├── socket/          # Socket.io configuration
│   │   ├── utils/           # Helper functions
│   │   └── server.js        # Main entry point
│   └── uploads/videos/      # Uploaded video files
├── frontend/
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── context/         # Auth and Socket context
│   │   ├── hooks/           # Custom hooks
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── App.jsx          # Main app + routing
│   │   └── main.jsx         # Entry point
│   └── public/
└── README.md
```

## Deployment

### Frontend — Vercel
1. Connect your GitHub repo to Vercel
2. Root directory: `frontend`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add environment variables (`VITE_API_URL`, `VITE_SOCKET_URL`)

### Backend — Render
1. Create a new Web Service on Render
2. Root directory: `backend`
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variables

### Database — MongoDB Atlas
1. Create a free M0 cluster
2. Add the connection string to backend `.env`

## License

MIT
