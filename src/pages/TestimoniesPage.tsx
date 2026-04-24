import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Testimony } from '../lib/types';
import { formatDate } from '../lib/utils';
import { Heart, Quote, Calendar, MapPin, AlertCircle } from 'lucide-react';
import Spinner from '../components/ui/Spinner';

export default function TestimoniesPage() {
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [yearFilter, setYearFilter] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('phsa_testimonies')
        .select('*')
        .order('client_name', { ascending: true, nullsFirst: false })
        .order('first_contact_date', { ascending: false, nullsFirst: false });
      if (error) setError(error.message);
      else setTestimonies((data ?? []) as Testimony[]);
      setLoading(false);
    })();
  }, []);

  const years = useMemo(() => {
    const ys = new Set<number>();
    testimonies.forEach(t => {
      if (t.first_contact_date) ys.add(new Date(t.first_contact_date).getFullYear());
    });
    return Array.from(ys).sort((a, b) => b - a);
  }, [testimonies]);

  const filtered = useMemo(() => {
    if (!yearFilter) return testimonies;
    return testimonies.filter(t =>
      t.first_contact_date &&
      new Date(t.first_contact_date).getFullYear() === parseInt(yearFilter)
    );
  }, [testimonies, yearFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-slate-500">
          {loading ? 'Loading…' : `${filtered.length} ${filtered.length === 1 ? 'testimony' : 'testimonies'}`}
        </p>
        <div className="flex items-center gap-2">
          <label className="label mb-0 whitespace-nowrap">Filter by year:</label>
          <select
            className="select w-auto"
            value={yearFilter}
            onChange={e => setYearFilter(e.target.value)}
            disabled={loading}
          >
            <option value="">All years</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <Spinner size="lg" />
            <p className="text-slate-400 text-sm">Loading testimonies…</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center">
            <Heart className="w-8 h-8 text-accent-400" />
          </div>
          <p className="text-slate-500 font-medium">No testimonies found</p>
          <p className="text-slate-400 text-sm text-center max-w-xs">
            {yearFilter ? `No testimonies for ${yearFilter}.` : 'Add records to the phsa_testimonies table to see them here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(t => <TestimonyCard key={t.id} testimony={t} />)}
        </div>
      )}
    </div>
  );
}

function TestimonyCard({ testimony: t }: { testimony: Testimony }) {
  const displayText = t.testimony_edited?.trim() || t.testimony_text?.trim() || null;

  return (
    <div className="card p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-slate-800 text-sm truncate">{t.client_name}</p>
          <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
            <Calendar className="w-3 h-3 flex-shrink-0" />
            {formatDate(t.first_contact_date)}
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-400 to-primary-500 flex items-center justify-center flex-shrink-0">
          <Heart className="w-4 h-4 text-white" fill="white" />
        </div>
      </div>

      {displayText ? (
        <div className="relative">
          <Quote className="absolute -top-1 -left-1 w-5 h-5 text-accent-200" />
          <blockquote className="pl-4 text-sm text-slate-600 leading-relaxed italic border-l-2 border-accent-200">
            "{displayText}"
          </blockquote>
        </div>
      ) : (
        <p className="text-xs text-slate-400 italic">No testimony text available.</p>
      )}

      {(t.province || t.reason_for_contact) && (
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100">
          {t.province && (
            <span className="inline-flex items-center gap-1 text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full font-medium">
              <MapPin className="w-2.5 h-2.5" />
              {t.province}
            </span>
          )}
          {t.reason_for_contact && (
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
              {t.reason_for_contact.length > 30
                ? t.reason_for_contact.substring(0, 28) + '…'
                : t.reason_for_contact}
            </span>
          )}
        </div>
      )}

      {t.testimony_edited?.trim() && (
        <p className="text-xs text-accent-600 font-medium">Edited version</p>
      )}
    </div>
  );
}
