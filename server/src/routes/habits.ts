import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const habits = db.prepare('SELECT * FROM habits WHERE user_id = ? ORDER BY created_at DESC').all(req.userId);
  res.json(habits);
});

router.post('/', (req, res) => {
  const { name, description, frequency, color } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });

  const id = uuidv4();
  db.prepare('INSERT INTO habits (id, name, description, frequency, color, user_id) VALUES (?, ?, ?, ?, ?, ?)').run(id, name, description || null, frequency || 'daily', color || '#22c55e', req.userId);

  const habit = db.prepare('SELECT * FROM habits WHERE id = ?').get(id);
  res.status(201).json(habit);
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, frequency, color } = req.body;

  const existing = db.prepare('SELECT id FROM habits WHERE id = ? AND user_id = ?').get(id, req.userId);
  if (!existing) return res.status(404).json({ error: 'Habit not found' });

  db.prepare(`
    UPDATE habits SET name = COALESCE(?, name), description = COALESCE(?, description),
    frequency = COALESCE(?, frequency), color = COALESCE(?, color)
    WHERE id = ? AND user_id = ?
  `).run(name, description, frequency, color, id, req.userId);

  const habit = db.prepare('SELECT * FROM habits WHERE id = ?').get(id);
  res.json(habit);
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM habits WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  if (result.changes === 0) return res.status(404).json({ error: 'Habit not found' });
  res.json({ message: 'Habit deleted' });
});

router.get('/:id/logs', (req, res) => {
  const { start_date, end_date } = req.query;
  let query = 'SELECT * FROM habit_logs WHERE habit_id = ? AND user_id = ?';
  const params: any[] = [req.params.id, req.userId];

  if (start_date) { query += ' AND date >= ?'; params.push(start_date); }
  if (end_date) { query += ' AND date <= ?'; params.push(end_date); }

  query += ' ORDER BY date DESC';
  const logs = db.prepare(query).all(...params);
  res.json(logs);
});

router.post('/:id/logs', (req, res) => {
  const { date } = req.body;
  if (!date) return res.status(400).json({ error: 'Date required' });

  const existing = db.prepare('SELECT id FROM habit_logs WHERE habit_id = ? AND date = ? AND user_id = ?').get(req.params.id, date, req.userId);

  if (existing) {
    db.prepare('DELETE FROM habit_logs WHERE habit_id = ? AND date = ? AND user_id = ?').run(req.params.id, date, req.userId);
    return res.json({ completed: false });
  }

  const id = uuidv4();
  db.prepare('INSERT INTO habit_logs (id, habit_id, date, user_id) VALUES (?, ?, ?, ?)').run(id, req.params.id, date, req.userId);
  res.json({ completed: true });
});

router.get('/:id/streak', (req, res) => {
  const logs = db.prepare(`
    SELECT date FROM habit_logs WHERE habit_id = ? AND user_id = ? ORDER BY date DESC
  `).all(req.params.id, req.userId) as any[];

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let lastDate: Date | null = null;

  for (const log of logs) {
    const logDate = new Date(log.date);
    if (lastDate) {
      const diff = (lastDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    } else {
      tempStreak = 1;
    }
    lastDate = logDate;
  }

  longestStreak = Math.max(longestStreak, tempStreak);

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (logs.length > 0) {
    const latestLog = logs[0].date;
    if (latestLog === today || latestLog === yesterday) {
      currentStreak = tempStreak;
    }
  }

  res.json({ currentStreak, longestStreak });
});

export default router;
