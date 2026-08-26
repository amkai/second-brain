import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tagApi } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Trash2, Tags } from 'lucide-react';

export function TagsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', color: '#8b5cf6' });

  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagApi.list().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => tagApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      setShowForm(false);
      setFormData({ name: '', color: '#8b5cf6' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tagApi.delete(id),
    onSuccess: (_data, id) => {
      queryClient.setQueryData(['tags'], (old: any[]) => old?.filter((t) => t.id !== id) ?? []);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Tags</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus size={18} className="mr-2" /> New Tag
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Tag</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Tag name"
                  required
                />
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="h-9 w-16 rounded-md border border-[var(--input)] cursor-pointer"
                  />
                  <span className="text-sm text-[var(--muted-foreground)]">{formData.color}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Create Tag</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tags.map((tag) => (
          <Card key={tag.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tag.color }} />
                  <span className="font-medium">{tag.name}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(tag.id)}>
                  <Trash2 size={16} className="text-[var(--destructive)]" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {tags.length === 0 && (
          <div className="col-span-full text-center py-12 text-[var(--muted-foreground)]">
            <Tags size={48} className="mx-auto mb-4 opacity-50" />
            <p>No tags yet. Create tags to organize your content!</p>
          </div>
        )}
      </div>
    </div>
  );
}
