
import React, { useEffect, useState } from 'react';
import { StoreProvider } from './context/StoreContext';
import { ViewMode, AdminSection } from './types';
import { ProfileView } from './views/admin/ProfileView';
import { MenuView } from './views/admin/MenuView';
import { QRView } from './views/admin/QRView';
import { OrdersView } from './views/admin/OrdersView';
import { DashboardView } from './views/admin/DashboardView';
import { CustomerView } from './views/customer/CustomerView';
import { LayoutDashboard, UtensilsCrossed, QrCode, Smartphone, LogOut, Store, ShoppingBag } from 'lucide-react';

const getCustomerRoute = (location: Location) => {
  if (!location.pathname.startsWith('/menu/')) return null;

  const match = location.pathname.match(/^\/menu\/([^/]+)/);
  if (!match) return null;

  const slug = match[1];
  const searchParams = new URLSearchParams(location.search);
  const tableParam = searchParams.get('table');
  const tableId = tableParam ? Number.parseInt(tableParam, 10) : undefined;

  return {
    slug,
    tableId: Number.isNaN(tableId) ? undefined : tableId,
  };
};

const AdminSidebar: React.FC<{ 
  activeSection: AdminSection, 
  onNavigate: (s: AdminSection) => void
}> = ({ activeSection, onNavigate }) => {
  
  const mainNav: { id: AdminSection; label: string; icon: React.ReactNode }[] = [
    { id: 'DASHBOARD', label: 'Tableau de bord', icon: <LayoutDashboard size={20} /> },
    { id: 'ORDERS', label: 'Commandes', icon: <ShoppingBag size={20} /> },
  ];

  const managementNav: { id: AdminSection; label: string; icon: React.ReactNode }[] = [
    { id: 'MENU', label: 'Carte & Menu', icon: <UtensilsCrossed size={20} /> },
    { id: 'QR', label: 'QR Codes', icon: <QrCode size={20} /> },
    { id: 'PROFILE', label: 'Restaurant', icon: <Store size={20} /> },
  ];

  const NavItem: React.FC<{ item: typeof mainNav[0] }> = ({ item }) => (
    <button
      onClick={() => onNavigate(item.id)}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
        activeSection === item.id 
          ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/20' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      {item.icon}
      {item.label}
    </button>
  );

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-100 h-screen sticky top-0 border-r border-slate-800">
      <div className="p-6">
        <div className="flex items-center gap-2 font-bold text-xl text-white">
          <UtensilsCrossed className="text-rose-500" />
          <span>QRMenu</span>
        </div>
        <p className="text-xs text-slate-500 mt-1">Admin Dashboard v0.2</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-6">
        <div>
          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Principal</p>
          <div className="space-y-1">
            {mainNav.map(item => <NavItem key={item.id} item={item} />)}
          </div>
        </div>

        <div>
          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Gestion</p>
          <div className="space-y-1">
            {managementNav.map(item => <NavItem key={item.id} item={item} />)}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-900 space-y-2">
        <button className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
          <LogOut size={20} />
          Déconnexion
        </button>
      </div>
    </aside>
  );
};

const MobileNav: React.FC<{
  activeSection: AdminSection,
  onNavigate: (s: AdminSection) => void
}> = ({ activeSection, onNavigate }) => {
  return (
    <div className="md:hidden flex overflow-x-auto bg-slate-900 text-white p-2 gap-2 sticky top-0 z-20 shadow-md">
       <button
          onClick={() => onNavigate('DASHBOARD')}
          className={`flex-1 flex flex-col items-center justify-center p-2 rounded-md text-xs ${activeSection === 'DASHBOARD' ? 'bg-rose-600' : 'bg-transparent text-slate-400'}`}
        >
          <LayoutDashboard size={18} className="mb-1" /> Board
        </button>
       <button
          onClick={() => onNavigate('ORDERS')}
          className={`flex-1 flex flex-col items-center justify-center p-2 rounded-md text-xs ${activeSection === 'ORDERS' ? 'bg-rose-600' : 'bg-transparent text-slate-400'}`}
        >
          <ShoppingBag size={18} className="mb-1" /> Caisse
        </button>
        <button
          onClick={() => onNavigate('MENU')}
          className={`flex-1 flex flex-col items-center justify-center p-2 rounded-md text-xs ${activeSection === 'MENU' ? 'bg-rose-600' : 'bg-transparent text-slate-400'}`}
        >
          <UtensilsCrossed size={18} className="mb-1" /> Menu
        </button>
        <button
          onClick={() => onNavigate('QR')}
          className={`flex-1 flex flex-col items-center justify-center p-2 rounded-md text-xs ${activeSection === 'QR' ? 'bg-rose-600' : 'bg-transparent text-slate-400'}`}
        >
          <QrCode size={18} className="mb-1" /> QR
        </button>
    </div>
  );
}

const AdminApp: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('ADMIN');
  const [adminSection, setAdminSection] = useState<AdminSection>('DASHBOARD');

  if (viewMode === 'CUSTOMER') {
    return (
      <div className="relative">
        <CustomerView />
        <button 
          onClick={() => setViewMode('ADMIN')}
          className="fixed bottom-32 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-full shadow-lg flex items-center gap-2 hover:bg-slate-800 transition-all font-medium text-sm border border-slate-700/50 backdrop-blur-sm"
        >
          <LogOut size={16} /> Retour Admin
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <AdminSidebar
        activeSection={adminSection}
        onNavigate={setAdminSection}
      />
      <MobileNav activeSection={adminSection} onNavigate={setAdminSection} />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-8 shrink-0">
          <h1 className="text-xl font-bold text-slate-800 md:hidden flex items-center gap-2">
            <UtensilsCrossed className="text-rose-500" /> QRMenu
          </h1>
          <div className="hidden md:block text-slate-500 text-sm">
            Restaurant Management System v2.0
          </div>
          
          <div className="flex items-center gap-3">
             <button 
                onClick={() => setViewMode('CUSTOMER')}
                className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 rounded-lg text-sm font-bold border border-rose-200 hover:bg-rose-100 transition-colors shadow-sm"
             >
               <Smartphone size={18} />
               <span className="hidden sm:inline">Aperçu Client</span>
             </button>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          {adminSection === 'DASHBOARD' && (
            <DashboardView 
              onNavigate={setAdminSection} 
              onPreview={() => setViewMode('CUSTOMER')} 
            />
          )}
          {adminSection === 'ORDERS' && <OrdersView />}
          {adminSection === 'PROFILE' && <ProfileView />}
          {adminSection === 'MENU' && <MenuView />}
          {adminSection === 'QR' && <QRView />}
        </div>
      </main>
    </div>
  );
};

const AppRouter: React.FC = () => {
  const [customerRoute, setCustomerRoute] = useState(() =>
    typeof window !== 'undefined' ? getCustomerRoute(window.location) : null
  );

  useEffect(() => {
    const handlePopState = () => {
      if (typeof window === 'undefined') return;
      setCustomerRoute(getCustomerRoute(window.location));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (customerRoute) {
    return <CustomerView slug={customerRoute.slug} tableId={customerRoute.tableId} />;
  }

  return <AdminApp />;
};

const App: React.FC = () => {
  return (
    <StoreProvider>
      <AppRouter />
    </StoreProvider>
  );
};

export default App;
