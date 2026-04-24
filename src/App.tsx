import { useState, useEffect, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { Client, Page } from './lib/types';
import Layout from './components/Layout/Layout';
import DashboardPage from './pages/DashboardPage';
import ClientsPage from './pages/ClientsPage';
import AddClientPage from './pages/AddClientPage';
import TestimoniesPage from './pages/TestimoniesPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import Spinner from './components/ui/Spinner';

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [page, setPage] = useState<Page>('dashboard');
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewClientId, setViewClientId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('phsa_clients')
      .select('*')
      .order('first_contact_date', { ascending: false });
    if (error) console.error('Failed to fetch clients:', error.message);
    if (data) setClients(data as Client[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (session) fetchClients();
  }, [session, fetchClients]);

  const handleAddSuccess = () => {
    fetchClients();
    setPage('clients');
  };

  // Still resolving auth state
  if (session === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  return (
    <Layout currentPage={page} onNavigate={setPage}>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <Spinner size="lg" />
            <p className="text-slate-400 text-sm">Loading client data...</p>
          </div>
        </div>
      ) : (
        <>
          {page === 'dashboard' && <DashboardPage clients={clients} />}
          {page === 'clients' && (
            <ClientsPage
              onRefresh={fetchClients}
              onAddNew={() => setPage('add-client')}
              initialClientId={viewClientId}
              onInitialClientOpened={() => setViewClientId(null)}
            />
          )}
          {page === 'add-client' && (
            <AddClientPage
              onSuccess={handleAddSuccess}
              onViewClient={(id) => { setViewClientId(id); setPage('clients'); }}
            />
          )}
          {page === 'testimonies' && <TestimoniesPage />}
          {page === 'reports' && <ReportsPage clients={clients} />}
          {page === 'settings' && <SettingsPage />}
        </>
      )}
    </Layout>
  );
}
