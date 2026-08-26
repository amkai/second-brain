import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const ideas = db.prepare(`
    SELECT * FROM ideas WHERE user_id = ?
    ORDER BY pinned DESC, created_at DESC
  `).all(req.userId);
  res.json(ideas);
});

router.post('/', (req, res) => {
  const { title, content } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });

  const id = uuidv4();
  db.prepare('INSERT INTO ideas (id, title, content, user_id) VALUES (?, ?, ?, ?)').run(id, title, content || '', req.userId);

  const idea = db.prepare('SELECT * FROM ideas WHERE id = ?').get(id);
  res.status(201).json(idea);
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { title, content, pinned } = req.body;

  const existing = db.prepare('SELECT id FROM ideas WHERE id = ? AND user_id = ?').get(id, req.userId);
  if (!existing) return res.status(404).json({ error: 'Idea not found' });

  db.prepare(`
    UPDATE ideas SET title = COALESCE(?, title), content = COALESCE(?, content), pinned = COALESCE(?, pinned), updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `).run(title, content, pinned !== undefined ? (pinned ? 1 : 0) : null, id, req.userId);

  const idea = db.prepare('SELECT * FROM ideas WHERE id = ?').get(id);
  res.json(idea);
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM ideas WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  if (result.changes === 0) return res.status(404).json({ error: 'Idea not found' });
  res.json({ message: 'Idea deleted' });
});

export default router;
