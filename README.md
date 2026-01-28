# Pitstop Crew

A project timeline visualization application with Gantt chart display, user authentication, and team management.

## Project Structure

```
pitstop-crew/
├── client/     # React frontend (Vite + TypeScript)
└── server/     # Express.js backend (TypeScript + PostgreSQL)
```

The client and server are **independent projects** that can be deployed separately.

---

## Client (Frontend)

React application with Tailwind CSS and shadcn/ui components.

### Setup

```bash
cd client
npm install
```

### Configuration

Create a `.env` file (or copy from `.env.example`):

```env
VITE_API_URL=http://localhost:3001/api
```

### Run

```bash
npm run dev      # Development server at http://localhost:5173
npm run build    # Production build
npm run preview  # Preview production build
```

---

## Server (Backend)

Express.js API with PostgreSQL database and JWT authentication.

### Setup

```bash
cd server
npm install
```

### Configuration

Create a `.env` file (or copy from `.env.example`):

```env
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173

DB_HOST=localhost
DB_PORT=5432
DB_NAME=pitstop_crew
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
```

### Database Setup

```bash
# Create PostgreSQL database
createdb pitstop_crew

# Initialize schema
npm run db:init
```

### Run

```bash
npm run dev      # Development server at http://localhost:3001
npm run build    # Compile TypeScript
npm start        # Run production build
```

---

## API Endpoints

| Method | Endpoint            | Description         | Auth Required |
|--------|---------------------|---------------------|---------------|
| POST   | /api/auth/register  | Register new user   | No            |
| POST   | /api/auth/login     | Login user          | No            |
| GET    | /api/auth/verify    | Verify JWT token    | Yes           |
| GET    | /api/auth/me        | Get current user    | Yes           |
| GET    | /api/health         | Health check        | No            |

---

## Tech Stack

**Frontend:**
- React 19
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Router

**Backend:**
- Express.js
- TypeScript
- PostgreSQL
- JWT Authentication
- Zod validation
