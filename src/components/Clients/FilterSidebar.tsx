import { X } from 'lucide-react';
import { VOLUNTEERS, PROVINCES, REASONS_FOR_CONTACT, CONCLUSIONS } from '../../lib/types';

export interface Filters {
  search: string;
  dateFrom: string;
  dateTo: string;
  volunteer: string;
  province: string;
  reason: string;
  sex: string;
  conclusion: string;
}

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
  onClear: () => void;
}

export default function FilterSidebar({ filters, onChange, onClear }: Props) {
  const set = (key: keyof Filters, val: string) =>
    onChange({ ...filters, [key]: val });

  return (
    <aside className="w-full lg:w-56 flex-shrink-0 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Filters</p>
        <button onClick={onClear} className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1">
          <X className="w-3 h-3" /> Clear
        </button>
      </div>

      <div className="card p-4 space-y-4">
        <div>
          <label className="label">Date From</label>
          <input type="date" className="input" value={filters.dateFrom} onChange={e => set('dateFrom', e.target.value)} />
        </div>
        <div>
          <label className="label">Date To</label>
          <input type="date" className="input" value={filters.dateTo} onChange={e => set('dateTo', e.target.value)} />
        </div>

        <div>
          <label className="label">Volunteer</label>
          <select className="select" value={filters.volunteer} onChange={e => set('volunteer', e.target.value)}>
            <option value="">All</option>
            {VOLUNTEERS.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        <div>
          <label className="label">Province</label>
          <select className="select" value={filters.province} onChange={e => set('province', e.target.value)}>
            <option value="">All</option>
            {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div>
          <label className="label">Reason</label>
          <select className="select" value={filters.reason} onChange={e => set('reason', e.target.value)}>
            <option value="">All</option>
            {REASONS_FOR_CONTACT.map(r => <option key={r} value={r}>{r.substring(0, 28)}{r.length > 28 ? '…' : ''}</option>)}
          </select>
        </div>

        <div>
          <label className="label">Sex</label>
          <select className="select" value={filters.sex} onChange={e => set('sex', e.target.value)}>
            <option value="">All</option>
            <option value="F">Female</option>
            <option value="M">Male</option>
            <option value="Unknown">Unknown</option>
          </select>
        </div>

        <div>
          <label className="label">Conclusion</label>
          <select className="select" value={filters.conclusion} onChange={e => set('conclusion', e.target.value)}>
            <option value="">All</option>
            {CONCLUSIONS.map(c => <option key={c} value={c}>{c.substring(0, 28)}{c.length > 28 ? '…' : ''}</option>)}
          </select>
        </div>
      </div>
    </aside>
  );
}
