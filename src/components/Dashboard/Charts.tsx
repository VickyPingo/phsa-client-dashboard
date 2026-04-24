import { useState, useEffect } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { decisionLabel } from '../../lib/utils';
import { ChartRow } from '../../hooks/useReportData';

// ─── mobile detection ────────────────────────────────────────────────────────

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return mobile;
}

// ─── shared helpers ───────────────────────────────────────────────────────────

function DataTable({ data, categoryLabel }: { data: ChartRow[]; categoryLabel: string }) {
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const total = sorted.reduce((s, r) => s + r.value, 0);
  if (!sorted.length) return null;
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-slate-100">
            <th className="text-left px-3 py-2 font-semibold text-slate-600 border border-slate-200">{categoryLabel}</th>
            <th className="text-right px-3 py-2 font-semibold text-slate-600 border border-slate-200 w-24">Count</th>
            <th className="text-right px-3 py-2 font-semibold text-slate-600 border border-slate-200 w-16">%</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr key={row.name} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
              <td className="px-3 py-1.5 text-slate-700 border border-slate-200">{row.name}</td>
              <td className="px-3 py-1.5 text-right text-slate-700 border border-slate-200 tabular-nums">
                {row.value.toLocaleString()}
              </td>
              <td className="px-3 py-1.5 text-right text-slate-500 border border-slate-200 tabular-nums">
                {total > 0 ? ((row.value / total) * 100).toFixed(1) + '%' : '—'}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-slate-100 font-bold">
            <td className="px-3 py-2 text-slate-700 border border-slate-200">TOTAL</td>
            <td className="px-3 py-2 text-right text-slate-700 border border-slate-200 tabular-nums">
              {total.toLocaleString()}
            </td>
            <td className="px-3 py-2 text-right text-slate-700 border border-slate-200">100%</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// Scrollable wrapper for mobile charts
function ScrollableChart({ minWidth, children }: { minWidth: number; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto -mx-1">
      <div style={{ minWidth }}>
        {children}
      </div>
    </div>
  );
}

// "Show all" toggle for mobile bar charts with many categories
function useShowAll(isMobile: boolean, threshold: number, data: ChartRow[]) {
  const [showAll, setShowAll] = useState(false);
  const needsToggle = isMobile && data.length > threshold;
  const visible = needsToggle && !showAll ? data.slice(0, threshold) : data;
  return { visible, showAll, setShowAll, needsToggle };
}

const PALETTE = [
  '#0d9488', '#fb923c', '#fb7185', '#22d3ee',
  '#f59e0b', '#34d399', '#818cf8', '#64748b',
];

const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="card p-5 w-full">
    <h3 className="font-semibold text-slate-700 text-sm mb-4">{title}</h3>
    {children}
  </div>
);

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color || p.fill }}>
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

function ShowAllToggle({ showAll, setShowAll, total, shown }: {
  showAll: boolean; setShowAll: (v: boolean) => void; total: number; shown: number;
}) {
  return (
    <button
      onClick={() => setShowAll(!showAll)}
      className="mt-3 w-full text-xs text-teal-600 hover:text-teal-800 font-medium py-1.5 border border-teal-200 rounded-lg bg-teal-50 hover:bg-teal-100 transition-colors"
    >
      {showAll ? 'Show top 5 only' : `Show all ${total} entries`}
      {!showAll && ` (showing ${shown} of ${total})`}
    </button>
  );
}

// ─── NewClientsChart ──────────────────────────────────────────────────────────

export function NewClientsChart({
  data,
  year,
  loading,
}: {
  data: { month: string; count: number }[];
  year: number;
  loading?: boolean;
}) {
  const isMobile = useIsMobile();
  const [showAll, setShowAll] = useState(false);

  const visible = isMobile && !showAll ? data.slice(-6) : data;
  const needsToggle = isMobile && data.length > 6;

  const tick = { fontSize: isMobile ? 11 : 12, fill: '#94a3b8' };

  return (
    <ChartCard title={`New Clients per Month (${year})`}>
      {loading ? (
        <div className="flex items-center justify-center h-[300px]">
          <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <ScrollableChart minWidth={isMobile ? 500 : 0}>
            <ResponsiveContainer width="100%" height={isMobile ? 280 : 400}>
              <BarChart data={visible} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={tick} />
                <YAxis tick={tick} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Clients" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ScrollableChart>
          {needsToggle && (
            <ShowAllToggle showAll={showAll} setShowAll={setShowAll} total={data.length} shown={visible.length} />
          )}
        </>
      )}
    </ChartCard>
  );
}

// ─── ReasonChart (pie/donut) ──────────────────────────────────────────────────

export function ReasonChart({ data }: { data: ChartRow[] }) {
  const isMobile = useIsMobile();
  const top = data.slice(0, 8);

  if (isMobile) {
    return (
      <ChartCard title="Reason for Contact">
        <div style={{ height: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={top}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
              >
                {top.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {top.map((entry, i) => (
            <div key={entry.name} className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PALETTE[i % PALETTE.length] }} />
              {entry.name}
            </div>
          ))}
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Reason for Contact">
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={top}
            dataKey="value"
            cx="50%"
            cy="45%"
            innerRadius={80}
            outerRadius={140}
            paddingAngle={3}
          >
            {top.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(v) => <span className="text-xs text-slate-600">{v}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── HowFoundChart ────────────────────────────────────────────────────────────

export function HowFoundChart({ data }: { data: ChartRow[] }) {
  const isMobile = useIsMobile();
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const { visible, showAll, setShowAll, needsToggle } = useShowAll(isMobile, 5, sorted);

  const barHeight = Math.max(isMobile ? 250 : 400, visible.length * 36);
  const tick = { fontSize: 11, fill: '#64748b' };
  const axisTick = { fontSize: 11, fill: '#94a3b8' };

  return (
    <ChartCard title="How Clients Found PHSA">
      <ScrollableChart minWidth={isMobile ? 500 : 0}>
        <ResponsiveContainer width="100%" height={barHeight}>
          <BarChart data={visible} layout="vertical" margin={{ top: 4, right: 24, left: 150, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis type="number" tick={axisTick} allowDecimals={false} />
            <YAxis type="category" dataKey="name" tick={tick} width={148} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" name="Clients" fill="#0d9488" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ScrollableChart>
      {needsToggle && (
        <ShowAllToggle showAll={showAll} setShowAll={setShowAll} total={sorted.length} shown={visible.length} />
      )}
    </ChartCard>
  );
}

// ─── ProvinceChart ────────────────────────────────────────────────────────────

export function ProvinceChart({ data }: { data: ChartRow[] }) {
  const isMobile = useIsMobile();
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const { visible, showAll, setShowAll, needsToggle } = useShowAll(isMobile, 5, sorted);

  const tick = { fontSize: 11, fill: '#94a3b8' };

  return (
    <ChartCard title="Clients by Province">
      <ScrollableChart minWidth={isMobile ? 500 : 0}>
        <ResponsiveContainer width="100%" height={isMobile ? 280 : 400}>
          <BarChart data={visible} margin={{ top: 8, right: 16, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="name"
              tick={tick}
              angle={-45}
              textAnchor="end"
              interval={0}
            />
            <YAxis tick={tick} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" name="Clients" fill="#fb923c" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ScrollableChart>
      {needsToggle && (
        <ShowAllToggle showAll={showAll} setShowAll={setShowAll} total={sorted.length} shown={visible.length} />
      )}
    </ChartCard>
  );
}

// ─── ConclusionChart (pie/donut) ──────────────────────────────────────────────

export function ConclusionChart({ data }: { data: ChartRow[] }) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <ChartCard title="Conclusion Outcomes">
        <div style={{ height: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {data.map((entry, i) => (
            <div key={entry.name} className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PALETTE[i % PALETTE.length] }} />
              {entry.name}
            </div>
          ))}
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Conclusion Outcomes">
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            cx="50%"
            cy="45%"
            innerRadius={80}
            outerRadius={140}
            paddingAngle={3}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(v) => <span className="text-xs text-slate-600">{v}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── DecisionChart ────────────────────────────────────────────────────────────

export function DecisionChart({ data }: { data: ChartRow[] }) {
  const isMobile = useIsMobile();
  const mapped = data.map(r => ({ ...r, name: decisionLabel(r.name) }));
  const tick = { fontSize: isMobile ? 11 : 10, fill: '#94a3b8' };

  return (
    <ChartCard title="Decisions">
      <ScrollableChart minWidth={isMobile ? 500 : 0}>
        <ResponsiveContainer width="100%" height={isMobile ? 260 : 400}>
          <BarChart data={mapped} margin={{ top: 8, right: 16, left: 0, bottom: isMobile ? 40 : 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="name"
              tick={tick}
              angle={isMobile ? -30 : 0}
              textAnchor={isMobile ? 'end' : 'middle'}
              interval={0}
            />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" name="Cases" fill="#fb7185" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ScrollableChart>
    </ChartCard>
  );
}

// ─── ContactTimeChart ─────────────────────────────────────────────────────────

const TIME_BAND_ORDER = ['Morning', 'Lunch', 'Afternoon', 'Evening', 'Night', 'Early Hours'];

export function ContactTimeChart({ data }: { data: ChartRow[] }) {
  const isMobile = useIsMobile();
  const ordered = TIME_BAND_ORDER.map(name => ({
    name,
    value: data.find(r => r.name === name)?.value ?? 0,
  }));
  const total = ordered.reduce((s, d) => s + d.value, 0);
  const tick = { fontSize: isMobile ? 11 : 12, fill: '#94a3b8' };

  return (
    <ChartCard title="Time of First Contact">
      <ScrollableChart minWidth={isMobile ? 500 : 0}>
        <ResponsiveContainer width="100%" height={isMobile ? 260 : 400}>
          <BarChart data={ordered} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={tick} />
            <YAxis tick={tick} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" name="Clients" fill="#22d3ee" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ScrollableChart>
      {total === 0 && (
        <p className="text-xs text-slate-400 text-center mt-2">No time data yet</p>
      )}
      <p className="text-xs text-slate-400 mt-2">Based on clients added via chat extraction</p>
    </ChartCard>
  );
}

// ─── VolunteerChart ───────────────────────────────────────────────────────────

export function VolunteerChart({ data }: { data: ChartRow[] }) {
  const isMobile = useIsMobile();
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const { visible, showAll, setShowAll, needsToggle } = useShowAll(isMobile, 5, sorted);

  const barHeight = Math.max(isMobile ? 240 : 400, visible.length * 36);
  const tick = { fontSize: 11, fill: '#64748b' };
  const axisTick = { fontSize: 11, fill: '#94a3b8' };

  return (
    <ChartCard title="Cases per Volunteer">
      <ScrollableChart minWidth={isMobile ? 500 : 0}>
        <ResponsiveContainer width="100%" height={barHeight}>
          <BarChart data={visible} layout="vertical" margin={{ top: 4, right: 24, left: 80, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis type="number" tick={axisTick} allowDecimals={false} />
            <YAxis type="category" dataKey="name" tick={tick} width={78} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" name="Cases" fill="#34d399" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ScrollableChart>
      {needsToggle && (
        <ShowAllToggle showAll={showAll} setShowAll={setShowAll} total={sorted.length} shown={visible.length} />
      )}
    </ChartCard>
  );
}

// ─── ReportBarChart (Reports page) ───────────────────────────────────────────

export function ReportBarChart({
  title,
  data,
  color = '#0d9488',
  leftMargin = 120,
  showTable = false,
  tableLabel,
}: {
  title: string;
  data: ChartRow[];
  color?: string;
  leftMargin?: number;
  showTable?: boolean;
  tableLabel?: string;
}) {
  const isMobile = useIsMobile();
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const { visible, showAll, setShowAll, needsToggle } = useShowAll(isMobile, 5, sorted);

  const barHeight = Math.max(isMobile ? 240 : 450, visible.length * 36);
  const tick = { fontSize: 11, fill: '#64748b' };
  const axisTick = { fontSize: 11, fill: '#94a3b8' };

  return (
    <ChartCard title={title}>
      <ScrollableChart minWidth={isMobile ? 500 : 0}>
        <ResponsiveContainer width="100%" height={barHeight}>
          <BarChart data={visible} layout="vertical" margin={{ top: 4, right: 24, left: leftMargin, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis type="number" tick={axisTick} allowDecimals={false} />
            <YAxis type="category" dataKey="name" tick={tick} width={leftMargin - 2} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" name="Clients" fill={color} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ScrollableChart>
      {needsToggle && (
        <ShowAllToggle showAll={showAll} setShowAll={setShowAll} total={sorted.length} shown={visible.length} />
      )}
      {showTable && <DataTable data={data} categoryLabel={tableLabel ?? title} />}
    </ChartCard>
  );
}

// ─── ReportProvinceChart (Reports page) ──────────────────────────────────────

export function ReportProvinceChart({ data, showTable }: { data: ChartRow[]; showTable?: boolean }) {
  const isMobile = useIsMobile();
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const { visible, showAll, setShowAll, needsToggle } = useShowAll(isMobile, 5, sorted);

  const tick = { fontSize: 11, fill: '#94a3b8' };

  return (
    <ChartCard title="Clients by Province">
      <ScrollableChart minWidth={isMobile ? 500 : 0}>
        <ResponsiveContainer width="100%" height={isMobile ? 280 : 450}>
          <BarChart data={visible} margin={{ top: 8, right: 16, left: 0, bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="name"
              tick={tick}
              angle={-45}
              textAnchor="end"
              interval={0}
            />
            <YAxis tick={tick} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" name="Clients" fill="#fb923c" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ScrollableChart>
      {needsToggle && (
        <ShowAllToggle showAll={showAll} setShowAll={setShowAll} total={sorted.length} shown={visible.length} />
      )}
      {showTable && <DataTable data={data} categoryLabel="Province" />}
    </ChartCard>
  );
}
