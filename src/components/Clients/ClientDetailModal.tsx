import { useState } from 'react';
import { Client, ClientInsert } from '../../lib/types';
import { formatDate } from '../../lib/utils';
import Modal from '../ui/Modal';
import ClientForm from './ClientForm';
import Badge, { sexBadge, decisionBadge, testimonyBadge } from '../ui/Badge';
import { CreditCard as Edit2, Trash2, Phone, MapPin, Calendar, User, Heart } from 'lucide-react';

interface Props {
  client: Client | null;
  onClose: () => void;
  onUpdate: (id: string, data: ClientInsert) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-slate-700">{value || <span className="text-slate-300">—</span>}</p>
    </div>
  );
}

export default function ClientDetailModal({ client, onClose, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!client) return null;

  const handleUpdate = async (data: ClientInsert) => {
    await onUpdate(client.id, data);
    setEditing(false);
  };

  const handleDelete = async () => {
    await onDelete(client.id);
    onClose();
  };

  if (editing) {
    return (
      <Modal open title={`Edit — ${client.client_name}`} onClose={() => setEditing(false)} size="2xl">
        <ClientForm
          initial={client as ClientInsert}
          onSubmit={handleUpdate}
          onCancel={() => setEditing(false)}
          submitLabel="Update Client"
        />
      </Modal>
    );
  }

  return (
    <Modal open title={client.client_name} onClose={onClose} size="2xl">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2 items-center">
          {sexBadge(client.sex)}
          {decisionBadge(client.decision)}
          {client.testimony_potential === 'Yes' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
              <Heart className="w-3 h-3" /> Testimony
            </span>
          )}
          {client.province && <Badge color="teal">{client.province}</Badge>}
          {client.volunteer && <Badge color="teal">{client.volunteer}</Badge>}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl">
          <Detail label="First Contact" value={formatDate(client.first_contact_date)} />
          <Detail label="Follow Up" value={formatDate(client.follow_up_date)} />
          <Detail label="Closed" value={formatDate(client.closed_date)} />
          <Detail label="Age" value={client.age} />
          <Detail label="Phone" value={client.phone_number} />
          <Detail label="Contact Made?" value={client.made_contact_with_pc} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Detail label="Reason for Contact" value={client.reason_for_contact} />
          <Detail label="How Found PHSA" value={client.how_found_phsa} />
          <Detail label="Referral 1" value={client.referral_1} />
          <Detail label="Referral 2" value={client.referral_2} />
          <Detail label="Conclusion" value={client.conclusion} />
        </div>

        {client.notes && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Notes</p>
            <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3 leading-relaxed whitespace-pre-wrap">
              {client.notes}
            </p>
          </div>
        )}

        {client.testimony_text && (
          <div>
            <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wide mb-1.5">Testimony</p>
            <blockquote className="text-sm text-slate-600 bg-emerald-50 border-l-4 border-emerald-400 rounded-r-xl pl-4 pr-3 py-3 leading-relaxed italic">
              "{client.testimony_text}"
            </blockquote>
          </div>
        )}

        {confirmDelete ? (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
            <p className="text-sm font-medium text-rose-700 mb-3">Delete this client record permanently?</p>
            <div className="flex gap-2">
              <button onClick={handleDelete} className="btn-danger text-xs py-1.5">Yes, delete</button>
              <button onClick={() => setConfirmDelete(false)} className="btn-secondary text-xs py-1.5">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button onClick={() => setConfirmDelete(true)} className="btn-secondary text-xs gap-1.5">
              <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Delete
            </button>
            <button onClick={() => setEditing(true)} className="btn-primary text-xs gap-1.5">
              <Edit2 className="w-3.5 h-3.5" /> Edit
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
