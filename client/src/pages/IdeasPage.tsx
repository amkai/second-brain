import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ideaApi } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Trash2, Pin, PinOff } from 'lucide-react';
import { format } from 'date-fns';

export function IdeasPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '' });

  const { data: ideas = [], isLoading } = useQuery({
    queryKey: ['ideas'],
    queryFn: () => ideaApi.list().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => ideaApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas'] });
      setShowForm(false);
      setFormData({ title: '', content: '' });
    },
  });

  const togglePinMutation = useMutation({
    mutationFn: ({ id, pinned }: { id: string; pinned: number }) =>
      ideaApi.update(id, { pinned: pinned ? 0 : 1 } as any),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ideas'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ideaApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ideas'] }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Ideas</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus size={18} className="mr-2" /> New Idea
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Idea</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Idea title"
                required
              />
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Describe your idea..."
                className="flex min-h-[120px] w-full rounded-md border border-[var(--input)] bg-transparent px-3 py-2 text-sm placeholder:text-[var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--ring)]"
              />
              <div className="flex gap-2">
                <Button type="submit">Save Idea</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {ideas.map((idea) => (
          <Card key={idea.id} className={idea.pinned ? 'border-[var(--primary)]' : ''}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{idea.title}</CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => togglePinMutation.mutate({ id: idea.id, pinned: idea.pinned })}
                  >
                    {idea.pinned ? <PinOff size={16} /> : <Pin size={16} />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(idea.id)}
                  >
                    <Trash2 size={16} className="text-[var(--destructive)]" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[var(--muted-foreground)] whitespace-pre-wrap">{idea.content}</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-4">
                {format(new Date(idea.created_at), 'MMM d, yyyy')}
              </p>
            </CardContent>
          </Card>
        ))}
        {ideas.length === 0 && (
          <div className="col-span-full text-center py-12 text-[var(--muted-foreground)]">
            No ideas yet. Click "New Idea" to get started!
          </div>
        )}
      </div>
    </div>
  );
}
