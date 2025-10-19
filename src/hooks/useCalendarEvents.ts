import { useState, useEffect } from 'react';

export interface CalendarEvent {
  id: number;
  title: string;
  date: string;
  priority: string;
  status: string;
  equipment: {
    name: string;
    code: string;
  };
  sector: string;
  assignedUser: string;
  company: string;
  estimatedCost: number;
}

export interface CalendarData {
  events: CalendarEvent[];
  totalEvents: number;
}

export function useCalendarEvents() {
  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/dashboard/calendar');
      
      if (!response.ok) {
        throw new Error('Failed to fetch calendar events');
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchEvents,
  };
}