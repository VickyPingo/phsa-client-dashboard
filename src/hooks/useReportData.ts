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

export type ChartRow = { name: string; value: number };

export interface ReportStats {
  kpis: ReportKPIs;
  byProvince: ChartRow[];
  byReason: ChartRow[];
  byHowFound: ChartRow[];
  byVolunteer: ChartRow[];
  byDecision: ChartRow[];
  byConclusion: ChartRow[];
  timeBands: ChartRow[];
}

const EMPTY_STATS: ReportStats = {
  kpis: { total: 0, female: 0, male: 0, referrals: 0, testimony: 0, avg_age: null },
  byProvince: [], byReason: [], byHowFound: [],
  byVolunteer: [], byDecision: [], byConclusion: [], timeBands: [],
};

type RpcRow = { name: string; value: number };

async function rpc(fn: string, dateFrom: string, dateTo: string): Promise<RpcRow[]> {
  const params: Record<string, string | null> = {
    date_from: dateFrom || null,
    date_to:   dateTo   || null,
  };
  const { data } = await supabase.rpc(fn, params);
  return (data ?? []) as RpcRow[];
}

export function useReportData(dateFrom: string, dateTo: string) {
  const [stats, setStats] = useState<ReportStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const buildCount = (base: ReturnType<typeof supabase.from>) => {
        let q = base.select('*', { count: 'exact', head: true });
        if (dateFrom) q = q.gte('first_contact_date', dateFrom);
        if (dateTo)   q = q.lte('first_contact_date', dateTo);
        return q;
      };

      const [
        { count: totalCount },
        { count: femaleCount },
        { count: maleCount },
        { count: referralCount },
        { count: testimonyCount },
        avgAgeResult,
        byReason,
        byHowFound,
        byVolunteer,
        byProvince,
        byDecision,
        byConclusion,
        timeBands,
      ] = await Promise.all([
        buildCount(supabase.from('phsa_clients')),
        buildCount(supabase.from('phsa_clients')).eq('sex', 'F'),
        buildCount(supabase.from('phsa_clients')).eq('sex', 'M'),
        buildCount(supabase.from('phsa_clients')).not('referral_1', 'is', null),
        supabase.from('phsa_testimonies').select('*', { count: 'exact', head: true }),
        supabase.rpc('get_avg_age', { date_from: dateFrom || null, date_to: dateTo || null }),
        rpc('get_reason_counts',    dateFrom, dateTo),
        rpc('get_how_found_counts', dateFrom, dateTo),
        rpc('get_volunteer_counts', dateFrom, dateTo),
        rpc('get_province_counts',  dateFrom, dateTo),
        rpc('get_decision_counts',  dateFrom, dateTo),
        rpc('get_conclusion_counts',dateFrom, dateTo),
        rpc('get_time_band_counts', dateFrom, dateTo),
      ]);

      setStats({
        kpis: {
          total:     totalCount     ?? 0,
          female:    femaleCount    ?? 0,
          male:      maleCount      ?? 0,
          referrals: referralCount  ?? 0,
          testimony: testimonyCount ?? 0,
          avg_age:   avgAgeResult.data != null ? Number(avgAgeResult.data) : null,
        },
        byReason,
        byHowFound,
        byVolunteer,
        byProvince,
        byDecision,
        byConclusion,
        timeBands,
      });
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  return { stats, loading };
}
