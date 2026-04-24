import { Users, TrendingUp, Heart, MapPin, UserCheck } from 'lucide-react';
import { DashboardKPIs } from '../../pages/DashboardPage';

interface Props {
  kpis: DashboardKPIs;
}

export default function KPICards({ kpis }: Props) {
  const { total, women, men, avgAge, referrals, testimonyPotential } = kpis;

  const fmt = (n: number | null) => n === null ? '…' : n.toLocaleString();
  const totalN = total ?? 0;
  const womenPct = totalN > 0 && women !== null ? Math.round((women / totalN) * 100) : null;
  const menPct   = totalN > 0 && men   !== null ? Math.round((men   / totalN) * 100) : null;

  const cards = [
    {
      label: 'Total Clients',
      value: fmt(total),
      sub: 'All time',
      icon: Users,
      gradient: 'from-primary-500 to-primary-600',
    },
    {
      label: 'Gender Split',
      value: womenPct !== null && menPct !== null ? `${womenPct}% / ${menPct}%` : '…',
      sub: women !== null && men !== null
        ? `${women.toLocaleString()} women · ${men.toLocaleString()} men`
        : '',
      icon: UserCheck,
      gradient: 'from-accent-500 to-accent-600',
    },
    {
      label: 'Average Age',
      value: avgAge !== null ? String(avgAge) : '…',
      sub: 'years old',
      icon: TrendingUp,
      gradient: 'from-rose-400 to-rose-500',
    },
    {
      label: 'Total Referrals',
      value: fmt(referrals),
      sub: 'referral_1 or referral_2 filled',
      icon: MapPin,
      gradient: 'from-amber-400 to-amber-500',
    },
    {
      label: 'Testimony Potential',
      value: fmt(testimonyPotential),
      sub: 'Yes · Asked · Received · Provided',
      icon: Heart,
      gradient: 'from-emerald-500 to-teal-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map(card => {
        const Icon = card.icon;
        return (
          <div key={card.label} className={`bg-gradient-to-br ${card.gradient} rounded-xl p-4 text-white shadow-sm`}>
            <div className="flex items-start justify-between mb-3">
              <div className="bg-white/20 rounded-lg p-2">
                <Icon className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold leading-none mb-1">{card.value}</p>
            <p className="text-white/80 text-xs font-medium">{card.label}</p>
            <p className="text-white/60 text-xs mt-0.5">{card.sub}</p>
          </div>
        );
      })}
    </div>
  );
}
