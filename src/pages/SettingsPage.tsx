import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Volunteer } from '../lib/types';
import { useVolunteers } from '../hooks/useVolunteers';
import { UserPlus, Mail, User, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const { volunteers, loading, refetch } = useVolunteers();
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setAdding(true);
    setAddError(null);
    const { error } = await supabase.from('phsa_volunteers').insert({
      name,
      email: newEmail.trim() || null,
      is_active: true,
    });
    setAdding(false);
    if (error) {
      setAddError(error.message.includes('unique') ? 'A volunteer with that name already exists.' : error.message);
      return;
    }
    setNewName('');
    setNewEmail('');
    refetch();
  };

  const handleToggle = async (v: Volunteer) => {
    setTogglingId(v.id);
    await supabase.from('phsa_volunteers').update({ is_active: !v.is_active }).eq('id', v.id);
    setTogglingId(null);
    refetch();
  };

  const active = volunteers.filter(v => v.is_active);
  const inactive = volunteers.filter(v => !v.is_active);

  return (
    <div className="max-w-2xl space-y-6">
      {/* Add volunteer */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="w-4 h-4 text-primary-600" />
          <h3 className="font-semibold text-slate-700 text-sm">Add Volunteer</h3>
        </div>
        <form onSubmit={handleAdd} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  className="input pl-9"
                  placeholder="Full name"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className="label">Email (optional)</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  className="input pl-9"
                  placeholder="volunteer@example.com"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                />
              </div>
            </div>
          </div>
          {addError && (
            <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{addError}</p>
          )}
          <div className="flex justify-end">
            <button type="submit" disabled={adding || !newName.trim()} className="btn-primary">
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Add Volunteer
            </button>
          </div>
        </form>
      </div>

      {/* Volunteer list */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h3 className="font-semibold text-slate-700 text-sm">Volunteers</h3>
          {!loading && (
            <span className="text-xs text-slate-400">{active.length} active · {inactive.length} inactive</span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        ) : volunteers.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-400">No volunteers yet.</p>
        ) : (
          <div className="divide-y divide-slate-50">
            {[...active, ...inactive].map(v => (
              <div key={v.id} className={`flex items-center gap-3 px-5 py-3 transition-colors ${!v.is_active ? 'bg-slate-50/60' : ''}`}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary-700">{v.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${v.is_active ? 'text-slate-700' : 'text-slate-400'}`}>
                    {v.name}
                  </p>
                  {v.email && (
                    <p className="text-xs text-slate-400 truncate">{v.email}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    v.is_active
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-400'
                  }`}>
                    {v.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick={() => handleToggle(v)}
                    disabled={togglingId === v.id}
                    className="p-1 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
                    title={v.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {togglingId === v.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : v.is_active ? (
                      <ToggleRight className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
