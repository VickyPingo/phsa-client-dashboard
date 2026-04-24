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

const EMPTY_STATS: ReportStats = {
  kpis: { total: 0, female: 0, male: 0, referrals: 0, testimony: 0, avg_age: null },
  byProvince: {}, byReason: {}, byHowFound: {},
  byVolunteer: {}, byDecision: {}, byConclusion: {}, timeBands: {},
};

type SlimClient = {
  sex: string | null;
  age: string | null;
  volunteer: string | null;
  province: string | null;
  reason_for_contact: string | null;
  how_found_us: string | null;
  decision: string | null;
  conclusion: string | null;
  referral_1: string | null;
  referral_2: string | null;
  first_contact_date: string | null;
  first_contact_time: string | null;
};

function countBy(rows: SlimClient[], key: keyof SlimClient): Record<string, number> {
  return rows.reduce((acc, row) => {
    const val = (row[key] as string | null) ?? 'Unknown';
    if (!val) return acc;
    acc[val] = (acc[val] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

const TIME_BANDS: { label: string; start: number; end: number }[] = [
  { label: 'Morning',     start: 6,  end: 12 },
  { label: 'Lunch',       start: 12, end: 14 },
  { label: 'Afternoon',   start: 14, end: 18 },
  { label: 'Evening',     start: 18, end: 21 },
  { label: 'Night',       start: 21, end: 24 },
  { label: 'Early Hours', start: 0,  end: 6  },
];

function timeBands(rows: SlimClient[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const row of rows) {
    if (!row.first_contact_time) continue;
    const hour = parseInt(row.first_contact_time.slice(0, 2), 10);
    for (const band of TIME_BANDS) {
      if (hour >= band.start && hour < band.end) {
        result[band.label] = (result[band.label] ?? 0) + 1;
        break;
      }
    }
  }
  return result;
}

async function fetchAllRows(dateFrom: string, dateTo: string): Promise<SlimClient[]> {
  const cols = 'sex,age,volunteer,province,reason_for_contact,how_found_us,decision,conclusion,referral_1,referral_2,first_contact_date,first_contact_time';
  let query = supabase.from('phsa_clients').select(cols).range(0, 9999);
  if (dateFrom) query = query.gte('first_contact_date', dateFrom);
  if (dateTo)   query = query.lte('first_contact_date', dateTo);
  const { data } = await query;
  return (data ?? []) as SlimClient[];
}

export function useReportData(dateFrom: string, dateTo: string) {
  const [stats, setStats] = useState<ReportStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      let totalQuery = supabase.from('phsa_clients').select('*', { count: 'exact', head: true });
      if (dateFrom) totalQuery = totalQuery.gte('first_contact_date', dateFrom);
      if (dateTo)   totalQuery = totalQuery.lte('first_contact_date', dateTo);

      const buildCountQuery = (base: ReturnType<typeof supabase.from>) => {
        let q = base.select('*', { count: 'exact', head: true });
        if (dateFrom) q = q.gte('first_contact_date', dateFrom);
        if (dateTo)   q = q.lte('first_contact_date', dateTo);
        return q;
      };

      const femaleQuery   = buildCountQuery(supabase.from('phsa_clients')).eq('sex', 'F');
      const maleQuery     = buildCountQuery(supabase.from('phsa_clients')).eq('sex', 'M');
      const referralQuery = buildCountQuery(supabase.from('phsa_clients')).not('referral_1', 'is', null);

      const [
        rows,
        { count: totalCount },
        { count: femaleCount },
        { count: maleCount },
        { count: referralCount },
        { count: testimonyCount },
      ] = await Promise.all([
        fetchAllRows(dateFrom, dateTo),
        totalQuery,
        femaleQuery,
        maleQuery,
        referralQuery,
        supabase.from('phsa_testimonies').select('*', { count: 'exact', head: true }),
      ]);

      const total = totalCount ?? rows.length;
      const ages = rows.map(r => parseInt(r.age ?? '')).filter(a => !isNaN(a));
      const avg_age = ages.length ? parseFloat((ages.reduce((a, b) => a + b, 0) / ages.length).toFixed(1)) : null;

      setStats({
        kpis: {
          total,
          female:    femaleCount   ?? 0,
          male:      maleCount     ?? 0,
          referrals: referralCount ?? 0,
          testimony: testimonyCount ?? 0,
          avg_age,
        },
        byProvince:  countBy(rows, 'province'),
        byReason:    countBy(rows, 'reason_for_contact'),
        byHowFound:  countBy(rows, 'how_found_us'),
        byVolunteer: countBy(rows, 'volunteer'),
        byDecision:  countBy(rows.filter(r => r.decision), 'decision'),
        byConclusion:countBy(rows.filter(r => r.conclusion), 'conclusion'),
        timeBands:   timeBands(rows),
      });
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => { fetch(); }, [fetch]);

  return { stats, loading };
}
