import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ChartRow } from './useReportData';

export interface DashboardCharts {
  byReason:    ChartRow[];
  byHowFound:  ChartRow[];
  byVolunteer: ChartRow[];
  byProvince:  ChartRow[];
  byDecision:  ChartRow[];
  byConclusion:ChartRow[];
}

const EMPTY: DashboardCharts = {
  byReason: [], byHowFound: [], byVolunteer: [],
  byProvince: [], byDecision: [], byConclusion: [],
};

async function rpc(fn: string): Promise<ChartRow[]> {
  const { data } = await supabase.rpc(fn, { date_from: null, date_to: null });
  return (data ?? []) as ChartRow[];
}

export function useDashboardCharts() {
  const [charts, setCharts] = useState<DashboardCharts>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      rpc('get_reason_counts'),
      rpc('get_how_found_counts'),
      rpc('get_volunteer_counts'),
      rpc('get_province_counts'),
      rpc('get_decision_counts'),
      rpc('get_conclusion_counts'),
    ]).then(([byReason, byHowFound, byVolunteer, byProvince, byDecision, byConclusion]) => {
      setCharts({ byReason, byHowFound, byVolunteer, byProvince, byDecision, byConclusion });
      setLoading(false);
    });
  }, []);

  return { charts, loading };
}
