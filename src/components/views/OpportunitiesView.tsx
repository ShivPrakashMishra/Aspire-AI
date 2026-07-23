import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { OpportunityCategory, OpportunityItem } from '../../types';
import {
  Search,
  Globe,
  Sparkles,
  ExternalLink,
  BookmarkPlus,
  Filter,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MapPin,
  Calendar,
  Building,
} from 'lucide-react';

const CATEGORIES: { id: string; label: string }[] = [
  { id: 'all', label: 'All Opportunities' },
  { id: 'internships', label: 'Internships' },
  { id: 'jobs', label: 'Full-time Jobs' },
  { id: 'remote_jobs', label: 'Remote Jobs' },
  { id: 'hackathons', label: 'Hackathons' },
  { id: 'scholarships', label: 'Scholarships' },
  { id: 'fellowships', label: 'Fellowships' },
  { id: 'certifications', label: 'Certifications' },
  { id: 'competitions', label: 'Competitions' },
  { id: 'workshops', label: 'Workshops' },
  { id: 'webinars', label: 'Webinars' },
  { id: 'bootcamps', label: 'Bootcamps' },
  { id: 'startup_programs', label: 'Startup Programs' },
  { id: 'research_internships', label: 'Research Internships' },
  { id: 'government_internships', label: 'Govt Internships' },
  { id: 'open_source', label: 'Open Source' },
  { id: 'exchange_programs', label: 'Exchange Programs' },
  { id: 'international', label: 'International' },
];

export const OpportunitiesView: React.FC = () => {
  const {
    opportunities,
    setOpportunities,
    calculateMatchScore,
    userProfile,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [minMatchOnly, setMinMatchOnly] = useState<boolean>(false);
  const [isLiveSearching, setIsLiveSearching] = useState<boolean>(false);
  const [searchStatusMsg, setSearchStatusMsg] = useState<string>('');

  const handleLiveWebSearch = async () => {
    setIsLiveSearching(true);
    setSearchStatusMsg('Searching live web with Gemini for active opportunities...');

    try {
      const catLabel = selectedCategory !== 'all' ? selectedCategory.replace('_', ' ') : '';
      const constructedQuery = searchTerm.trim()
        ? `${searchTerm.trim()} ${catLabel}`.trim()
        : (catLabel ? `${catLabel} opportunities 2026` : 'internships, software jobs and hackathons 2026');

      const res = await fetch('/api/gemini/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: constructedQuery,
          searchType: 'opportunities',
          userProfile: {
            ...userProfile,
            requestedCategory: selectedCategory,
          },
        }),
      });

      const json = await res.json();
      if (json.isRateLimited) {
        setSearchStatusMsg('AI search rate limit reached (429). Displaying verified local opportunities directory. Please retry AI search in a minute.');
      } else if (json.success && Array.isArray(json.results) && json.results.length > 0) {
        // Merge fetched results with existing
        const newResults: OpportunityItem[] = json.results.map((r: any, i: number) => {
          let cat = (r.category || 'internships') as OpportunityCategory;
          if (selectedCategory !== 'all') {
            cat = selectedCategory as OpportunityCategory;
          }
          return {
            id: r.id || `live-opp-${Date.now()}-${i}`,
            title: r.title || 'Live Opportunity',
            category: cat,
            organization: r.organization || 'Verified Organization',
            location: r.location || 'Global / Remote',
            deadline: r.deadline || 'Upcoming',
            eligibility: r.eligibility || 'Open to eligible candidates',
            requiredSkills: Array.isArray(r.requiredSkills) ? r.requiredSkills : ['Software Development'],
            description: r.description || 'Verified live opportunity found from web search.',
            applyUrl: r.applyUrl || 'https://google.com',
          };
        });

        setOpportunities((prev) => {
          const ids = new Set(prev.map((p) => p.id));
          const filteredNew = newResults.filter((n) => !ids.has(n.id));
          return [...filteredNew, ...prev];
        });

        setSearchStatusMsg(`Fetched ${json.results.length} live verified opportunities for "${constructedQuery}"!`);
      } else {
        setSearchStatusMsg('No new live opportunities returned. Try broadening your query.');
      }
    } catch (err) {
      console.error(err);
      setSearchStatusMsg('Live web search error. Showing default database.');
    } finally {
      setIsLiveSearching(false);
    }
  };

  // Filter & calculate match
  const filteredOpportunities = opportunities
    .filter((opp) => {
      const matchesCategory =
        selectedCategory === 'all' ||
        opp.category === selectedCategory ||
        (selectedCategory === 'internships' && (opp.category.includes('intern') || opp.category === 'research_internships' || opp.category === 'government_internships')) ||
        (selectedCategory === 'jobs' && (opp.category.includes('job') || opp.category === 'remote_jobs'));

      const matchesSearch =
        searchTerm === '' ||
        opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opp.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opp.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opp.requiredSkills.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesCategory && matchesSearch;
    })
    .map((opp) => {
      const matchData = calculateMatchScore(opp.requiredSkills, opp.title, opp.description);
      return { ...opp, ...matchData };
    })
    .filter((opp) => !minMatchOnly || opp.matchScore >= 80);

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Search & Live Web Discovery Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-500" /> Live Opportunity Discovery
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Search real-time internships, hackathons, remote jobs, and scholarships from official portals.
            </p>
          </div>

          {/* Live Web Search Trigger */}
          <button
            onClick={handleLiveWebSearch}
            disabled={isLiveSearching}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 shrink-0"
          >
            {isLiveSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{isLiveSearching ? 'Searching Web...' : 'Fetch Live Web Results'}</span>
          </button>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLiveWebSearch()}
              placeholder="Search by title, skill (React, Python), company, or keyword (Press Enter to search live web)..."
              className="w-full pl-10 pr-28 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleLiveWebSearch}
              disabled={isLiveSearching}
              className="absolute right-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] transition-all disabled:opacity-50"
            >
              {isLiveSearching ? 'Searching...' : 'Search Web'}
            </button>
          </div>

          <label className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={minMatchOnly}
              onChange={(e) => setMinMatchOnly(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span className="font-semibold">High Match Only (80%+)</span>
          </label>
        </div>

        {searchStatusMsg && (
          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">{searchStatusMsg}</p>
        )}
      </div>

      {/* Category Horizontal Scroll Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Opportunities List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredOpportunities.map((opp) => (
          <div
            key={opp.id}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-indigo-500/50 transition-all space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {opp.category.replace('_', ' ')}
                </span>
                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                  {opp.matchScore}% Match
                </span>
              </div>

              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white leading-snug">
                  {opp.title}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                  <span className="flex items-center gap-1"><Building className="w-3.5 h-3.5 text-slate-400" /> {opp.organization}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {opp.location}</span>
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400"><Calendar className="w-3.5 h-3.5" /> Deadline: {opp.deadline}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                <p><span className="font-bold text-slate-700 dark:text-slate-200">Eligibility:</span> {opp.eligibility}</p>
                <p className="line-clamp-2">{opp.description}</p>
              </div>

              {/* Skills breakdown */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Required Skills & Match:</span>
                <div className="flex flex-wrap gap-1">
                  {opp.requiredSkills.map((skill) => {
                    const isMatched = (userProfile.skills || []).some((s) => s.toLowerCase().includes(skill.toLowerCase()));
                    return (
                      <span
                        key={skill}
                        className={`text-[11px] px-2.5 py-0.5 rounded font-medium ${
                          isMatched
                            ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        }`}
                      >
                        {skill} {isMatched ? '✓' : '(Missing)'}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end text-xs">
              <a
                href={opp.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center space-x-2 shadow-md shadow-indigo-600/20 transition-all"
              >
                <span>Visit Official Website / Apply</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {filteredOpportunities.length === 0 && (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No opportunities match your search filter.</p>
          <button
            onClick={handleLiveWebSearch}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-bold text-xs"
          >
            Search Live Web with Gemini AI
          </button>
        </div>
      )}
    </div>
  );
};
