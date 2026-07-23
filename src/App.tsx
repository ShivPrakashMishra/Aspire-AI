import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ProfileModal } from './components/ProfileModal';

import { DashboardView } from './components/views/DashboardView';
import { OpportunitiesView } from './components/views/OpportunitiesView';
import { SchemesView } from './components/views/SchemesView';
import { AssistantView } from './components/views/AssistantView';
import { ResumeAnalyzerView } from './components/views/ResumeAnalyzerView';
import { LearningView } from './components/views/LearningView';
import { HealthcareView } from './components/views/HealthcareView';
import { AboutView } from './components/views/AboutView';

const MainLayout: React.FC = () => {
  const { activeTab } = useApp();

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'opportunities':
        return <OpportunitiesView />;
      case 'schemes':
        return <SchemesView />;
      case 'assistant':
        return <AssistantView />;
      case 'resume':
        return <ResumeAnalyzerView />;
      case 'learning':
        return <LearningView />;
      case 'healthcare':
        return <HealthcareView />;
      case 'about':
        return <AboutView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors selection:bg-indigo-500 selection:text-white">
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderActiveView()}
        </main>
      </div>

      {/* Slide-over Profile Edit Modal */}
      <ProfileModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
