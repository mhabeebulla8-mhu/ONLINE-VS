
import React from 'react';
import { Fingerprint, BarChart3, Info, Home, MessageSquare, LogOut, Settings, Shield } from 'lucide-react';
import { ViewState } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  setView: (view: ViewState) => void;
  voterName?: string;
  onLogout: () => void;
  isAdmin?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, setView, voterName, onLogout, isAdmin }) => {
  const voterNavItems = [
    { id: 'DASHBOARD', icon: <Home size={20} />, label: 'Home' },
    { id: 'BALLOT', icon: <Fingerprint size={20} />, label: 'Vote' },
    { id: 'RESULTS', icon: <BarChart3 size={20} />, label: 'Results' },
    { id: 'AI_ASSISTANT', icon: <MessageSquare size={20} />, label: 'Help' },
  ];

  const adminNavItems = [
    { id: 'ADMIN_DASHBOARD', icon: <Settings size={20} />, label: 'Control Panel' },
    { id: 'RESULTS', icon: <BarChart3 size={20} />, label: 'Live Tally' },
  ];

  const navItems = isAdmin ? adminNavItems : voterNavItems;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Top Header */}
      <header className={`${isAdmin ? 'bg-slate-900' : 'bg-[#000080]'} text-white shadow-lg sticky top-0 z-50 transition-colors`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setView(isAdmin ? 'ADMIN_DASHBOARD' : 'DASHBOARD')}>
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-[#000080] font-bold text-xl">🇮🇳</span>
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">BharatVote</h1>
                <p className="text-[10px] uppercase tracking-widest opacity-80">Government of India</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-6">
              {isAdmin && (
                <div className="flex items-center space-x-1 px-3 py-1 bg-red-500/20 text-red-400 rounded-full border border-red-500/30 mr-4">
                  <Shield size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">System Admin</span>
                </div>
              )}
              
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setView(item.id as ViewState)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-all ${
                    currentView === item.id ? 'bg-white/20 font-semibold' : 'hover:bg-white/10'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
              <div className="flex items-center space-x-4 pl-6 border-l border-white/20">
                <span className="text-sm font-medium">
                  {isAdmin ? 'Officer Access' : `Namaste, ${voterName}`}
                </span>
                <button 
                  onClick={onLogout}
                  className="p-2 hover:bg-red-500 rounded-full transition-colors"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>

            <div className="md:hidden flex items-center">
               <button onClick={onLogout} className="p-2"><LogOut size={18} /></button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id as ViewState)}
              className={`flex flex-col items-center justify-center w-full h-full transition-all ${
                currentView === item.id ? 'text-[#FF9933]' : 'text-gray-500'
              }`}
            >
              {item.icon}
              <span className="text-[10px] mt-1">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <footer className="bg-gray-100 border-t py-8 pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-500">
            © 2024 Election Commission of India. Strictly for educational demonstration.
          </p>
          <div className="flex justify-center space-x-4 mt-4 text-xs text-gray-400">
            <a href="#" className="hover:text-blue-600">Privacy Policy</a>
            <a href="#" className="hover:text-blue-600">Accessibility</a>
            <a href="#" className="hover:text-blue-600">Disclaimer</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
