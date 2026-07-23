import React from 'react';
import { useApp, ActiveTab } from '../context/AppContext';
import {
  LayoutDashboard,
  Briefcase,
  Landmark,
  Bot,
  FileSearch,
  BookOpen,
  Hospital,
  Info,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

import logoImg from '../assets/images/aspire_ai_logo_1784801013152.jpg';

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, userProfile, setIsProfileModalOpen } = useApp();

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'opportunities', label: 'Career Opportunities', icon: Briefcase },
    { id: 'schemes', label: 'Government Schemes', icon: Landmark },
    { id: 'assistant', label: 'AI Career Assistant', icon: Bot, badge: 'AI' },
    { id: 'resume', label: 'Resume Analyzer', icon: FileSearch },
    { id: 'learning', label: 'Learning Resources', icon: BookOpen },
    { id: 'healthcare', label: 'Healthcare & Doctors', icon: Hospital },
    { id: 'about', label: 'About AspireAI', icon: Info },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between h-screen sticky top-0 shrink-0 text-slate-300 select-none transition-all duration-200">
      <div>
        {/* Brand Header */}
        <div className="px-5 py-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-indigo-500/40 shadow-md shadow-indigo-500/20 shrink-0 bg-slate-950 flex items-center justify-center">
              <img src={logoImg} alt="AspireAI Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-white tracking-tight flex items-center gap-1.5">
                Aspire<span className="text-indigo-400">AI</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">Smart Opportunity Platform</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      item.badge === 'AI'
                        ? 'bg-gradient-to-r from-indigo-500 to-emerald-500 text-white'
                        : 'bg-slate-800 text-indigo-300 border border-indigo-500/30'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile & Settings */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        {/* User Profile Quick Card */}
        <div
          onClick={() => setIsProfileModalOpen(true)}
          className="p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 cursor-pointer transition-all flex items-center justify-between group"
        >
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center justify-center font-bold text-xs shrink-0">
              {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{userProfile.name || 'User Profile'}</p>
              <p className="text-[10px] text-slate-400 truncate">{userProfile.preferredRole || 'Update Profile'}</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0" />
        </div>
      </div>
    </aside>
  );
};
