import { useState, useMemo } from 'react';
import { Client } from '../lib/types';
import { formatDate } from '../lib/utils';
import { Heart, Quote, Calendar } from 'lucide-react';

interface Props {
  clients: Client[];
}

export default function TestimoniesPage({ clients }: Props) {
  const testimonies = clients.filter(c => c.testimony_potential === 'Yes' && c.testimony_text);
  const [yearFilter, setYearFilter] = useState('');

  const years = useMemo(() => {
    const ys = new Set<number>();
    testimonies.forEach(c => {
      if (c.first_contact_date) ys.add(new Date(c.first_contact_date).getFullYear());
    });
    return Array.from(ys).sort((a, b) => b - a);
  }, [testimonies]);

  const filtered = useMemo(() => {
    if (!yearFilter) return testimonies;
    return testimonies.filter(c =>
      c.first_contact_date &&
      new Date(c.first_contact_date).getFullYear() === parseInt(yearFilter)
    );
  }, [testimonies, yearFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 mt-0.5">{filtered.length} testimonies</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="label mb-0 whitespace-nowrap">Filter by year:</label>
          <select
            className="select w-auto"
            value={yearFilter}
            onChange={e => setYearFilter(e.target.value)}
          >
            <option value="">All years</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center">
            <Heart className="w-8 h-8 text-accent-400" />
          </div>
          <p className="text-slate-500 font-medium">No testimonies found</p>
          <p className="text-slate-400 text-sm text-center max-w-xs">
            Mark clients as "Testimony Potential: Yes" and add testimony text to see them here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(client => (
            <TestimonyCard key={client.id} client={client} />
          ))}
        </div>
      )}
    </div>
  );
}

function TestimonyCard({ client }: { client: Client }) {
  return (
    <div className="card p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-slate-800 text-sm">{client.client_name}</p>
          <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
            <Calendar className="w-3 h-3" />
            {formatDate(client.first_contact_date)}
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-400 to-primary-500 flex items-center justify-center flex-shrink-0">
          <Heart className="w-4 h-4 text-white" fill="white" />
        </div>
      </div>

      <div className="relative">
        <Quote className="absolute -top-1 -left-1 w-5 h-5 text-accent-200" />
        <blockquote className="pl-4 text-sm text-slate-600 leading-relaxed italic border-l-2 border-accent-200">
          "{client.testimony_text}"
        </blockquote>
      </div>

      <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100">
        {client.province && (
          <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full font-medium">
            {client.province}
          </span>
        )}
        {client.reason_for_contact && (
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
            {client.reason_for_contact.length > 30
              ? client.reason_for_contact.substring(0, 28) + '…'
              : client.reason_for_contact}
          </span>
        )}
        {client.volunteer && (
          <span className="text-xs bg-accent-50 text-accent-700 px-2 py-0.5 rounded-full font-medium">
            {client.volunteer}
          </span>
        )}
      </div>
    </div>
  );
}
