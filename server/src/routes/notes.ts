import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const { folder_id } = req.query;
  let query = 'SELECT * FROM notes WHERE user_id = ?';
  const params: any[] = [req.userId];

  if (folder_id) {
    query += ' AND folder_id = ?';
    params.push(folder_id);
  } else if (folder_id === null || folder_id === undefined) {
    query += ' AND folder_id IS NULL';
  }

  query += ' ORDER BY updated_at DESC';
  const notes = db.prepare(query).all(...params);
  res.json(notes);
});

router.get('/folders', (req, res) => {
  const folders = db.prepare('SELECT * FROM folders WHERE user_id = ? ORDER BY name').all(req.userId);
  res.json(folders);
});

router.post('/folders', (req, res) => {
  const { name, parent_id } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });

  const id = uuidv4();
  db.prepare('INSERT INTO folders (id, name, parent_id, user_id) VALUES (?, ?, ?, ?)').run(id, name, parent_id || null, req.userId);

  const folder = db.prepare('SELECT * FROM folders WHERE id = ?').get(id);
  res.status(201).json(folder);
});

router.post('/', (req, res) => {
  const { title, content, folder_id } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });

  const id = uuidv4();
  db.prepare('INSERT INTO notes (id, title, content, folder_id, user_id) VALUES (?, ?, ?, ?, ?)').run(id, title, content || '', folder_id || null, req.userId);

  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(id);
  res.status(201).json(note);
});

router.get('/:id', (req, res) => {
  const note = db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!note) return res.status(404).json({ error: 'Note not found' });
  res.json(note);
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { title, content, folder_id } = req.body;

  const existing = db.prepare('SELECT id FROM notes WHERE id = ? AND user_id = ?').get(id, req.userId);
  if (!existing) return res.status(404).json({ error: 'Note not found' });

  db.prepare(`
    UPDATE notes SET
      title = COALESCE(?, title),
      content = COALESCE(?, content),
      folder_id = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `).run(title, content, folder_id !== undefined ? folder_id : null, id, req.userId);

  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(id);
  res.json(note);
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM notes WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  if (result.changes === 0) return res.status(404).json({ error: 'Note not found' });
  res.json({ message: 'Note deleted' });
});

export default router;
