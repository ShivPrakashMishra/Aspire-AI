import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  Briefcase,
  Landmark,
  Bot,
  FileSearch,
  BookOpen,
  Hospital,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  BookmarkPlus,
  TrendingUp,
  UserCheck,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    userProfile,
    setActiveTab,
    opportunities,
    schemes,
    resources,
    calculateMatchScore,
    setIsProfileModalOpen,
  } = useApp();

  // Compute recommendations
  const topOpportunities = opportunities.slice(0, 3).map((opp) => {
    const match = calculateMatchScore(opp.requiredSkills, opp.title, opp.description);
    return { ...opp, ...match };
  });

  const topSchemes = schemes.slice(0, 2).map((sch) => {
    const match = calculateMatchScore([], sch.name, sch.summary);
    return { ...sch, ...match };
  });

  const topResources = resources.slice(0, 3);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 border border-slate-800 shadow-xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Smart Recommendation Engine Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, <span className="text-indigo-400">{userProfile.name || 'Candidate'}</span>!
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Targeting <span className="font-semibold text-white">{userProfile.preferredRole || 'your target career path'}</span> in {userProfile.location || 'your region'}. AspireAI analyzes your profile details to deliver personalized opportunities, schemes, and career paths.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveTab('opportunities')}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center space-x-2 transition-all"
              >
                <span>Explore All Opportunities</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="px-4 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-xs transition-all flex items-center space-x-1.5"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Update Profile Details</span>
              </button>
            </div>
          </div>

          {/* User Profile Snapshot Card */}
          <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/60 rounded-xl p-4 sm:w-80 shrink-0 text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
              <span className="font-bold text-slate-200">Candidate Snapshot</span>
              <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Profile Active
              </span>
            </div>
            <div className="space-y-1.5 text-slate-300">
              <p className="truncate"><span className="text-slate-400">Education:</span> {userProfile.education}</p>
              <p className="truncate"><span className="text-slate-400">State:</span> {userProfile.state || 'Pan-India'}</p>
              <p className="truncate">
                <span className="text-slate-400">Skills ({userProfile.skills?.length || 0}):</span>{' '}
                {(userProfile.skills || []).slice(0, 3).join(', ')}...
              </p>
              {userProfile.resumeParsedData && (
                <div className="pt-1.5 flex items-center justify-between text-[11px] font-bold text-indigo-300 bg-indigo-950/40 p-2 rounded-lg border border-indigo-800/40">
                  <span>ATS Resume Score:</span>
                  <span className="text-emerald-400">{userProfile.resumeParsedData.atsScore}/100</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New Session Profile Input Prompt */}
      {(!userProfile.name || !userProfile.preferredRole) && (
        <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <div>
              <p className="font-bold text-slate-900 dark:text-white">New User Session Active</p>
              <p className="text-slate-600 dark:text-slate-300">Enter your details or upload your resume to customize opportunities, AI guidance, and ATS analysis.</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-500 shadow-sm transition-all"
            >
              Input Profile
            </button>
            <button
              onClick={() => setActiveTab('resume')}
              className="px-3.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 font-bold hover:bg-indigo-50 dark:hover:bg-slate-700 transition-all"
            >
              Upload Resume
            </button>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase">Matched Opportunities</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{opportunities.length} Available</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase">Government Schemes</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{schemes.length} Eligible</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase">Learning Hub</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{resources.length} Resources</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase">Avg Match Score</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">88% Match</p>
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setActiveTab('assistant')}
          className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800/60 text-left transition-all group"
        >
          <div className="flex items-center justify-between mb-1">
            <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <ArrowRight className="w-4 h-4 text-indigo-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </div>
          <p className="font-bold text-xs text-slate-900 dark:text-slate-100">AI Career Roadmap</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Generate personalized step roadmap</p>
        </button>

        <button
          onClick={() => setActiveTab('resume')}
          className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/60 text-left transition-all group"
        >
          <div className="flex items-center justify-between mb-1">
            <FileSearch className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <ArrowRight className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </div>
          <p className="font-bold text-xs text-slate-900 dark:text-slate-100">Resume & ATS Check</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Analyze & improve bullet points</p>
        </button>

        <button
          onClick={() => setActiveTab('schemes')}
          className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800/60 text-left transition-all group"
        >
          <div className="flex items-center justify-between mb-1">
            <Landmark className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <ArrowRight className="w-4 h-4 text-amber-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </div>
          <p className="font-bold text-xs text-slate-900 dark:text-slate-100">Government Schemes</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Find central & state benefits</p>
        </button>

        <button
          onClick={() => setActiveTab('healthcare')}
          className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800/60 text-left transition-all group"
        >
          <div className="flex items-center justify-between mb-1">
            <Hospital className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            <ArrowRight className="w-4 h-4 text-rose-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </div>
          <p className="font-bold text-xs text-slate-900 dark:text-slate-100">Healthcare Finder</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Locate hospitals & doctors</p>
        </button>
      </div>

      {/* Smart Recommendations Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" /> Top Recommended Opportunities
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Tailored to {userProfile.preferredRole}</p>
          </div>
          <button
            onClick={() => setActiveTab('opportunities')}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
          >
            <span>View All ({opportunities.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topOpportunities.map((opp) => (
            <div
              key={opp.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-indigo-500/50 transition-all group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    {opp.category.replace('_', ' ')}
                  </span>
                  <div className="flex items-center space-x-1 text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    <span>{opp.matchScore}% Match</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                    {opp.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{opp.organization} • {opp.location}</p>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                  {opp.description}
                </p>

                {/* Skills tags */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {opp.requiredSkills.slice(0, 3).map((skill) => {
                    const isMatched = (userProfile.skills || []).some((s) => s.toLowerCase().includes(skill.toLowerCase()));
                    return (
                      <span
                        key={skill}
                        className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                          isMatched
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {skill} {isMatched ? '✓' : ''}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end text-xs">
                <a
                  href={opp.applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center space-x-1.5 shadow-sm transition-colors"
                >
                  <span>Apply Now</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Government Schemes & Resources Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Government Schemes Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Landmark className="w-4 h-4 text-amber-500" /> Government Schemes
            </h2>
            <button
              onClick={() => setActiveTab('schemes')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              View Schemes
            </button>
          </div>

          <div className="space-y-3">
            {topSchemes.map((sch) => (
              <div key={sch.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                    {sch.level} Scheme
                  </span>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{sch.matchScore}% Eligible</span>
                </div>
                <h3 className="font-bold text-xs text-slate-900 dark:text-white">{sch.name}</h3>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2">{sch.benefits}</p>
                <div className="pt-1 flex justify-end">
                  <a
                    href={sch.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <span>Visit Official Website</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Learning Resources */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-500" /> Free Learning Resources
            </h2>
            <button
              onClick={() => setActiveTab('learning')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Explore Hub
            </button>
          </div>

          <div className="space-y-3">
            {topResources.map((res) => (
              <div key={res.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                    {res.type}
                  </span>
                  <h3 className="font-bold text-xs text-slate-900 dark:text-white truncate">{res.title}</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{res.provider} • {res.topic}</p>
                </div>
                <a
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 text-slate-800 dark:text-slate-200 text-xs font-bold shrink-0 transition-colors flex items-center gap-1"
                >
                  <span>Open</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
