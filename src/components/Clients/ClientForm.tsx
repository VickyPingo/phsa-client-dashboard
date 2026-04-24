import { useState, useEffect } from 'react';
import { Client, ClientInsert, VOLUNTEERS, PROVINCES, REASONS_FOR_CONTACT, HOW_FOUND_OPTIONS, CONCLUSIONS, DECISIONS, MADE_CONTACT_OPTIONS } from '../../lib/types';

interface Props {
  initial?: Partial<ClientInsert>;
  onSubmit: (data: ClientInsert) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

const empty: ClientInsert = {
  first_contact_date: null,
  client_name: '',
  volunteer: null,
  age: null,
  sex: null,
  reason_for_contact: null,
  how_found_us: null,
  phone_number: null,
  province: null,
  referral_1: null,
  referral_2: null,
  follow_up_date: null,
  made_contact_with_pc: null,
  decision: null,
  closed_date: null,
  conclusion: null,
  testimony_potential: 'No',
  testimony_text: null,
  notes: null,
};

export default function ClientForm({ initial, onSubmit, onCancel, submitLabel = 'Save Client' }: Props) {
  const [form, setForm] = useState<ClientInsert>({ ...empty, ...initial });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) setForm({ ...empty, ...initial });
  }, [JSON.stringify(initial)]);

  const set = (key: keyof ClientInsert, value: string | null) => {
    setForm(f => ({ ...f, [key]: value || null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client_name.trim()) return;
    setSaving(true);
    try {
      await onSubmit(form);
    } finally {
      setSaving(false);
    }
  };

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Client Name *">
          <input className="input" value={form.client_name} onChange={e => set('client_name', e.target.value)} required placeholder="Full name" />
        </Field>
        <Field label="First Contact Date">
          <input type="date" className="input" value={form.first_contact_date ?? ''} onChange={e => set('first_contact_date', e.target.value)} />
        </Field>
        <Field label="Volunteer">
          <select className="select" value={form.volunteer ?? ''} onChange={e => set('volunteer', e.target.value)}>
            <option value="">Select volunteer</option>
            {VOLUNTEERS.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </Field>
        <Field label="Phone Number">
          <input className="input" value={form.phone_number ?? ''} onChange={e => set('phone_number', e.target.value)} placeholder="e.g. 0821234567" />
        </Field>
        <Field label="Age">
          <input className="input" value={form.age ?? ''} onChange={e => set('age', e.target.value)} placeholder="Number or Unknown" />
        </Field>
        <Field label="Sex">
          <select className="select" value={form.sex ?? ''} onChange={e => set('sex', e.target.value)}>
            <option value="">Select</option>
            <option value="F">Female</option>
            <option value="M">Male</option>
            <option value="Unknown">Unknown</option>
          </select>
        </Field>
        <Field label="Province">
          <select className="select" value={form.province ?? ''} onChange={e => set('province', e.target.value)}>
            <option value="">Select province</option>
            {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="How Found PHSA">
          <select className="select" value={form.how_found_us ?? ''} onChange={e => set('how_found_us', e.target.value)}>
            <option value="">Select source</option>
            {HOW_FOUND_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Reason for Contact">
        <select className="select" value={form.reason_for_contact ?? ''} onChange={e => set('reason_for_contact', e.target.value)}>
          <option value="">Select reason</option>
          {REASONS_FOR_CONTACT.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Referral Centre 1">
          <input className="input" value={form.referral_1 ?? ''} onChange={e => set('referral_1', e.target.value)} placeholder="Centre name" />
        </Field>
        <Field label="Referral Centre 2">
          <input className="input" value={form.referral_2 ?? ''} onChange={e => set('referral_2', e.target.value)} placeholder="Centre name" />
        </Field>
        <Field label="Follow Up Date">
          <input type="date" className="input" value={form.follow_up_date ?? ''} onChange={e => set('follow_up_date', e.target.value)} />
        </Field>
        <Field label="Made Contact with PC?">
          <select className="select" value={form.made_contact_with_pc ?? ''} onChange={e => set('made_contact_with_pc', e.target.value)}>
            <option value="">Select</option>
            {MADE_CONTACT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="Decision">
          <select className="select" value={form.decision ?? ''} onChange={e => set('decision', e.target.value)}>
            <option value="">Select</option>
            {DECISIONS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </Field>
        <Field label="Closed Date">
          <input type="date" className="input" value={form.closed_date ?? ''} onChange={e => set('closed_date', e.target.value)} />
        </Field>
      </div>

      <Field label="Conclusion">
        <select className="select" value={form.conclusion ?? ''} onChange={e => set('conclusion', e.target.value)}>
          <option value="">Select conclusion</option>
          {CONCLUSIONS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Testimony Potential">
          <select className="select" value={form.testimony_potential ?? 'No'} onChange={e => set('testimony_potential', e.target.value)}>
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
        </Field>
      </div>

      {form.testimony_potential === 'Yes' && (
        <Field label="Testimony Text">
          <textarea
            className="input"
            rows={3}
            value={form.testimony_text ?? ''}
            onChange={e => set('testimony_text', e.target.value)}
            placeholder="Client's testimony in their own words..."
          />
        </Field>
      )}

      <Field label="Notes">
        <textarea
          className="input"
          rows={4}
          value={form.notes ?? ''}
          onChange={e => set('notes', e.target.value)}
          placeholder="Case notes, context, follow-up actions..."
        />
      </Field>

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
