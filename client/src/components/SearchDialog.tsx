import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchApi, type SearchResult } from '@/lib/api';
import { Input } from './ui/Input';
import { Search, FileText, Lightbulb, DollarSign, Bell, Target } from 'lucide-react';
import { format } from 'date-fns';

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SearchDialog({ open, onClose }: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const { data } = await searchApi.query(query);
        setResults(data);
      } catch {
        setResults([]);
      }
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const typeIcons: Record<string, React.ReactNode> = {
    note: <FileText size={16} />,
    idea: <Lightbulb size={16} />,
    expense: <DollarSign size={16} />,
    reminder: <Bell size={16} />,
    habit: <Target size={16} />,
    goal: <Target size={16} />,
  };

  const typePaths: Record<string, string> = {
    note: '/notes',
    idea: '/ideas',
    expense: '/expenses',
    reminder: '/reminders',
    habit: '/habits',
    goal: '/goals',
  };

  const handleSelect = (result: SearchResult) => {
    navigate(typePaths[result.type] || '/');
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[var(--card)] rounded-lg shadow-lg border border-[var(--border)] overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-[var(--border)]">
          <Search size={20} className="text-[var(--muted-foreground)]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across all modules..."
            className="border-none focus-visible:ring-0 bg-transparent"
            autoFocus
          />
        </div>
        <div className="max-h-[300px] overflow-auto">
          {isLoading && (
            <div className="p-4 text-center text-[var(--muted-foreground)]">Searching...</div>
          )}
          {!isLoading && query.length >= 2 && results.length === 0 && (
            <div className="p-4 text-center text-[var(--muted-foreground)]">No results found</div>
          )}
          {results.map((result) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => handleSelect(result)}
              className="w-full text-left p-3 hover:bg-[var(--accent)] flex items-start gap-3 transition-colors"
            >
              <div className="text-[var(--muted-foreground)] mt-0.5">
                {typeIcons[result.type]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{result.title}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-[var(--secondary)] text-[var(--muted-foreground)]">
                    {result.type}
                  </span>
                </div>
                {result.preview && (
                  <p className="text-sm text-[var(--muted-foreground)] truncate mt-0.5">
                    {result.preview}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
        <div className="p-2 border-t border-[var(--border)] text-xs text-[var(--muted-foreground)] text-center">
          Press <kbd className="px-1 py-0.5 rounded bg-[var(--secondary)]">Esc</kbd> to close
        </div>
      </div>
    </div>
  );
}
