import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from '@tanstack/react-table';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Client } from '../../lib/types';
import { formatDate } from '../../lib/utils';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  clients: Client[];
  loading: boolean;
  totalCount: number;
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  onRowClick: (client: Client) => void;
  onNoteUpdate: (id: string, note: string | null, colour: string) => Promise<void>;
}

const NOTE_COLOURS = [
  { label: 'Yellow',  value: '#fef9c3' },
  { label: 'Pink',    value: '#fce7f3' },
  { label: 'Green',   value: '#d1fae5' },
  { label: 'Blue',    value: '#dbeafe' },
  { label: 'Purple',  value: '#ede9fe' },
  { label: 'Orange',  value: '#ffedd5' },
  { label: 'Red',     value: '#fee2e2' },
  { label: 'Teal',    value: '#ccfbf1' },
  { label: 'None',    value: '#f8fafc' },
];

function MarisNoteCell({
  client,
  onUpdate,
}: {
  client: Client;
  onUpdate: (id: string, note: string | null, colour: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(client.maris_note ?? '');
  const [colour, setColour] = useState(client.maris_note_colour ?? '#fef9c3');
  const [saving, setSaving] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNote(client.maris_note ?? '');
    setColour(client.maris_note_colour ?? '#fef9c3');
  }, [client.maris_note, client.maris_note_colour]);

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      const left = Math.min(rect.left, window.innerWidth - 272);
      setPos({ top: rect.bottom + 4, left });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setNote(client.maris_note ?? '');
    setColour(client.maris_note_colour ?? '#fef9c3');
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setSaving(true);
    try {
      await onUpdate(client.id, note.trim() || null, colour);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current && !triggerRef.current.contains(target)) {
        const popover = document.getElementById('maris-note-popover');
        if (popover && popover.contains(target)) return;
        handleClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, client.maris_note, client.maris_note_colour]);

  const popover = open
    ? createPortal(
        <div
          id="maris-note-popover"
          style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999, width: 264 }}
          className="bg-white rounded-xl shadow-2xl border border-slate-200 p-3 space-y-3"
          onClick={e => e.stopPropagation()}
        >
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Mari's Note</p>
          <div className="flex gap-1.5 flex-wrap">
            {NOTE_COLOURS.map(c => (
              <button
                key={c.value}
                onClick={() => setColour(c.value)}
                className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                  colour === c.value ? 'border-slate-500 scale-110' : 'border-slate-200'
                }`}
                style={{ backgroundColor: c.value }}
                title={c.label}
              />
            ))}
          </div>
          <textarea
            className="w-full text-xs border border-slate-200 rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary-400 transition-colors"
            rows={5}
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Add a note for this client..."
            autoFocus
            style={{ backgroundColor: colour }}
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={e => { e.stopPropagation(); handleClose(); }}
              className="text-xs px-2 py-1 text-slate-500 hover:text-slate-700 rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-xs px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>,
        document.body
      )
    : null;

  const bg = client.maris_note_colour ?? '#fef9c3';
  const hasNote = !!client.maris_note;

  return (
    <>
      <div
        ref={triggerRef}
        onClick={handleOpen}
        className="cursor-pointer rounded-lg px-2 py-1 min-w-[130px] max-w-[200px] min-h-[28px] text-xs leading-relaxed line-clamp-2 transition-opacity hover:opacity-80"
        style={{ backgroundColor: hasNote ? bg : '#f1f5f9' }}
        title={client.maris_note ?? 'Click to add note'}
      >
        {hasNote ? (
          <span className="text-slate-700">{client.maris_note}</span>
        ) : (
          <span className="text-slate-400 italic">+ note</span>
        )}
      </div>
      {popover}
    </>
  );
}

const SortIcon = ({ sorted }: { sorted: false | 'asc' | 'desc' }) => {
  if (sorted === 'asc') return <ChevronUp className="w-3 h-3" />;
  if (sorted === 'desc') return <ChevronDown className="w-3 h-3" />;
  return <ChevronsUpDown className="w-3 h-3 text-slate-300" />;
};

const col = createColumnHelper<Client>();

export default function ClientsTable({
  clients,
  loading,
  totalCount,
  page,
  pageCount,
  onPageChange,
  onRowClick,
  onNoteUpdate,
}: Props) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = [
    col.accessor('first_contact_date', {
      header: 'Date',
      cell: i => <span className="text-slate-500 text-xs whitespace-nowrap">{formatDate(i.getValue())}</span>,
    }),
    col.accessor('client_name', {
      header: 'Client',
      cell: i => <span className="font-medium text-slate-800">{i.getValue()}</span>,
    }),
    col.accessor('age', {
      header: 'Age',
      cell: i => <span className="text-slate-600 text-xs">{i.getValue() ?? '—'}</span>,
    }),
    col.accessor('reason_for_contact', {
      header: 'Reason for Contact',
      cell: i => {
        const v = i.getValue();
        return <span className="text-slate-600 text-xs line-clamp-2" title={v ?? ''}>{v ?? '—'}</span>;
      },
    }),
    col.accessor('referral_1', {
      header: 'Referral 1',
      cell: i => <span className="text-slate-600 text-xs">{i.getValue() ?? '—'}</span>,
    }),
    col.accessor('conclusion', {
      header: 'Conclusion',
      cell: i => {
        const v = i.getValue();
        return <span className="text-slate-600 text-xs line-clamp-1" title={v ?? ''}>{v ?? '—'}</span>;
      },
    }),
    col.display({
      id: 'maris_note',
      header: "Mari's Notes",
      enableSorting: false,
      cell: ({ row }) => (
        <MarisNoteCell client={row.original} onUpdate={onNoteUpdate} />
      ),
    }),
  ];

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
                      {header.column.getCanSort() && (
                        <SortIcon sorted={header.column.getIsSorted()} />
                      )}
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
