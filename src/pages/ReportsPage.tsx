import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Client } from '../lib/types';
import { csvExport, downloadCsv, decisionLabel } from '../lib/utils';
import { ChartRow } from '../hooks/useReportData';
import { Download, Printer, BarChart3, Users, MapPin, Heart, Loader2 } from 'lucide-react';
import { ContactTimeChart, ReportBarChart, ReportProvinceChart } from '../components/Dashboard/Charts';
import { useReportData } from '../hooks/useReportData';

// clients prop is kept for backwards compat but no longer used for stats
interface Props {
  clients: Client[];
}

export default function ReportsPage(_: Props) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [exporting, setExporting] = useState(false);

  const { stats, loading } = useReportData(dateFrom, dateTo);
  const { kpis } = stats;

  const avgAgeDisplay = kpis.avg_age !== null ? String(kpis.avg_age) : '—';

  const handleExportCsv = async () => {
    setExporting(true);
    let query = supabase.from('phsa_clients').select('*').limit(10000).order('first_contact_date', { ascending: false });
    if (dateFrom) query = query.gte('first_contact_date', dateFrom);
    if (dateTo)   query = query.lte('first_contact_date', dateTo);
    const { data } = await query;
    setExporting(false);
    if (!data?.length) return;
    const csv = csvExport(data as Client[]);
    const label = dateFrom && dateTo ? `${dateFrom}_to_${dateTo}` : 'all';
    downloadCsv(csv, `phsa-clients-${label}.csv`);
  };

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <h3 className="font-semibold text-slate-700 text-sm mb-4">Date Range Filter</h3>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="label">From</label>
            <input type="date" className="input w-auto" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="label">To</label>
            <input type="date" className="input w-auto" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button onClick={handleExportCsv} disabled={exporting} className="btn-primary">
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Export CSV
            </button>
            <button onClick={() => window.print()} className="btn-secondary">
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="text-xs text-slate-400 hover:text-slate-600">
              Clear dates
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-4 print:grid-cols-3">
        {[
          { label: 'Total Clients', value: loading ? '…' : kpis.total, icon: Users, color: 'text-primary-600' },
          { label: 'Female', value: loading ? '…' : kpis.female, icon: Users, color: 'text-rose-500' },
          { label: 'Male', value: loading ? '…' : kpis.male, icon: Users, color: 'text-blue-500' },
          { label: 'Avg Age', value: loading ? '…' : avgAgeDisplay, icon: BarChart3, color: 'text-amber-500' },
          { label: 'Referrals', value: loading ? '…' : kpis.referrals, icon: MapPin, color: 'text-emerald-500' },
          { label: 'Testimonies', value: loading ? '…' : kpis.testimony, icon: Heart, color: 'text-accent-500' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <s.icon className={`w-5 h-5 ${s.color} mx-auto mb-2`} />
            <p className="text-2xl font-bold text-slate-800">{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <ContactTimeChart data={stats.timeBands} />
          <ReportProvinceChart data={stats.byProvince} showTable />
          <ReportBarChart
            title="Reason for Contact"
            data={stats.byReason}
            color="#0d9488"
            leftMargin={160}
            showTable
            tableLabel="Reason for Contact"
          />
          <ReportBarChart
            title="How Clients Found PHSA"
            data={stats.byHowFound}
            color="#22d3ee"
            leftMargin={160}
            showTable
            tableLabel="How Found PHSA"
          />
          <ReportBarChart
            title="Decisions"
            data={stats.byDecision.map((r: ChartRow) => ({ name: decisionLabel(r.name), value: r.value }))}
            color="#fb7185"
            leftMargin={120}
            showTable
            tableLabel="Decision"
          />
          <ReportBarChart
            title="Conclusions"
            data={stats.byConclusion}
            color="#34d399"
            leftMargin={120}
            showTable
            tableLabel="Conclusion"
          />
          <ReportBarChart
            title="Cases per Volunteer"
            data={stats.byVolunteer}
            color="#f59e0b"
            leftMargin={100}
            showTable
            tableLabel="Volunteer"
          />
        </div>
      )}
    </div>
  );
}
