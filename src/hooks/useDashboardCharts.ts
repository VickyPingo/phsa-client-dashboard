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

type RpcRow = { name: string; value: number };

function normalize(data: RpcRow[] | null): ChartRow[] {
  return (data ?? []).map(r => ({ name: r.name, value: Number(r.value) }));
}

const NO_DATE = { date_from: null, date_to: null };

export function useDashboardCharts() {
  const [charts, setCharts] = useState<DashboardCharts>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.rpc('get_reason_counts',     NO_DATE),
      supabase.rpc('get_how_found_counts',  NO_DATE),
      supabase.rpc('get_volunteer_counts',  NO_DATE),
      supabase.rpc('get_province_counts',   NO_DATE),
      supabase.rpc('get_decision_counts',   NO_DATE),
      supabase.rpc('get_conclusion_counts', NO_DATE),
      supabase.rpc('get_time_band_counts',  NO_DATE),
    ]).then(([reason, howFound, volunteer, province, decision, conclusion, timeBands]) => {
      setCharts({
        byReason:    normalize(reason.data),
        byHowFound:  normalize(howFound.data),
        byVolunteer: normalize(volunteer.data),
        byProvince:  normalize(province.data),
        byDecision:  normalize(decision.data),
        byConclusion:normalize(conclusion.data),
        timeBands:   normalize(timeBands.data),
      });
      setLoading(false);
    });
  }, []);

  return { charts, loading };
}
