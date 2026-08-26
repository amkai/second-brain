import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const { month, year, category_id } = req.query;
  let query = `
    SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color
    FROM expenses e
    JOIN categories c ON e.category_id = c.id
    WHERE e.user_id = ?
  `;
  const params: any[] = [req.userId];

  if (month && year) {
    query += ` AND strftime('%m', e.date) = ? AND strftime('%Y', e.date) = ?`;
    params.push(String(month).padStart(2, '0'), String(year));
  }

  if (category_id) {
    query += ` AND e.category_id = ?`;
    params.push(category_id);
  }

  query += ' ORDER BY e.date DESC, e.created_at DESC';

  const expenses = db.prepare(query).all(...params);
  res.json(expenses);
});

router.post('/', (req, res) => {
  const { amount, category_id, date, notes, is_recurring, recurrence_pattern } = req.body;

  if (!amount || !category_id || !date) {
    return res.status(400).json({ error: 'Amount, category, and date required' });
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO expenses (id, amount, category_id, date, notes, is_recurring, recurrence_pattern, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, amount, category_id, date, notes || null, is_recurring ? 1 : 0, recurrence_pattern || null, req.userId);

  const expense = db.prepare(`
    SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color
    FROM expenses e
    JOIN categories c ON e.category_id = c.id
    WHERE e.id = ?
  `).get(id);

  res.status(201).json(expense);
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { amount, category_id, date, notes, is_recurring, recurrence_pattern } = req.body;

  const existing = db.prepare('SELECT id FROM expenses WHERE id = ? AND user_id = ?').get(id, req.userId);
  if (!existing) {
    return res.status(404).json({ error: 'Expense not found' });
  }

  db.prepare(`
    UPDATE expenses SET amount = ?, category_id = ?, date = ?, notes = ?, is_recurring = ?, recurrence_pattern = ?
    WHERE id = ? AND user_id = ?
  `).run(amount, category_id, date, notes || null, is_recurring ? 1 : 0, recurrence_pattern || null, id, req.userId);

  const expense = db.prepare(`
    SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color
    FROM expenses e
    JOIN categories c ON e.category_id = c.id
    WHERE e.id = ?
  `).get(id);

  res.json(expense);
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const result = db.prepare('DELETE FROM expenses WHERE id = ? AND user_id = ?').run(id, req.userId);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Expense not found' });
  }

  res.json({ message: 'Expense deleted' });
});

router.get('/summary', (req, res) => {
  const { month, year } = req.query;
  const m = String(month || new Date().getMonth() + 1).padStart(2, '0');
  const y = String(year || new Date().getFullYear());

  const total = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM expenses
    WHERE user_id = ? AND strftime('%m', date) = ? AND strftime('%Y', date) = ?
  `).get(req.userId, m, y) as any;

  const byCategory = db.prepare(`
    SELECT c.id, c.name, c.icon, c.color, COALESCE(SUM(e.amount), 0) as total
    FROM categories c
    LEFT JOIN expenses e ON c.id = e.category_id AND strftime('%m', e.date) = ? AND strftime('%Y', e.date) = ?
    WHERE c.user_id = ?
    GROUP BY c.id
    ORDER BY total DESC
  `).all(m, y, req.userId);

  const budgets = db.prepare(`
    SELECT b.*, c.name as category_name, c.icon as category_icon, c.color as category_color,
    COALESCE(
      (SELECT SUM(amount) FROM expenses WHERE category_id = b.category_id AND strftime('%m', date) = ? AND strftime('%Y', date) = ?),
      0
    ) as spent
    FROM budgets b
    JOIN categories c ON b.category_id = c.id
    WHERE b.user_id = ? AND b.month = ? AND b.year = ?
  `).all(m, y, req.userId, parseInt(m), parseInt(y));

  res.json({ total: total.total, byCategory, budgets });
});

router.get('/trends', (req, res) => {
  const { months = 6 } = req.query;

  const trends = db.prepare(`
    SELECT strftime('%Y-%m', date) as month, SUM(amount) as total
    FROM expenses
    WHERE user_id = ? AND date >= date('now', '-' || ? || ' months')
    GROUP BY strftime('%Y-%m', date)
    ORDER BY month ASC
  `).all(req.userId, months);

  res.json(trends);
});

export default router;
