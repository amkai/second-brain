import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { habitApi } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Trash2, Check, Flame } from 'lucide-react';
import { format, subDays, startOfWeek, addDays } from 'date-fns';

export function HabitsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', frequency: 'daily', color: '#22c55e' });

  const { data: habits = [] } = useQuery({
    queryKey: ['habits'],
    queryFn: () => habitApi.list().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => habitApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      setShowForm(false);
      setFormData({ name: '', description: '', frequency: 'daily', color: '#22c55e' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => habitApi.delete(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['habits'] });
      const previous = queryClient.getQueryData(['habits']);
      queryClient.setQueryData(['habits'], (old: any[]) => old?.filter((h) => h.id !== id) ?? []);
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(['habits'], context.previous);
    },
  });

  const toggleLogMutation = useMutation({
    mutationFn: ({ id, date }: { id: string; date: string }) => habitApi.toggleLog(id, date),
    onMutate: async ({ id, date }: { id: string; date: string }) => {
      await queryClient.cancelQueries({ queryKey: ['habitLogs', id] });
      const previous = queryClient.getQueryData(['habitLogs', id]);
      queryClient.setQueryData(['habitLogs', id], (old: any[]) => {
        const without = old?.filter((l) => l.date !== date) ?? [];
        if (!old?.some((l) => l.date === date)) {
          return [...without, { id: `optimistic-${date}`, habit_id: id, date, completed: 1 }];
        }
        return without;
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['habitLogs', _vars.id], context.previous);
    },
    onSettled: (_data, _err, vars) => {
      queryClient.invalidateQueries({ queryKey: ['habitLogs', vars.id] });
      queryClient.invalidateQueries({ queryKey: ['habitStreak', vars.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const today = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Habits</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus size={18} className="mr-2" /> New Habit
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Habit</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Habit name"
                required
              />
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description (optional)"
              />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Frequency</label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    className="flex h-9 w-full rounded-md border border-[var(--input)] bg-transparent px-3 py-1 text-sm"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Color</label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="h-9 w-full rounded-md border border-[var(--input)] cursor-pointer"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Create Habit</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {habits.map((habit) => (
          <HabitCard
            key={habit.id}
            habit={habit}
            last7Days={last7Days}
            onToggle={(date) => toggleLogMutation.mutate({ id: habit.id, date })}
            onDelete={() => deleteMutation.mutate(habit.id)}
          />
        ))}
        {habits.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-[var(--muted-foreground)]">
              No habits yet. Start building good habits!
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function HabitCard({ habit, last7Days, onToggle, onDelete }: {
  habit: any;
  last7Days: Date[];
  onToggle: (date: string) => void;
  onDelete: () => void;
}) {
  const { data: logs = [] } = useQuery({
    queryKey: ['habitLogs', habit.id],
    queryFn: () => habitApi.logs(habit.id, {
      start_date: format(last7Days[0], 'yyyy-MM-dd'),
      end_date: format(last7Days[6], 'yyyy-MM-dd'),
    }).then((r) => r.data),
  });

  const { data: streak } = useQuery({
    queryKey: ['habitStreak', habit.id],
    queryFn: () => habitApi.streak(habit.id).then((r) => r.data),
  });

  const completedDates = new Set(logs.map((l: any) => l.date));
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const doneToday = completedDates.has(todayStr);

  return (
    <Card className={doneToday ? 'border-[var(--success)]' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-medium flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: habit.color }} />
              {habit.name}
            </h3>
            {habit.description && (
              <p className="text-sm text-[var(--muted-foreground)]">{habit.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {streak && (
              <div className="flex items-center gap-1 text-sm">
                <Flame size={16} className="text-orange-500" />
                <span>{streak.currentStreak}</span>
              </div>
            )}
            <Button
              variant={doneToday ? 'default' : 'outline'}
              onClick={() => onToggle(todayStr)}
              className={doneToday ? 'bg-[var(--success)] text-white hover:opacity-90 border-none' : 'hover:border-[var(--success)] hover:text-[var(--success)]'}
            >
              <Check size={16} className="mr-1" />
              {doneToday ? 'Done' : 'Mark Done'}
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 size={16} className="text-[var(--destructive)]" />
            </Button>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          {last7Days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const isCompleted = completedDates.has(dateStr);
            const isToday = format(new Date(), 'yyyy-MM-dd') === dateStr;

            return (
              <button
                key={dateStr}
                onClick={() => onToggle(dateStr)}
                className={`flex flex-col items-center gap-1 p-2 rounded-md transition-colors ${
                  isCompleted
                    ? 'bg-[var(--success)] text-white'
                    : isToday
                    ? 'bg-[var(--accent)]'
                    : 'hover:bg-[var(--accent)]'
                }`}
              >
                <span className="text-xs">{format(day, 'EEE')}</span>
                <span className="text-sm font-medium">{format(day, 'd')}</span>
                {isCompleted && <Check size={12} />}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
