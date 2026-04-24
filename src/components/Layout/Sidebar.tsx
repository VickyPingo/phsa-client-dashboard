import { LayoutDashboard, Users, UserPlus, Heart, FileText, Menu, X } from 'lucide-react';
import { Page } from '../../lib/types';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  mobileOpen: boolean;
  onMobileToggle: () => void;
}

const navItems: { page: Page; label: string; icon: React.ElementType }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { page: 'clients', label: 'Clients', icon: Users },
  { page: 'add-client', label: 'Add Client', icon: UserPlus },
  { page: 'testimonies', label: 'Testimonies', icon: Heart },
  { page: 'reports', label: 'Reports', icon: FileText },
];

export default function Sidebar({ currentPage, onNavigate, mobileOpen, onMobileToggle }: SidebarProps) {
  const content = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" fill="white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">PHSA</p>
            <p className="text-white/60 text-xs leading-tight">Client Management</p>
          </div>
        </div>
        <button onClick={onMobileToggle} className="lg:hidden text-white/70 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ page, label, icon: Icon }) => {
          const active = currentPage === page;
          return (
            <button
              key={page}
              onClick={() => { onNavigate(page); onMobileToggle(); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="w-4.5 h-4.5 flex-shrink-0" style={{ width: 18, height: 18 }} />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-white/10">
        <p className="text-white/40 text-xs text-center">
          Pregnancy Help South Africa
        </p>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex lg:flex-col w-56 min-h-screen bg-gradient-to-b from-primary-700 to-accent-700 fixed left-0 top-0 z-30">
        {content}
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/40" onClick={onMobileToggle} />
          <aside className="relative w-56 min-h-screen bg-gradient-to-b from-primary-700 to-accent-700 flex flex-col z-50">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
