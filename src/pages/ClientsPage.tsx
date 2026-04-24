import { useState, useEffect, useCallback, useRef } from 'react';
import { Client, ClientInsert } from '../lib/types';
import { supabase } from '../lib/supabase';
import ClientsTable from '../components/Clients/ClientsTable';
import ClientDetailModal from '../components/Clients/ClientDetailModal';
import FilterSidebar, { Filters } from '../components/Clients/FilterSidebar';
import { Search, UserPlus, SlidersHorizontal, X } from 'lucide-react';

const PAGE_SIZE = 50;

interface Props {
  onRefresh: () => void;
  onAddNew: () => void;
  initialClientId?: string | null;
  onInitialClientOpened?: () => void;
}

const defaultFilters: Filters = {
  search: '',
  dateFrom: '',
  dateTo: '',
  volunteer: '',
  province: '',
  reason: '',
  sex: '',
  conclusion: '',
};

export default function ClientsPage({ onRefresh, onAddNew, initialClientId, onInitialClientOpened }: Props) {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [rows, setRows] = useState<Client[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  // Debounce search so we don't fire on every keystroke
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => setDebouncedSearch(filters.search), 300);
    return () => { if (searchDebounce.current) clearTimeout(searchDebounce.current); };
  }, [filters.search]);

  // Reset to page 0 when filters change
  useEffect(() => { setPage(0); }, [debouncedSearch, filters.volunteer, filters.province, filters.reason, filters.sex, filters.conclusion, filters.dateFrom, filters.dateTo]);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('phsa_clients')
      .select('*', { count: 'exact' })
      .order('first_contact_date', { ascending: false, nullsFirst: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (debouncedSearch) query = query.ilike('client_name', `%${debouncedSearch}%`);
    if (filters.volunteer)  query = query.eq('volunteer', filters.volunteer);
    if (filters.province)   query = query.eq('province', filters.province);
    if (filters.reason)     query = query.eq('reason_for_contact', filters.reason);
    if (filters.sex)        query = query.eq('sex', filters.sex);
    if (filters.conclusion) query = query.eq('conclusion', filters.conclusion);
    if (filters.dateFrom)   query = query.gte('first_contact_date', filters.dateFrom);
    if (filters.dateTo)     query = query.lte('first_contact_date', filters.dateTo);

    const { data, count, error } = await query;
    if (error) console.error('Failed to fetch clients:', error.message);
    setRows((data ?? []) as Client[]);
    setTotalCount(count ?? 0);
    setLoading(false);
  }, [page, debouncedSearch, filters.volunteer, filters.province, filters.reason, filters.sex, filters.conclusion, filters.dateFrom, filters.dateTo]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  useEffect(() => {
    if (!initialClientId) return;
    supabase
      .from('phsa_clients')
      .select('*')
      .eq('id', initialClientId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setSelectedClient(data as Client);
        onInitialClientOpened?.();
      });
  }, [initialClientId]);

  const handleUpdate = async (id: string, data: ClientInsert) => {
    const { error } = await supabase
      .from('phsa_clients')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw new Error(error.message);
    // Refresh the selected client to reflect changes in the modal
    const updated = rows.find(r => r.id === id);
    if (updated) setSelectedClient({ ...updated, ...data } as Client);
    await fetchRows();
    onRefresh();
    setSelectedClient(null);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('phsa_clients').delete().eq('id', id);
    if (error) throw new Error(error.message);
    await fetchRows();
    onRefresh();
  };

  const pageCount = Math.ceil(totalCount / PAGE_SIZE);
  const activeFilterCount = Object.entries(filters).filter(([k, v]) => k !== 'search' && v).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Search by client name..."
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            />
            {filters.search && (
              <button
                onClick={() => setFilters(f => ({ ...f, search: '' }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary relative ${activeFilterCount > 0 ? 'border-primary-300 text-primary-700' : ''}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
        <button onClick={onAddNew} className="btn-primary">
          <UserPlus className="w-4 h-4" /> Add Client
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {showFilters && (
          <FilterSidebar
            filters={filters}
            onChange={f => setFilters(f)}
            onClear={() => setFilters(defaultFilters)}
          />
        )}
        <div className="flex-1 min-w-0">
          <ClientsTable
            clients={rows}
            loading={loading}
            totalCount={totalCount}
            page={page}
            pageCount={pageCount}
            onPageChange={setPage}
            onRowClick={setSelectedClient}
          />
        </div>
      </div>

      <ClientDetailModal
        client={selectedClient}
        onClose={() => setSelectedClient(null)}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}
