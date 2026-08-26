import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  DollarSign,
  Lightbulb,
  Bell,
  FileText,
  Target,
  Calendar,
  Tags,
  Search,
  Menu,
  X,
  Moon,
  Sun,
  LogOut
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from './ui/Button';
import { SearchDialog } from './SearchDialog';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/expenses', label: 'Expenses', icon: DollarSign },
  { path: '/ideas', label: 'Ideas', icon: Lightbulb },
  { path: '/reminders', label: 'Reminders', icon: Bell },
  { path: '/notes', label: 'Notes', icon: FileText },
  { path: '/habits', label: 'Habits', icon: Target },
  { path: '/goals', label: 'Goals', icon: Target },
  { path: '/calendar', label: 'Calendar', icon: Calendar },
  { path: '/tags', label: 'Tags', icon: Tags },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', !darkMode ? 'dark' : 'light');
  };

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <aside
        className={cn(
          'flex flex-col border-r border-[var(--border)] bg-[var(--card)] transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-16'
        )}
      >
        <div className="flex items-center justify-between p-4">
          {sidebarOpen && (
            <h1 className="text-xl font-bold text-[var(--primary)]">Second Brain</h1>
          )}
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>

        <nav className="flex-1 space-y-1 p-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                    : 'text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]'
                )}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[var(--border)] p-2">
          {sidebarOpen && (
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[var(--muted-foreground)] hover:bg-[var(--accent)] rounded-md mb-2"
            >
              <Search size={16} />
              <span>Search</span>
              <kbd className="ml-auto text-xs bg-[var(--secondary)] px-1.5 py-0.5 rounded">⌘K</kbd>
            </button>
          )}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </Button>
            {sidebarOpen && (
              <span className="text-sm text-[var(--muted-foreground)] truncate">{user?.username}</span>
            )}
            <Button variant="ghost" size="icon" onClick={() => logout()}>
              <LogOut size={20} />
            </Button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="h-full p-6">
          {children}
        </div>
      </main>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
