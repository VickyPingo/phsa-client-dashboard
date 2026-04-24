import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { decisionLabel } from '../../lib/utils';
import { ChartRow } from '../../hooks/useReportData';

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

export function NewClientsChart({
  data,
  year,
  loading,
}: {
  data: { month: string; count: number }[];
  year: number;
  loading?: boolean;
}) {
  return (
    <ChartCard title={`New Clients per Month (${year})`}>
      {loading ? (
        <div className="flex items-center justify-center h-[400px]">
          <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" name="Clients" fill="#0d9488" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

export function ReasonChart({ data }: { data: ChartRow[] }) {
  const top = data.slice(0, 8);
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

export function HowFoundChart({ data }: { data: ChartRow[] }) {
  const barHeight = Math.max(400, data.length * 36);
  return (
    <ChartCard title="How Clients Found PHSA">
      <ResponsiveContainer width="100%" height={barHeight}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 150, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} width={148} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" name="Clients" fill="#0d9488" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function ProvinceChart({ data }: { data: ChartRow[] }) {
  return (
    <ChartCard title="Clients by Province">
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            angle={-45}
            textAnchor="end"
            interval={0}
          />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" name="Clients" fill="#fb923c" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function ConclusionChart({ data }: { data: ChartRow[] }) {
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

export function DecisionChart({ data }: { data: ChartRow[] }) {
  const mapped = data.map(r => ({ ...r, name: decisionLabel(r.name) }));
  return (
    <ChartCard title="Decisions">
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={mapped} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" name="Cases" fill="#fb7185" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

const TIME_BAND_ORDER = ['Morning', 'Lunch', 'Afternoon', 'Evening', 'Night', 'Early Hours'];

export function ContactTimeChart({ data }: { data: ChartRow[] }) {
  const ordered = TIME_BAND_ORDER.map(name => ({
    name,
    value: data.find(r => r.name === name)?.value ?? 0,
  }));
  const total = ordered.reduce((s, d) => s + d.value, 0);

  return (
    <ChartCard title="Time of First Contact">
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={ordered} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} />
          <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" name="Clients" fill="#22d3ee" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      {total === 0 && (
        <p className="text-xs text-slate-400 text-center -mt-2">No time data yet</p>
      )}
      <p className="text-xs text-slate-400 mt-2">Based on clients added via chat extraction</p>
    </ChartCard>
  );
}

export function VolunteerChart({ data }: { data: ChartRow[] }) {
  const barHeight = Math.max(400, data.length * 36);
  return (
    <ChartCard title="Cases per Volunteer">
      <ResponsiveContainer width="100%" height={barHeight}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 80, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} width={78} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" name="Cases" fill="#34d399" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// Generic horizontal bar chart for Reports page
export function ReportBarChart({
  title,
  data,
  color = '#0d9488',
  leftMargin = 120,
}: {
  title: string;
  data: ChartRow[];
  color?: string;
  leftMargin?: number;
}) {
  const barHeight = Math.max(450, data.length * 36);
  return (
    <ChartCard title={title}>
      <ResponsiveContainer width="100%" height={barHeight}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: leftMargin, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} width={leftMargin - 2} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" name="Clients" fill={color} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function ReportProvinceChart({ data }: { data: ChartRow[] }) {
  return (
    <ChartCard title="Clients by Province">
      <ResponsiveContainer width="100%" height={450}>
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 80 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            angle={-45}
            textAnchor="end"
            interval={0}
          />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" name="Clients" fill="#fb923c" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
