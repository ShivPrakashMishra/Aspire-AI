import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SchemeCategory, GovernmentSchemeItem } from '../../types';
import {
  Landmark,
  Search,
  Globe,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  FileCheck2,
  SlidersHorizontal,
  Loader2,
  Building2,
  ShieldCheck,
} from 'lucide-react';

const SCHEME_CATEGORIES: { id: string; label: string }[] = [
  { id: 'all', label: 'All Schemes' },
  { id: 'senior_citizens', label: 'Senior Citizens (60+)' },
  { id: 'pensions', label: 'Pensions & Social Security' },
  { id: 'education', label: 'Education' },
  { id: 'employment', label: 'Employment' },
  { id: 'startups', label: 'Startups' },
  { id: 'msmes', label: 'MSMEs' },
  { id: 'women', label: 'Women' },
  { id: 'farmers', label: 'Farmers' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'skill_development', label: 'Skill Development' },
  { id: 'scholarships', label: 'Scholarships' },
  { id: 'financial_assistance', label: 'Financial Aid' },
];

export const SchemesView: React.FC = () => {
  const { schemes, setSchemes, userProfile } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [filterAge, setFilterAge] = useState<number>(userProfile.age || 22);
  const [filterState, setFilterState] = useState<string>(userProfile.state || 'All / Pan India');
  const [filterIncome, setFilterIncome] = useState<string>(userProfile.incomeBracket || 'Below ₹5 Lakhs');
  const [filterLevel, setFilterLevel] = useState<'all' | 'Central' | 'State'>('all');

  const [isSearchingGovt, setIsSearchingGovt] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const applySeniorPreset = () => {
    setFilterAge(60);
    setSelectedCategory('senior_citizens');
    setFilterLevel('all');
    setSearchQuery('');
  };

  const applyAllStatesPreset = () => {
    setFilterState('All / Pan India');
    setFilterLevel('all');
  };

  const applyStudentPreset = () => {
    setFilterAge(22);
    setSelectedCategory('all');
    setFilterLevel('all');
  };

  const handleSearchGovtPortals = async () => {
    setIsSearchingGovt(true);
    const searchTopic = searchQuery.trim() || (selectedCategory !== 'all' ? selectedCategory : (filterAge >= 60 ? 'senior citizen pension and welfare' : 'welfare and education schemes'));
    setStatusMessage(`Searching official government portals (india.gov.in, nsap.nic.in, myscheme.gov.in, state portals) for "${searchTopic}"...`);

    try {
      const res = await fetch('/api/gemini/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `${searchTopic} schemes for candidate age ${filterAge} in ${filterState}`,
          searchType: 'schemes',
          userProfile: {
            ...userProfile,
            age: filterAge,
            state: filterState,
            incomeBracket: filterIncome,
          },
        }),
      });

      const json = await res.json();
      if (json.isRateLimited) {
        setStatusMessage('AI search rate limit reached (429). Displaying verified government schemes database. Please try AI search again in a moment.');
      } else if (json.success && Array.isArray(json.results) && json.results.length > 0) {
        const fetchedSchemes: GovernmentSchemeItem[] = json.results.map((r: any, i: number) => ({
          id: r.id || `live-sch-${Date.now()}-${i}`,
          name: r.name || 'Government Scheme',
          category: (r.category || (filterAge >= 60 ? 'senior_citizens' : 'education')) as SchemeCategory,
          level: (r.level || 'Central') as 'Central' | 'State',
          state: r.state || filterState,
          benefits: r.benefits || 'Financial & Subsidy Assistance',
          eligibilityCriteria: r.eligibilityCriteria || 'As per government guidelines',
          requiredDocuments: Array.isArray(r.requiredDocuments) ? r.requiredDocuments : ['Aadhaar Card', 'Income Certificate'],
          summary: r.summary || 'Official welfare initiative by government.',
          officialUrl: r.officialUrl || 'https://india.gov.in',
        }));

        setSchemes((prev) => {
          const ids = new Set(prev.map((p) => p.id));
          const filtered = fetchedSchemes.filter((f) => !ids.has(f.id));
          return [...filtered, ...prev];
        });

        setStatusMessage(`Found ${json.results.length} verified government schemes!`);
      } else {
        setStatusMessage(`No new live schemes returned for "${searchTopic}". Try broadening search keywords.`);
      }
    } catch (err) {
      console.error(err);
      setStatusMessage('Failed to connect to government portal search. Showing available database.');
    } finally {
      setIsSearchingGovt(false);
    }
  };

  const filteredSchemes = schemes.filter((sch) => {
    // Level matching (Central, State, or All)
    if (filterLevel !== 'all' && sch.level !== filterLevel) {
      return false;
    }

    // Category matching (fuzzy fallback for senior citizens, pensions, education, etc.)
    let matchesCategory = selectedCategory === 'all' || sch.category === selectedCategory;
    if (!matchesCategory) {
      const lowerName = sch.name.toLowerCase();
      const lowerCriteria = sch.eligibilityCriteria.toLowerCase();
      const lowerSummary = sch.summary.toLowerCase();

      if (selectedCategory === 'senior_citizens') {
        matchesCategory =
          sch.category === 'pensions' ||
          lowerName.includes('senior') ||
          lowerName.includes('elder') ||
          lowerName.includes('vaya') ||
          lowerName.includes('old age') ||
          lowerCriteria.includes('60') ||
          lowerCriteria.includes('70') ||
          lowerSummary.includes('senior') ||
          lowerSummary.includes('elder') ||
          lowerSummary.includes('old age');
      } else if (selectedCategory === 'pensions') {
        matchesCategory =
          sch.category === 'senior_citizens' ||
          lowerName.includes('pension') ||
          lowerName.includes('nsap') ||
          lowerName.includes('ignoaps') ||
          lowerName.includes('apy') ||
          lowerName.includes('nps') ||
          lowerSummary.includes('pension');
      } else if (selectedCategory === 'education') {
        matchesCategory = sch.category === 'scholarships' || lowerName.includes('education') || lowerSummary.includes('education');
      } else if (selectedCategory === 'scholarships') {
        matchesCategory = sch.category === 'education' || lowerName.includes('scholarship');
      } else if (selectedCategory === 'financial_assistance') {
        matchesCategory = sch.category === 'msmes' || lowerName.includes('loan') || sch.benefits.toLowerCase().includes('loan');
      }
    }

    // State matching: show if Central/Pan-India, or if user filter matches scheme state, or if filter is "all"
    const cleanFilterState = filterState.trim().toLowerCase();
    const schState = (sch.state || 'Pan India').toLowerCase();
    const matchesState =
      cleanFilterState === '' ||
      cleanFilterState.includes('all') ||
      cleanFilterState === 'pan india' ||
      sch.level === 'Central' ||
      schState === 'pan india' ||
      schState.includes(cleanFilterState) ||
      cleanFilterState.includes(schState);

    // Keyword search matching across name, summary, benefits, criteria, documents & state
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      query === '' ||
      sch.name.toLowerCase().includes(query) ||
      sch.summary.toLowerCase().includes(query) ||
      sch.benefits.toLowerCase().includes(query) ||
      sch.eligibilityCriteria.toLowerCase().includes(query) ||
      sch.category.toLowerCase().includes(query) ||
      (sch.state && sch.state.toLowerCase().includes(query)) ||
      sch.requiredDocuments.some((doc) => doc.toLowerCase().includes(query));

    return matchesCategory && matchesState && matchesSearch;
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchGovtPortals();
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Search Header Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Landmark className="w-5 h-5 text-amber-500" /> Central & State Government Welfare Schemes
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Discover official subsidies, educational loans, startup grants, and financial assistance programs.
            </p>
          </div>

          <button
            onClick={handleSearchGovtPortals}
            disabled={isSearchingGovt}
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-600/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 shrink-0"
          >
            {isSearchingGovt ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{isSearchingGovt ? 'Searching Portals...' : 'Search Official Govt Portals'}</span>
          </button>
        </div>

        {/* Filters Input Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Government Level</label>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value as 'all' | 'Central' | 'State')}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Levels (Central & State)</option>
              <option value="Central">Central Government Only</option>
              <option value="State">State Government Only</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">State / Union Territory</label>
            <input
              type="text"
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              placeholder="e.g. All / Pan India, Karnataka"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Candidate Age</label>
            <input
              type="number"
              value={filterAge}
              onChange={(e) => setFilterAge(Number(e.target.value))}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              placeholder="e.g. 60 or 22"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Family Income Level</label>
            <select
              value={filterIncome}
              onChange={(e) => setFilterIncome(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
            >
              <option value="Below ₹2.5 Lakhs">Below ₹2.5 Lakhs (BPL / EWS)</option>
              <option value="₹2.5 Lakhs - ₹5 Lakhs">₹2.5 Lakhs - ₹5 Lakhs</option>
              <option value="₹5 Lakhs - ₹8 Lakhs">₹5 Lakhs - ₹8 Lakhs</option>
              <option value="Above ₹8 Lakhs">Above ₹8 Lakhs</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Presets Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="font-semibold text-slate-500 dark:text-slate-400 text-[11px]">Quick Profile Presets:</span>
          <button
            onClick={applySeniorPreset}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all border ${
              filterAge >= 60 && selectedCategory === 'senior_citizens'
                ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-slate-700'
            }`}
          >
            👴 Senior Citizens (Age 60+)
          </button>
          <button
            onClick={applyAllStatesPreset}
            className="px-2.5 py-1 rounded-lg font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            🇮🇳 Show All Central & State Schemes
          </button>
          <button
            onClick={applyStudentPreset}
            className="px-2.5 py-1 rounded-lg font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            🎓 Youth & Education
          </button>
        </div>

        {/* Keyword Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search scheme name, state or keyword (e.g. Education loan, Karnataka, Startup, Mudra loan)... Press Enter to search live portals"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>

        {statusMessage && <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">{statusMessage}</p>}
      </div>

      {/* Category Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {SCHEME_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Schemes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSchemes.map((sch) => (
          <div
            key={sch.id}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-amber-500/50 transition-all space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    {sch.level} Govt Scheme
                  </span>
                  {sch.state && (
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {sch.state}
                    </span>
                  )}
                </div>

                <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> High Eligibility
                </span>
              </div>

              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white leading-snug">
                  {sch.name}
                </h3>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-xs text-slate-800 dark:text-slate-200 space-y-1">
                <p className="font-bold text-amber-900 dark:text-amber-300">Key Benefits & Subsidies:</p>
                <p className="leading-relaxed">{sch.benefits}</p>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                <p><span className="font-bold text-slate-800 dark:text-slate-200">Eligibility:</span> {sch.eligibilityCriteria}</p>
                <p><span className="font-bold text-slate-800 dark:text-slate-200">Summary:</span> {sch.summary}</p>
              </div>

              {/* Required Documents */}
              <div className="space-y-1 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <FileCheck2 className="w-3.5 h-3.5 text-indigo-500" /> Required Documents:
                </span>
                <div className="flex flex-wrap gap-1">
                  {sch.requiredDocuments.map((doc) => (
                    <span key={doc} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {doc}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Official Website Button */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
              <a
                href={sch.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center space-x-2 shadow-md shadow-amber-600/20 transition-all"
              >
                <span>Visit Official Application Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {filteredSchemes.length === 0 && (
        <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="p-3 w-12 h-12 mx-auto rounded-full bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              No matching schemes in local database
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              We couldn't find pre-loaded schemes matching "{searchQuery || selectedCategory}" for {filterState}. Click below to perform a live web search across official government portals.
            </p>
          </div>
          <button
            onClick={handleSearchGovtPortals}
            disabled={isSearchingGovt}
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-600/20 inline-flex items-center space-x-2 transition-all disabled:opacity-50"
          >
            {isSearchingGovt ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Search Official Portals with Gemini AI</span>
          </button>
        </div>
      )}
    </div>
  );
};
