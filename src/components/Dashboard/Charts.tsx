import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Client } from '../../lib/types';
import { countByKey, topN, decisionLabel } from '../../lib/utils';

const PALETTE = [
  '#0d9488', '#a855f7', '#fb923c', '#fb7185', '#22d3ee',
  '#f59e0b', '#34d399', '#818cf8',
];

const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="card p-5">
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
        <div className="flex items-center justify-center h-[220px]">
          <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" name="Clients" fill="#0d9488" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

export function ReasonChart({ clients }: { clients: Client[] }) {
  const counts = countByKey(clients, 'reason_for_contact');
  const data = topN(counts, 6);
  return (
    <ChartCard title="Reason for Contact">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
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

export function HowFoundChart({ clients }: { clients: Client[] }) {
  const counts = countByKey(clients, 'how_found_us');
  const data = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));
  return (
    <ChartCard title="How Clients Found PHSA">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} width={90} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" name="Clients" fill="#a855f7" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function ProvinceChart({ clients }: { clients: Client[] }) {
  const counts = countByKey(clients, 'province');
  const data = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));
  return (
    <ChartCard title="Clients by Province">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 0, right: 4, left: -20, bottom: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} angle={-30} textAnchor="end" />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" name="Clients" fill="#fb923c" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function ConclusionChart({ clients }: { clients: Client[] }) {
  const counts = countByKey(clients.filter(c => c.conclusion), 'conclusion');
  const data = Object.entries(counts).map(([name, value]) => ({ name, value }));
  return (
    <ChartCard title="Conclusion Outcomes">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
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

export function DecisionChart({ clients }: { clients: Client[] }) {
  const counts = countByKey(clients.filter(c => c.decision), 'decision');
  const data = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name: decisionLabel(name), code: name, value }));
  return (
    <ChartCard title="Decisions">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
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

export function VolunteerChart({ clients }: { clients: Client[] }) {
  const counts = countByKey(clients.filter(c => c.volunteer), 'volunteer');
  const data = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));
  return (
    <ChartCard title="Cases per Volunteer">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} width={60} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" name="Cases" fill="#34d399" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
