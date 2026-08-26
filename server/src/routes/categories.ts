import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const categories = db.prepare('SELECT * FROM categories WHERE user_id = ? ORDER BY name').all(req.userId);
  res.json(categories);
});

router.post('/', (req, res) => {
  const { name, icon, color } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });

  const id = uuidv4();
  db.prepare('INSERT INTO categories (id, name, icon, color, user_id) VALUES (?, ?, ?, ?, ?)').run(id, name, icon || '📁', color || '#6366f1', req.userId);

  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  res.status(201).json(category);
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, icon, color } = req.body;

  const existing = db.prepare('SELECT id FROM categories WHERE id = ? AND user_id = ?').get(id, req.userId);
  if (!existing) return res.status(404).json({ error: 'Category not found' });

  db.prepare('UPDATE categories SET name = COALESCE(?, name), icon = COALESCE(?, icon), color = COALESCE(?, color) WHERE id = ? AND user_id = ?').run(name, icon, color, id, req.userId);

  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  res.json(category);
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM categories WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  if (result.changes === 0) return res.status(404).json({ error: 'Category not found' });
  res.json({ message: 'Category deleted' });
});

export default router;
