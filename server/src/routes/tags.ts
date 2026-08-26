import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const tags = db.prepare('SELECT * FROM tags WHERE user_id = ? ORDER BY name').all(req.userId);
  res.json(tags);
});

router.post('/', (req, res) => {
  const { name, color } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });

  const id = uuidv4();
  try {
    db.prepare('INSERT INTO tags (id, name, color, user_id) VALUES (?, ?, ?, ?)').run(id, name, color || '#8b5cf6', req.userId);
    const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(id);
    res.status(201).json(tag);
  } catch (e: any) {
    if (e.message?.includes('UNIQUE')) return res.status(409).json({ error: 'Tag already exists' });
    throw e;
  }
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM taggables WHERE tag_id = ?').run(req.params.id);
  const result = db.prepare('DELETE FROM tags WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  if (result.changes === 0) return res.status(404).json({ error: 'Tag not found' });
  res.json({ message: 'Tag deleted' });
});

router.post('/assign', (req, res) => {
  const { tag_id, taggable_id, taggable_type } = req.body;
  if (!tag_id || !taggable_id || !taggable_type) return res.status(400).json({ error: 'All fields required' });

  db.prepare('INSERT OR IGNORE INTO taggables (tag_id, taggable_id, taggable_type) VALUES (?, ?, ?)').run(tag_id, taggable_id, taggable_type);
  res.json({ message: 'Tag assigned' });
});

router.delete('/assign', (req, res) => {
  const { tag_id, taggable_id, taggable_type } = req.body;
  db.prepare('DELETE FROM taggables WHERE tag_id = ? AND taggable_id = ? AND taggable_type = ?').run(tag_id, taggable_id, taggable_type);
  res.json({ message: 'Tag removed' });
});

router.get('/item/:type/:id', (req, res) => {
  const tags = db.prepare(`
    SELECT t.* FROM tags t
    JOIN taggables tg ON t.id = tg.tag_id
    WHERE tg.taggable_id = ? AND tg.taggable_type = ?
  `).all(req.params.id, req.params.type);
  res.json(tags);
});

export default router;
