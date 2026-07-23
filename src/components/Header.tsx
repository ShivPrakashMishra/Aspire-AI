import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Search,
  User,
  Sparkles,
  MapPin,
  GraduationCap,
  Bell,
  SlidersHorizontal,
} from 'lucide-react';

import logoImg from '../assets/images/aspire_ai_logo_1784801013152.jpg';

export const Header: React.FC = () => {
  const { activeTab, setActiveTab, userProfile, setIsProfileModalOpen } = useApp();

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return { title: 'Executive Overview', desc: 'Personalized recommendations, live opportunities & career insights' };
      case 'opportunities':
        return { title: 'Career Opportunities', desc: 'Live internships, remote jobs, hackathons, scholarships & open source programs' };
      case 'schemes':
        return { title: 'Government Schemes Portal', desc: 'Central & State financial, startup, education & employment schemes' };
      case 'assistant':
        return { title: 'AI Career Assistant', desc: 'Generative roadmaps, skill gap analysis, resume scoring & study plans' };
      case 'resume':
        return { title: 'Resume Analyzer', desc: 'ATS compliance checks, keyword extraction & instant bullet point re-writer' };
      case 'learning':
        return { title: 'Learning Resources Hub', desc: 'Curated documentation, courses, repositories & coding platforms' };
      case 'healthcare':
        return { title: 'Healthcare & Hospital Finder', desc: 'Public health directories, doctor search & AI preliminary guidance' };
      case 'about':
        return { title: 'About AspireAI', desc: 'Platform philosophy, architecture & AI privacy framework' };
      default:
        return { title: 'AspireAI', desc: 'Smart Career & Healthcare Platform' };
    }
  };

  const { title, desc } = getPageTitle();

  // Calculate profile completion percentage
  let filledFields = 0;
  const fields = [userProfile.name, userProfile.education, userProfile.preferredRole, userProfile.location, userProfile.careerGoals];
  if (userProfile.skills && userProfile.skills.length > 0) filledFields++;
  fields.forEach((f) => {
    if (f && f.trim().length > 0) filledFields++;
  });
  const completionPercent = Math.min(100, Math.round((filledFields / 6) * 100));

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-20 px-6 flex items-center justify-between transition-colors">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg overflow-hidden border border-indigo-500/30 shadow-sm shrink-0 bg-slate-950 flex items-center justify-center">
          <img src={logoImg} alt="AspireAI Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight leading-none flex items-center gap-2">
            {title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate max-w-xl">
            {desc}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Profile Completion Badge */}
        <button
          onClick={() => setIsProfileModalOpen(true)}
          className="hidden sm:flex items-center space-x-2.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-xs transition-all"
        >
          <div className="flex flex-col text-right">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Profile Readiness</span>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{completionPercent}% Completed</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
            <User className="w-4 h-4" />
          </div>
        </button>

        {/* Quick Edit Profile Button */}
        <button
          onClick={() => setIsProfileModalOpen(true)}
          className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm flex items-center space-x-1.5 transition-colors"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Edit Candidate Profile</span>
        </button>
      </div>
    </header>
  );
};
