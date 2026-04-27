import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Testimony } from '../lib/types';
import { formatDate } from '../lib/utils';
import { Heart, X, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import Spinner from '../components/ui/Spinner';

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function TestimonyModal({
  testimony,
  onClose,
}: {
  testimony: Testimony;
  onClose: () => void;
}) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-semibold text-slate-800 text-base">{testimony.client_name}</h2>
            <p className="text-xs text-slate-400 mt-0.5">First contact: {formatDate(testimony.first_contact_date)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Dates */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">First Contact</p>
              <p className="text-sm text-slate-700">{formatDate(testimony.first_contact_date)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Testimony Received</p>
              <p className="text-sm text-slate-700">{formatDate(testimony.testimony_received_date)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Published Date</p>
              <p className="text-sm text-slate-700">{formatDate(testimony.published_date)}</p>
            </div>
          </div>

          {/* Testimony received */}
          {testimony.testimony_text && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                Testimony Received
              </p>
              <div className="text-sm text-slate-600 bg-slate-50 rounded-xl p-4 leading-relaxed whitespace-pre-wrap">
                {testimony.testimony_text}
              </div>
            </div>
          )}

          {/* Testimony edited */}
          {testimony.testimony_edited && (
            <div>
              <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wide mb-1.5">
                Testimony Edited Version
              </p>
              <blockquote className="text-sm text-slate-600 bg-emerald-50 border-l-4 border-emerald-400 rounded-r-xl pl-4 pr-3 py-3 leading-relaxed italic whitespace-pre-wrap">
                "{testimony.testimony_edited}"
              </blockquote>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

export default function TestimoniesPage() {
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Testimony | null>(null);
  const [yearFilter, setYearFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('phsa_testimonies')
        .select('*')
        .order('first_contact_date', { ascending: false, nullsFirst: false });
      setTestimonies((data ?? []) as Testimony[]);
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
    let list = testimonies;
    if (yearFilter) {
      list = list.filter(t =>
        t.first_contact_date &&
        new Date(t.first_contact_date).getFullYear() === parseInt(yearFilter)
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t => t.client_name?.toLowerCase().includes(q));
    }
    return list;
  }, [testimonies, yearFilter, search]);

  // Reset to page 0 when filters change
  useEffect(() => { setPage(0); }, [yearFilter, search]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const from = filtered.length === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = Math.min((page + 1) * PAGE_SIZE, filtered.length);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Search by client name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <select
            className="select w-auto"
            value={yearFilter}
            onChange={e => setYearFilter(e.target.value)}
          >
            <option value="">All years</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <p className="text-xs text-slate-400">
          {loading ? 'Loading…' : `${filtered.length} ${filtered.length === 1 ? 'testimony' : 'testimonies'}`}
        </p>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['First Contact', 'Client Name', 'Testimony Received', 'Date Published', 'Testimony Received (text)', 'Edited Version'].map(h => (
                  <th
                    key={h}
                    className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
                      <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center">
                        <Heart className="w-6 h-6 text-accent-400" />
                      </div>
                      <p className="text-slate-400 text-sm">No testimonies found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((t, i) => (
                  <tr
                    key={t.id}
                    onClick={() => setSelected(t)}
                    className={`border-b border-slate-50 cursor-pointer transition-colors hover:bg-primary-50/50 ${
                      i % 2 === 0 ? '' : 'bg-slate-50/30'
                    }`}
                  >
                    {/* First Contact */}
                    <td className="px-3 py-2.5">
                      <span className="text-slate-500 text-xs whitespace-nowrap">{formatDate(t.first_contact_date)}</span>
                    </td>
                    {/* Client Name */}
                    <td className="px-3 py-2.5">
                      <span className="font-medium text-slate-800">{t.client_name}</span>
                    </td>
                    {/* Testimony Received Date */}
                    <td className="px-3 py-2.5">
                      <span className="text-slate-600 text-xs whitespace-nowrap">{formatDate(t.testimony_received_date)}</span>
                    </td>
                    {/* Published Date */}
                    <td className="px-3 py-2.5">
                      <span className="text-slate-600 text-xs whitespace-nowrap">{formatDate(t.published_date)}</span>
                    </td>
                    {/* Testimony text (truncated) */}
                    <td className="px-3 py-2.5 max-w-xs">
                      <span className="text-slate-600 text-xs line-clamp-2">
                        {t.testimony_text ?? '—'}
                      </span>
                    </td>
                    {/* Edited version (truncated) */}
                    <td className="px-3 py-2.5 max-w-xs">
                      {t.testimony_edited ? (
                        <span className="text-emerald-700 text-xs line-clamp-2">
                          {t.testimony_edited}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {!loading && pageCount > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            {filtered.length === 0 ? 'No results' : `${from}–${to} of ${filtered.length} testimonies`}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => p - 1)}
              disabled={page === 0}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-500 px-1">{page + 1} / {pageCount}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= pageCount - 1}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <TestimonyModal testimony={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
