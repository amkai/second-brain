import { Router } from 'express';
import db from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const { q } = req.query;
  if (!q || String(q).length < 2) return res.status(400).json({ error: 'Search query must be at least 2 characters' });

  const searchTerm = `%${q}%`;

  const notes = db.prepare(`
    SELECT id, title, substr(content, 1, 100) as preview, updated_at as date, 'note' as type
    FROM notes WHERE user_id = ? AND (title LIKE ? OR content LIKE ?)
    ORDER BY updated_at DESC LIMIT 10
  `).all(req.userId, searchTerm, searchTerm);

  const ideas = db.prepare(`
    SELECT id, title, substr(content, 1, 100) as preview, created_at as date, 'idea' as type
    FROM ideas WHERE user_id = ? AND (title LIKE ? OR content LIKE ?)
    ORDER BY created_at DESC LIMIT 10
  `).all(req.userId, searchTerm, searchTerm);

  const expenses = db.prepare(`
    SELECT e.id, e.notes as title, e.amount || ' (' || c.name || ')' as preview, e.date, 'expense' as type
    FROM expenses e JOIN categories c ON e.category_id = c.id
    WHERE e.user_id = ? AND (e.notes LIKE ? OR c.name LIKE ?)
    ORDER BY e.date DESC LIMIT 10
  `).all(req.userId, searchTerm, searchTerm);

  const reminders = db.prepare(`
    SELECT id, title, description as preview, datetime as date, 'reminder' as type
    FROM reminders WHERE user_id = ? AND (title LIKE ? OR description LIKE ?)
    ORDER BY datetime ASC LIMIT 10
  `).all(req.userId, searchTerm, searchTerm);

  const habits = db.prepare(`
    SELECT id, name as title, description as preview, created_at as date, 'habit' as type
    FROM habits WHERE user_id = ? AND (name LIKE ? OR description LIKE ?)
    ORDER BY created_at DESC LIMIT 10
  `).all(req.userId, searchTerm, searchTerm);

  const goals = db.prepare(`
    SELECT id, title, description as preview, deadline as date, 'goal' as type
    FROM goals WHERE user_id = ? AND (title LIKE ? OR description LIKE ?)
    ORDER BY deadline ASC LIMIT 10
  `).all(req.userId, searchTerm, searchTerm);

  const results = [...notes, ...ideas, ...expenses, ...reminders, ...habits, ...goals]
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 20);

  res.json(results);
});

export default router;
