import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileSearch,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Copy,
  Check,
  Upload,
  FileText,
  Target,
  Wand2,
  ArrowRight,
  ShieldCheck,
  Lightbulb,
  Award,
  BarChart3,
  ListChecks,
  Zap,
} from 'lucide-react';

export const ResumeAnalyzerView: React.FC = () => {
  const { userProfile, updateUserProfile } = useApp();

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStatus, setAnalysisStatus] = useState<string>('');
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  // Bullet Point Optimizer
  const [rawBullet, setRawBullet] = useState<string>('Worked on React frontend application and fixed bugs.');
  const [optimizedBullets, setOptimizedBullets] = useState<string>('');
  const [isOptimizingBullet, setIsOptimizingBullet] = useState<boolean>(false);
  const [copiedBullet, setCopiedBullet] = useState<boolean>(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setAnalysisStatus('Reading resume file (PDF/DOCX/TXT) & running AI ATS analysis...');

    try {
      const data = new FormData();
      data.append('resume', file);

      const res = await fetch('/api/resume/parse', {
        method: 'POST',
        body: data,
      });

      const json = await res.json();
      if (json.success && json.parsedData) {
        const pData = json.parsedData;
        const name = pData.candidateName || pData.name || '';
        const education = pData.educationSummary || pData.education || '';
        const preferredRole = pData.preferredRole || pData.role || '';
        const location = pData.location || '';
        const state = pData.state || '';
        const careerGoals = pData.careerGoals || pData.summary || '';
        const occupation = pData.occupation || '';
        const extractedSkills = pData.extractedSkills || [];
        const extractedInterests = pData.interests || pData.projects || [];
        const gender = pData.gender || '';
        const incomeBracket = pData.incomeBracket || '';
        const age = pData.age;

        updateUserProfile({
          name: name || userProfile.name,
          education: education || userProfile.education,
          preferredRole: preferredRole || userProfile.preferredRole,
          location: location || userProfile.location,
          state: state || userProfile.state,
          careerGoals: careerGoals || userProfile.careerGoals,
          occupation: occupation || userProfile.occupation,
          skills: extractedSkills.length > 0 ? extractedSkills : userProfile.skills,
          interests: extractedInterests.length > 0 ? extractedInterests : userProfile.interests,
          age: age !== undefined ? Number(age) : userProfile.age,
          gender: gender || userProfile.gender,
          incomeBracket: incomeBracket || userProfile.incomeBracket,
          resumeText: json.resumeText,
          resumeFileName: file.name,
          resumeParsedData: json.parsedData,
        });
        setAnalysisStatus(`Resume parsed successfully! File: ${file.name}`);
        setCompletedSteps({});
      } else {
        setAnalysisStatus(json.error || 'Failed to parse resume file. Please try another file format.');
      }
    } catch (err) {
      console.error(err);
      setAnalysisStatus('Error analyzing resume file.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleOptimizeBullet = async () => {
    if (!rawBullet.trim()) return;

    setIsOptimizingBullet(true);
    setOptimizedBullets('');

    try {
      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Rewrite the following weak resume bullet point into 3 high-impact, quantified, STAR-method bullet points starting with strong action verbs:
Weak Bullet: "${rawBullet}"
Target Role: ${userProfile.preferredRole || 'Professional'}`,
          systemInstruction: 'You are an elite executive resume writer. Output 3 bullet options with metrics placeholder (e.g. 35%, 10k users) and action verbs.',
        }),
      });

      const json = await res.json();
      if (json.success && json.text) {
        setOptimizedBullets(json.text);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsOptimizingBullet(false);
    }
  };

  const toggleStep = (index: number) => {
    setCompletedSteps((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const parsed = userProfile.resumeParsedData;
  const atsScore = parsed?.atsScore ?? 0;

  // Determine ATS status tier
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800';
    if (score >= 60) return 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800';
    return 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800';
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Resume Upload Box */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileSearch className="w-5 h-5 text-indigo-500" /> AI Resume & ATS Analyzer
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Upload your resume (PDF, DOCX, or TXT) to evaluate ATS score, verify extracted contact details, and view personalized action steps to correct your resume.
            </p>
          </div>
          {userProfile.resumeFileName && (
            <span className="text-xs bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full font-semibold border border-indigo-200 dark:border-indigo-800 shrink-0 self-start sm:self-auto">
              Loaded: {userProfile.resumeFileName}
            </span>
          )}
        </div>

        {/* Upload Dropzone Card */}
        <div className="p-6 rounded-xl border-2 border-dashed border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/40 dark:bg-indigo-950/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-all text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
            {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Upload Candidate Resume Document</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Supports PDF, DOCX, or TXT formats (up to 10MB)</p>
          </div>

          <div className="pt-1 flex flex-col items-center justify-center space-y-2">
            <label className="cursor-pointer px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 inline-flex items-center space-x-2 transition-all">
              <Upload className="w-4 h-4" />
              <span>{isAnalyzing ? 'Analyzing Resume File...' : 'Select PDF / DOCX Resume'}</span>
              <input type="file" accept=".pdf,.txt,.doc,.docx" onChange={handleFileUpload} className="hidden" />
            </label>
            {analysisStatus && (
              <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-2">{analysisStatus}</p>
            )}
          </div>
        </div>
      </div>

      {/* Analysis Output Dashboard */}
      {parsed ? (
        <div className="space-y-6">
          {/* Top ATS Score Meter Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Main Score Meter Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-800/80 shadow-md flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-extrabold tracking-wider text-indigo-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Overall ATS Score
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getScoreColor(atsScore)}`}>
                  {atsScore >= 80 ? 'Excellent Match' : atsScore >= 60 ? 'Moderate Match' : 'Action Required'}
                </span>
              </div>

              <div className="flex items-baseline space-x-3">
                <span className="text-5xl font-black tracking-tight text-emerald-400">{atsScore}</span>
                <span className="text-base font-bold text-slate-400">/ 100</span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-700 ${
                      atsScore >= 80 ? 'bg-emerald-500' : atsScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(5, atsScore))}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                  <span>0%</span>
                  <span>Benchmark: 75%+</span>
                  <span>100%</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed pt-1 border-t border-slate-800">
                {parsed.summary || (atsScore >= 80
                  ? 'Strong formatting and keyword density detected. Your resume is well-optimized for recruitment ATS algorithms.'
                  : 'Your resume has good baseline content, but requires additional keyword matching and quantified metrics.')}
              </p>
            </div>

            {/* Extracted Candidate Profile Details */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
                <Award className="w-4 h-4 text-indigo-500" /> Extracted Candidate Profile
              </span>
              <div className="grid grid-cols-1 gap-2 text-xs">
                {parsed.candidateName && (
                  <div>
                    <span className="text-slate-400 font-medium">Candidate Name:</span>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{parsed.candidateName}</p>
                  </div>
                )}
                {(parsed.email || parsed.phone) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                    {parsed.email && (
                      <div>
                        <span className="text-slate-400 text-[10px] font-semibold uppercase block">Detected Email</span>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{parsed.email}</p>
                      </div>
                    )}
                    {parsed.phone && (
                      <div>
                        <span className="text-slate-400 text-[10px] font-semibold uppercase block">Detected Phone</span>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{parsed.phone}</p>
                      </div>
                    )}
                  </div>
                )}
                <div>
                  <span className="text-slate-400 font-medium">Target Job Role:</span>
                  <p className="font-bold text-indigo-600 dark:text-indigo-400 text-xs">{parsed.preferredRole || 'Software Professional'}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-slate-400 font-medium">Experience:</span>
                    <p className="font-bold text-slate-900 dark:text-white text-xs">{parsed.experienceYears || 0} Years</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Location:</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{parsed.location || 'Not Specified'}</p>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Education:</span>
                  <p className="font-medium text-slate-800 dark:text-slate-200 text-xs">{parsed.educationSummary || 'Not explicitly stated'}</p>
                </div>
              </div>
            </div>

            {/* Extracted Skills */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Extracted Skills ({parsed.extractedSkills?.length || 0})</span>
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                </span>
                <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto pt-1">
                  {parsed.extractedSkills && parsed.extractedSkills.length > 0 ? (
                    parsed.extractedSkills.map((skill) => (
                      <span
                        key={skill}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-semibold"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">No explicit technical skills identified.</span>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-slate-400 italic border-t border-slate-100 dark:border-slate-800 pt-2">
                Auto-synced to your candidate profile for personalized job recommendations.
              </p>
            </div>
          </div>

          {/* Recommended Steps to Correct & Fix Resume */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ListChecks className="w-5 h-5 text-indigo-500" /> Recommended Action Steps to Correct & Optimize
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Follow this prioritized checklist to improve your ATS score and fix formatting or keyword gaps.
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 shrink-0">
                {Object.values(completedSteps).filter(Boolean).length} of {parsed.feedback?.length || 0} Fixes Applied
              </span>
            </div>

            <div className="space-y-3">
              {parsed.feedback && parsed.feedback.length > 0 ? (
                parsed.feedback.map((tip, idx) => {
                  const isDone = !!completedSteps[idx];
                  const isHighPriority = idx === 0 || tip.toLowerCase().includes('action') || tip.toLowerCase().includes('metric') || tip.toLowerCase().includes('skill');

                  return (
                    <div
                      key={idx}
                      onClick={() => toggleStep(idx)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start space-x-3 ${
                        isDone
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/80 opacity-80'
                          : 'bg-slate-50/60 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/70 hover:border-indigo-300 dark:hover:border-indigo-700'
                      }`}
                    >
                      <button className="mt-0.5 shrink-0">
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-100 dark:fill-emerald-950" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 hover:border-indigo-500"></div>
                        )}
                      </button>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                            isHighPriority
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                              : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                          }`}>
                            {isHighPriority ? 'High Priority Step' : 'Recommendation'}
                          </span>
                          <span className="text-[11px] font-bold text-slate-500">Step {idx + 1}</span>
                        </div>
                        <p className={`text-xs font-semibold leading-relaxed ${isDone ? 'line-through text-slate-500 dark:text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>
                          {tip}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-500">
                  No critical errors found. Your resume structure looks clean!
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 text-slate-500 dark:text-slate-400">
          <FileText className="w-12 h-12 mx-auto text-indigo-400/60 animate-bounce" />
          <p className="text-base font-bold text-slate-800 dark:text-slate-200">No active resume analysis present.</p>
          <p className="text-xs max-w-md mx-auto">
            Upload your PDF/DOCX resume file above or click "Analyze Resume Text" to calculate your ATS Score and view personalized step-by-step corrections.
          </p>
        </div>
      )}

      {/* AI Bullet Point Quantifier & Rewriter Tool */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center space-x-2">
          <Wand2 className="w-5 h-5 text-indigo-500" />
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">AI Bullet Point Quantifier & Fixer</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Paste a weak bullet point from your resume to automatically rewrite it into high-impact, quantified STAR-method bullet statements.
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Enter Weak Bullet Point from Resume</label>
            <input
              type="text"
              value={rawBullet}
              onChange={(e) => setRawBullet(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              placeholder="e.g. Worked on React website and optimized SQL queries."
            />
          </div>

          <button
            onClick={handleOptimizeBullet}
            disabled={isOptimizingBullet || !rawBullet.trim()}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-colors disabled:opacity-50"
          >
            {isOptimizingBullet ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>{isOptimizingBullet ? 'Rewriting with Action Metrics...' : 'Generate High-Impact Fix Options'}</span>
          </button>

          {optimizedBullets && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-slate-800 dark:text-slate-200 font-sans whitespace-pre-line">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-1.5">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">Quantified Rewrites (Ready to Copy):</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(optimizedBullets);
                    setCopiedBullet(true);
                    setTimeout(() => setCopiedBullet(false), 2000);
                  }}
                  className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 text-xs"
                >
                  {copiedBullet ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedBullet ? 'Copied to Clipboard' : 'Copy All Options'}</span>
                </button>
              </div>
              <p className="leading-relaxed text-xs">{optimizedBullets}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

