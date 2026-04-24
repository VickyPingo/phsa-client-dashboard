import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { newClientsPerMonth } from '../lib/utils';
import { Client } from '../lib/types';
import { useDashboardCharts } from '../hooks/useDashboardCharts';
import KPICards from '../components/Dashboard/KPICards';
import {
  NewClientsChart, ReasonChart, HowFoundChart,
  ProvinceChart, ConclusionChart, DecisionChart, VolunteerChart,
  ContactTimeChart,
} from '../components/Dashboard/Charts';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  clients: Client[];
}

export interface DashboardKPIs {
  total: number | null;
  women: number | null;
  men: number | null;
  avgAge: number | null;
  referrals: number | null;
  testimonyPotential: number | null;
}

export default function DashboardPage(_: Props) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [kpis, setKpis] = useState<DashboardKPIs>({
    total: null, women: null, men: null,
    avgAge: null, referrals: null, testimonyPotential: null,
  });
  const [monthlyData, setMonthlyData] = useState<{ month: string; count: number }[]>([]);
  const [monthlyLoading, setMonthlyLoading] = useState(true);

  const { charts, loading: chartsLoading } = useDashboardCharts();

  useEffect(() => {
    Promise.all([
      supabase.from('phsa_clients').select('*', { count: 'exact', head: true }),
      supabase.from('phsa_clients').select('*', { count: 'exact', head: true }).eq('sex', 'F'),
      supabase.from('phsa_clients').select('*', { count: 'exact', head: true }).eq('sex', 'M'),
      supabase.from('phsa_clients').select('*', { count: 'exact', head: true })
        .or('referral_1.neq.null,referral_2.neq.null'),
      supabase.from('phsa_clients').select('*', { count: 'exact', head: true })
        .in('testimony_potential', ['Yes', 'Asked', 'Received', 'Provided']),
      supabase.rpc('get_avg_age', { date_from: null, date_to: null }),
    ]).then(([total, female, male, referrals, testimony, avgAge]) => {
      setKpis({
        total:              total.count     ?? null,
        women:              female.count    ?? null,
        men:                male.count      ?? null,
        referrals:          referrals.count ?? null,
        testimonyPotential: testimony.count ?? null,
        avgAge:             avgAge.data != null ? Number(avgAge.data) : null,
      });
    });
  }, []);

  useEffect(() => {
    setMonthlyLoading(true);
    supabase
      .from('phsa_clients')
      .select('first_contact_date')
      .gte('first_contact_date', `${year}-01-01`)
      .lte('first_contact_date', `${year}-12-31`)
      .then(({ data }) => {
        const rows = (data ?? []) as Pick<Client, 'first_contact_date'>[];
        setMonthlyData(newClientsPerMonth(rows as Client[], year));
        setMonthlyLoading(false);
      });
  }, [year]);

  return (
    <div className="space-y-6">
      <KPICards kpis={kpis} />

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Analytics</h2>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-1 py-1 shadow-sm">
          <button
            onClick={() => setYear(y => y - 1)}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-slate-700 min-w-[3rem] text-center">{year}</span>
          <button
            onClick={() => setYear(y => y + 1)}
            disabled={year >= currentYear}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <NewClientsChart data={monthlyData} year={year} loading={monthlyLoading} />
        {chartsLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <ReasonChart     data={charts.byReason} />
            <HowFoundChart   data={charts.byHowFound} />
            <ProvinceChart   data={charts.byProvince} />
            <ConclusionChart data={charts.byConclusion} />
            <DecisionChart   data={charts.byDecision} />
            <VolunteerChart  data={charts.byVolunteer} />
            <ContactTimeChart data={charts.timeBands} />
          </>
        )}
      </div>
    </div>
  );
}
