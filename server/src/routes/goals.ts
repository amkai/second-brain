import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const goals = db.prepare('SELECT * FROM goals WHERE user_id = ? ORDER BY deadline ASC, created_at DESC').all(req.userId);
  res.json(goals);
});

router.post('/', (req, res) => {
  const { title, description, deadline, category } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });

  const id = uuidv4();
  db.prepare('INSERT INTO goals (id, title, description, deadline, category, user_id) VALUES (?, ?, ?, ?, ?, ?)').run(id, title, description || null, deadline || null, category || 'personal', req.userId);

  const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(id);
  res.status(201).json(goal);
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, deadline, progress, category } = req.body;

  const existing = db.prepare('SELECT id FROM goals WHERE id = ? AND user_id = ?').get(id, req.userId);
  if (!existing) return res.status(404).json({ error: 'Goal not found' });

  db.prepare(`
    UPDATE goals SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      deadline = COALESCE(?, deadline),
      progress = COALESCE(?, progress),
      category = COALESCE(?, category),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `).run(title, description, deadline, progress, category, id, req.userId);

  const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(id);
  res.json(goal);
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM goals WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  if (result.changes === 0) return res.status(404).json({ error: 'Goal not found' });
  res.json({ message: 'Goal deleted' });
});

export default router;
