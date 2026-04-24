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

// Convert the json_object_agg result from report_group_by into sorted ChartRow[]
function toChartRows(obj: Record<string, number> | null): ChartRow[] {
  if (!obj) return [];
  return Object.entries(obj)
    .map(([name, value]) => ({ name, value: Number(value) }))
    .sort((a, b) => b.value - a.value);
}

export function useReportData(dateFrom: string, dateTo: string) {
  const [stats, setStats] = useState<ReportStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const df = dateFrom || null;
      const dt = dateTo   || null;

      let testimonyQuery = supabase
        .from('phsa_clients')
        .select('*', { count: 'exact', head: true })
        .in('testimony_potential', ['Yes', 'Asked', 'Received', 'Provided']);
      if (df) testimonyQuery = testimonyQuery.gte('first_contact_date', df);
      if (dt) testimonyQuery = testimonyQuery.lte('first_contact_date', dt);

      const [
        kpisRes,
        { count: testimonyCount },
        provinceRes,
        reasonRes,
        howFoundRes,
        volunteerRes,
        decisionRes,
        conclusionRes,
        timeBandsRes,
      ] = await Promise.all([
        supabase.rpc('report_kpis',               { date_from: df, date_to: dt }),
        testimonyQuery,
        supabase.rpc('report_group_by',            { col: 'province',            date_from: df, date_to: dt }),
        supabase.rpc('report_group_by',            { col: 'reason_for_contact',   date_from: df, date_to: dt }),
        supabase.rpc('report_group_by',            { col: 'how_found_us',         date_from: df, date_to: dt }),
        supabase.rpc('report_group_by',            { col: 'volunteer',            date_from: df, date_to: dt }),
        supabase.rpc('report_group_by',            { col: 'decision',             date_from: df, date_to: dt }),
        supabase.rpc('report_group_by',            { col: 'conclusion',           date_from: df, date_to: dt }),
        supabase.rpc('report_contact_time_bands',  { date_from: df, date_to: dt }),
      ]);

      const kpis = kpisRes.data as ReportKPIs | null;

      setStats({
        kpis: {
          total:     kpis?.total     ?? 0,
          female:    kpis?.female    ?? 0,
          male:      kpis?.male      ?? 0,
          referrals: kpis?.referrals ?? 0,
          testimony: testimonyCount  ?? 0,
          avg_age:   kpis?.avg_age   ?? null,
        },
        byProvince:  toChartRows(provinceRes.data),
        byReason:    toChartRows(reasonRes.data),
        byHowFound:  toChartRows(howFoundRes.data),
        byVolunteer: toChartRows(volunteerRes.data),
        byDecision:  toChartRows(decisionRes.data),
        byConclusion:toChartRows(conclusionRes.data),
        timeBands:   toChartRows(timeBandsRes.data),
      });
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  return { stats, loading };
}
