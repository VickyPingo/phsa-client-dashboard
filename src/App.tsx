import { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabase';
import { Client, Page } from './lib/types';
import Layout from './components/Layout/Layout';
import DashboardPage from './pages/DashboardPage';
import ClientsPage from './pages/ClientsPage';
import AddClientPage from './pages/AddClientPage';
import TestimoniesPage from './pages/TestimoniesPage';
import ReportsPage from './pages/ReportsPage';
import Spinner from './components/ui/Spinner';

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = useCallback(async () => {
    const { data, error } = await supabase
      .from('phsa_clients')
      .select('*')
      .order('first_contact_date', { ascending: false });
    if (error) console.error('Failed to fetch clients:', error.message);
    if (data) setClients(data as Client[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleAddSuccess = () => {
    fetchClients();
    setPage('clients');
  };

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
            />
          )}
          {page === 'add-client' && (
            <AddClientPage onSuccess={handleAddSuccess} />
          )}
          {page === 'testimonies' && <TestimoniesPage clients={clients} />}
          {page === 'reports' && <ReportsPage clients={clients} />}
        </>
      )}
    </Layout>
  );
}
