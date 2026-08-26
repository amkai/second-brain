import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { calendarApi } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, ChevronRight, DollarSign, Bell, Target } from 'lucide-react';
import { format, startOfMonth, endOfMonth, addMonths, subMonths, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns';

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const startDate = format(startOfMonth(currentDate), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(currentDate), 'yyyy-MM-dd');

  const { data: events = [] } = useQuery({
    queryKey: ['calendar', startDate, endDate],
    queryFn: () => calendarApi.get(startDate, endDate).then((r) => r.data),
  });

  const days = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start, end });

    const startPadding = start.getDay();
    const paddingDays = Array.from({ length: startPadding }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() - (startPadding - i));
      return d;
    });

    const endPadding = 6 - end.getDay();
    const endPaddingDays = Array.from({ length: endPadding }, (_, i) => {
      const d = new Date(end);
      d.setDate(d.getDate() + (i + 1));
      return d;
    });

    return [...paddingDays, ...daysInMonth, ...endPaddingDays];
  }, [currentDate]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    events.forEach((event) => {
      const dateKey = event.date?.split('T')[0] || event.datetime?.split('T')[0];
      if (dateKey) {
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(event);
      }
    });
    return map;
  }, [events]);

  const typeIcons: Record<string, React.ReactNode> = {
    expense: <DollarSign size={12} />,
    reminder: <Bell size={12} />,
    habit: <Target size={12} />,
  };

  const typeColors: Record<string, string> = {
    expense: 'bg-[var(--info)]',
    reminder: 'bg-[var(--warning)]',
    habit: 'bg-[var(--success)]',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Calendar</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
            <ChevronLeft size={18} />
          </Button>
          <span className="text-lg font-medium min-w-[160px] text-center">
            {format(currentDate, 'MMMM yyyy')}
          </span>
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-[var(--muted-foreground)] py-2">
                {day}
              </div>
            ))}
            {days.map((day, idx) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayEvents = eventsByDate[dateKey] || [];
              const isCurrentMonth = isSameMonth(day, currentDate);
              const today = isToday(day);

              return (
                <div
                  key={idx}
                  className={`min-h-[100px] p-2 rounded-md border border-[var(--border)] ${
                    isCurrentMonth ? 'bg-[var(--card)]' : 'bg-[var(--secondary)] opacity-50'
                  } ${today ? 'ring-2 ring-[var(--primary)]' : ''}`}
                >
                  <div className={`text-sm font-medium mb-1 ${today ? 'text-[var(--primary)]' : ''}`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event, i) => (
                      <div
                        key={i}
                        className={`text-xs px-1 py-0.5 rounded text-white truncate flex items-center gap-1 ${typeColors[event.type]}`}
                        title={`${event.type}: ${event.title || event.notes || ''}`}
                      >
                        {typeIcons[event.type]}
                        <span className="truncate">{event.title || event.notes || event.category_name || ''}</span>
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-[var(--muted-foreground)]">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-[var(--info)]" />
          <span>Expenses</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-[var(--warning)]" />
          <span>Reminders</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-[var(--success)]" />
          <span>Habits</span>
        </div>
      </div>
    </div>
  );
}
