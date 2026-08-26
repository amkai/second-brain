import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const reminders = db.prepare(`
    SELECT * FROM reminders WHERE user_id = ?
    ORDER BY datetime ASC
  `).all(req.userId);
  res.json(reminders);
});

router.post('/', (req, res) => {
  const { title, description, datetime, recurring, priority } = req.body;
  if (!title || !datetime) return res.status(400).json({ error: 'Title and datetime required' });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO reminders (id, title, description, datetime, recurring, priority, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, title, description || null, datetime, recurring || null, priority || 'medium', req.userId);

  const reminder = db.prepare('SELECT * FROM reminders WHERE id = ?').get(id);
  res.status(201).json(reminder);
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, datetime, recurring, priority, completed } = req.body;

  const existing = db.prepare('SELECT id FROM reminders WHERE id = ? AND user_id = ?').get(id, req.userId);
  if (!existing) return res.status(404).json({ error: 'Reminder not found' });

  db.prepare(`
    UPDATE reminders SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      datetime = COALESCE(?, datetime),
      recurring = COALESCE(?, recurring),
      priority = COALESCE(?, priority),
      completed = COALESCE(?, completed)
    WHERE id = ? AND user_id = ?
  `).run(title, description, datetime, recurring, priority, completed !== undefined ? (completed ? 1 : 0) : null, id, req.userId);

  const reminder = db.prepare('SELECT * FROM reminders WHERE id = ?').get(id);
  res.json(reminder);
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM reminders WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  if (result.changes === 0) return res.status(404).json({ error: 'Reminder not found' });
  res.json({ message: 'Reminder deleted' });
});

export default router;
