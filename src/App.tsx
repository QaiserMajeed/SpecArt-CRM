import { useState } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { DataProvider } from '@/contexts/DataContext';
import { LoginPage } from '@/components/LoginPage';
import { WorkspaceSelector } from '@/components/WorkspaceSelector';
import { Dashboard } from '@/components/Dashboard';
import { AdminPanel } from '@/components/AdminPanel';
import { ProfilePage } from '@/components/ProfilePage';
import { Toaster } from '@/components/ui/sonner';

type View = 'workspaces' | 'dashboard' | 'admin' | 'profile';

function AppContent() {
  const { currentUser, isAuthenticated, isAuthLoading } = useAuth();
  const [currentView, setCurrentView] = useState<View>('workspaces');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7567F8] to-[#9B9BFF] flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white text-xl font-bold">S</span>
          </div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !currentUser) {
    return <LoginPage />;
  }

  const handleWorkspaceSelect = (workspaceId: string) => {
    setSelectedWorkspaceId(workspaceId);
    setCurrentView('dashboard');
  };

  const handleBackToWorkspaces = () => {
    setCurrentView('workspaces');
    setSelectedWorkspaceId(null);
  };

  const handleGoToAdmin = () => {
    setCurrentView('admin');
  };

  const handleGoToProfile = () => {
    setCurrentView('profile');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F5FF] via-[#F0F0FF] to-[#E8E8FF]">
      {currentView === 'workspaces' && (
        <WorkspaceSelector 
          onSelectWorkspace={handleWorkspaceSelect}
          onGoToAdmin={handleGoToAdmin}
          onGoToProfile={handleGoToProfile}
        />
      )}
      {currentView === 'dashboard' && selectedWorkspaceId && (
        <Dashboard 
          workspaceId={selectedWorkspaceId}
          onBack={handleBackToWorkspaces}
          onGoToProfile={handleGoToProfile}
        />
      )}
      {currentView === 'admin' && (
        <AdminPanel 
          onBack={handleBackToWorkspaces} 
          onGoToProfile={handleGoToProfile}
        />
      )}
      {currentView === 'profile' && (
        <ProfilePage 
          onBack={currentView === 'profile' ? () => setCurrentView('workspaces') : handleBackToWorkspaces}
        />
      )}
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
