import { Router } from 'express';
import db from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String(now.getFullYear());

  const totalExpenses = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM expenses
    WHERE user_id = ? AND strftime('%m', date) = ? AND strftime('%Y', date) = ?
  `).get(req.userId, month, year) as any;

  const activeHabits = db.prepare('SELECT COUNT(*) as count FROM habits WHERE user_id = ?').get(req.userId) as any;

  const upcomingReminders = db.prepare(`
    SELECT * FROM reminders WHERE user_id = ? AND completed = 0 AND datetime >= datetime('now')
    ORDER BY datetime ASC LIMIT 5
  `).all(req.userId);

  const recentNotes = db.prepare(`
    SELECT * FROM notes WHERE user_id = ? ORDER BY updated_at DESC LIMIT 5
  `).all(req.userId);

  const recentIdeas = db.prepare(`
    SELECT * FROM ideas WHERE user_id = ? ORDER BY created_at DESC LIMIT 5
  `).all(req.userId);

  const activeGoals = db.prepare(`
    SELECT * FROM goals WHERE user_id = ? AND progress < 100 ORDER BY deadline ASC LIMIT 5
  `).all(req.userId);

  const expensesByCategory = db.prepare(`
    SELECT c.name, c.icon, c.color, COALESCE(SUM(e.amount), 0) as total
    FROM categories c
    LEFT JOIN expenses e ON c.id = e.category_id AND strftime('%m', e.date) = ? AND strftime('%Y', e.date) = ?
    WHERE c.user_id = ?
    GROUP BY c.id HAVING total > 0
    ORDER BY total DESC
  `).all(month, year, req.userId);

  const expenseTrends = db.prepare(`
    SELECT strftime('%Y-%m', date) as month, SUM(amount) as total
    FROM expenses
    WHERE user_id = ? AND date >= date('now', '-6 months')
    GROUP BY strftime('%Y-%m', date)
    ORDER BY month ASC
  `).all(req.userId);

  const completedHabitsToday = db.prepare(`
    SELECT COUNT(*) as count FROM habit_logs
    WHERE user_id = ? AND date = date('now')
  `).get(req.userId) as any;

  res.json({
    totalExpenses: totalExpenses.total,
    activeHabits: activeHabits.count,
    completedHabitsToday: completedHabitsToday.count,
    upcomingReminders,
    recentNotes,
    recentIdeas,
    activeGoals,
    expensesByCategory,
    expenseTrends
  });
});

export default router;
