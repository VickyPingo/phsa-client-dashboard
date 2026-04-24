import { useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import { Page } from '../../lib/types';

interface LayoutProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  children: React.ReactNode;
}

const pageTitles: Record<Page, string> = {
  dashboard: 'Dashboard',
  clients: 'Clients',
  'add-client': 'Import Client',
  testimonies: 'Testimonies',
  reports: 'Reports',
};

export default function Layout({ currentPage, onNavigate, children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        mobileOpen={mobileOpen}
        onMobileToggle={() => setMobileOpen(v => !v)}
      />

      <div className="flex-1 lg:ml-56 flex flex-col min-h-screen">
        <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-3 flex items-center gap-3 sticky top-0 z-20">
          <button
            className="lg:hidden p-1.5 rounded-md text-slate-500 hover:bg-slate-100"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-semibold text-slate-800 text-base">{pageTitles[currentPage]}</h1>
            <p className="text-xs text-slate-400">Pregnancy Help South Africa</p>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
