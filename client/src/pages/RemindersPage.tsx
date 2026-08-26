import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reminderApi } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Trash2, Check, Clock } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

export function RemindersPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    datetime: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    recurring: '',
  });

  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ['reminders'],
    queryFn: () => reminderApi.list().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => reminderApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setShowForm(false);
      setFormData({ title: '', description: '', datetime: '', priority: 'medium', recurring: '' });
    },
  });

  const toggleCompleteMutation = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: number }) =>
      reminderApi.update(id, { completed: completed ? 0 : 1 } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reminderApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      recurring: formData.recurring || null,
      description: formData.description || null,
    });
  };

  const priorityColors = {
    low: 'bg-[var(--info)]',
    medium: 'bg-[var(--warning)]',
    high: 'bg-[var(--destructive)]',
  };

  const upcomingReminders = reminders.filter((r) => !r.completed && new Date(r.datetime) >= new Date());
  const completedReminders = reminders.filter((r) => r.completed);
  const overdueReminders = reminders.filter((r) => !r.completed && new Date(r.datetime) < new Date());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Reminders</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus size={18} className="mr-2" /> New Reminder
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Reminder</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Reminder title"
                required
              />
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description (optional)"
                className="flex min-h-[80px] w-full rounded-md border border-[var(--input)] bg-transparent px-3 py-2 text-sm placeholder:text-[var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--ring)]"
              />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date & Time</label>
                  <Input
                    type="datetime-local"
                    value={formData.datetime}
                    onChange={(e) => setFormData({ ...formData, datetime: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="flex h-9 w-full rounded-md border border-[var(--input)] bg-transparent px-3 py-1 text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Recurring</label>
                  <select
                    value={formData.recurring}
                    onChange={(e) => setFormData({ ...formData, recurring: e.target.value })}
                    className="flex h-9 w-full rounded-md border border-[var(--input)] bg-transparent px-3 py-1 text-sm"
                  >
                    <option value="">None</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Create Reminder</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {overdueReminders.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-[var(--destructive)] mb-3">Overdue</h2>
          <div className="space-y-2">
            {overdueReminders.map((reminder) => (
              <Card key={reminder.id} className="border-[var(--destructive)]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${priorityColors[reminder.priority]}`} />
                      <div>
                        <h3 className="font-medium">{reminder.title}</h3>
                        {reminder.description && (
                          <p className="text-sm text-[var(--muted-foreground)]">{reminder.description}</p>
                        )}
                        <p className="text-xs text-[var(--destructive)]">
                          Overdue by {formatDistanceToNow(new Date(reminder.datetime))}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => toggleCompleteMutation.mutate({ id: reminder.id, completed: reminder.completed })}>
                        <Check size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(reminder.id)}>
                        <Trash2 size={16} className="text-[var(--destructive)]" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-3">Upcoming</h2>
        <div className="space-y-2">
          {upcomingReminders.map((reminder) => (
            <Card key={reminder.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${priorityColors[reminder.priority]}`} />
                    <div>
                      <h3 className="font-medium">{reminder.title}</h3>
                      {reminder.description && (
                        <p className="text-sm text-[var(--muted-foreground)]">{reminder.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                        <Clock size={12} />
                        {format(new Date(reminder.datetime), 'MMM d, yyyy h:mm a')}
                        {reminder.recurring && <span className="bg-[var(--secondary)] px-2 py-0.5 rounded">{reminder.recurring}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => toggleCompleteMutation.mutate({ id: reminder.id, completed: reminder.completed })}>
                      <Check size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(reminder.id)}>
                      <Trash2 size={16} className="text-[var(--destructive)]" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {upcomingReminders.length === 0 && overdueReminders.length === 0 && (
            <p className="text-[var(--muted-foreground)] text-center py-8">No upcoming reminders</p>
          )}
        </div>
      </div>

      {completedReminders.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-[var(--muted-foreground)] mb-3">Completed</h2>
          <div className="space-y-2">
            {completedReminders.slice(0, 5).map((reminder) => (
              <Card key={reminder.id} className="opacity-60">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Check size={16} className="text-[var(--success)]" />
                      <div>
                        <h3 className="font-medium line-through">{reminder.title}</h3>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(reminder.id)}>
                      <Trash2 size={16} className="text-[var(--destructive)]" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
