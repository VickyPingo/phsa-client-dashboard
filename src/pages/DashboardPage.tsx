import { useState, useEffect } from 'react';
import { Client } from '../lib/types';
import { supabase } from '../lib/supabase';
import { newClientsPerMonth } from '../lib/utils';
import KPICards from '../components/Dashboard/KPICards';
import {
  NewClientsChart, ReasonChart, HowFoundChart,
  ProvinceChart, ConclusionChart, DecisionChart, VolunteerChart,
} from '../components/Dashboard/Charts';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  clients: Client[];
}

export default function DashboardPage({ clients }: Props) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [monthlyData, setMonthlyData] = useState<{ month: string; count: number }[]>([]);
  const [monthlyLoading, setMonthlyLoading] = useState(true);

  // Fetch total client count once
  useEffect(() => {
    supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .then(({ count }) => { if (count !== null) setTotalCount(count); });
  }, []);

  // Fetch first_contact_date for the selected year to build the monthly chart
  useEffect(() => {
    setMonthlyLoading(true);
    supabase
      .from('clients')
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
      <KPICards clients={clients} totalCount={totalCount} />

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="lg:col-span-2">
          <NewClientsChart data={monthlyData} year={year} loading={monthlyLoading} />
        </div>
        <ReasonChart clients={clients} />
        <HowFoundChart clients={clients} />
        <ProvinceChart clients={clients} />
        <ConclusionChart clients={clients} />
        <DecisionChart clients={clients} />
        <VolunteerChart clients={clients} />
      </div>
    </div>
  );
}
