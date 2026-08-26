import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase } from './db/schema.js';
import authRoutes from './routes/auth.js';
import expenseRoutes from './routes/expenses.js';
import ideaRoutes from './routes/ideas.js';
import reminderRoutes from './routes/reminders.js';
import noteRoutes from './routes/notes.js';
import habitRoutes from './routes/habits.js';
import goalRoutes from './routes/goals.js';
import tagRoutes from './routes/tags.js';
import dashboardRoutes from './routes/dashboard.js';
import calendarRoutes from './routes/calendar.js';
import searchRoutes from './routes/search.js';
import categoryRoutes from './routes/categories.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'second-brain-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.COOKIE_SECURE === 'true',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/ideas', ideaRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/categories', categoryRoutes);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const staticCandidates = [
  process.env.STATIC_DIR,
  path.join(__dirname, '../../public'),
  path.join(__dirname, '../../client/dist'),
].filter((d): d is string => !!d);
const publicDir = staticCandidates.find((d) => fs.existsSync(path.join(d, 'index.html')));

if (publicDir) {
  app.use(express.static(publicDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(publicDir, 'index.html'));
  });
  console.log(`Serving client from ${publicDir}`);
}

async function start() {
  await initializeDatabase();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();

export default app;
