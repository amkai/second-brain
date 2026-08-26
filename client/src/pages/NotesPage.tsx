import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { noteApi } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Trash2, FileText, Folder } from 'lucide-react';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function NotesPage() {
  const queryClient = useQueryClient();
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [showNewNote, setShowNewNote] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const { data: notes = [] } = useQuery({
    queryKey: ['notes'],
    queryFn: () => noteApi.list().then((r) => r.data),
  });

  const { data: folders = [] } = useQuery({
    queryKey: ['folders'],
    queryFn: () => noteApi.folders().then((r) => r.data),
  });

  const { data: currentNote } = useQuery({
    queryKey: ['note', selectedNote],
    queryFn: () => noteApi.get(selectedNote!).then((r) => r.data),
    enabled: !!selectedNote,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => noteApi.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setSelectedNote(response.data.id);
      setShowNewNote(false);
      setNewTitle('');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => noteApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['note', selectedNote] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => noteApi.delete(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      if (selectedNote === id) setSelectedNote(null);
    },
  });

  const handleCreateNote = () => {
    if (newTitle.trim()) {
      createMutation.mutate({ title: newTitle });
    }
  };

  const handleContentChange = (content: string) => {
    if (selectedNote) {
      updateMutation.mutate({ id: selectedNote, data: { content } });
    }
  };

  return (
    <div className="flex h-[calc(100vh-3rem)] gap-4">
      <div className="w-64 flex flex-col border border-[var(--border)] rounded-lg bg-[var(--card)]">
        <div className="p-3 border-b border-[var(--border)]">
          <Button onClick={() => setShowNewNote(true)} className="w-full" size="sm">
            <Plus size={16} className="mr-2" /> New Note
          </Button>
        </div>
        {showNewNote && (
          <div className="p-3 border-b border-[var(--border)]">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Note title"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateNote()}
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <Button size="sm" onClick={handleCreateNote}>Create</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowNewNote(false)}>Cancel</Button>
            </div>
          </div>
        )}
        <div className="flex-1 overflow-auto p-2 space-y-1">
          {notes.map((note) => (
            <button
              key={note.id}
              onClick={() => setSelectedNote(note.id)}
              className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
                selectedNote === note.id
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                  : 'hover:bg-[var(--accent)]'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText size={14} />
                <span className="truncate">{note.title}</span>
              </div>
              <p className="text-xs text-[var(--muted-foreground)] mt-1 truncate">
                {note.content || 'Empty note'}
              </p>
            </button>
          ))}
          {notes.length === 0 && (
            <p className="text-[var(--muted-foreground)] text-sm text-center py-4">No notes yet</p>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col border border-[var(--border)] rounded-lg bg-[var(--card)]">
        {currentNote ? (
          <>
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
              <Input
                value={currentNote.title}
                onChange={(e) => updateMutation.mutate({ id: currentNote.id, data: { title: e.target.value } })}
                className="text-lg font-bold border-none focus-visible:ring-0 bg-transparent"
              />
              <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(currentNote.id)}>
                <Trash2 size={16} className="text-[var(--destructive)]" />
              </Button>
            </div>
            <div className="flex-1 p-4 overflow-auto">
              <textarea
                value={currentNote.content}
                onChange={(e) => handleContentChange(e.target.value)}
                className="w-full h-full min-h-[400px] bg-transparent resize-none focus:outline-none text-sm"
                placeholder="Start writing in markdown..."
              />
            </div>
            <div className="p-4 border-t border-[var(--border)]">
              <h3 className="text-sm font-medium mb-2 text-[var(--muted-foreground)]">Preview</h3>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {currentNote.content || '*Start writing...*'}
                </ReactMarkdown>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[var(--muted-foreground)]">
            Select a note or create a new one
          </div>
        )}
      </div>
    </div>
  );
}
