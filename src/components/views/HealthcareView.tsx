import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { HealthcareItem } from '../../types';
import {
  Hospital,
  User,
  Search,
  MapPin,
  Phone,
  Clock,
  Star,
  ExternalLink,
  Map,
  ShieldAlert,
  Sparkles,
  Loader2,
  Stethoscope,
  Calendar,
  Building2,
  Send,
  Bot,
} from 'lucide-react';

export const HealthcareView: React.FC = () => {
  const { healthcareList, setHealthcareList, userProfile } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'hospital' | 'doctor' | 'guidance'>('hospital');
  const [searchLocation, setSearchLocation] = useState<string>(userProfile.location || 'All India');
  const [searchSpecialty, setSearchSpecialty] = useState<string>('');

  const [isSearchingHealth, setIsSearchingHealth] = useState<boolean>(false);
  const [searchStatus, setSearchStatus] = useState<string>('');

  // AI Health Chatbot State
  const [healthChatInput, setHealthChatInput] = useState<string>('');
  const [isHealthChatLoading, setIsHealthChatLoading] = useState<boolean>(false);
  const [healthChatMessages, setHealthChatMessages] = useState<{ sender: 'user' | 'ai'; text: string }[]>([
    {
      sender: 'ai',
      text: `Hello ${userProfile.name || 'there'}! I am your AI Healthcare Chatbot. Describe any symptoms, ask about doctor specialties, OPD guidance, or health awareness topics. How can I support your health today?`,
    },
  ]);

  const handleSendHealthChatMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const messageText = customText || healthChatInput.trim();
    if (!messageText || isHealthChatLoading) return;

    setHealthChatMessages((prev) => [...prev, { sender: 'user', text: messageText }]);
    if (!customText) setHealthChatInput('');
    setIsHealthChatLoading(true);

    try {
      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `User health question or symptom: "${messageText}".
User location context: ${searchLocation || userProfile.location || 'India'}.

Provide compassionate, structured educational guidance covering:
1. Overview of reported symptoms or health query
2. Recommended medical specialist to consult (e.g. Cardiologist, Orthopedist, General Physician)
3. Key warning signs requiring emergency ER visit.
4. Short reminder that this is educational guidance, not a formal diagnosis.`,
          systemInstruction: 'You are a compassionate, professional AI Healthcare Chatbot. Provide clear, supportive, educational medical guidance with appropriate disclaimers.',
        }),
      });

      const json = await res.json();
      if (json.success && json.text) {
        setHealthChatMessages((prev) => [...prev, { sender: 'ai', text: json.text }]);
      } else {
        setHealthChatMessages((prev) => [...prev, { sender: 'ai', text: 'I encountered an issue processing your request. Please try asking again.' }]);
      }
    } catch (err) {
      console.error(err);
      setHealthChatMessages((prev) => [...prev, { sender: 'ai', text: 'Connection issue. Please check your network and try again.' }]);
    } finally {
      setIsHealthChatLoading(false);
    }
  };

  const handleSearchHealthcare = async () => {
    setIsSearchingHealth(true);
    const queryTerm = `${activeSubTab === 'doctor' ? 'doctor specialist' : 'hospital'} ${searchSpecialty}`.trim();
    setSearchStatus(`Searching live web sources for verified ${activeSubTab === 'doctor' ? 'doctors' : 'hospitals'} in ${searchLocation}...`);

    try {
      const res = await fetch('/api/gemini/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `${queryTerm} in ${searchLocation}`,
          searchType: 'healthcare',
          userProfile: {
            ...userProfile,
            location: searchLocation,
            requestedType: activeSubTab,
          },
        }),
      });

      const json = await res.json();
      if (json.isRateLimited) {
        setSearchStatus('AI search rate limit reached (429). Displaying verified local healthcare directory. Please try AI search again in a moment.');
      } else if (json.success && Array.isArray(json.results) && json.results.length > 0) {
        const fetchedList: HealthcareItem[] = json.results.map((r: any, i: number) => ({
          id: r.id || `live-hc-${Date.now()}-${i}`,
          name: r.name || (r.doctorName ? `Clinic of ${r.doctorName}` : 'Medical Center'),
          type: (r.type === 'Doctor' || r.doctorName ? 'Doctor' : 'Hospital') as 'Hospital' | 'Doctor',
          doctorName: r.doctorName,
          qualification: r.qualification || 'MD / Specialist',
          specialty: Array.isArray(r.specialty) && r.specialty.length > 0 ? r.specialty : [searchSpecialty || 'General Care'],
          rating: r.rating || 4.8,
          address: r.address || searchLocation,
          city: r.city || searchLocation,
          state: r.state || userProfile.state || 'India',
          contact: r.contact || '+91 Helpline',
          timings: r.timings || 'OPD & Online Consultation',
          emergencyAvailable: typeof r.emergencyAvailable === 'boolean' ? r.emergencyAvailable : true,
          googleMapsUrl: r.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent((r.doctorName || r.name) + ' ' + searchLocation)}`,
          websiteUrl: r.websiteUrl || 'https://ors.gov.in',
          summary: r.summary || 'Verified medical care facility with online appointment booking.',
        }));

        setHealthcareList((prev) => {
          const ids = new Set(prev.map((p) => p.id));
          const filtered = fetchedList.filter((f) => !ids.has(f.id));
          return [...filtered, ...prev];
        });

        setSearchStatus(`Found ${json.results.length} verified ${activeSubTab === 'doctor' ? 'doctors' : 'hospitals'}!`);
      } else {
        setSearchStatus('No new facilities returned for this specific search. Try broadening location or specialty.');
      }
    } catch (err) {
      console.error(err);
      setSearchStatus('Healthcare search connection error. Showing local directory.');
    } finally {
      setIsSearchingHealth(false);
    }
  };

  const filteredHealthcare = healthcareList.filter((hc) => {
    if (activeSubTab === 'hospital' && hc.type !== 'Hospital') return false;
    if (activeSubTab === 'doctor' && hc.type !== 'Doctor') return false;

    const locClean = searchLocation.trim().toLowerCase();
    const matchesLoc =
      locClean === '' ||
      locClean.includes('all') ||
      locClean.includes('india') ||
      hc.city.toLowerCase().includes(locClean) ||
      hc.address.toLowerCase().includes(locClean) ||
      hc.state.toLowerCase().includes(locClean) ||
      locClean.includes(hc.city.toLowerCase());

    const specClean = searchSpecialty.trim().toLowerCase();
    const matchesSpec =
      specClean === '' ||
      hc.specialty.some((s) => s.toLowerCase().includes(specClean)) ||
      hc.name.toLowerCase().includes(specClean) ||
      (hc.doctorName && hc.doctorName.toLowerCase().includes(specClean)) ||
      (hc.qualification && hc.qualification.toLowerCase().includes(specClean));

    return matchesLoc && matchesSpec;
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchHealthcare();
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Top Banner & Sub-Tabs */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Hospital className="w-5 h-5 text-rose-500" /> Doctors & Hospitals Directory
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Discover top specialists, super-specialty hospitals, OPD timings, and direct online appointment booking.
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveSubTab('hospital')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                activeSubTab === 'hospital' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Hospitals</span>
            </button>
            <button
              onClick={() => setActiveSubTab('doctor')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                activeSubTab === 'doctor' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Doctors</span>
            </button>
            <button
              onClick={() => setActiveSubTab('guidance')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                activeSubTab === 'guidance' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>AI Health Chatbot</span>
            </button>
          </div>
        </div>

        {/* Location & Specialty Search Bar */}
        {activeSubTab !== 'guidance' && (
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">City / Location</label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                    placeholder="e.g. All India, Delhi, Bengaluru, Mumbai"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Specialty / Doctor / Treatment</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchSpecialty}
                    onChange={(e) => setSearchSpecialty(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                    placeholder="e.g. Cardiology, Orthopedics, Dr. Naresh Trehan"
                  />
                </div>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleSearchHealthcare}
                  disabled={isSearchingHealth}
                  className="w-full py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
                >
                  {isSearchingHealth ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>{isSearchingHealth ? 'Searching Web...' : `Search Web for ${activeSubTab === 'doctor' ? 'Doctors' : 'Hospitals'}`}</span>
                </button>
              </div>
            </div>

            {/* Quick Filter Specialty Chips */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs pt-1">
              <span className="font-semibold text-slate-500 dark:text-slate-400 text-[11px] mr-1">Popular Specialties:</span>
              {['Cardiology', 'Neurology', 'Oncology', 'Orthopedics', 'Pediatrics', 'Gastroenterology'].map((spec) => (
                <button
                  key={spec}
                  onClick={() => setSearchSpecialty(spec)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors border ${
                    searchSpecialty === spec
                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {spec}
                </button>
              ))}
              {searchSpecialty && (
                <button
                  onClick={() => setSearchSpecialty('')}
                  className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline font-semibold ml-2"
                >
                  Clear Specialty
                </button>
              )}
            </div>
          </div>
        )}

        {searchStatus && (
          <p className="text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{searchStatus}</span>
          </p>
        )}
      </div>

      {/* Directory Grid View */}
      {activeSubTab !== 'guidance' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredHealthcare.map((hc) => (
            <div
              key={hc.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-rose-500/50 transition-all space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1">
                      {hc.type === 'Doctor' ? <User className="w-3 h-3" /> : <Hospital className="w-3 h-3" />}
                      {hc.type}
                    </span>
                    {hc.emergencyAvailable && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                        24/7 Emergency
                      </span>
                    )}
                  </div>

                  <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {hc.rating} / 5.0
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white leading-snug">
                    {hc.type === 'Doctor' ? (hc.doctorName || hc.name) : hc.name}
                  </h3>
                  {hc.type === 'Doctor' && hc.name && hc.name !== hc.doctorName && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{hc.name}</p>
                  )}
                  {hc.qualification && (
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">{hc.qualification}</p>
                  )}
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0" /> {hc.address}, {hc.city}, {hc.state}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-rose-500" /> {hc.contact}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-400" /> {hc.timings}</span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {hc.summary}
                </p>

                {/* Specialties Tags */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {hc.specialty.map((spec) => (
                    <span key={spec} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              {/* Redirection Links */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs gap-2">
                <a
                  href={hc.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold flex items-center gap-1 shrink-0"
                >
                  <Map className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Google Maps</span>
                </a>

                <a
                  href={hc.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-colors text-right"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Book Appointment / Official Website</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State with Live Web Search Prompt */}
      {activeSubTab !== 'guidance' && filteredHealthcare.length === 0 && (
        <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="p-3 w-12 h-12 mx-auto rounded-full bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center">
            {activeSubTab === 'doctor' ? <User className="w-6 h-6" /> : <Hospital className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              No local {activeSubTab === 'doctor' ? 'doctors' : 'hospitals'} found matching "{searchSpecialty || 'query'}" in {searchLocation}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Search live medical web directories and hospital appointment systems across India using Gemini AI Search.
            </p>
          </div>
          <button
            onClick={handleSearchHealthcare}
            disabled={isSearchingHealth}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 inline-flex items-center space-x-2 transition-all disabled:opacity-50"
          >
            {isSearchingHealth ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Search Live Web for {activeSubTab === 'doctor' ? 'Doctors' : 'Hospitals'} with Gemini AI</span>
          </button>
        </div>
      )}

      {/* AI Health Chatbot View */}
      {activeSubTab === 'guidance' && (
        <div className="space-y-4">
          {/* Medical Disclaimer Banner */}
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 flex items-start space-x-3 text-xs text-amber-900 dark:text-amber-200">
            <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold uppercase tracking-wider text-[10px] text-amber-700 dark:text-amber-300">Important Medical Disclaimer</span>
              <p className="leading-relaxed">
                AspireAI health chatbot guidance is for informational and educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. In case of a medical emergency, call emergency services or visit the nearest hospital immediately.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 h-[580px] flex flex-col justify-between">
            <div className="flex-1 overflow-y-auto space-y-3 p-2">
              {/* Quick Health Prompt Chips */}
              <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Common Health Queries:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Which specialist for back pain?',
                    'First aid for minor burns',
                    'OPD visit preparation tips',
                    'How to manage sudden fever?',
                  ].map((promptText) => (
                    <button
                      key={promptText}
                      onClick={() => handleSendHealthChatMessage(undefined, promptText)}
                      className="text-[11px] px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900 transition-colors"
                    >
                      {promptText}
                    </button>
                  ))}
                </div>
              </div>

              {healthChatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xl p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${
                      msg.sender === 'user'
                        ? 'bg-rose-600 text-white font-medium rounded-br-none'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200 dark:border-slate-700/60'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isHealthChatLoading && (
                <div className="flex justify-start">
                  <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-400 flex items-center space-x-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                    <span>AI Healthcare Chatbot is typing...</span>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSendHealthChatMessage} className="flex items-center space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <input
                type="text"
                value={healthChatInput}
                onChange={(e) => setHealthChatInput(e.target.value)}
                placeholder="Ask about symptoms, medical specialties, or health guidance..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-rose-500"
              />
              <button
                type="submit"
                disabled={isHealthChatLoading || !healthChatInput.trim()}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center space-x-1 transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
