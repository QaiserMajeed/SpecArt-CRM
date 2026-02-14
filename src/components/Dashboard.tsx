import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  LogOut, 
  ArrowLeft, 
  Calendar,
  Plus,
  Search,
  Settings,
  UserCog,
  BarChart3,
  User,
  Target,
  Phone,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { LeadsClientsView } from '@/components/LeadsClientsView';
import { FollowUpsView } from '@/components/FollowUpsView';
import { DashboardStats } from '@/components/DashboardStats';
import { LeadClientModal } from '@/components/LeadClientModal';
import { ImportModal } from '@/components/ImportModal';
import { ManageTagsModal } from '@/components/ManageTagsModal';
import { ManageCustomFieldsModal } from '@/components/ManageCustomFieldsModal';
import { toast } from 'sonner';

interface DashboardProps {
  workspaceId: string;
  onBack: () => void;
  onGoToProfile: () => void;
}

const iconMap: Record<string, React.ElementType> = {
  Target,
  Phone,
  Users,
  BarChart3,
};

export function Dashboard({ workspaceId, onBack, onGoToProfile }: DashboardProps) {
  const { currentUser, logout, canManageUsers, canDeleteData } = useAuth();
  const { getWorkspaceById, getDashboardStats } = useData();
  const [activeTab, setActiveTab] = useState<'overview' | 'database' | 'followups'>('overview');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isTagsModalOpen, setIsTagsModalOpen] = useState(false);
  const [isCustomFieldsModalOpen, setIsCustomFieldsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const workspace = getWorkspaceById(workspaceId);
  const stats = getDashboardStats(workspaceId);
  const Icon = iconMap[workspace?.icon || 'Target'] || Target;

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
  };

  if (!workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-bold">Workspace not found</h2>
          <Button onClick={onBack} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left Section */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="text-gray-500 hover:text-[#7567F8] hover:bg-[#7567F8]/10"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${workspace.color} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-[#333333]">{workspace.name}</h1>
                  <p className="text-xs text-gray-500">{currentUser?.name} • {currentUser?.role}</p>
                </div>
              </div>
            </div>

            {/* Center Section - Quick Stats */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#7567F8]/10 rounded-lg">
                <Target className="w-4 h-4 text-[#7567F8]" />
                <span className="text-sm font-medium text-[#7567F8]">{stats.totalLeads} Leads</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#10B981]/10 rounded-lg">
                <Users className="w-4 h-4 text-[#10B981]" />
                <span className="text-sm font-medium text-[#10B981]">{stats.totalClients} Clients</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F59E0B]/10 rounded-lg">
                <Calendar className="w-4 h-4 text-[#F59E0B]" />
                <span className="text-sm font-medium text-[#F59E0B]">{stats.todayFollowUps} Today</span>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2">
              {canManageUsers() && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsImportModalOpen(true)}
                    className="border-gray-200 text-gray-600 hover:text-[#7567F8] hover:border-[#7567F8]/30"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Import
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsTagsModalOpen(true)}
                    className="border-gray-200 text-gray-600 hover:text-[#7567F8] hover:border-[#7567F8]/30"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Tags
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCustomFieldsModalOpen(true)}
                    className="border-gray-200 text-gray-600 hover:text-[#7567F8] hover:border-[#7567F8]/30"
                  >
                    <UserCog className="w-4 h-4 mr-2" />
                    Fields
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={onGoToProfile}
                className="border-gray-200"
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-gray-500 hover:text-red-500 hover:bg-red-50"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 py-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <TabsList className="bg-white/80 backdrop-blur-sm border border-gray-200 p-1">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7567F8] data-[state=active]:to-[#9B9BFF] data-[state=active]:text-white"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="database" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7567F8] data-[state=active]:to-[#9B9BFF] data-[state=active]:text-white"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Database
              </TabsTrigger>
              <TabsTrigger 
                value="followups"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7567F8] data-[state=active]:to-[#9B9BFF] data-[state=active]:text-white"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Follow-ups
                {stats.overdueFollowUps > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-red-100 text-red-600">
                    {stats.overdueFollowUps}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {activeTab === 'database' && (
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search leads or clients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7567F8]/20 focus:border-[#7567F8] w-full md:w-64"
                  />
                </div>
                <Button
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-gradient-to-r from-[#7567F8] to-[#9B9BFF] hover:from-[#6558E8] hover:to-[#8B8BEF] text-white shadow-lg shadow-[#7567F8]/30"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New
                </Button>
              </div>
            )}
          </div>

          <TabsContent value="overview" className="mt-0">
            <DashboardStats workspaceId={workspaceId} />
          </TabsContent>

          <TabsContent value="database" className="mt-0">
            <LeadsClientsView 
              workspaceId={workspaceId}
              searchQuery={searchQuery}
              canDelete={canDeleteData()}
            />
          </TabsContent>

          <TabsContent value="followups" className="mt-0">
            <FollowUpsView 
              workspaceId={workspaceId}
              canDelete={canDeleteData()}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Modals */}
      <LeadClientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        workspaceId={workspaceId}
      />
      
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        workspaceId={workspaceId}
      />

      <ManageTagsModal
        isOpen={isTagsModalOpen}
        onClose={() => setIsTagsModalOpen(false)}
        workspaceId={workspaceId}
      />

      <ManageCustomFieldsModal
        isOpen={isCustomFieldsModalOpen}
        onClose={() => setIsCustomFieldsModalOpen(false)}
        workspaceId={workspaceId}
      />
    </div>
  );
}
