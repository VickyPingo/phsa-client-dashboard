import { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import { Client } from '../lib/types';
import { csvExport, downloadCsv, decisionLabel } from '../lib/utils';
import { ChartRow } from '../hooks/useReportData';
import { Download, Printer, BarChart3, Users, MapPin, Heart, Loader2, FileSpreadsheet } from 'lucide-react';
import { ContactTimeChart, ReportBarChart, ReportProvinceChart } from '../components/Dashboard/Charts';
import { useReportData } from '../hooks/useReportData';

interface Props {
  clients: Client[];
}

function sheetFromChartData(data: ChartRow[], categoryLabel: string): XLSX.WorkSheet {
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const total = sorted.reduce((s, r) => s + r.value, 0);
  const rows = [
    [categoryLabel, 'Count', '%'],
    ...sorted.map(r => [
      r.name,
      r.value,
      total > 0 ? parseFloat(((r.value / total) * 100).toFixed(1)) : 0,
    ]),
    ['TOTAL', total, 100],
  ];
  return XLSX.utils.aoa_to_sheet(rows);
}

function sheetFromClients(clients: Client[]): XLSX.WorkSheet {
  const headers = [
    'Date',
    'Client Name',
    'Volunteer',
    'Age',
    'Sex',
    'Province',
    'Reason for Contact',
    'How Found Us',
    'Phone Number',
    'Referral 1',
    'Referral 2',
    'Follow Up Date',
    'Made Contact with PC',
    'Decision',
    'Closed Date',
    'Conclusion',
    'Testimony Potential',
    'Notes',
    "Mari's Note",
  ];

  const rows = clients.map(c => [
    c.first_contact_date ?? '',
    c.client_name ?? '',
    c.volunteer ?? '',
    c.age ?? '',
    c.sex ?? '',
    c.province ?? '',
    c.reason_for_contact ?? '',
    c.how_found_us ?? '',
    c.phone_number ?? '',
    c.referral_1 ?? '',
    c.referral_2 ?? '',
    c.follow_up_date ?? '',
    c.made_contact_with_pc ?? '',
    c.decision ?? '',
    c.closed_date ?? '',
    c.conclusion ?? '',
    c.testimony_potential ?? '',
    (c.notes ?? '').replace(/\n/g, ' '),
    (c.maris_note ?? '').replace(/\n/g, ' '),
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // Set column widths
  ws['!cols'] = [
    { wch: 12 }, // Date
    { wch: 24 }, // Client Name
    { wch: 14 }, // Volunteer
    { wch: 6  }, // Age
    { wch: 8  }, // Sex
    { wch: 14 }, // Province
    { wch: 38 }, // Reason for Contact
    { wch: 18 }, // How Found Us
    { wch: 16 }, // Phone Number
    { wch: 22 }, // Referral 1
    { wch: 22 }, // Referral 2
    { wch: 12 }, // Follow Up Date
    { wch: 20 }, // Made Contact with PC
    { wch: 10 }, // Decision
    { wch: 12 }, // Closed Date
    { wch: 34 }, // Conclusion
    { wch: 18 }, // Testimony Potential
    { wch: 40 }, // Notes
    { wch: 30 }, // Mari's Note
  ];

  return ws;
}

export default function ReportsPage(_: Props) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  const { stats, loading } = useReportData(dateFrom, dateTo);
  const { kpis } = stats;

  const avgAgeDisplay = kpis.avg_age !== null ? String(kpis.avg_age) : '—';

  const formatDisplayDate = (iso: string) =>
    new Date(iso + 'T00:00:00').toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' });

  const dateLabel =
    dateFrom && dateTo ? `${formatDisplayDate(dateFrom)} - ${formatDisplayDate(dateTo)}`
    : dateFrom         ? `From ${formatDisplayDate(dateFrom)}`
    : dateTo           ? `To ${formatDisplayDate(dateTo)}`
    : 'All time';

  const excelFilename = (() => {
    if (dateFrom || dateTo) {
      const ref = dateFrom || dateTo;
      const d = new Date(ref + 'T00:00:00');
      const month = d.toLocaleString('en-ZA', { month: 'long' });
      return `PHSA_Report_${month}_${d.getFullYear()}.xlsx`;
    }
    return 'PHSA_Report_All_Time.xlsx';
  })();

  const fetchClientsForPeriod = async (): Promise<Client[]> => {
    let query = supabase
      .from('phsa_clients')
      .select('*')
      .limit(10000)
      .order('first_contact_date', { ascending: false });
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
    const csv = csvExport(data);
    const label = dateFrom && dateTo ? `${dateFrom}_to_${dateTo}` : 'all';
    downloadCsv(csv, `phsa-clients-${label}.csv`);
  };

  const handleExportExcel = async () => {
    setExportingExcel(true);
    const clientData = await fetchClientsForPeriod();
    setExportingExcel(false);

    const wb = XLSX.utils.book_new();

    // Tab 1 — Summary
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

    // Tab 2 — Raw clients for the period
    XLSX.utils.book_append_sheet(wb, sheetFromClients(clientData), 'Clients');

    // Tab 3+ — Aggregate charts
    XLSX.utils.book_append_sheet(wb, sheetFromChartData(stats.byReason, 'Reason for Contact'), 'Reason for Contact');
    XLSX.utils.book_append_sheet(wb, sheetFromChartData(stats.byHowFound, 'How Found PHSA'), 'How Found PHSA');
    XLSX.utils.book_append_sheet(wb, sheetFromChartData(stats.byProvince, 'Province'), 'By Province');
    XLSX.utils.book_append_sheet(
      wb,
      sheetFromChartData(stats.byDecision.map((r: ChartRow) => ({ name: decisionLabel(r.name), value: r.value })), 'Decision'),
      'Decisions',
    );
    XLSX.utils.book_append_sheet(wb, sheetFromChartData(stats.byConclusion, 'Conclusion'), 'Conclusions');
    XLSX.utils.book_append_sheet(wb, sheetFromChartData(stats.byVolunteer, 'Volunteer'), 'Cases per Volunteer');

    XLSX.writeFile(wb, excelFilename);
  };

  const handlePrint = () => window.print();

  return (
    <div className="space-y-6">
      {/* Print-only header */}
      <div className="hidden print:block mb-6 pb-4 border-b border-slate-300">
        <h1 className="text-xl font-bold text-slate-800">Pregnancy Help South Africa — Client Report</h1>
        <p className="text-sm text-slate-600 mt-1">Date range: {dateLabel}</p>
        <p className="text-sm text-slate-500">Generated: {new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

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
            <button onClick={handlePrint} className="btn-secondary">
              <Printer className="w-4 h-4" />
              Export PDF
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
          <ContactTimeChart data={stats.timeBands} />
        </div>
      )}
    </div>
  );
}
