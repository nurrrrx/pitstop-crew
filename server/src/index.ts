import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth.js';
import { projectRouter } from './routes/projects.js';
import { timeRouter } from './routes/time.js';
import { userRouter } from './routes/users.js';
import { crewRouter } from './routes/crew.js';
import { adhocRouter } from './routes/adhoc.js';
import { favoritesRouter } from './routes/favorites.js';
import { statsRouter } from './routes/stats.js';
import { adminRouter } from './routes/admin.js';
import { budgetRouter } from './routes/budget.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'https://pitstop-crew.vercel.app',
  'https://pitstopcrew.net',
  'https://www.pitstopcrew.net',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/projects', projectRouter);
app.use('/api/time', timeRouter);
app.use('/api/users', userRouter);
app.use('/api/crew', crewRouter);
app.use('/api/adhoc', adhocRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/stats', statsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/budget', budgetRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
