# TaskFlow — Collaborative Task Management Platform

> A full-stack task management app with Google OAuth, real-time collaboration, and email notifications.

**Live Demo:** `https://taskflow-frontend.vercel.app` *(replace after deployment)*  
**API:** `https://taskflow-api.railway.app` *(replace after deployment)*

---

## Table of Contents
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [Project Structure](#project-structure)

---

## Features

- **Google OAuth 2.0** — Sign in with your Gmail account
- **Task Management** — Create, read, update, delete tasks
- **Task Assignment** — Assign tasks to any registered user
- **Email Notifications** — Gmail-powered notifications for:
  - Task assigned to you
  - Task completed (creator & assignee notified)
- **Kanban Board** — Visual board view with 3 columns (To Do / In Progress / Done)
- **List View** — Compact sortable table view
- **Priority Levels** — Low / Medium / High
- **Due Dates** — Set and track deadlines
- **Filtering** — Filter by status and priority

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT BROWSER                          │
│                                                                 │
│   ┌─────────────────────────────────────────────────────┐       │
│   │           Next.js 14 + TypeScript (Vercel)          │       │
│   │                                                     │       │
│   │  • Google OAuth (implicit flow via @react-oauth)    │       │
│   │  • Zustand state management                         │       │
│   │  • Axios API client with JWT interceptor            │       │
│   │  • Tailwind CSS + custom design system              │       │
│   └──────────────────────┬──────────────────────────────┘       │
└──────────────────────────│──────────────────────────────────────┘
                           │ HTTPS (REST API)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                Flask Backend (Railway / Render)                  │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Auth Routes │  │ Task Routes  │  │   Users Routes       │  │
│  │              │  │              │  │                      │  │
│  │ POST /google │  │ GET    /     │  │ GET /                │  │
│  │ GET  /me     │  │ POST   /     │  │ GET /:id             │  │
│  └──────┬───────┘  │ PATCH  /:id  │  └──────────────────────┘  │
│         │          │ DELETE /:id  │                             │
│         │          └──────┬───────┘                             │
│         │                 │                                     │
│  ┌──────▼─────────────────▼───────────────────────────────┐    │
│  │                    Services Layer                        │    │
│  │                                                         │    │
│  │  • Supabase Client (DB queries)                         │    │
│  │  • Email Service (Gmail SMTP)                           │    │
│  │  • JWT Auth Middleware                                  │    │
│  └──────────────────────┬──────────────────────────────────┘    │
└─────────────────────────│───────────────────────────────────────┘
                          │
            ┌─────────────┴────────────┐
            │                          │
            ▼                          ▼
┌────────────────────┐    ┌────────────────────────┐
│   Supabase (DB)    │    │   Gmail SMTP Server     │
│                    │    │                         │
│  • users table     │    │  • Task created alerts  │
│  • tasks table     │    │  • Task completed alerts│
│  • Row Level Sec.  │    │                         │
└────────────────────┘    └────────────────────────┘
```

### Authentication Flow

```
User → Click "Sign in with Google"
     → Google OAuth popup (implicit flow)
     → Receive access_token from Google
     → POST /api/auth/google-access { access_token }
     → Backend verifies token via Google userinfo API
     → Backend upserts user in Supabase
     → Backend returns JWT
     → Frontend stores JWT in localStorage
     → All subsequent requests use Bearer JWT
```

### Email Notification Flow

```
Task Created with assignee → Backend detects assignee != creator
                           → Fetch assignee email from Supabase
                           → Send HTML email via Gmail SMTP

Task Marked Done → Backend detects status change to "done"
                 → Notify creator (if != completer)
                 → Notify assignee (if != completer and != creator)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| State Management | Zustand |
| Backend | Flask (Python 3.11+) |
| Database | Supabase (PostgreSQL) |
| Authentication | Google OAuth 2.0 + JWT |
| Email | Gmail SMTP |
| Deployment (Frontend) | Vercel |
| Deployment (Backend) | Railway or Render |

---

## Local Development

### Prerequisites
- Node.js 18+
- Python 3.11+
- A Supabase project
- A Google Cloud project with OAuth 2.0 credentials
- A Gmail account with App Password enabled

### 1. Clone the repository
```bash
git clone https://github.com/your-username/taskflow.git
cd taskflow
```

### 2. Database Setup (Supabase)
1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor
3. Run the migration: `migrations/001_initial_schema.sql`

### 3. Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project → APIs & Services → Credentials
3. Create OAuth 2.0 Client ID (Web application)
4. Add authorized origins: `http://localhost:3000`, `https://your-vercel-domain.vercel.app`
5. Add redirect URIs (same as origins)

### 4. Gmail App Password Setup
1. Enable 2FA on your Google account
2. Go to Google Account → Security → App Passwords
3. Create an app password for "Mail"
4. Use this 16-character password as `GMAIL_APP_PASSWORD`

### 5. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Fill in your .env values
python app.py
```

Backend runs at: `http://localhost:5000`

### 6. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local
# Fill in your .env.local values
npm run dev
```

Frontend runs at: `http://localhost:3000`

---

## Environment Variables

### Backend (`backend/.env`)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

GOOGLE_CLIENT_ID=123456789-xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx

GMAIL_USER=yourapp@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx

SECRET_KEY=your-flask-secret-key-min-32-chars
JWT_SECRET=your-jwt-secret-key-min-32-chars
JWT_EXPIRY_HOURS=24

FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789-xxx.apps.googleusercontent.com
```

---

## Database Schema

### `users`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique user identifier |
| google_id | TEXT (UNIQUE) | Google OAuth sub claim |
| email | TEXT (UNIQUE) | User's email address |
| name | TEXT | Display name from Google |
| avatar_url | TEXT | Profile picture URL |
| last_login | TIMESTAMPTZ | Last sign-in time |
| created_at | TIMESTAMPTZ | Account creation time |

### `tasks`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique task identifier |
| title | TEXT | Task title |
| description | TEXT | Optional task details |
| priority | TEXT | `low` / `medium` / `high` |
| status | TEXT | `todo` / `in_progress` / `done` |
| creator_id | UUID (FK) | User who created the task |
| assignee_id | UUID (FK, nullable) | User assigned to the task |
| due_date | DATE | Optional deadline |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last modification timestamp |

---

## API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/google-access` | Login with Google access token |
| POST | `/api/auth/google` | Login with Google ID token |
| GET | `/api/auth/me` | Get current user |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks/` | Get all tasks for current user |
| POST | `/api/tasks/` | Create new task |
| GET | `/api/tasks/:id` | Get task by ID |
| PATCH | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task (creator only) |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/` | List all users (for assignment) |
| GET | `/api/users/:id` | Get user by ID |

---

## Deployment

### Deploy Backend to Railway

1. Create account at [railway.app](https://railway.app)
2. New Project → Deploy from GitHub Repo → Select `backend/` folder
3. Add all environment variables from `backend/.env.example`
4. Set Start Command: `gunicorn app:create_app() --bind 0.0.0.0:$PORT`
5. Note your Railway URL (e.g., `https://taskflow-api.railway.app`)

### Deploy Frontend to Vercel

1. Create account at [vercel.com](https://vercel.com)
2. New Project → Import GitHub Repo → Set root directory to `frontend/`
3. Add environment variables:
   - `NEXT_PUBLIC_API_URL` = your Railway URL
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` = your Google Client ID
4. Deploy!

### Update Google OAuth

After deployment, add your production URLs to Google Cloud Console:
- Authorized JavaScript origins: `https://your-app.vercel.app`
- Update `ALLOWED_ORIGINS` in Railway: `https://your-app.vercel.app`
- Update `FRONTEND_URL` in Railway: `https://your-app.vercel.app`

---

## Project Structure

```
taskflow/
├── README.md
├── migrations/
│   └── 001_initial_schema.sql       # Supabase DB setup
│
├── backend/                          # Flask API
│   ├── app.py                        # App factory
│   ├── config.py                     # Configuration
│   ├── requirements.txt
│   ├── Procfile                      # Railway/Render start command
│   ├── .env.example
│   ├── routes/
│   │   ├── auth.py                   # Google OAuth + JWT
│   │   ├── tasks.py                  # Task CRUD + notifications
│   │   └── users.py                  # User listing
│   ├── services/
│   │   ├── supabase_client.py        # DB client
│   │   └── email_service.py          # Gmail SMTP
│   └── utils/
│       └── auth.py                   # JWT helpers + middleware
│
└── frontend/                         # Next.js app
    ├── package.json
    ├── next.config.js
    ├── tailwind.config.js
    ├── .env.example
    └── src/
        ├── app/
        │   ├── layout.tsx            # Root layout + providers
        │   ├── globals.css           # Design system
        │   ├── page.tsx              # Auth redirect
        │   ├── login/page.tsx        # Google OAuth login
        │   └── dashboard/page.tsx    # Main task dashboard
        ├── components/
        │   ├── TaskCard.tsx          # Kanban card
        │   ├── CreateTaskModal.tsx   # New task form
        │   └── TaskDetailModal.tsx   # Edit/view task
        ├── lib/
        │   ├── api.ts                # Axios client
        │   └── store.ts              # Zustand auth store
        └── types/
            └── index.ts              # TypeScript types
```

---

## Git Commit Guidelines

This project follows conventional commits:
- `feat:` — New feature
- `fix:` — Bug fix
- `chore:` — Maintenance
- `docs:` — Documentation

---

## License

MIT © TaskFlow
