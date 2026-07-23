import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ResourceType, LearningResourceItem } from '../../types';
import {
  BookOpen,
  Search,
  Globe,
  Sparkles,
  ExternalLink,
  Code2,
  FileCode,
  GraduationCap,
  Loader2,
  Tag,
} from 'lucide-react';

export const LearningView: React.FC = () => {
  const { resources, setResources, userProfile } = useApp();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [freeOnly, setFreeOnly] = useState<boolean>(false);

  const [isSearchingWeb, setIsSearchingWeb] = useState<boolean>(false);
  const [searchStatus, setSearchStatus] = useState<string>('');

  const handleSearchLiveResources = async () => {
    setIsSearchingWeb(true);
    setSearchStatus('Finding curated learning resources, courses & tutorials...');

    try {
      const res = await fetch('/api/gemini/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery || `all online courses and learning resources for ${userProfile.preferredRole || 'Software Engineering'}`,
          searchType: 'resources',
          userProfile,
        }),
      });

      const json = await res.json();
      if (json.isRateLimited) {
        setSearchStatus('AI search rate limit reached (429). Displaying curated learning resources. Please try AI search again in a moment.');
      } else if (json.success && Array.isArray(json.results) && json.results.length > 0) {
        const fetchedResources: LearningResourceItem[] = json.results.map((r: any, i: number) => ({
          id: r.id || `live-res-${Date.now()}-${i}`,
          title: r.title || 'Learning Resource',
          type: (r.type || 'Course') as ResourceType,
          provider: r.provider || 'Web Educational Resource',
          topic: r.topic || 'Software Development',
          isFree: typeof r.isFree === 'boolean' ? r.isFree : true,
          url: r.url || 'https://developer.mozilla.org',
          description: r.description || 'Verified educational resource for career upskilling.',
        }));

        setResources((prev) => {
          const ids = new Set(prev.map((p) => p.id));
          const filtered = fetchedResources.filter((f) => !ids.has(f.id));
          return [...filtered, ...prev];
        });

        setSearchStatus(`Fetched ${json.results.length} verified learning resources!`);
      } else {
        setSearchStatus('No new resources returned.');
      }
    } catch (err) {
      console.error(err);
      setSearchStatus('Failed to search web learning resources.');
    } finally {
      setIsSearchingWeb(false);
    }
  };

  const filteredResources = resources.filter((res) => {
    const matchesSearch =
      searchQuery === '' ||
      res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFree = !freeOnly || res.isFree;
    return matchesSearch && matchesFree;
  });

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header Search Box */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-500" /> All Learning Resources & Courses
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Explore curated courses, certifications, documentation, and educational resources all in one unified section.
            </p>
          </div>

          <button
            onClick={handleSearchLiveResources}
            disabled={isSearchingWeb}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 shrink-0"
          >
            {isSearchingWeb ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{isSearchingWeb ? 'Searching Web...' : 'Find Live Courses & Resources'}</span>
          </button>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchLiveResources()}
              placeholder="Search topic or course (e.g. React, System Design, AI/ML) — Press Enter to search web..."
              className="w-full pl-10 pr-28 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleSearchLiveResources}
              disabled={isSearchingWeb}
              className="absolute right-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-all disabled:opacity-50"
            >
              {isSearchingWeb ? 'Searching...' : 'Search Web'}
            </button>
          </div>

          <label className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={freeOnly}
              onChange={(e) => setFreeOnly(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span className="font-semibold">Free Resources Only</span>
          </label>
        </div>

        {searchStatus && <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{searchStatus}</p>}
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredResources.map((res) => (
          <div
            key={res.id}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-emerald-500/50 transition-all space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {res.type}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    res.isFree
                      ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                      : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                  }`}
                >
                  {res.isFree ? 'Free' : 'Paid / Freemium'}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2 leading-snug">
                  {res.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                  Provider: {res.provider}
                </p>
              </div>

              <div className="flex items-center space-x-1.5 text-xs text-slate-600 dark:text-slate-300">
                <Tag className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="truncate">{res.topic}</span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {res.description}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
              <a
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-all"
              >
                <span>Visit Resource</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
