import { Users, TrendingUp, Heart, MapPin, UserCheck } from 'lucide-react';
import { Client } from '../../lib/types';
import { calcAverageAge } from '../../lib/utils';

interface Props {
  clients: Client[];
  totalCount?: number | null;
}

export default function KPICards({ clients, totalCount }: Props) {
  const total = totalCount ?? clients.length;
  const women = clients.filter(c => c.sex === 'F').length;
  const men = clients.filter(c => c.sex === 'M').length;
  const womenPct = total > 0 ? Math.round((women / total) * 100) : 0;
  const menPct = total > 0 ? Math.round((men / total) * 100) : 0;
  const avgAge = calcAverageAge(clients);
  const referrals = clients.filter(c => c.referral_1 || c.referral_2).length;
  const testimonies = clients.filter(c => c.testimony_potential === 'Yes').length;

  const cards = [
    {
      label: 'Total Clients',
      value: total,
      sub: 'All time',
      icon: Users,
      gradient: 'from-primary-500 to-primary-600',
      iconBg: 'bg-white/20',
    },
    {
      label: 'Gender Split',
      value: `${womenPct}% / ${menPct}%`,
      sub: `${women} women · ${men} men`,
      icon: UserCheck,
      gradient: 'from-accent-500 to-accent-600',
      iconBg: 'bg-white/20',
    },
    {
      label: 'Average Age',
      value: avgAge,
      sub: 'years old',
      icon: TrendingUp,
      gradient: 'from-rose-400 to-rose-500',
      iconBg: 'bg-white/20',
    },
    {
      label: 'Total Referrals',
      value: referrals,
      sub: 'Clients referred',
      icon: MapPin,
      gradient: 'from-amber-400 to-warm-500',
      iconBg: 'bg-white/20',
    },
    {
      label: 'Testimony Potential',
      value: testimonies,
      sub: 'Clients flagged',
      icon: Heart,
      gradient: 'from-emerald-500 to-teal-600',
      iconBg: 'bg-white/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map(card => {
        const Icon = card.icon;
        return (
          <div key={card.label} className={`bg-gradient-to-br ${card.gradient} rounded-xl p-4 text-white shadow-sm`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`${card.iconBg} rounded-lg p-2`}>
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
