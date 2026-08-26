import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { DollarSign, Target, Bell, FileText, Lightbulb } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';

export function DashboardPage() {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.get().then((r) => r.data),
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  if (!dashboard) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">This Month's Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-[var(--muted-foreground)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${dashboard.totalExpenses.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Habits</CardTitle>
            <Target className="h-4 w-4 text-[var(--muted-foreground)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.activeHabits}</div>
            <p className="text-xs text-[var(--muted-foreground)]">
              {dashboard.completedHabitsToday} completed today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Reminders</CardTitle>
            <Bell className="h-4 w-4 text-[var(--muted-foreground)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.upcomingReminders.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
            <Target className="h-4 w-4 text-[var(--muted-foreground)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.activeGoals.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Expense Trends</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard.expenseTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboard.expenseTrends}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-[var(--muted-foreground)] text-center py-8">No expense data yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard.expensesByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dashboard.expensesByCategory}
                    dataKey="total"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {dashboard.expensesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-[var(--muted-foreground)] text-center py-8">No expenses this month</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell size={18} /> Upcoming Reminders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard.upcomingReminders.length > 0 ? (
              <ul className="space-y-2">
                {dashboard.upcomingReminders.map((r) => (
                  <li key={r.id} className="flex items-center justify-between text-sm">
                    <span>{r.title}</span>
                    <span className="text-[var(--muted-foreground)]">
                      {format(new Date(r.datetime), 'MMM d, h:mm a')}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[var(--muted-foreground)] text-sm">No upcoming reminders</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText size={18} /> Recent Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard.recentNotes.length > 0 ? (
              <ul className="space-y-2">
                {dashboard.recentNotes.map((n) => (
                  <li key={n.id} className="text-sm">
                    <span className="font-medium">{n.title}</span>
                    <p className="text-[var(--muted-foreground)] text-xs truncate">{n.content}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[var(--muted-foreground)] text-sm">No notes yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb size={18} /> Recent Ideas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard.recentIdeas.length > 0 ? (
              <ul className="space-y-2">
                {dashboard.recentIdeas.map((i) => (
                  <li key={i.id} className="text-sm">
                    <span className="font-medium">{i.title}</span>
                    <p className="text-[var(--muted-foreground)] text-xs truncate">{i.content}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[var(--muted-foreground)] text-sm">No ideas yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
