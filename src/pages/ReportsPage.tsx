import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import { Client } from '../lib/types';
import { csvExport, downloadCsv, decisionLabel } from '../lib/utils';
import { ChartRow } from '../hooks/useReportData';
import { Download, Printer, BarChart3, Users, MapPin, Heart, Loader2, FileSpreadsheet, UserCheck, UserX, Activity } from 'lucide-react';
import { ContactTimeChart, ReportBarChart, ReportProvinceChart } from '../components/Dashboard/Charts';
import { useReportData } from '../hooks/useReportData';

interface Props {
  clients: Client[];
}

interface PHNStats {
  newContacts: number | null;
  closedCases: number | null;
  activeCases: number | null;
}

function sheetFromChartData(data: ChartRow[], categoryLabel: string): XLSX.WorkSheet {
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const total = sorted.reduce((s, r) => s + r.value, 0);
  const rows = [
    [categoryLabel, 'Count', '%'],
    ...sorted.map(r => [r.name, r.value, total > 0 ? parseFloat(((r.value / total) * 100).toFixed(1)) : 0]),
    ['TOTAL', total, 100],
  ];
  return XLSX.utils.aoa_to_sheet(rows);
}

function sheetFromClients(clients: Client[]): XLSX.WorkSheet {
  const headers = [
    'Date', 'Client Name', 'Status', 'Age', 'Sex', 'Province',
    'Reason for Contact', 'How Found Us', 'Phone Number',
    'Referral 1', 'Referral 2', 'Made Contact with PC',
    'Decision', 'Closed Date', 'Conclusion',
    'Testimony Potential', 'Notes', "Mari's Note",
  ];
  const rows = clients.map(c => [
    c.first_contact_date ?? '', c.client_name ?? '', c.status ?? 'Active',
    c.age ?? '', c.sex ?? '', c.province ?? '',
    c.reason_for_contact ?? '', c.how_found_us ?? '', c.phone_number ?? '',
    c.referral_1 ?? '', c.referral_2 ?? '', c.made_contact_with_pc ?? '',
    c.decision ?? '', c.closed_date ?? '', c.conclusion ?? '',
    c.testimony_potential ?? '', (c.notes ?? '').replace(/\n/g, ' '),
    (c.maris_note ?? '').replace(/\n/g, ' '),
  ]);
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = [
    {wch:12},{wch:24},{wch:8},{wch:6},{wch:8},{wch:14},{wch:38},{wch:18},{wch:16},
    {wch:22},{wch:22},{wch:20},{wch:10},{wch:12},{wch:34},{wch:18},{wch:40},{wch:30},
  ];
  return ws;
}

export default function ReportsPage(_: Props) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  // PHN monthly stats
  const now = new Date();
  const [phnYear, setPhnYear] = useState(now.getFullYear());
  const [phnMonth, setPhnMonth] = useState(now.getMonth() + 1); // 1-12
  const [phnStats, setPhnStats] = useState<PHNStats>({ newContacts: null, closedCases: null, activeCases: null });
  const [phnLoading, setPhnLoading] = useState(false);

  const { stats, loading } = useReportData(dateFrom, dateTo);
  const { kpis } = stats;

  // Fetch PHN stats for selected month
  useEffect(() => {
    setPhnLoading(true);
    const monthStart = `${phnYear}-${String(phnMonth).padStart(2, '0')}-01`;
    const nextMonth = phnMonth === 12 ? `${phnYear + 1}-01-01` : `${phnYear}-${String(phnMonth + 1).padStart(2, '0')}-01`;

    Promise.all([
      // New contacts this month
      supabase.from('phsa_clients').select('*', { count: 'exact', head: true })
        .gte('first_contact_date', monthStart).lt('first_contact_date', nextMonth),
      // Cases closed this month
      supabase.from('phsa_clients').select('*', { count: 'exact', head: true })
        .gte('closed_date', monthStart).lt('closed_date', nextMonth),
      // Total active cases (all time)
      supabase.from('phsa_clients').select('*', { count: 'exact', head: true })
        .eq('status', 'Active'),
    ]).then(([newC, closedC, activeC]) => {
      setPhnStats({
        newContacts: newC.count ?? 0,
        closedCases: closedC.count ?? 0,
        activeCases: activeC.count ?? 0,
      });
      setPhnLoading(false);
    });
  }, [phnYear, phnMonth]);

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthName = MONTHS[phnMonth - 1];

  const avgAgeDisplay = kpis.avg_age !== null ? String(kpis.avg_age) : '—';

  const formatDisplayDate = (iso: string) =>
    new Date(iso + 'T00:00:00').toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' });

  const dateLabel =
    dateFrom && dateTo ? `${formatDisplayDate(dateFrom)} - ${formatDisplayDate(dateTo)}`
    : dateFrom ? `From ${formatDisplayDate(dateFrom)}`
    : dateTo   ? `To ${formatDisplayDate(dateTo)}`
    : 'All time';

  const excelFilename = (() => {
    if (dateFrom || dateTo) {
      const ref = dateFrom || dateTo;
      const d = new Date(ref + 'T00:00:00');
      return `PHSA_Report_${d.toLocaleString('en-ZA', { month: 'long' })}_${d.getFullYear()}.xlsx`;
    }
    return 'PHSA_Report_All_Time.xlsx';
  })();

  const fetchClientsForPeriod = async (): Promise<Client[]> => {
    let query = supabase.from('phsa_clients').select('*').limit(10000).order('first_contact_date', { ascending: false });
    if (dateFrom) query = query.gte('first_contact_date', dateFrom);
    if (dateTo)   query = query.lte('first_contact_date', dateTo);
    const { data } = await query;
    return (data ?? []) as Client[];
  };

  const handleExportCsv = async () => {
    setExporting(true);
    const data = await fetchClientsForPeriod();
    setExporting(false);
    if (!data.length) return;
    const label = dateFrom && dateTo ? `${dateFrom}_to_${dateTo}` : 'all';
    downloadCsv(csvExport(data), `phsa-clients-${label}.csv`);
  };

  const handleExportExcel = async () => {
    setExportingExcel(true);
    const clientData = await fetchClientsForPeriod();
    setExportingExcel(false);
    const wb = XLSX.utils.book_new();
    const summaryRows = [
      ['Pregnancy Help South Africa — Client Report'],
      [],
      ['Report Period', dateLabel],
      ['Generated', new Date().toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' })],
      [],
      ['Metric', 'Value'],
      ['Total Clients', kpis.total],
      ['Female', kpis.female],
      ['Male', kpis.male],
      ['Average Age', kpis.avg_age ?? '—'],
      ['Referrals', kpis.referrals],
      ['Testimonies', kpis.testimony],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryRows), 'Summary');
    XLSX.utils.book_append_sheet(wb, sheetFromClients(clientData), 'Clients');
    XLSX.utils.book_append_sheet(wb, sheetFromChartData(stats.byReason, 'Reason for Contact'), 'Reason for Contact');
    XLSX.utils.book_append_sheet(wb, sheetFromChartData(stats.byHowFound, 'How Found PHSA'), 'How Found PHSA');
    XLSX.utils.book_append_sheet(wb, sheetFromChartData(stats.byProvince, 'Province'), 'By Province');
    XLSX.utils.book_append_sheet(wb, sheetFromChartData(stats.byDecision.map((r: ChartRow) => ({ name: decisionLabel(r.name), value: r.value })), 'Decision'), 'Decisions');
    XLSX.utils.book_append_sheet(wb, sheetFromChartData(stats.byConclusion, 'Conclusion'), 'Conclusions');
    XLSX.writeFile(wb, excelFilename);
  };

  return (
    <div className="space-y-6">
      <div className="hidden print:block mb-6 pb-4 border-b border-slate-300">
        <h1 className="text-xl font-bold text-slate-800">Pregnancy Help South Africa — Client Report</h1>
        <p className="text-sm text-slate-600 mt-1">Date range: {dateLabel}</p>
        <p className="text-sm text-slate-500">Generated: {new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* ── PHN Monthly Stats ──────────────────────────────────────────────── */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h3 className="font-semibold text-slate-700 text-sm">PHN Monthly Report</h3>
            <p className="text-xs text-slate-400 mt-0.5">Key stats to send to PHN at the start of each month</p>
          </div>
          {/* Month + Year picker */}
          <div className="flex items-center gap-2">
            <select
              className="select w-auto text-sm"
              value={phnMonth}
              onChange={e => setPhnMonth(Number(e.target.value))}
            >
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
            <select
              className="select w-auto text-sm"
              value={phnYear}
              onChange={e => setPhnYear(Number(e.target.value))}
            >
              {Array.from({ length: 6 }, (_, i) => now.getFullYear() - 5 + i + 1).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* New contacts */}
          <div className="bg-primary-50 rounded-xl p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center flex-shrink-0">
              <Users className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-700">
                {phnLoading ? '…' : phnStats.newContacts ?? 0}
              </p>
              <p className="text-sm font-medium text-primary-600">New contacts</p>
              <p className="text-xs text-primary-400">{monthName} {phnYear}</p>
            </div>
          </div>

          {/* Cases closed */}
          <div className="bg-slate-50 rounded-xl p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-500 flex items-center justify-center flex-shrink-0">
              <UserX className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-700">
                {phnLoading ? '…' : phnStats.closedCases ?? 0}
              </p>
              <p className="text-sm font-medium text-slate-600">Cases closed</p>
              <p className="text-xs text-slate-400">{monthName} {phnYear}</p>
            </div>
          </div>

          {/* Total active */}
          <div className="bg-emerald-50 rounded-xl p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center flex-shrink-0">
              <Activity className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-700">
                {phnLoading ? '…' : phnStats.activeCases ?? 0}
              </p>
              <p className="text-sm font-medium text-emerald-600">Active cases</p>
              <p className="text-xs text-emerald-400">All time</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Date range filter + exports ────────────────────────────────────── */}
      <div className="card p-5 print:hidden">
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
            <button onClick={handleExportExcel} disabled={exportingExcel} className="btn-secondary">
              {exportingExcel ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
              {exportingExcel ? 'Fetching...' : 'Export Excel'}
            </button>
            <button onClick={() => window.print()} className="btn-secondary">
              <Printer className="w-4 h-4" /> Export PDF
            </button>
          </div>
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="text-xs text-slate-400 hover:text-slate-600">Clear dates</button>
          )}
        </div>
      </div>

      {/* ── KPI summary ────────────────────────────────────────────────────── */}
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
          <ReportProvinceChart data={stats.byProvince} showTable />
          <ReportBarChart title="Reason for Contact" data={stats.byReason} color="#0d9488" leftMargin={160} showTable tableLabel="Reason for Contact" />
          <ReportBarChart title="How Clients Found PHSA" data={stats.byHowFound} color="#22d3ee" leftMargin={160} showTable tableLabel="How Found PHSA" />
          <ReportBarChart title="Decisions" data={stats.byDecision.map((r: ChartRow) => ({ name: decisionLabel(r.name), value: r.value }))} color="#fb7185" leftMargin={120} showTable tableLabel="Decision" />
          <ReportBarChart title="Conclusions" data={stats.byConclusion} color="#34d399" leftMargin={120} showTable tableLabel="Conclusion" />
          <ContactTimeChart data={stats.timeBands} />
        </div>
      )}
    </div>
  );
}
