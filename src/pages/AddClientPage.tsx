import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { ClientInsert, VOLUNTEERS } from '../lib/types';
import ClientForm from '../components/Clients/ClientForm';
import Spinner from '../components/ui/Spinner';
import { MessageSquare, FormInput, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  onSuccess: () => void;
}

const SUPABASE_URL = 'https://magmhrdbwpcfkibudtqj.supabase.co';
const ANON_KEY     = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hZ21ocmRid3BjZmtpYnVkdHFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NTI1NjAsImV4cCI6MjA4NzQyODU2MH0.ksv-5y1AErj7SJja0v2BkspOajqOk0MqWRNUIDRBA5w';

export default function AddClientPage({ onSuccess }: Props) {
  const [mode, setMode] = useState<'chat' | 'manual'>('chat');
  const [chatText, setChatText] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<Partial<ClientInsert> | null>(null);
  const [saved, setSaved] = useState(false);

  const handleExtract = async () => {
    if (!chatText.trim()) return;
    setExtracting(true);
    setExtractError(null);
    setExtracted(null);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/extract-client`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ANON_KEY}`,
        },
        body: JSON.stringify({ chat: chatText }),
      });
      if (!res.ok) throw new Error('Extraction failed. Please try again.');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setExtracted(data);
    } catch (err: any) {
      setExtractError(err.message || 'Something went wrong.');
    } finally {
      setExtracting(false);
    }
  };

  const handleSave = async (data: ClientInsert) => {
    const { error } = await supabase.from('clients').insert(data);
    if (error) throw error;
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setExtracted(null);
      setChatText('');
      onSuccess();
    }, 1500);
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
    </div>
  );
}
