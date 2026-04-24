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
  timeBands:   ChartRow[];
}

const EMPTY: DashboardCharts = {
  byReason: [], byHowFound: [], byVolunteer: [],
  byProvince: [], byDecision: [], byConclusion: [], timeBands: [],
};

function toChartRows(obj: Record<string, number> | null): ChartRow[] {
  if (!obj) return [];
  return Object.entries(obj)
    .map(([name, value]) => ({ name, value: Number(value) }))
    .sort((a, b) => b.value - a.value);
}

function groupBy(col: string) {
  return supabase.rpc('report_group_by', { col, date_from: null, date_to: null });
}

export function useDashboardCharts() {
  const [charts, setCharts] = useState<DashboardCharts>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      groupBy('reason_for_contact'),
      groupBy('how_found_us'),
      groupBy('volunteer'),
      groupBy('province'),
      groupBy('decision'),
      groupBy('conclusion'),
      supabase.rpc('report_contact_time_bands', { date_from: null, date_to: null }),
    ]).then(([reason, howFound, volunteer, province, decision, conclusion, timeBands]) => {
      setCharts({
        byReason:    toChartRows(reason.data),
        byHowFound:  toChartRows(howFound.data),
        byVolunteer: toChartRows(volunteer.data),
        byProvince:  toChartRows(province.data),
        byDecision:  toChartRows(decision.data),
        byConclusion:toChartRows(conclusion.data),
        timeBands:   toChartRows(timeBands.data),
      });
      setLoading(false);
    });
  }, []);

  return { charts, loading };
}
