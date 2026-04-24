import { useState, useMemo } from 'react';
import { Client } from '../lib/types';
import { countByKey, csvExport, downloadCsv, calcAverageAge, decisionLabel } from '../lib/utils';
import { Download, Printer, BarChart3, Users, MapPin, Heart } from 'lucide-react';

interface Props {
  clients: Client[];
}

export default function ReportsPage({ clients }: Props) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filtered = useMemo(() => {
    return clients.filter(c => {
      if (dateFrom && c.first_contact_date && c.first_contact_date < dateFrom) return false;
      if (dateTo && c.first_contact_date && c.first_contact_date > dateTo) return false;
      return true;
    });
  }, [clients, dateFrom, dateTo]);

  const stats = useMemo(() => ({
    total: filtered.length,
    female: filtered.filter(c => c.sex === 'F').length,
    male: filtered.filter(c => c.sex === 'M').length,
    avgAge: calcAverageAge(filtered),
    referrals: filtered.filter(c => c.referral_1 || c.referral_2).length,
    testimonies: filtered.filter(c => c.testimony_potential === 'Yes').length,
    byProvince: countByKey(filtered, 'province'),
    byReason: countByKey(filtered, 'reason_for_contact'),
    byVolunteer: countByKey(filtered, 'volunteer'),
    byDecision: countByKey(filtered.filter(c => c.decision), 'decision'),
    byConclusion: countByKey(filtered.filter(c => c.conclusion), 'conclusion'),
    byHowFound: countByKey(filtered, 'how_found_us'),
  }), [filtered]);

  const handleExportCsv = () => {
    const csv = csvExport(filtered);
    const label = dateFrom && dateTo ? `${dateFrom}_to_${dateTo}` : 'all';
    downloadCsv(csv, `phsa-clients-${label}.csv`);
  };

  return (
    <div className="space-y-6 max-w-4xl">
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
            <button onClick={handleExportCsv} className="btn-primary">
              <Download className="w-4 h-4" /> Export CSV
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

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 print:grid-cols-3">
        {[
          { label: 'Total Clients', value: stats.total, icon: Users, color: 'text-primary-600' },
          { label: 'Female', value: stats.female, icon: Users, color: 'text-rose-500' },
          { label: 'Male', value: stats.male, icon: Users, color: 'text-blue-500' },
          { label: 'Avg Age', value: stats.avgAge, icon: BarChart3, color: 'text-amber-500' },
          { label: 'Referrals', value: stats.referrals, icon: MapPin, color: 'text-emerald-500' },
          { label: 'Testimonies', value: stats.testimonies, icon: Heart, color: 'text-accent-500' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <s.icon className={`w-5 h-5 ${s.color} mx-auto mb-2`} />
            <p className="text-2xl font-bold text-slate-800">{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <StatTable title="By Province" data={stats.byProvince} total={stats.total} />
        <StatTable title="Reason for Contact" data={stats.byReason} total={stats.total} />
        <StatTable title="How Clients Found PHSA" data={stats.byHowFound} total={stats.total} />
        <StatTable title="Decisions" data={Object.fromEntries(Object.entries(stats.byDecision).map(([k, v]) => [decisionLabel(k), v]))} total={stats.total} />
        <StatTable title="Conclusions" data={stats.byConclusion} total={stats.total} />
        <StatTable title="Cases per Volunteer" data={stats.byVolunteer} total={stats.total} />
      </div>
    </div>
  );
}

function StatTable({ title, data, total }: { title: string; data: Record<string, number>; total: number }) {
  const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);
  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
        <p className="font-semibold text-sm text-slate-700">{title}</p>
      </div>
      {sorted.length === 0 ? (
        <p className="px-4 py-3 text-xs text-slate-400">No data</p>
      ) : (
        <div className="divide-y divide-slate-50">
          {sorted.map(([label, count]) => (
            <div key={label} className="px-4 py-2.5 flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700 truncate">{label || 'Unknown'}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full"
                    style={{ width: `${total > 0 ? (count / total) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-600 w-6 text-right">{count}</span>
                <span className="text-xs text-slate-400 w-8 text-right">
                  {total > 0 ? Math.round((count / total) * 100) : 0}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
