import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { Client } from '../../lib/types';
import { formatDate } from '../../lib/utils';
import { sexBadge, decisionBadge } from '../ui/Badge';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  clients: Client[];
  loading: boolean;
  totalCount: number;
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  onRowClick: (client: Client) => void;
}

const col = createColumnHelper<Client>();

const columns = [
  col.accessor('first_contact_date', {
    header: 'Date',
    cell: i => <span className="text-slate-500 text-xs">{formatDate(i.getValue())}</span>,
  }),
  col.accessor('client_name', {
    header: 'Client',
    cell: i => <span className="font-medium text-slate-800">{i.getValue()}</span>,
  }),
  col.accessor('volunteer', {
    header: 'Volunteer',
    cell: i => <span className="text-slate-600 text-xs">{i.getValue() ?? '—'}</span>,
  }),
  col.accessor('sex', {
    header: 'Sex',
    cell: i => sexBadge(i.getValue()),
  }),
  col.accessor('age', {
    header: 'Age',
    cell: i => <span className="text-slate-600 text-xs">{i.getValue() ?? '—'}</span>,
  }),
  col.accessor('province', {
    header: 'Province',
    cell: i => <span className="text-slate-600 text-xs">{i.getValue() ?? '—'}</span>,
  }),
  col.accessor('reason_for_contact', {
    header: 'Reason',
    cell: i => {
      const v = i.getValue();
      return <span className="text-slate-600 text-xs line-clamp-1" title={v ?? ''}>{v ?? '—'}</span>;
    },
  }),
  col.accessor('decision', {
    header: 'Decision',
    cell: i => decisionBadge(i.getValue()),
  }),
  col.accessor('testimony_potential', {
    header: 'Testimony',
    cell: i => i.getValue() === 'Yes'
      ? <span className="text-emerald-600 text-xs font-medium">Yes</span>
      : <span className="text-slate-300 text-xs">No</span>,
  }),
];

const SortIcon = ({ sorted }: { sorted: false | 'asc' | 'desc' }) => {
  if (sorted === 'asc') return <ChevronUp className="w-3 h-3" />;
  if (sorted === 'desc') return <ChevronDown className="w-3 h-3" />;
  return <ChevronsUpDown className="w-3 h-3 text-slate-300" />;
};

export default function ClientsTable({ clients, loading, totalCount, page, pageCount, onPageChange, onRowClick }: Props) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data: clients,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount,
  });

  const from = totalCount === 0 ? 0 : page * 50 + 1;
  const to = Math.min((page + 1) * 50, totalCount);

  return (
    <div className="space-y-3">
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {table.getHeaderGroups()[0].headers.map(header => (
                  <th
                    key={header.id}
                    className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap cursor-pointer select-none hover:text-slate-700"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <span className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <SortIcon sorted={header.column.getIsSorted()} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="text-center py-12">
                    <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
                      <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="text-center py-12 text-slate-400 text-sm">
                    No clients found
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row, i) => (
                  <tr
                    key={row.id}
                    onClick={() => onRowClick(row.original)}
                    className={`border-b border-slate-50 cursor-pointer transition-colors hover:bg-primary-50/50 ${
                      i % 2 === 0 ? '' : 'bg-slate-50/30'
                    }`}
                  >
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-3 py-2.5">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          {totalCount === 0
            ? 'No results'
            : `${from}–${to} of ${totalCount} clients`}
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 0 || loading}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-500 px-1">
            {pageCount === 0 ? '—' : `${page + 1} / ${pageCount}`}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= pageCount - 1 || loading}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
