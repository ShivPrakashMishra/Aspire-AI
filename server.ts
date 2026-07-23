import express, { Request, Response } from 'express';
import path from 'path';
import multer from 'multer';
import * as pdfParseModule from 'pdf-parse';
import { GoogleGenAI, Type } from '@google/genai';

const pdfParse = (pdfParseModule as any).default || pdfParseModule;
import { createServer as createViteServer } from 'vite';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Helper for Gemini call with 1 retry on 429 rate limit
async function callGeminiWithRetry<T>(fn: () => Promise<T>, retries = 1, delayMs = 1200): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    const isRateLimited = err?.status === 429 || err?.status === 'RESOURCE_EXHAUSTED' || String(err).includes('429') || String(err).includes('quota') || String(err).includes('RESOURCE_EXHAUSTED');
    if (isRateLimited && retries > 0) {
      console.warn(`Gemini 429 Rate Limit hit. Retrying request in ${delayMs}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return callGeminiWithRetry(fn, retries - 1, delayMs * 1.5);
    }
    throw err;
  }
}

// Initialize Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY environment variable is missing.');
  }
  return new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Healthcheck
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Heuristic resume parser fallback for offline/rate-limited operation
const COMMON_SKILLS_LIST = [
  'JavaScript', 'TypeScript', 'React', 'React Native', 'Node.js', 'Express', 'Python', 'Java', 'C++', 'C#', 'C',
  'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin', 'HTML', 'CSS', 'Tailwind', 'Bootstrap', 'Sass', 'Next.js', 'Vue', 'Angular',
  'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Firebase', 'Firestore', 'SQLite', 'GraphQL', 'REST API',
  'AWS', 'Azure', 'Google Cloud', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Git', 'GitHub', 'GitLab', 'Linux',
  'Machine Learning', 'Deep Learning', 'Data Science', 'Pandas', 'NumPy', 'TensorFlow', 'PyTorch', 'Scikit-Learn',
  'System Design', 'Data Structures', 'Algorithms', 'OOP', 'Agile', 'Scrum', 'Jira', 'Figma',
  'Communication', 'Leadership', 'Problem Solving', 'Teamwork', 'Project Management', 'Time Management', 'Critical Thinking'
];

function parseResumeHeuristically(rawText: string, fileName = 'resume') {
  const cleanText = rawText
    .replace(/<[^>]+>/g, ' ')
    .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const textLower = cleanText.toLowerCase();

  // Extract Email & Phone
  const emailMatch = cleanText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
  const email = emailMatch ? emailMatch[0] : '';

  const phoneMatch = cleanText.match(/\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/);
  const phone = phoneMatch ? phoneMatch[0] : '';

  // Candidate Name extraction
  let candidateName = '';
  const lines = rawText.split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 5)) {
    const cleanLine = line.replace(/[^a-zA-Z\s]/g, '').trim();
    const words = cleanLine.split(/\s+/);
    if (
      words.length >= 2 &&
      words.length <= 4 &&
      !/resume|curriculum|vitae|page|contact|phone|email|education|experience|skills|profile|summary|address/i.test(line)
    ) {
      candidateName = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      break;
    }
  }

  // Skill extraction
  const foundSkillsSet = new Set<string>();
  for (const skill of COMMON_SKILLS_LIST) {
    const escaped = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(cleanText)) {
      foundSkillsSet.add(skill);
    }
  }
  const extractedSkills = Array.from(foundSkillsSet);

  // Experience estimation
  let experienceYears = 0;
  const yearMatches = cleanText.match(/\b(19|20)\d{2}\b/g);
  if (yearMatches && yearMatches.length >= 2) {
    const years = yearMatches.map(Number).sort((a, b) => a - b);
    const span = Math.min(years[years.length - 1], new Date().getFullYear()) - years[0];
    if (span >= 1 && span <= 25) {
      experienceYears = span;
    }
  }

  // Education estimation
  let educationSummary = '';
  if (textLower.includes('phd') || textLower.includes('doctorate')) {
    educationSummary = 'PhD / Doctorate Degree';
  } else if (textLower.includes('m.tech') || textLower.includes('m.s') || textLower.includes('master') || textLower.includes('mca')) {
    educationSummary = 'Master’s Degree (M.Tech / M.S / MCA)';
  } else if (textLower.includes('b.tech') || textLower.includes('b.e') || textLower.includes('bachelor') || textLower.includes('b.s')) {
    educationSummary = 'Bachelor of Technology / Engineering Degree';
  } else if (textLower.includes('diploma')) {
    educationSummary = 'Diploma in Engineering / Technology';
  } else if (textLower.includes('high school') || textLower.includes('secondary')) {
    educationSummary = 'Higher Secondary Education';
  }

  // Preferred Role
  let preferredRole = '';
  const roles = [
    'Full Stack Software Engineer', 'Frontend Developer', 'Backend Developer', 'Mobile App Developer',
    'Data Scientist', 'Machine Learning Engineer', 'UI/UX Designer', 'DevOps Engineer',
    'Cloud Architect', 'Cybersecurity Analyst', 'Product Manager', 'QA Engineer', 'Software Engineer'
  ];
  for (const r of roles) {
    if (new RegExp(`\\b${r}\\b`, 'i').test(cleanText)) {
      preferredRole = r;
      break;
    }
  }
  if (!preferredRole && extractedSkills.length > 0) {
    if (extractedSkills.includes('React') || extractedSkills.includes('Node.js')) {
      preferredRole = 'Full Stack Software Engineer';
    } else if (extractedSkills.includes('Python') || extractedSkills.includes('Machine Learning')) {
      preferredRole = 'Data Scientist / AI Developer';
    } else {
      preferredRole = 'Software Engineer';
    }
  }

  // Location / City
  let location = '';
  const cities = ['Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Pune', 'Chennai', 'Noida', 'Gurgaon', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Chandigarh', 'San Francisco', 'New York', 'London'];
  for (const c of cities) {
    if (new RegExp(`\\b${c}\\b`, 'i').test(cleanText)) {
      location = `${c}, India`;
      break;
    }
  }

  // State
  let state = '';
  const states = ['Karnataka', 'Maharashtra', 'Delhi', 'Telangana', 'Tamil Nadu', 'Uttar Pradesh', 'West Bengal', 'Gujarat', 'Rajasthan', 'Punjab', 'Haryana', 'California', 'Texas'];
  for (const s of states) {
    if (new RegExp(`\\b${s}\\b`, 'i').test(cleanText)) {
      state = s;
      break;
    }
  }

  // Career Goals / Summary
  let careerGoals = '';
  if (cleanText.length > 50) {
    careerGoals = `Seeking growth opportunities as a ${preferredRole || 'Software Professional'} in high-impact technical projects.`;
  }

  // Occupation
  let occupation = '';
  if (textLower.includes('student') || textLower.includes('undergraduate') || textLower.includes('intern') || experienceYears <= 1) {
    occupation = 'Student';
  } else if (experienceYears > 1) {
    occupation = 'Working Professional';
  }

  // Interests
  const interests: string[] = [];
  if (extractedSkills.includes('React') || extractedSkills.includes('HTML')) interests.push('Web Development');
  if (extractedSkills.includes('Python') || extractedSkills.includes('Machine Learning')) interests.push('Artificial Intelligence');
  if (extractedSkills.includes('Docker') || extractedSkills.includes('AWS')) interests.push('Cloud & DevOps');
  if (extractedSkills.includes('Git')) interests.push('Open Source');

  const projects: string[] = [];

  // ATS Score calculation
  let atsScore = 65;
  if (cleanText.length > 200) atsScore += 10;
  if (extractedSkills.length >= 5) atsScore += 10;
  if (email) atsScore += 5;
  if (phone) atsScore += 5;
  atsScore = Math.min(95, Math.max(60, atsScore));

  const feedback: string[] = [];
  if (!email || !phone) {
    feedback.push('Ensure your phone number and professional email address are clearly visible at the top of your resume.');
  }
  if (!cleanText.match(/\b(improved|increased|decreased|reduced|achieved|developed|built|managed|led|spearheaded|architected|automated)\b/i)) {
    feedback.push('Start your experience and project bullet points with strong action verbs like Spearheaded, Architected, or Automated.');
  }
  if (!cleanText.match(/\b(\d+%\b|\$\d+|\b\d+\b\s*(users|customers|clients|percent|ms|seconds|hours|projects|teams))\b/i)) {
    feedback.push('Include quantifiable metrics and statistics (e.g. "Increased app speed by 35%", "Served 10k+ active users").');
  }
  if (extractedSkills.length < 5) {
    feedback.push('Add a dedicated Technical Skills section highlighting key frameworks, languages, and databases.');
  }
  if (projects.length === 0 && !cleanText.toLowerCase().includes('project')) {
    feedback.push('Include 2-3 key technical projects with tech stack details, live deployment links, and measurable outcomes.');
  }
  if (feedback.length < 3) {
    feedback.push('Tailor your summary statement directly to your target role to match ATS keyword filters.');
  }

  const top3Skills = extractedSkills.slice(0, 3).join(', ');
  const summary = candidateName
    ? `${candidateName} is a ${preferredRole || 'candidate'} skilled in ${top3Skills || 'software engineering'}.`
    : `Candidate profile skilled in ${top3Skills || 'software development'}.`;

  return {
    extractedText: cleanText.length > 20 ? cleanText : rawText || 'Resume content processed successfully.',
    candidateName,
    email,
    phone,
    educationSummary,
    preferredRole,
    location,
    state,
    careerGoals,
    occupation,
    extractedSkills,
    interests,
    projects,
    experienceYears,
    atsScore,
    feedback,
    summary,
  };
}

// Resume Parsing Endpoint
app.post('/api/resume/parse', upload.single('resume'), async (req: Request, res: Response) => {
  let resumeText = '';
  let isPdf = false;
  let fileBuffer: Buffer | null = null;
  let fileName = '';

  try {
    if (req.file) {
      fileBuffer = req.file.buffer;
      fileName = req.file.originalname || 'resume';
      const mime = req.file.mimetype || '';
      const magicPrefix = fileBuffer ? fileBuffer.slice(0, 4).toString() : '';

      if (mime.includes('pdf') || fileName.toLowerCase().endsWith('.pdf') || magicPrefix === '%PDF') {
        isPdf = true;
        try {
          const pdfData = await pdfParse(fileBuffer);
          if (pdfData && pdfData.text && pdfData.text.trim().length > 30) {
            resumeText = pdfData.text;
          }
        } catch (pdfErr) {
          console.warn('pdf-parse warning on buffer:', pdfErr);
        }

        // Buffer string extraction fallback if pdf-parse returned short/empty text
        if ((!resumeText || resumeText.trim().length < 30) && fileBuffer) {
          const printableMatches = fileBuffer.toString('binary').match(/[a-zA-Z0-9\s.,@+\-#]{4,}/g);
          if (printableMatches && printableMatches.length > 0) {
            const extractedBufferText = printableMatches.join(' ').replace(/\s+/g, ' ').trim();
            if (extractedBufferText.length > 30) {
              resumeText = extractedBufferText;
            }
          }
        }
      } else {
        try {
          // Check if DOCX (ZIP format starting with PK\x03\x04)
          const rawStr = fileBuffer ? fileBuffer.toString('utf-8') : '';
          if (fileBuffer && fileBuffer.slice(0, 4).toString() === 'PK\x03\x04') {
            const xmlTextMatches = rawStr.match(/<w:t[^>]*>(.*?)<\/w:t>/gi);
            if (xmlTextMatches && xmlTextMatches.length > 0) {
              resumeText = xmlTextMatches.map((m) => m.replace(/<[^>]+>/g, '')).join(' ').replace(/\s+/g, ' ').trim();
            }
          }
          if (!resumeText || resumeText.trim().length < 20) {
            resumeText = rawStr.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
          }
        } catch (txtErr) {
          console.warn('Text conversion issue:', txtErr);
        }
      }
    } else if (req.body && req.body.resumeText) {
      resumeText = req.body.resumeText;
    }

    if (!resumeText || resumeText.trim().length === 0) {
      if (fileBuffer) {
        const printableMatches = fileBuffer.toString('binary').match(/[a-zA-Z0-9\s.,@+\-#]{3,}/g);
        if (printableMatches && printableMatches.length > 0) {
          resumeText = printableMatches.join(' ').replace(/\s+/g, ' ').trim();
        }
      }
    }

    if (!resumeText || resumeText.trim().length === 0) {
      resumeText = 'Candidate Resume Content';
    }

    // Attempt Gemini AI Parsing
    try {
      const ai = getGeminiClient();

      if (isPdf && fileBuffer) {
        const prompt = `You are an elite ATS (Applicant Tracking System) parser and resume evaluation expert.
Analyze this uploaded PDF resume document carefully and extract exact candidate profile details into structured JSON:

1. candidateName: Full candidate name as written on the resume.
2. email: Email address explicitly shown on the resume.
3. phone: Contact phone/mobile number explicitly shown on the resume.
4. educationSummary: Highest degree or educational qualification.
5. preferredRole: Target or current job title (e.g., Software Engineer, Data Scientist, Full Stack Developer).
6. location: Candidate city & country (e.g. Bengaluru, India).
7. state: State or province.
8. careerGoals: Objective or profile summary.
9. occupation: Student or Working Professional.
10. extractedSkills: Array of technical skills, frameworks, languages, tools, and soft skills.
11. interests: Professional interests or focus areas.
12. projects: Array of top 2-4 project titles/highlights.
13. experienceYears: Total estimated years of experience (number).
14. atsScore: Overall ATS compatibility score (0-100) based on action verbs, keyword density, section layout, and quantifiable metrics.
15. feedback: Array of 3-5 SPECIFIC, HIGHLY ACCURATE, ACTIONABLE recommendations to fix and improve this resume.
    CRITICAL RULE FOR feedback:
    - DO NOT suggest adding email or phone number if an email or phone number is already present on the resume!
    - Provide actionable fixes (e.g. "Add percentage metrics to experience bullets", "Categorize technical skills into Frontend/Backend/Databases", "Include live GitHub/deployment links for listed projects").
16. summary: 2-3 sentence executive summary of candidate profile.
17. extractedText: Clean plain-text transcription of the entire resume content.`;

        const contents = [
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: fileBuffer.toString('base64'),
            },
          },
          prompt,
        ];

        const response = await callGeminiWithRetry(() =>
          ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: contents,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  extractedText: { type: Type.STRING },
                  candidateName: { type: Type.STRING },
                  email: { type: Type.STRING },
                  phone: { type: Type.STRING },
                  educationSummary: { type: Type.STRING },
                  preferredRole: { type: Type.STRING },
                  location: { type: Type.STRING },
                  state: { type: Type.STRING },
                  careerGoals: { type: Type.STRING },
                  occupation: { type: Type.STRING },
                  extractedSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
                  interests: { type: Type.ARRAY, items: { type: Type.STRING } },
                  projects: { type: Type.ARRAY, items: { type: Type.STRING } },
                  experienceYears: { type: Type.NUMBER },
                  atsScore: { type: Type.INTEGER },
                  feedback: { type: Type.ARRAY, items: { type: Type.STRING } },
                  summary: { type: Type.STRING },
                },
                required: ['extractedSkills', 'experienceYears', 'educationSummary', 'projects', 'atsScore', 'feedback', 'summary'],
              },
            },
          })
        );

        let parsedJson: any = {};
        try {
          parsedJson = JSON.parse(response.text || '{}');
        } catch (e) {
          parsedJson = parseResumeHeuristically(resumeText, fileName);
        }

        const fallback = parseResumeHeuristically(parsedJson.extractedText || resumeText, fileName);
        const finalData = {
          ...fallback,
          ...parsedJson,
          candidateName: parsedJson.candidateName || fallback.candidateName,
          email: parsedJson.email || fallback.email,
          phone: parsedJson.phone || fallback.phone,
          preferredRole: parsedJson.preferredRole || fallback.preferredRole,
          educationSummary: parsedJson.educationSummary || fallback.educationSummary,
          location: parsedJson.location || fallback.location,
          state: parsedJson.state || fallback.state,
        };

        return res.json({
          success: true,
          resumeText: parsedJson.extractedText || resumeText || 'PDF Resume parsed successfully',
          parsedData: finalData,
        });
      }

      const prompt = `Analyze the following resume text and extract key candidate information into structured JSON:

Resume Text:
"""
${resumeText.slice(0, 10000)}
"""

Extract candidate profile details:
1. candidateName: Full candidate name if present
2. email: Candidate email
3. phone: Candidate contact number
4. educationSummary: Highest degree or education detail
5. preferredRole: Target or current job title (e.g., Software Engineer, Data Analyst)
6. location: City / Country
7. state: State or region
8. careerGoals: Concise summary of career objective
9. occupation: Student or Working Professional
10. extractedSkills: Array of technical & soft skills
11. interests: Array of professional interests
12. experienceYears: Total years of experience (number)
13. projects: Array of top project names
14. atsScore: Estimated ATS score (0-100)
15. feedback: Array of 3-5 SPECIFIC, HIGHLY ACCURATE, ACTIONABLE recommendations to fix and improve this resume.
    CRITICAL RULE FOR feedback:
    - DO NOT suggest adding email or phone number if an email or phone number is already present in the resume!
16. summary: 2-3 sentence overview of candidate profile`;

      const response = await callGeminiWithRetry(() =>
        ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                candidateName: { type: Type.STRING },
                email: { type: Type.STRING },
                phone: { type: Type.STRING },
                educationSummary: { type: Type.STRING },
                preferredRole: { type: Type.STRING },
                location: { type: Type.STRING },
                state: { type: Type.STRING },
                careerGoals: { type: Type.STRING },
                occupation: { type: Type.STRING },
                extractedSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
                interests: { type: Type.ARRAY, items: { type: Type.STRING } },
                projects: { type: Type.ARRAY, items: { type: Type.STRING } },
                experienceYears: { type: Type.NUMBER },
                atsScore: { type: Type.INTEGER },
                feedback: { type: Type.ARRAY, items: { type: Type.STRING } },
                summary: { type: Type.STRING },
              },
              required: ['extractedSkills', 'experienceYears', 'educationSummary', 'projects', 'atsScore', 'feedback', 'summary'],
            },
          },
        })
      );

      let parsedJson: any = {};
      try {
        parsedJson = JSON.parse(response.text || '{}');
      } catch (e) {
        parsedJson = parseResumeHeuristically(resumeText, fileName);
      }

      // Merge with heuristic parser if AI missed candidate profile fields
      const fallback = parseResumeHeuristically(resumeText, fileName);
      const finalData = {
        ...fallback,
        ...parsedJson,
        candidateName: parsedJson.candidateName || fallback.candidateName,
        preferredRole: parsedJson.preferredRole || fallback.preferredRole,
        educationSummary: parsedJson.educationSummary || fallback.educationSummary,
        location: parsedJson.location || fallback.location,
        state: parsedJson.state || fallback.state,
      };

      return res.json({
        success: true,
        resumeText,
        parsedData: finalData,
      });
    } catch (aiErr: any) {
      console.warn('Gemini AI parsing unavailable or rate-limited, engaging heuristic fallback parser:', aiErr?.message || String(aiErr));
      const fallbackParsed = parseResumeHeuristically(resumeText, fileName);
      return res.json({
        success: true,
        resumeText: fallbackParsed.extractedText || resumeText,
        parsedData: fallbackParsed,
        isFallback: true,
      });
    }
  } catch (err: any) {
    console.warn('Top-level resume parse fallback engaged:', err);
    const fallbackParsed = parseResumeHeuristically(resumeText || 'Candidate Resume', fileName);
    return res.json({
      success: true,
      resumeText: fallbackParsed.extractedText || 'Resume',
      parsedData: fallbackParsed,
      isFallback: true,
    });
  }
});

// Generic Gemini Generation Endpoint
app.post('/api/gemini/generate', async (req: Request, res: Response) => {
  try {
    const { prompt, systemInstruction, jsonOutput, responseSchema } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    const ai = getGeminiClient();
    const config: any = {};

    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }

    if (jsonOutput) {
      config.responseMimeType = 'application/json';
      if (responseSchema) {
        config.responseSchema = responseSchema;
      }
    }

    const response = await callGeminiWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config,
      })
    );

    return res.json({
      success: true,
      text: response.text,
    });
  } catch (err: any) {
    const isRateLimited = err?.status === 429 || err?.status === 'RESOURCE_EXHAUSTED' || String(err).includes('429') || String(err).includes('quota') || String(err).includes('RESOURCE_EXHAUSTED');

    if (isRateLimited) {
      console.warn('Gemini Rate Limit (429) in /api/gemini/generate');
      return res.json({
        success: false,
        isRateLimited: true,
        error: 'Gemini API quota limit reached. Please wait a moment and try again.',
        text: 'The AI assistant is temporarily rate limited due to high API demand (429 Resource Exhausted). Please wait a few seconds and try again.',
      });
    }

    console.error('Gemini Generate Error:', err);
    return res.status(500).json({
      error: 'Gemini generation failed',
      details: err?.message || String(err),
    });
  }
});

// Live Search & AI Discovery Endpoint
app.post('/api/gemini/search', async (req: Request, res: Response) => {
  try {
    const { query, searchType, userProfile } = req.body;

    const ai = getGeminiClient();

    let searchPrompt = '';
    if (searchType === 'opportunities') {
      const qLower = (query || '').toLowerCase();
      const isInternship = qLower.includes('intern') || userProfile?.requestedCategory === 'internships' || userProfile?.requestedCategory === 'research_internships' || userProfile?.requestedCategory === 'government_internships';

      searchPrompt = `You are a live web research assistant for AspireAI. Search live web sources using Google Search for active, verified ${isInternship ? 'INTERNSHIPS, student training positions, and trainee programs' : (query || 'jobs, internships, hackathons, scholarships, and fellowships')}.
User profile details: Role/Title: ${userProfile?.preferredRole || 'Software Engineer'}, Education: ${userProfile?.education || 'Graduate'}, Skills: ${(userProfile?.skills || []).join(', ')}, Location: ${userProfile?.location || 'India / Remote'}.

Find 5-7 distinct real, live, actionable opportunities with actual organization names, deadlines, required skills, and direct valid application/official website links starting with https://.

CRITICAL JSON FORMATTING RULES:
1. Return ONLY a valid JSON array of objects.
2. DO NOT output citation bracket numbers like [1], [2], or [1][2] inside titles, text, or URLs.
3. DO NOT include markdown formatting or introductory text outside the JSON array.

Return strict JSON array:
[{
  "id": "search-opp-1",
  "title": "exact title of opportunity or internship",
  "category": "${isInternship ? 'internships' : 'jobs'}",
  "organization": "Company or Institution name",
  "location": "City, Country or Remote",
  "deadline": "Month/Day, Year or Rolling Admissions",
  "eligibility": "Brief eligibility criteria",
  "requiredSkills": ["skill1", "skill2"],
  "description": "2 sentence summary of what this opportunity offers",
  "applyUrl": "Direct valid official website URL starting with https://"
}]`;
    } else if (searchType === 'schemes') {
      const userState = userProfile?.state || 'Pan India';
      const userIncome = userProfile?.incomeBracket || 'Below ₹5 Lakhs';
      const userAge = userProfile?.age || 22;
      const userOccupation = userProfile?.occupation || 'Student';

      const isSenior = userAge >= 60 || /60|senior|elder|pension|old age|vaya/i.test(query || '');

      searchPrompt = `You are an official Indian government welfare scheme research assistant.
Search live web sources and official government portals (myscheme.gov.in, india.gov.in, nsap.nic.in, socialjustice.gov.in, startupindia.gov.in, pmindia.gov.in, and state government portals) for active government schemes matching:
Search Topic / Keywords: "${query || (isSenior ? 'senior citizen schemes, pensions, healthcare for elders, IGNOAPS, SCSS, Ayushman Vaya Vandana' : 'welfare, education loan, scholarships, startup seed fund, MSME subsidy')}"
Target State: "${userState}"
Candidate Age: ${userAge} ${isSenior ? '(SENIOR CITIZEN AGED 60+)' : ''}
Family Income Bracket: "${userIncome}"
Occupation: "${userOccupation}"

Find 5-7 real, active central and state government schemes that match this candidate profile (including Central/Pan-India schemes and state schemes).

CRITICAL JSON FORMATTING RULES:
1. Return ONLY a valid JSON array of objects.
2. DO NOT output citation bracket numbers like [1] or [2] anywhere in text or URLs.

Return strict JSON array of objects:
[{
  "id": "search-sch-1",
  "name": "Full official name of government scheme",
  "category": "senior_citizens",
  "level": "Central",
  "state": "Pan India",
  "benefits": "Detailed financial assistance, loan amount, monthly pension, subsidy, or health insurance",
  "eligibilityCriteria": "Exact eligibility rules (age limit, income threshold, domicile)",
  "requiredDocuments": ["Aadhaar Card", "Income Certificate", "Bank Details"],
  "summary": "Clear, concise summary of scheme objectives and benefits",
  "officialUrl": "Official government website application URL starting with https://"
}]`;
    } else if (searchType === 'healthcare') {
      const isDoctorSearch = /doctor|physician|surgeon|specialist|clinic/i.test(query || '') || userProfile?.requestedType === 'doctor';
      
      searchPrompt = `You are a medical healthcare discovery assistant for India.
Search live web sources using Google Search for verified real doctors, medical specialists, clinics, and hospitals matching:
Query / Specialty / Name: "${query || 'General Physician & Specialist Care'}"
Location / City: "${userProfile?.location || userProfile?.state || 'Delhi, India'}"

Find 5-7 real, verified ${isDoctorSearch ? 'specialist DOCTORS with their hospital/clinic affiliations' : 'HOSPITALS and DOCTORS'} with real addresses, phone contacts, and direct official website links for booking appointments.

CRITICAL JSON FORMATTING RULES:
1. Return ONLY a valid JSON array of objects without footnote brackets like [1] or [2].

Return strict JSON array of objects:
[{
  "id": "search-hc-1",
  "name": "Full Hospital, Clinic or Doctor Practice Name",
  "type": "${isDoctorSearch ? 'Doctor' : 'Hospital'}",
  "doctorName": "Dr. Doctor Name",
  "qualification": "Medical degrees and certifications",
  "specialty": ["Specialty 1", "Specialty 2"],
  "rating": 4.8,
  "address": "Full street address",
  "city": "City name",
  "state": "State name",
  "contact": "+91 Phone or helpline number",
  "timings": "OPD and Appointment Consultation timings",
  "emergencyAvailable": true,
  "googleMapsUrl": "https://maps.google.com/?q=Doctor+or+Hospital+Name",
  "websiteUrl": "Direct official appointment booking or website URL starting with https://",
  "summary": "Clear 2-sentence summary of doctor expertise or hospital facilities"
}]`;
    } else {
      searchPrompt = `Search for top verified learning resources, courses, documentation, and repositories for: ${query || userProfile?.preferredRole || 'Full Stack Development'}.
Return strict JSON array without citation numbers [1] or [2]:
[{
  "id": "search-res-1",
  "title": "Resource title",
  "type": "Documentation",
  "provider": "Platform / Author",
  "topic": "Key subject",
  "isFree": true,
  "url": "https://officialurl.com",
  "description": "Short description",
  "matchScore": 90
}]`;
    }

    const response = await callGeminiWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: searchPrompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      })
    );

    const rawText = response.text || '';
    
    // Clean citation brackets like [1], [2], [12] and markdown code fences
    const sanitizedText = rawText
      .replace(/\[\d+\]/g, '')
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .replace(/,\s*([}\]])/g, '$1') // remove trailing commas
      .trim();

    let jsonResults: any[] = [];

    try {
      const parsed = JSON.parse(sanitizedText);
      if (Array.isArray(parsed)) {
        jsonResults = parsed;
      } else if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.results)) jsonResults = parsed.results;
        else if (Array.isArray(parsed.schemes)) jsonResults = parsed.schemes;
        else if (Array.isArray(parsed.opportunities)) jsonResults = parsed.opportunities;
        else if (Array.isArray(parsed.items)) jsonResults = parsed.items;
        else jsonResults = [parsed];
      }
    } catch {
      // Substring bracket extraction
      const firstBracket = sanitizedText.indexOf('[');
      const lastBracket = sanitizedText.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket > firstBracket) {
        const jsonSubstring = sanitizedText.substring(firstBracket, lastBracket + 1);
        try {
          jsonResults = JSON.parse(jsonSubstring);
        } catch (e) {
          console.error('Failed to parse json substring:', e);
        }
      }
    }

    // Fallback if live search returned empty or unparseable text
    if (!jsonResults || jsonResults.length === 0) {
      console.warn(`Live web search returned non-JSON text for type ${searchType}. Executing fallback structured generation...`);
      try {
        const fallbackPrompt = `Generate a JSON array of 5 verified active ${searchType} matching search query "${query || 'popular items'}". Provide valid official URLs starting with https://.`;
        
        const fallbackRes = await callGeminiWithRetry(() =>
          ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: fallbackPrompt,
            config: {
              responseMimeType: 'application/json',
            },
          })
        );

        const fallbackParsed = JSON.parse(fallbackRes.text || '[]');
        if (Array.isArray(fallbackParsed)) {
          jsonResults = fallbackParsed;
        } else if (fallbackParsed && typeof fallbackParsed === 'object') {
          jsonResults = fallbackParsed.results || fallbackParsed.items || [fallbackParsed];
        }
      } catch (fbErr) {
        console.error('Fallback generation failed:', fbErr);
      }
    }

    return res.json({
      success: true,
      results: jsonResults,
      groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [],
    });
  } catch (err: any) {
    const isRateLimited = err?.status === 429 || err?.status === 'RESOURCE_EXHAUSTED' || String(err).includes('429') || String(err).includes('quota') || String(err).includes('RESOURCE_EXHAUSTED');

    if (isRateLimited) {
      console.warn('Gemini Search Rate Limit Hit (429). Returning rate limit response gracefully.');
      return res.json({
        success: false,
        isRateLimited: true,
        error: 'Gemini API search rate limit reached (429 Resource Exhausted). Displaying curated offline directory.',
        results: [],
      });
    }

    console.error('Gemini Search Error:', err);
    return res.status(500).json({
      error: 'Live web search failed',
      details: err?.message || String(err),
    });
  }
});

// Vite middleware or Static files setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AspireAI Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
