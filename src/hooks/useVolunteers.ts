import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Volunteer } from '../lib/types';

export function useVolunteers() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from('phsa_volunteers')
      .select('*')
      .order('name', { ascending: true });
    if (data) setVolunteers(data as Volunteer[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const activeNames = volunteers.filter(v => v.is_active).map(v => v.name);

  return { volunteers, activeNames, loading, refetch: fetch };
}
