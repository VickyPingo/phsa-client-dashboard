import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface ReportKPIs {
  total: number;
  female: number;
  male: number;
  referrals: number;
  testimony: number;
  avg_age: number | null;
}

export interface ReportStats {
  kpis: ReportKPIs;
  byProvince: Record<string, number>;
  byReason: Record<string, number>;
  byHowFound: Record<string, number>;
  byVolunteer: Record<string, number>;
  byDecision: Record<string, number>;
  byConclusion: Record<string, number>;
  timeBands: Record<string, number>;
}

const EMPTY_KPIS: ReportKPIs = {
  total: 0, female: 0, male: 0, referrals: 0, testimony: 0, avg_age: null,
};

const EMPTY_STATS: ReportStats = {
  kpis: EMPTY_KPIS,
  byProvince: {}, byReason: {}, byHowFound: {},
  byVolunteer: {}, byDecision: {}, byConclusion: {}, timeBands: {},
};

async function rpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw error;
  return data as T;
}

async function groupBy(col: string, dateFrom: string, dateTo: string): Promise<Record<string, number>> {
  const data = await rpc<Record<string, number> | null>('report_group_by', {
    col,
    date_from: dateFrom || null,
    date_to:   dateTo   || null,
  });
  return data ?? {};
}

export function useReportData(dateFrom: string, dateTo: string) {
  const [stats, setStats] = useState<ReportStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const args = { date_from: dateFrom || null, date_to: dateTo || null };

      const [kpis, byProvince, byReason, byHowFound, byVolunteer, byDecision, byConclusion, timeBands] =
        await Promise.all([
          rpc<ReportKPIs>('report_kpis', args),
          groupBy('province',           dateFrom, dateTo),
          groupBy('reason_for_contact', dateFrom, dateTo),
          groupBy('how_found_us',       dateFrom, dateTo),
          groupBy('volunteer',          dateFrom, dateTo),
          groupBy('decision',           dateFrom, dateTo),
          groupBy('conclusion',         dateFrom, dateTo),
          rpc<Record<string, number> | null>('report_contact_time_bands', args).then(d => d ?? {}),
        ]);

      setStats({ kpis, byProvince, byReason, byHowFound, byVolunteer, byDecision, byConclusion, timeBands });
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => { fetch(); }, [fetch]);

  return { stats, loading };
}
