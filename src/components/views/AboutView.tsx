import React from 'react';
import logoImg from '../../assets/images/aspire_ai_logo_1784801013152.jpg';
import {
  Sparkles,
  Briefcase,
  Landmark,
  Bot,
  Hospital,
  ShieldCheck,
  CheckCircle2,
  Globe,
  Zap,
} from 'lucide-react';

export const AboutView: React.FC = () => {
  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-4xl mx-auto">
      {/* Brand Hero Card */}
      <div className="p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-slate-800 shadow-xl space-y-4">
        <div className="w-14 h-14 rounded-2xl overflow-hidden border border-indigo-500/40 shadow-lg shadow-indigo-500/20 shrink-0 bg-slate-950 flex items-center justify-center">
          <img src={logoImg} alt="AspireAI Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          About <span className="text-indigo-400">AspireAI</span>
        </h1>
        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
          AspireAI is an all-in-one AI platform engineered to democratize access to career opportunities, government welfare schemes, learning resources, and healthcare services. By combining manual profile inputs with Google Gemini AI and live web grounding, AspireAI provides personalized recommendations that redirect users directly to official websites.
        </p>
      </div>

      {/* Core Platform Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
            <Briefcase className="w-4 h-4" />
            <span>17+ Opportunity Categories</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Covers internships, full-time jobs, remote roles, hackathons, scholarships, fellowships, certifications, startup programs, research internships, open-source programs, and international exchange programs.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
            <Landmark className="w-4 h-4" />
            <span>Central & State Govt Schemes</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Search official portals (startupindia, mygov, pmjay) for central and state schemes covering education, MSMEs, startups, women entrepreneurs, farmers, and skill development.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
            <Bot className="w-4 h-4" />
            <span>Generative AI Career Suite</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Generates 4-phase career roadmaps, pinpoint skill gap analysis, ATS resume evaluation, cover letters, LinkedIn bios, and structured study plans powered by Gemini 3.6 Flash.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
            <Hospital className="w-4 h-4" />
            <span>Healthcare & Doctor Finder</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Locate nearby hospitals and specialists with ratings, addresses, timings, emergency indicators, Google Maps links, and AI basic symptom guidance.
          </p>
        </div>
      </div>

      {/* Tech Stack & Architecture Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 text-xs">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" /> Technology Architecture & Privacy
        </h3>

        <div className="space-y-2 text-slate-600 dark:text-slate-300">
          <p className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span><strong>Frontend:</strong> React 19, TypeScript, Tailwind CSS v4, Lucide React icons, Motion animations.</span>
          </p>
          <p className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span><strong>Backend:</strong> Express full-stack Node server, `@google/genai` SDK, PDF text parser.</span>
          </p>
          <p className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span><strong>AI Grounding:</strong> Google Gemini API (`gemini-3.6-flash`) with search tools for real-time web verification.</span>
          </p>
          <p className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span><strong>No Authentication Friction:</strong> All profile inputs and bookmarks are kept locally in your browser session for maximum speed and data privacy.</span>
          </p>
        </div>
      </div>
    </div>
  );
};
