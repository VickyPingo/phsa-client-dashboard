import { Users, TrendingUp, Heart, MapPin, UserCheck } from 'lucide-react';

interface Props {
  totalCount?: number | null;
  genderCounts?: { women: number; men: number } | null;
}

export default function KPICards({ totalCount, genderCounts }: Props) {
  const total   = totalCount ?? 0;
  const women   = genderCounts?.women ?? 0;
  const men     = genderCounts?.men   ?? 0;
  // Percentages include Unknown in denominator
  const womenPct = total > 0 ? Math.round((women / total) * 100) : 0;
  const menPct   = total > 0 ? Math.round((men   / total) * 100) : 0;

  const cards = [
    {
      label: 'Total Clients',
      value: total > 0 ? total.toLocaleString() : '…',
      sub: 'All time',
      icon: Users,
      gradient: 'from-primary-500 to-primary-600',
    },
    {
      label: 'Gender Split',
      value: total > 0 ? `${womenPct}% / ${menPct}%` : '…',
      sub: total > 0 ? `${women.toLocaleString()} women · ${men.toLocaleString()} men · incl. unknown` : '',
      icon: UserCheck,
      gradient: 'from-accent-500 to-accent-600',
    },
    {
      label: 'Average Age',
      value: '—',
      sub: 'years old',
      icon: TrendingUp,
      gradient: 'from-rose-400 to-rose-500',
    },
    {
      label: 'Total Referrals',
      value: '—',
      sub: 'Clients referred',
      icon: MapPin,
      gradient: 'from-amber-400 to-warm-500',
    },
    {
      label: 'Testimony Potential',
      value: '—',
      sub: 'Clients flagged',
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
