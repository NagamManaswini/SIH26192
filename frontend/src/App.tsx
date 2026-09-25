import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { PwaProvider } from './context/PwaContext';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { StatusBanner } from './components/StatusBanner';
import { DemoControlModal } from './components/DemoControlModal';
import { ReportGenerationModal } from './components/ReportGenerationModal';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { RbacMatrixPage } from './pages/RbacMatrixPage';
import { LiveMapPage } from './pages/LiveMapPage';
import { SensorsPage } from './pages/SensorsPage';
import { PredictionsPage } from './pages/PredictionsPage';
import { AlertsPage } from './pages/AlertsPage';
import { CitizenReportsPage } from './pages/CitizenReportsPage';
import { EvacuationPage } from './pages/EvacuationPage';
import { CommandCenterPage } from './pages/CommandCenterPage';
import { EdgeNetworkPage } from './pages/EdgeNetworkPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { PwaStatusPage } from './pages/PwaStatusPage';
import { ModulePlaceholderPage } from './pages/ModulePlaceholderPage';
import { NavigationTab } from './types';
import { Settings as SettingsIcon } from 'lucide-react';

import { useAuth } from './context/AuthContext';

const MainContent: React.FC = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavigationTab>('command-center');
  const [demoModalOpen, setDemoModalOpen] = useState<boolean>(false);
  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);

  const handleAuthSuccess = () => {
    setCurrentTab('command-center');
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'login':
        return (
          <LoginPage
            onNavigateRegister={() => setCurrentTab('register')}
            onLoginSuccess={handleAuthSuccess}
          />
        );

      case 'register':
        return (
          <RegisterPage
            onNavigateLogin={() => setCurrentTab('login')}
            onRegisterSuccess={handleAuthSuccess}
          />
        );

      case 'rbac-matrix':
        return (
          <ProtectedRoute 
            allowedRoles={['CITIZEN', 'ADMIN', 'RESPONSE_TEAM', 'GOVERNMENT_OFFICIAL', 'RESEARCHER']}
            requiredPermission="all_features"
            onNavigateLogin={() => setCurrentTab('login')}
            onNavigateRegister={() => setCurrentTab('register')}
          >
            <RbacMatrixPage />
          </ProtectedRoute>
        );

      case 'command-center':
        return <CommandCenterPage />;

      case 'live-map':
        return <LiveMapPage />;

      case 'sensors':
        return (
          <ProtectedRoute 
            allowedRoles={['CITIZEN', 'RESEARCHER', 'RESPONSE_TEAM', 'GOVERNMENT_OFFICIAL', 'ADMIN']}
            requiredPermission="view_sensors"
            onNavigateLogin={() => setCurrentTab('login')}
            onNavigateRegister={() => setCurrentTab('register')}
          >
            <SensorsPage />
          </ProtectedRoute>
        );

      case 'predictions':
        return (
          <ProtectedRoute 
            allowedRoles={['CITIZEN', 'RESEARCHER', 'RESPONSE_TEAM', 'GOVERNMENT_OFFICIAL', 'ADMIN']}
            requiredPermission="view_predictions"
            onNavigateLogin={() => setCurrentTab('login')}
            onNavigateRegister={() => setCurrentTab('register')}
          >
            <PredictionsPage />
          </ProtectedRoute>
        );

      case 'alerts':
        return <AlertsPage />;

      case 'citizen-reports':
        return <CitizenReportsPage />;

      case 'evacuation':
        return (
          <ProtectedRoute 
            allowedRoles={['CITIZEN', 'RESPONSE_TEAM', 'GOVERNMENT_OFFICIAL', 'ADMIN', 'RESEARCHER']}
            requiredPermission="view_evacuation_centers"
            onNavigateLogin={() => setCurrentTab('login')}
            onNavigateRegister={() => setCurrentTab('register')}
          >
            <EvacuationPage />
          </ProtectedRoute>
        );

      case 'edge-network':
        return <EdgeNetworkPage />;

      case 'analytics':
        return <AnalyticsPage />;

      case 'pwa-status':
        return (
          <ProtectedRoute 
            allowedRoles={['CITIZEN', 'ADMIN', 'RESPONSE_TEAM', 'GOVERNMENT_OFFICIAL', 'RESEARCHER']}
            requiredPermission="all_features"
            onNavigateLogin={() => setCurrentTab('login')}
            onNavigateRegister={() => setCurrentTab('register')}
          >
            <PwaStatusPage />
          </ProtectedRoute>
        );

      case 'settings':
        return (
          <ProtectedRoute 
            allowedRoles={['CITIZEN', 'ADMIN', 'RESPONSE_TEAM', 'GOVERNMENT_OFFICIAL', 'RESEARCHER']}
            requiredPermission="all_features"
            onNavigateLogin={() => setCurrentTab('login')}
            onNavigateRegister={() => setCurrentTab('register')}
          >
            <ModulePlaceholderPage
              tabId="settings"
              title="Platform Configuration & System Settings"
              subtitle="API endpoints, notification channels, threshold calibrations, and user access."
              description="Manage system integrations, PostgreSQL/PostGIS connection settings, MQTT broker topics, and ML model hyper-parameters."
              icon={SettingsIcon}
              targetMilestone="System Administration"
              upcomingFeatures={[
                'Sensor threshold and cloudburst trigger calibration',
                'PostgreSQL / PostGIS & Redis connection health',
                'SMS/Voice provider API keys and Push notification config',
                'Role-based access control (Admin, Operator, Citizen)'
              ]}
            />
          </ProtectedRoute>
        );

      default:
        return <CommandCenterPage />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-900 selection:bg-indigo-500 selection:text-white flex flex-col lg:flex-row">
      {/* 1. Left Vertical Side Navigation matching Screenshot 2 */}
      <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* 2. Main Application Workspace */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 transition-all duration-300">
        {/* Top Navigation & Status Bar matching Screenshot 2 */}
        <TopBar 
          currentTab={currentTab} 
          onOpenDemo={() => setDemoModalOpen(true)}
          onOpenReport={() => setReportModalOpen(true)}
          onNavigateTab={setCurrentTab}
        />
        <StatusBanner onNavigatePwa={user?.role === 'ADMIN' ? () => setCurrentTab('pwa-status') : undefined} />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-3 md:p-6 overflow-x-hidden">
          {renderContent()}
        </main>

        {/* Global Demo Control Modal */}
        <DemoControlModal
          isOpen={demoModalOpen}
          onClose={() => setDemoModalOpen(false)}
        />

        {/* Global Operational Disaster Report & PDF Generator Modal */}
        <ReportGenerationModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
        />

        {/* Clean Light Footer */}
        <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="font-medium">© 2026 National Flash Flood Early Warning & Disaster Response Platform.</p>
            <div className="flex items-center space-x-3 text-[11px]">
              <span className="text-indigo-600 font-bold">Live Operations Active</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <PwaProvider>
      <AuthProvider>
        <MainContent />
      </AuthProvider>
    </PwaProvider>
  );
};

export default App;

