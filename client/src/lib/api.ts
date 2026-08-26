import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

export interface User {
  id: string;
  username: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  user_id: string;
}

export interface Expense {
  id: string;
  amount: number;
  category_id: string;
  date: string;
  notes: string | null;
  is_recurring: number;
  recurrence_pattern: string | null;
  user_id: string;
  created_at: string;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
}

export interface Budget {
  id: string;
  category_id: string;
  monthly_limit: number;
  month: number;
  year: number;
  spent?: number;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
}

export interface Idea {
  id: string;
  title: string;
  content: string;
  pinned: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  title: string;
  description: string | null;
  datetime: string;
  recurring: string | null;
  priority: 'low' | 'medium' | 'high';
  completed: number;
  user_id: string;
  created_at: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  folder_id: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
  user_id: string;
}

export interface Habit {
  id: string;
  name: string;
  description: string | null;
  frequency: string;
  color: string;
  user_id: string;
  created_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  date: string;
  completed: number;
}

export interface Goal {
  id: string;
  title: string;
  description: string | null;
  deadline: string | null;
  progress: number;
  category: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  user_id: string;
}

export interface SearchResult {
  id: string;
  title: string;
  preview: string;
  date: string;
  type: 'note' | 'idea' | 'expense' | 'reminder' | 'habit' | 'goal';
}

export interface DashboardData {
  totalExpenses: number;
  activeHabits: number;
  completedHabitsToday: number;
  upcomingReminders: Reminder[];
  recentNotes: Note[];
  recentIdeas: Idea[];
  activeGoals: Goal[];
  expensesByCategory: { name: string; icon: string; color: string; total: number }[];
  expenseTrends: { month: string; total: number }[];
}

export interface CalendarEvent {
  id: string;
  type: 'expense' | 'reminder' | 'habit';
  date: string;
  title: string;
  [key: string]: any;
}

// Auth
export const authApi = {
  register: (data: { username: string; password: string }) => api.post<{ user: User }>('/auth/register', data),
  login: (data: { username: string; password: string }) => api.post<{ user: User }>('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get<{ user: User }>('/auth/me'),
};

// Categories
export const categoryApi = {
  list: () => api.get<Category[]>('/categories'),
  create: (data: { name: string; icon?: string; color?: string }) => api.post<Category>('/categories', data),
  update: (id: string, data: Partial<Category>) => api.put<Category>(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

// Expenses
export const expenseApi = {
  list: (params?: { month?: number; year?: number; category_id?: string }) => api.get<Expense[]>('/expenses', { params }),
  create: (data: Partial<Expense>) => api.post<Expense>('/expenses', data),
  update: (id: string, data: Partial<Expense>) => api.put<Expense>(`/expenses/${id}`, data),
  delete: (id: string) => api.delete(`/expenses/${id}`),
  summary: (params?: { month?: number; year?: number }) => api.get<{ total: number; byCategory: any[]; budgets: Budget[] }>('/expenses/summary', { params }),
  trends: (months?: number) => api.get<{ month: string; total: number }[]>('/expenses/trends', { params: { months } }),
};

// Ideas
export const ideaApi = {
  list: () => api.get<Idea[]>('/ideas'),
  create: (data: { title: string; content?: string }) => api.post<Idea>('/ideas', data),
  update: (id: string, data: Partial<Idea>) => api.put<Idea>(`/ideas/${id}`, data),
  delete: (id: string) => api.delete(`/ideas/${id}`),
};

// Reminders
export const reminderApi = {
  list: () => api.get<Reminder[]>('/reminders'),
  create: (data: Partial<Reminder>) => api.post<Reminder>('/reminders', data),
  update: (id: string, data: Partial<Reminder>) => api.put<Reminder>(`/reminders/${id}`, data),
  delete: (id: string) => api.delete(`/reminders/${id}`),
};

// Notes
export const noteApi = {
  list: (folderId?: string) => api.get<Note[]>('/notes', { params: { folder_id: folderId } }),
  get: (id: string) => api.get<Note>(`/notes/${id}`),
  create: (data: { title: string; content?: string; folder_id?: string }) => api.post<Note>('/notes', data),
  update: (id: string, data: Partial<Note>) => api.put<Note>(`/notes/${id}`, data),
  delete: (id: string) => api.delete(`/notes/${id}`),
  folders: () => api.get<Folder[]>('/notes/folders'),
  createFolder: (data: { name: string; parent_id?: string }) => api.post<Folder>('/notes/folders', data),
};

// Habits
export const habitApi = {
  list: () => api.get<Habit[]>('/habits'),
  create: (data: { name: string; description?: string; frequency?: string; color?: string }) => api.post<Habit>('/habits', data),
  update: (id: string, data: Partial<Habit>) => api.put<Habit>(`/habits/${id}`, data),
  delete: (id: string) => api.delete(`/habits/${id}`),
  logs: (id: string, params?: { start_date?: string; end_date?: string }) => api.get<HabitLog[]>(`/habits/${id}/logs`, { params }),
  toggleLog: (id: string, date: string) => api.post<{ completed: boolean }>(`/habits/${id}/logs`, { date }),
  streak: (id: string) => api.get<{ currentStreak: number; longestStreak: number }>(`/habits/${id}/streak`),
};

// Goals
export const goalApi = {
  list: () => api.get<Goal[]>('/goals'),
  create: (data: { title: string; description?: string; deadline?: string; category?: string }) => api.post<Goal>('/goals', data),
  update: (id: string, data: Partial<Goal>) => api.put<Goal>(`/goals/${id}`, data),
  delete: (id: string) => api.delete(`/goals/${id}`),
};

// Tags
export const tagApi = {
  list: () => api.get<Tag[]>('/tags'),
  create: (data: { name: string; color?: string }) => api.post<Tag>('/tags', data),
  delete: (id: string) => api.delete(`/tags/${id}`),
  assign: (data: { tag_id: string; taggable_id: string; taggable_type: string }) => api.post('/tags/assign', data),
  unassign: (data: { tag_id: string; taggable_id: string; taggable_type: string }) => api.delete('/tags/assign', { data }),
  forItem: (type: string, id: string) => api.get<Tag[]>(`/tags/item/${type}/${id}`),
};

// Dashboard
export const dashboardApi = {
  get: () => api.get<DashboardData>('/dashboard'),
};

// Calendar
export const calendarApi = {
  get: (startDate: string, endDate: string) => api.get<CalendarEvent[]>('/calendar', { params: { start_date: startDate, end_date: endDate } }),
};

// Search
export const searchApi = {
  query: (q: string) => api.get<SearchResult[]>('/search', { params: { q } }),
};

export default api;
