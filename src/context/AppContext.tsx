import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserProfile,
  OpportunityItem,
  GovernmentSchemeItem,
  LearningResourceItem,
  HealthcareItem,
  TrackerItem,
  TrackerStatus,
} from '../types';
import {
  INITIAL_OPPORTUNITIES,
  INITIAL_SCHEMES,
  INITIAL_RESOURCES,
  INITIAL_HEALTHCARE,
} from '../data/initialData';

export type ActiveTab =
  | 'dashboard'
  | 'opportunities'
  | 'schemes'
  | 'assistant'
  | 'resume'
  | 'learning'
  | 'tracker'
  | 'healthcare'
  | 'about';

interface AppContextType {
  userProfile: UserProfile;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  opportunities: OpportunityItem[];
  setOpportunities: React.Dispatch<React.SetStateAction<OpportunityItem[]>>;
  schemes: GovernmentSchemeItem[];
  setSchemes: React.Dispatch<React.SetStateAction<GovernmentSchemeItem[]>>;
  resources: LearningResourceItem[];
  setResources: React.Dispatch<React.SetStateAction<LearningResourceItem[]>>;
  healthcareList: HealthcareItem[];
  setHealthcareList: React.Dispatch<React.SetStateAction<HealthcareItem[]>>;
  trackerItems: TrackerItem[];
  addOpportunityToTracker: (opp: OpportunityItem, initialStatus?: TrackerStatus) => void;
  updateTrackerItemStatus: (id: string, status: TrackerStatus) => void;
  updateTrackerItemNotes: (id: string, notes: string) => void;
  removeTrackerItem: (id: string) => void;
  calculateMatchScore: (itemSkills: string[], itemTitle?: string, itemDesc?: string) => {
    matchScore: number;
    missingSkills: string[];
    suggestions: string[];
  };
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
  selectedHealthcareTab: 'hospital' | 'doctor';
  setSelectedHealthcareTab: (tab: 'hospital' | 'doctor') => void;
}

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  education: '',
  skills: [],
  interests: [],
  preferredRole: '',
  location: '',
  careerGoals: '',
  age: undefined,
  gender: '',
  incomeBracket: '',
  occupation: '',
  state: '',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(true);
  const [selectedHealthcareTab, setSelectedHealthcareTab] = useState<'hospital' | 'doctor'>('hospital');

  // Load Dark Mode
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('aspire_dark_mode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('aspire_dark_mode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  // Fresh In-Memory User Profile for strictly private, isolated user sessions
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);

  const updateUserProfile = (newFields: Partial<UserProfile>) => {
    setUserProfile((prev) => ({ ...prev, ...newFields }));
  };

  // State Data
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>(INITIAL_OPPORTUNITIES);
  const [schemes, setSchemes] = useState<GovernmentSchemeItem[]>(INITIAL_SCHEMES);
  const [resources, setResources] = useState<LearningResourceItem[]>(INITIAL_RESOURCES);
  const [healthcareList, setHealthcareList] = useState<HealthcareItem[]>(INITIAL_HEALTHCARE);

  // In-Memory Tracker State
  const [trackerItems, setTrackerItems] = useState<TrackerItem[]>([]);

  const addOpportunityToTracker = (opp: OpportunityItem, initialStatus: TrackerStatus = 'Interested') => {
    setTrackerItems((prev) => {
      if (prev.some((item) => item.opportunityId === opp.id)) {
        return prev; // already tracked
      }
      const newItem: TrackerItem = {
        id: `track-${Date.now()}`,
        opportunityId: opp.id,
        title: opp.title,
        organization: opp.organization,
        category: opp.category,
        status: initialStatus,
        addedDate: new Date().toLocaleDateString(),
        notes: `Added from ${opp.category.replace('_', ' ')}. Deadline: ${opp.deadline}`,
        deadline: opp.deadline,
        applyUrl: opp.applyUrl,
      };
      return [newItem, ...prev];
    });
  };

  const updateTrackerItemStatus = (id: string, status: TrackerStatus) => {
    setTrackerItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
  };

  const updateTrackerItemNotes = (id: string, notes: string) => {
    setTrackerItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, notes } : item))
    );
  };

  const removeTrackerItem = (id: string) => {
    setTrackerItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Match Engine Helper
  const calculateMatchScore = (
    itemSkills: string[],
    itemTitle: string = '',
    itemDesc: string = ''
  ) => {
    const userSkillSet = new Set<string>((userProfile.skills || []).map((s) => s.toLowerCase().trim()));
    if (userProfile.resumeParsedData?.extractedSkills) {
      userProfile.resumeParsedData.extractedSkills.forEach((s) => userSkillSet.add(s.toLowerCase().trim()));
    }

    if (!itemSkills || itemSkills.length === 0) {
      return { matchScore: 82, missingSkills: [], suggestions: ['Review guidelines and prepare application early.'] };
    }

    const lowerReqs = itemSkills.map((s) => s.toLowerCase().trim());
    let matchedCount = 0;
    const missing: string[] = [];

    lowerReqs.forEach((req, idx) => {
      let isMatch = false;
      userSkillSet.forEach((uSkill: string) => {
        if (uSkill.includes(req) || req.includes(uSkill)) {
          isMatch = true;
        }
      });
      if (isMatch) {
        matchedCount++;
      } else {
        missing.push(itemSkills[idx]);
      }
    });

    const ratio = matchedCount / itemSkills.length;
    let baseScore = Math.round(55 + ratio * 40);

    // Boost score if title or desc matches preferred role
    if (userProfile.preferredRole && (itemTitle.toLowerCase().includes(userProfile.preferredRole.toLowerCase()) || itemDesc.toLowerCase().includes(userProfile.preferredRole.toLowerCase()))) {
      baseScore = Math.min(98, baseScore + 10);
    }

    const suggestions: string[] = [];
    if (missing.length > 0) {
      suggestions.push(`Focus on building projects using ${missing.slice(0, 2).join(' and ')}.`);
    } else {
      suggestions.push('Strong skill overlap! Highlight your relevant projects in your application.');
    }

    return {
      matchScore: Math.min(99, Math.max(50, baseScore)),
      missingSkills: missing,
      suggestions,
    };
  };

  return (
    <AppContext.Provider
      value={{
        userProfile,
        updateUserProfile,
        activeTab,
        setActiveTab,
        isDarkMode,
        toggleDarkMode,
        opportunities,
        setOpportunities,
        schemes,
        setSchemes,
        resources,
        setResources,
        healthcareList,
        setHealthcareList,
        trackerItems,
        addOpportunityToTracker,
        updateTrackerItemStatus,
        updateTrackerItemNotes,
        removeTrackerItem,
        calculateMatchScore,
        isProfileModalOpen,
        setIsProfileModalOpen,
        selectedHealthcareTab,
        setSelectedHealthcareTab,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
