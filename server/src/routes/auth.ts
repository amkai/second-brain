import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/schema.js';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const id = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);

    db.prepare('INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)').run(id, username, passwordHash);

    const defaultCategories = [
      { name: 'Food & Dining', icon: '🍔', color: '#ef4444' },
      { name: 'Transportation', icon: '🚗', color: '#f97316' },
      { name: 'Bills & Utilities', icon: '📱', color: '#eab308' },
      { name: 'Entertainment', icon: '🎬', color: '#a855f7' },
      { name: 'Shopping', icon: '🛍️', color: '#ec4899' },
      { name: 'Health', icon: '💊', color: '#22c55e' },
      { name: 'Education', icon: '📚', color: '#3b82f6' },
      { name: 'Other', icon: '📦', color: '#6b7280' }
    ];

    const insertCategory = db.prepare('INSERT INTO categories (id, name, icon, color, user_id) VALUES (?, ?, ?, ?, ?)');
    for (const cat of defaultCategories) {
      insertCategory.run(uuidv4(), cat.name, cat.icon, cat.color, id);
    }

    req.session.userId = id;

    res.json({ user: { id, username } });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = db.prepare('SELECT id, password_hash FROM users WHERE username = ?').get(username) as any;
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.userId = user.id;

    res.json({ user: { id: user.id, username } });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out' });
  });
});

router.get('/me', (req, res) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = db.prepare('SELECT id, username, created_at FROM users WHERE id = ?').get(req.session.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ user });
});

export default router;
