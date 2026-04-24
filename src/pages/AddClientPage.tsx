import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { ClientInsert, VOLUNTEERS } from '../lib/types';
import ClientForm from '../components/Clients/ClientForm';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';
import { MessageSquare, FormInput, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatDate } from '../lib/utils';

interface Props {
  onSuccess: () => void;
  onViewClient?: (id: string) => void;
}

interface DuplicateWarning {
  id: string;
  client_name: string;
  first_contact_date: string | null;
  pendingData: ClientInsert;
}


export default function AddClientPage({ onSuccess, onViewClient }: Props) {
  const [mode, setMode] = useState<'chat' | 'manual'>('chat');
  const [chatText, setChatText] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<Partial<ClientInsert> | null>(null);
  const [saved, setSaved] = useState(false);
  const [duplicate, setDuplicate] = useState<DuplicateWarning | null>(null);

  const handleExtract = async () => {
    if (!chatText.trim()) return;
    setExtracting(true);
    setExtractError(null);
    setExtracted(null);
    try {
      const { data, error } = await supabase.functions.invoke('extract-client', {
        body: { chat: chatText },
      });
      console.log('Extracted data:', data);
      if (error) throw new Error(error.message || 'Extraction failed. Please try again.');
      if (data?.error) throw new Error(data.error);
      const today = new Date().toISOString().split('T')[0];
      const mapped: Partial<ClientInsert> = {
        client_name:        data.clientName        || '',
        first_contact_date: data.firstContactDate  || today,
        first_contact_time: data.firstContactTime  || null,
        volunteer:          data.volunteer         || null,
        age:                data.age ? String(data.age) : null,
        sex:                data.sex               || null,
        reason_for_contact: data.reasonForContact  || null,
        how_found_us:       data.howFoundUs        || null,
        phone_number:       data.phoneNumber       || null,
        province:           data.province          || null,
        notes:              data.notes             || null,
      };
      setExtracted(mapped);
    } catch (err: any) {
      setExtractError(err.message || 'Something went wrong.');
    } finally {
      setExtracting(false);
    }
  };

  const doSave = async (data: ClientInsert) => {
    const { error } = await supabase.from('phsa_clients').insert(data);
    if (error) throw error;
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setExtracted(null);
      setChatText('');
      onSuccess();
    }, 1500);
  };

  const handleSave = async (data: ClientInsert) => {
    if (data.client_name && data.first_contact_date) {
      const { data: existing } = await supabase
        .from('phsa_clients')
        .select('id, client_name, first_contact_date')
        .eq('client_name', data.client_name)
        .eq('first_contact_date', data.first_contact_date)
        .limit(1);
      if (existing && existing.length > 0) {
        setDuplicate({ ...existing[0], pendingData: data });
        return;
      }
    }
    await doSave(data);
  };

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <p className="text-slate-700 font-semibold">Client saved successfully!</p>
        <p className="text-slate-400 text-sm">Redirecting to clients list...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm w-fit">
        <button
          onClick={() => setMode('chat')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'chat'
              ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Paste Chat
        </button>
        <button
          onClick={() => setMode('manual')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'manual'
              ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <FormInput className="w-4 h-4" />
          Manual Entry
        </button>
      </div>

      {mode === 'chat' && (
        <div className="space-y-5">
          <div className="card p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-slate-700 text-sm">AI Chat Extraction</p>
                <p className="text-slate-400 text-xs mt-0.5">
                  Paste a Facebook Messenger conversation and Claude will extract client details automatically.
                </p>
              </div>
            </div>

            <div>
              <label className="label">Paste Facebook Messenger Chat</label>
              <textarea
                className="input font-mono text-xs"
                rows={10}
                value={chatText}
                onChange={e => setChatText(e.target.value)}
                placeholder="[Volunteer]: Hi, thank you for reaching out to PHSA. How can we help you today?&#10;[Client]: I found out I'm pregnant and I'm really scared...&#10;[Volunteer]: I'm so sorry to hear that. Can you tell me a bit more?&#10;..."
              />
            </div>

            {extractError && (
              <div className="mt-3 flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 text-sm text-rose-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {extractError}
              </div>
            )}

            <div className="mt-4">
              <button
                onClick={handleExtract}
                disabled={!chatText.trim() || extracting}
                className="btn-primary"
              >
                {extracting ? (
                  <>
                    <Spinner size="sm" />
                    Extracting with Claude...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Extract Client Info
                  </>
                )}
              </button>
            </div>
          </div>

          {extracted && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 text-sm">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>Client information extracted! Review and complete the form below, then save.</span>
              </div>
              <div className="card p-5">
                <h3 className="font-semibold text-slate-700 text-sm mb-4">Review & Complete</h3>
                <ClientForm
                  initial={extracted}
                  onSubmit={handleSave}
                  onCancel={() => { setExtracted(null); setChatText(''); }}
                  submitLabel="Save Client"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {mode === 'manual' && (
        <div className="card p-5">
          <h3 className="font-semibold text-slate-700 text-sm mb-4">New Client Details</h3>
          <ClientForm
            onSubmit={handleSave}
            onCancel={() => {}}
            submitLabel="Save Client"
          />
        </div>
      )}

      {duplicate && (
        <Modal open title="Possible Duplicate Detected" onClose={() => setDuplicate(null)} size="sm">
          <div className="space-y-5">
            <p className="text-sm text-slate-600">
              A client named <span className="font-semibold text-slate-800">{duplicate.client_name}</span> with
              a first contact date of <span className="font-semibold text-slate-800">{formatDate(duplicate.first_contact_date)}</span> already exists.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                className="btn-primary flex-1"
                onClick={() => {
                  setDuplicate(null);
                  if (onViewClient) onViewClient(duplicate.id);
                }}
              >
                View Existing Record
              </button>
              <button
                className="btn-secondary flex-1"
                onClick={async () => {
                  const data = duplicate.pendingData;
                  setDuplicate(null);
                  await doSave(data);
                }}
              >
                Save Anyway
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
