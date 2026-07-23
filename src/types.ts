export interface UserProfile {
  name: string;
  education: string;
  skills: string[];
  interests: string[];
  preferredRole: string;
  location: string;
  careerGoals: string;
  age?: number;
  gender?: string;
  incomeBracket?: string;
  occupation?: string;
  state?: string;
  resumeText?: string;
  resumeFileName?: string;
  resumeParsedData?: {
    extractedSkills: string[];
    experienceYears: number;
    educationSummary: string;
    projects: string[];
    atsScore: number;
    feedback: string[];
  };
}

export type OpportunityCategory =
  | 'internships'
  | 'jobs'
  | 'remote_jobs'
  | 'hackathons'
  | 'scholarships'
  | 'fellowships'
  | 'certifications'
  | 'competitions'
  | 'workshops'
  | 'webinars'
  | 'bootcamps'
  | 'startup_programs'
  | 'research_internships'
  | 'government_internships'
  | 'open_source'
  | 'exchange_programs'
  | 'international';

export interface OpportunityItem {
  id: string;
  title: string;
  category: OpportunityCategory;
  organization: string;
  location: string;
  deadline: string;
  eligibility: string;
  requiredSkills: string[];
  description: string;
  applyUrl: string;
  matchScore?: number;
  missingSkills?: string[];
  improvementSuggestions?: string[];
}

export type SchemeCategory =
  | 'education'
  | 'employment'
  | 'startups'
  | 'msmes'
  | 'women'
  | 'farmers'
  | 'healthcare'
  | 'skill_development'
  | 'scholarships'
  | 'financial_assistance'
  | 'senior_citizens'
  | 'pensions';

export interface GovernmentSchemeItem {
  id: string;
  name: string;
  category: SchemeCategory;
  level: 'Central' | 'State';
  state?: string;
  benefits: string;
  eligibilityCriteria: string;
  requiredDocuments: string[];
  summary: string;
  officialUrl: string;
  matchScore?: number;
}

export type ResourceType =
  | 'Documentation'
  | 'YouTube'
  | 'GitHub'
  | 'Book'
  | 'Research Paper'
  | 'Coding Platform'
  | 'Course';

export interface LearningResourceItem {
  id: string;
  title: string;
  type: ResourceType;
  provider: string;
  topic: string;
  isFree: boolean;
  url: string;
  description: string;
  matchScore?: number;
}

export type TrackerStatus =
  | 'Interested'
  | 'Applied'
  | 'Interview Scheduled'
  | 'Selected'
  | 'Rejected'
  | 'Completed';

export interface TrackerItem {
  id: string;
  opportunityId: string;
  title: string;
  organization: string;
  category: string;
  status: TrackerStatus;
  addedDate: string;
  notes: string;
  deadline?: string;
  applyUrl: string;
}

export interface HealthcareItem {
  id: string;
  name: string;
  type: 'Hospital' | 'Doctor';
  specialty: string[];
  rating: number;
  address: string;
  city: string;
  state: string;
  contact: string;
  timings: string;
  emergencyAvailable?: boolean;
  googleMapsUrl: string;
  websiteUrl: string;
  summary: string;
  doctorName?: string;
  qualification?: string;
}

export interface SmartRecommendationResponse {
  careerOpportunities: OpportunityItem[];
  governmentSchemes: GovernmentSchemeItem[];
  learningResources: LearningResourceItem[];
  healthcare: HealthcareItem[];
  overallMatchSummary: string;
}
