import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bot,
  MapPin,
  Sparkles,
  Target,
  FileText,
  Linkedin,
  HelpCircle,
  Calendar,
  Send,
  Loader2,
  Copy,
  Check,
  BookOpen,
  ArrowRight,
  Zap,
} from 'lucide-react';

type ToolTab =
  | 'roadmap'
  | 'gap'
  | 'cover_letter'
  | 'linkedin'
  | 'interview'
  | 'study_plan'
  | 'chat';

export const AssistantView: React.FC = () => {
  const { userProfile } = useApp();
  const [activeTool, setActiveTool] = useState<ToolTab>('roadmap');

  // State for AI outputs
  const [loading, setLoading] = useState<boolean>(false);
  const [outputResult, setOutputResult] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Form Inputs
  const [targetRole, setTargetRole] = useState<string>(userProfile.preferredRole || 'Full Stack Engineer');
  const [companyName, setCompanyName] = useState<string>('Google / Tech Startup');
  const [jobDescription, setJobDescription] = useState<string>('Seeking a developer proficient in React, Node.js, and Cloud architectures.');
  const [chatInput, setChatInput] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'ai'; text: string }[]>([
    {
      sender: 'ai',
      text: `Hello ${userProfile.name || 'there'}! I am your AI Career Assistant. How can I help you accelerate your journey toward becoming a ${userProfile.preferredRole || 'top professional'} today?`,
    },
  ]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateAI = async (promptText: string, sysInst?: string) => {
    setLoading(true);
    setOutputResult('');

    try {
      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          systemInstruction: sysInst || 'You are an expert career counselor, tech recruiter, and resume consultant at AspireAI.',
        }),
      });

      const json = await res.json();
      if (json.success && json.text) {
        setOutputResult(json.text);
      } else {
        setOutputResult('AI generation failed. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setOutputResult('Connection error with Gemini AI backend.');
    } finally {
      setLoading(false);
    }
  };

  const generateRoadmap = () => {
    const prompt = `Generate a detailed 4-phase step-by-step career roadmap for a candidate aspiring to become a "${targetRole}".
Candidate Current Profile:
- Education: ${userProfile.education}
- Skills: ${(userProfile.skills || []).join(', ')}
- Career Goal: ${userProfile.careerGoals}

Format output with clear headers for Phase 1 (Foundations & Core Skills), Phase 2 (Intermediate Projects & System Architecture), Phase 3 (Advanced Specialization & Portfolio), Phase 4 (Job Hunting, Networking & Interview Prep). Include estimated duration and 3 concrete project ideas.`;
    handleGenerateAI(prompt);
  };

  const analyzeSkillGap = () => {
    const prompt = `Analyze skill gaps for candidate targeting "${targetRole}".
Candidate Current Skills: ${(userProfile.skills || []).join(', ')}
Candidate Education: ${userProfile.education}

Provide:
1. Matched Skills list
2. Missing Critical Skills required for ${targetRole}
3. Recommended Courses/Projects to close the gap fast.`;
    handleGenerateAI(prompt);
  };

  const generateCoverLetter = () => {
    const prompt = `Write a persuasive, tailored cover letter for candidate ${userProfile.name} applying for the role of "${targetRole}" at "${companyName}".
Candidate Skills: ${(userProfile.skills || []).join(', ')}
Education: ${userProfile.education}
Job Description Context: ${jobDescription}

Ensure high impact, professional tone, and mention relevant projects.`;
    handleGenerateAI(prompt);
  };

  const generateLinkedInBio = () => {
    const prompt = `Generate 3 catchy, high-impact LinkedIn Summary / About bios for a candidate aspiring to be a "${targetRole}".
Candidate Skills: ${(userProfile.skills || []).join(', ')}
Education: ${userProfile.education}
Include option 1 (Professional & Direct), option 2 (Story-driven & Passionate), option 3 (Action-oriented & Achievement focused). Include top relevant hashtag suggestions.`;
    handleGenerateAI(prompt);
  };

  const generateInterviewPrep = () => {
    const prompt = `Generate 5 top technical and behavioral interview questions for a candidate interviewing for "${targetRole}".
For each question, provide a high-scoring sample response structure using the STAR method (Situation, Task, Action, Result) or code approach.`;
    handleGenerateAI(prompt);
  };

  const generateStudyPlan = () => {
    const prompt = `Create a 6-week structured weekly study schedule for mastering key missing skills for "${targetRole}".
Candidate Skills: ${(userProfile.skills || []).join(', ')}
Break down each week into Goals, Key Topics to Study, and Weekly Practice Project.`;
    handleGenerateAI(prompt);
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || loading) return;

    const userText = chatInput.trim();
    setChatMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `User question: "${userText}"
Candidate Context: Role: ${userProfile.preferredRole}, Education: ${userProfile.education}, Skills: ${(userProfile.skills || []).join(', ')}.`,
          systemInstruction: 'You are AspireAI Career Assistant. Provide concise, encouraging, actionable career advice.',
        }),
      });

      const json = await res.json();
      if (json.success && json.text) {
        setChatMessages((prev) => [...prev, { sender: 'ai', text: json.text }]);
      }
    } catch (err) {
      setChatMessages((prev) => [...prev, { sender: 'ai', text: 'Apologies, I hit a network glitch. Please ask again!' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Assistant Top Nav Tabs */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Gemini AI Career Suite</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Generative roadmaps, cover letters, skill gaps & interview preparation</p>
          </div>
        </div>

        {/* Tool Selector Buttons */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            onClick={() => setActiveTool('roadmap')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTool === 'roadmap'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Career Roadmap</span>
          </button>

          <button
            onClick={() => setActiveTool('gap')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTool === 'gap'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Skill Gap Analysis</span>
          </button>

          <button
            onClick={() => setActiveTool('cover_letter')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTool === 'cover_letter'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Cover Letter</span>
          </button>

          <button
            onClick={() => setActiveTool('linkedin')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTool === 'linkedin'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Linkedin className="w-3.5 h-3.5" />
            <span>LinkedIn Bio</span>
          </button>

          <button
            onClick={() => setActiveTool('interview')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTool === 'interview'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Interview Prep</span>
          </button>

          <button
            onClick={() => setActiveTool('study_plan')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTool === 'study_plan'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Study Plan</span>
          </button>

          <button
            onClick={() => setActiveTool('chat')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTool === 'chat'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI Career Chatbot</span>
          </button>
        </div>
      </div>

      {/* Main Tool Content Panel */}
      {activeTool !== 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Column */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white capitalize flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-500" /> {activeTool.replace('_', ' ')} Settings
            </h3>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Preferred Role</label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {activeTool === 'cover_letter' && (
              <>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Company</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Job Description Snippet</label>
                  <textarea
                    rows={3}
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </>
            )}

            <button
              onClick={() => {
                if (activeTool === 'roadmap') generateRoadmap();
                if (activeTool === 'gap') analyzeSkillGap();
                if (activeTool === 'cover_letter') generateCoverLetter();
                if (activeTool === 'linkedin') generateLinkedInBio();
                if (activeTool === 'interview') generateInterviewPrep();
                if (activeTool === 'study_plan') generateStudyPlan();
              }}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{loading ? 'Generating with AI...' : `Generate ${activeTool.replace('_', ' ')}`}</span>
            </button>
          </div>

          {/* AI Output Result Column */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between min-h-[400px]">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-500" /> AI Generated Result
                </span>
                {outputResult && (
                  <button
                    onClick={() => copyToClipboard(outputResult)}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Result'}</span>
                  </button>
                )}
              </div>

              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                  <p className="text-xs font-semibold">Gemini AI is crafting your personalized content...</p>
                </div>
              ) : outputResult ? (
                <div className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line font-sans p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 max-h-[500px] overflow-y-auto">
                  {outputResult}
                </div>
              ) : (
                <div className="py-20 text-center space-y-2 text-slate-400">
                  <Bot className="w-10 h-10 mx-auto text-indigo-400/40" />
                  <p className="text-xs font-semibold">Click "Generate" on the left to start AI synthesis.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Interactive AI Chat Tab */}
      {activeTool === 'chat' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 h-[580px] flex flex-col justify-between">
          <div className="flex-1 overflow-y-auto space-y-3 p-2">
            {/* Quick Suggestion Chips */}
            <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Suggested Questions:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Top skills for my target role?',
                  'How to write bullet points with metrics?',
                  'Tips for technical salary negotiation',
                  'Recommended projects for portfolio',
                ].map((promptText) => (
                  <button
                    key={promptText}
                    onClick={() => {
                      setChatInput(promptText);
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors"
                  >
                    {promptText}
                  </button>
                ))}
              </div>
            </div>

            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xl p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white font-medium rounded-br-none'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200 dark:border-slate-700/60'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-400 flex items-center space-x-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                  <span>AI Career Assistant is typing...</span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSendChatMessage} className="flex items-center space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask any career, internship, or interview question..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={loading || !chatInput.trim()}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center space-x-1 transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
