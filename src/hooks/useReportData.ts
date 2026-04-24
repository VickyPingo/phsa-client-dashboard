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

function normalize(data: RpcRow[] | null): ChartRow[] {
  return (data ?? []).map(r => ({ name: r.name, value: Number(r.value) }));
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
        { data: avgAgeData },
        { data: reasonData },
        { data: howFoundData },
        { data: volunteerData },
        { data: provinceData },
        { data: decisionData },
        { data: conclusionData },
        { data: timeBandData },
      ] = await Promise.all([
        buildCount(supabase.from('phsa_clients')),
        buildCount(supabase.from('phsa_clients')).eq('sex', 'F'),
        buildCount(supabase.from('phsa_clients')).eq('sex', 'M'),
        buildCount(supabase.from('phsa_clients'))
          .or('referral_1.neq.null,referral_2.neq.null'),
        buildCount(supabase.from('phsa_clients'))
          .in('testimony_potential', ['Yes', 'Asked', 'Received', 'Provided']),
        supabase.rpc('get_avg_age',           { date_from: dateFrom || null, date_to: dateTo || null }),
        supabase.rpc('get_reason_counts',     { date_from: dateFrom || null, date_to: dateTo || null }),
        supabase.rpc('get_how_found_counts',  { date_from: dateFrom || null, date_to: dateTo || null }),
        supabase.rpc('get_volunteer_counts',  { date_from: dateFrom || null, date_to: dateTo || null }),
        supabase.rpc('get_province_counts',   { date_from: dateFrom || null, date_to: dateTo || null }),
        supabase.rpc('get_decision_counts',   { date_from: dateFrom || null, date_to: dateTo || null }),
        supabase.rpc('get_conclusion_counts', { date_from: dateFrom || null, date_to: dateTo || null }),
        supabase.rpc('get_time_band_counts',  { date_from: dateFrom || null, date_to: dateTo || null }),
      ]);

      setStats({
        kpis: {
          total:     totalCount     ?? 0,
          female:    femaleCount    ?? 0,
          male:      maleCount      ?? 0,
          referrals: referralCount  ?? 0,
          testimony: testimonyCount ?? 0,
          avg_age:   avgAgeData != null ? Number(avgAgeData) : null,
        },
        byReason:    normalize(reasonData as RpcRow[]),
        byHowFound:  normalize(howFoundData as RpcRow[]),
        byVolunteer: normalize(volunteerData as RpcRow[]),
        byProvince:  normalize(provinceData as RpcRow[]),
        byDecision:  normalize(decisionData as RpcRow[]),
        byConclusion:normalize(conclusionData as RpcRow[]),
        timeBands:   normalize(timeBandData as RpcRow[]),
      });
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  return { stats, loading };
}
