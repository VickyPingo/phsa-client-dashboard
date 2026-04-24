import { Client } from './types';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

export function getYear(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return new Date(dateStr).getFullYear();
}

export function getMonth(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return new Date(dateStr).getMonth();
}

export function calcAverageAge(clients: Client[]): string {
  const ages = clients
    .map(c => parseInt(c.age ?? ''))
    .filter(a => !isNaN(a));
  if (!ages.length) return '—';
  return (ages.reduce((a, b) => a + b, 0) / ages.length).toFixed(1);
}

export function countByKey<T>(items: T[], key: keyof T): Record<string, number> {
  return items.reduce((acc, item) => {
    const val = String(item[key] ?? 'Unknown');
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

export function topN(obj: Record<string, number>, n: number, otherLabel = 'Other') {
  const sorted = Object.entries(obj).sort((a, b) => b[1] - a[1]);
  if (sorted.length <= n) return sorted.map(([name, value]) => ({ name, value }));
  const top = sorted.slice(0, n);
  const otherCount = sorted.slice(n).reduce((s, [, v]) => s + v, 0);
  return [...top.map(([name, value]) => ({ name, value })), { name: otherLabel, value: otherCount }];
}

export function newClientsPerMonth(clients: Client[], year: number) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const counts = new Array(12).fill(0);
  clients.forEach(c => {
    if (!c.first_contact_date) return;
    const d = new Date(c.first_contact_date);
    if (d.getFullYear() === year) counts[d.getMonth()]++;
  });
  return months.map((month, i) => ({ month, count: counts[i] }));
}

export function csvExport(clients: Client[]): string {
  const headers = [
    'ID','First Contact','Client Name','Volunteer','Age','Sex',
    'Reason','How Found','Phone','Province','Referral 1','Referral 2',
    'Follow Up','Contact Made','Decision','Closed','Conclusion',
    'Testimony','Notes'
  ];
  const rows = clients.map(c => [
    c.id, c.first_contact_date ?? '', c.client_name, c.volunteer ?? '',
    c.age ?? '', c.sex ?? '', c.reason_for_contact ?? '', c.how_found_phsa ?? '',
    c.phone_number ?? '', c.province ?? '', c.referral_1 ?? '', c.referral_2 ?? '',
    c.follow_up_date ?? '', c.made_contact_with_pc ?? '', c.decision ?? '',
    c.closed_date ?? '', c.conclusion ?? '', c.testimony_potential ?? '',
    (c.notes ?? '').replace(/,/g, ';'),
  ]);
  return [headers, ...rows].map(r => r.join(',')).join('\n');
}

export function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const DECISION_LABELS: Record<string, string> = {
  P: 'Parenting',
  'AB-P': 'Abortion (Prevented)',
  'AD-P': 'Adoption (Planned)',
  MIS: 'Miscarriage',
  'AB-AB': 'Abortion (Attempted)',
  Other: 'Other',
};

export function decisionLabel(d: string): string {
  return DECISION_LABELS[d] ?? d;
}
