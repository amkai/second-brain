import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalApi } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Trash2, Target } from 'lucide-react';
import { format } from 'date-fns';

export function GoalsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    category: 'personal',
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['goals'],
    queryFn: () => goalApi.list().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => goalApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setShowForm(false);
      setFormData({ title: '', description: '', deadline: '', category: 'personal' });
    },
  });

  const updateProgressMutation = useMutation({
    mutationFn: ({ id, progress }: { id: string; progress: number }) =>
      goalApi.update(id, { progress }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => goalApi.delete(id),
    onSuccess: (_data, id) => {
      queryClient.setQueryData(['goals'], (old: any[]) => old?.filter((g) => g.id !== id) ?? []);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      deadline: formData.deadline || null,
      description: formData.description || null,
    });
  };

  const categoryColors: Record<string, string> = {
    personal: 'bg-[var(--info)]',
    career: 'bg-[var(--primary)]',
    health: 'bg-[var(--success)]',
    finance: 'bg-[var(--warning)]',
    education: 'bg-purple-500',
  };

  const activeGoals = goals.filter((g) => g.progress < 100);
  const completedGoals = goals.filter((g) => g.progress >= 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Goals</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus size={18} className="mr-2" /> New Goal
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Goal</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Goal title"
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
                  <label className="text-sm font-medium">Deadline</label>
                  <Input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="flex h-9 w-full rounded-md border border-[var(--input)] bg-transparent px-3 py-1 text-sm"
                  >
                    <option value="personal">Personal</option>
                    <option value="career">Career</option>
                    <option value="health">Health</option>
                    <option value="finance">Finance</option>
                    <option value="education">Education</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Create Goal</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-3">Active Goals</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activeGoals.map((goal) => (
            <Card key={goal.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{goal.title}</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(goal.id)}>
                    <Trash2 size={16} className="text-[var(--destructive)]" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {goal.description && (
                  <p className="text-sm text-[var(--muted-foreground)]">{goal.description}</p>
                )}
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs text-white ${categoryColors[goal.category] || 'bg-gray-500'}`}>
                    {goal.category}
                  </span>
                  {goal.deadline && (
                    <span className="text-xs text-[var(--muted-foreground)]">
                      Due: {format(new Date(goal.deadline), 'MMM d, yyyy')}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{goal.progress}%</span>
                  </div>
                  <div className="h-2 bg-[var(--secondary)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--primary)] transition-all"
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                  <div className="flex gap-2">
                    {[0, 25, 50, 75, 100].map((p) => (
                      <Button
                        key={p}
                        variant={goal.progress === p ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateProgressMutation.mutate({ id: goal.id, progress: p })}
                      >
                        {p}%
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {activeGoals.length === 0 && (
            <div className="col-span-full text-center py-12 text-[var(--muted-foreground)]">
              No active goals. Set a goal to get started!
            </div>
          )}
        </div>
      </div>

      {completedGoals.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-[var(--success)] mb-3">Completed Goals</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {completedGoals.map((goal) => (
              <Card key={goal.id} className="opacity-75">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Target size={16} className="text-[var(--success)]" />
                    <span className="font-medium">{goal.title}</span>
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
