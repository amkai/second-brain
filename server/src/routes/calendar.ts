import { Router } from 'express';
import db from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const { start_date, end_date } = req.query;
  if (!start_date || !end_date) return res.status(400).json({ error: 'Date range required' });

  const expenses = db.prepare(`
    SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color, 'expense' as type
    FROM expenses e
    JOIN categories c ON e.category_id = c.id
    WHERE e.user_id = ? AND e.date BETWEEN ? AND ?
  `).all(req.userId, start_date, end_date);

  const reminders = db.prepare(`
    SELECT *, 'reminder' as type FROM reminders
    WHERE user_id = ? AND date(datetime) BETWEEN ? AND ?
  `).all(req.userId, start_date, end_date);

  const habitLogs = db.prepare(`
    SELECT hl.*, h.name as habit_name, h.color as habit_color, 'habit' as type
    FROM habit_logs hl
    JOIN habits h ON hl.habit_id = h.id
    WHERE hl.user_id = ? AND hl.date BETWEEN ? AND ?
  `).all(req.userId, start_date, end_date);

  const events = [...expenses, ...reminders, ...habitLogs].sort((a: any, b: any) => {
    const dateA = a.date || a.datetime;
    const dateB = b.date || b.datetime;
    return dateA.localeCompare(dateB);
  });

  res.json(events);
});

export default router;
