import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// Badge component not used
import { 
  Users, 
  LogOut, 
  Settings, 
  Target, 
  Phone, 
  ArrowRight,
  Plus,
  User,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface WorkspaceSelectorProps {
  onSelectWorkspace: (workspaceId: string) => void;
  onGoToAdmin: () => void;
  onGoToProfile: () => void;
}

const iconMap: Record<string, React.ElementType> = {
  Target,
  Phone,
  Users,
  BarChart3,
};

export function WorkspaceSelector({ onSelectWorkspace, onGoToAdmin, onGoToProfile }: WorkspaceSelectorProps) {
  const { currentUser, logout, canManageWorkspaces, canAccessWorkspace } = useAuth();
  const { getActiveWorkspaces, addWorkspace, getDashboardStats } = useData();
  const [isAddWorkspaceOpen, setIsAddWorkspaceOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState('');

  const accessibleWorkspaces = getActiveWorkspaces().filter(ws => canAccessWorkspace(ws.id));

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
  };

  const handleAddWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      toast.error('Workspace name is required');
      return;
    }

    try {
      await addWorkspace({
        name: newWorkspaceName.trim(),
        description: newWorkspaceDescription.trim() || 'New workspace',
        icon: 'Users',
        color: 'from-[#7567F8] to-[#9B9BFF]',
        createdBy: currentUser?.id || '',
        isActive: true,
      });
      setNewWorkspaceName('');
      setNewWorkspaceDescription('');
      setIsAddWorkspaceOpen(false);
      toast.success('Workspace created successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create workspace');
    }
  };

  const getTotalStats = () => {
    let totalLeads = 0;
    let totalClients = 0;
    let totalFollowUps = 0;

    accessibleWorkspaces.forEach(ws => {
      const stats = getDashboardStats(ws.id);
      totalLeads += stats.totalLeads;
      totalClients += stats.totalClients;
      totalFollowUps += stats.overdueFollowUps + stats.todayFollowUps + stats.upcomingFollowUps;
    });

    return { totalLeads, totalClients, totalFollowUps };
  };

  const stats = getTotalStats();

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7567F8] to-[#9B9BFF] flex items-center justify-center shadow-lg shadow-[#7567F8]/30">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#333333]">SpecArt</h1>
              <p className="text-sm text-gray-500">Select your workspace</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {canManageWorkspaces() && (
              <Button
                variant="outline"
                onClick={onGoToAdmin}
                className="border-[#7567F8]/30 text-[#7567F8] hover:bg-[#7567F8]/10"
              >
                <Settings className="w-4 h-4 mr-2" />
                Admin Panel
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onGoToProfile}
              className="border-gray-200"
            >
              <User className="w-4 h-4 mr-2" />
              Profile
            </Button>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7567F8] to-[#9B9BFF] flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {currentUser?.name.charAt(0)}
                </span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-[#333333]">{currentUser?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{currentUser?.role}</p>
              </div>
            </div>
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
      </header>

      {/* Workspaces Grid */}
      <main className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-light text-[#333333] mb-2">
            Choose Your <span className="font-medium text-[#7567F8]">Workspace</span>
          </h2>
          <p className="text-gray-600">
            Select the workspace that matches your workflow
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accessibleWorkspaces.map((workspace) => {
            const Icon = iconMap[workspace.icon] || Target;
            const stats = getDashboardStats(workspace.id);

            return (
              <Card
                key={workspace.id}
                className="group relative overflow-hidden border-0 shadow-lg transition-all duration-500 hover:shadow-2xl hover:shadow-[#7567F8]/20 cursor-pointer bg-white/90 backdrop-blur-sm"
                onClick={() => onSelectWorkspace(workspace.id)}
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${workspace.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${workspace.color} flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-xl mt-4 text-[#333333] group-hover:text-[#7567F8] transition-colors">
                    {workspace.name}
                  </CardTitle>
                  <CardDescription className="text-gray-500">
                    {workspace.description}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <p className="text-lg font-bold text-[#7567F8]">{stats.totalLeads}</p>
                      <p className="text-xs text-gray-500">Leads</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <p className="text-lg font-bold text-[#10B981]">{stats.totalClients}</p>
                      <p className="text-xs text-gray-500">Clients</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <p className="text-lg font-bold text-[#F59E0B]">{stats.todayFollowUps}</p>
                      <p className="text-xs text-gray-500">Today</p>
                    </div>
                  </div>

                  <div className="flex items-center text-[#7567F8] font-medium text-sm group-hover:translate-x-2 transition-transform duration-300">
                    Enter Workspace
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Add Workspace Card (Admin only) */}
          {canManageWorkspaces() && (
            <Card
              className="group relative overflow-hidden border-2 border-dashed border-gray-200 transition-all duration-500 hover:border-[#7567F8]/50 hover:shadow-lg cursor-pointer bg-gray-50/50"
              onClick={() => setIsAddWorkspaceOpen(true)}
            >
              <CardContent className="flex flex-col items-center justify-center h-full min-h-[280px]">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4 group-hover:bg-[#7567F8]/10 transition-colors">
                  <Plus className="w-7 h-7 text-gray-400 group-hover:text-[#7567F8] transition-colors" />
                </div>
                <p className="font-medium text-gray-500 group-hover:text-[#7567F8] transition-colors">
                  Add New Workspace
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Stats */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Leads', value: stats.totalLeads.toString(), icon: Target, color: 'text-[#7567F8]' },
            { label: 'Active Clients', value: stats.totalClients.toString(), icon: Users, color: 'text-[#10B981]' },
            { label: 'Pending Follow-ups', value: stats.totalFollowUps.toString(), icon: Phone, color: 'text-[#F59E0B]' },
            { label: 'Workspaces', value: accessibleWorkspaces.length.toString(), icon: BarChart3, color: 'text-[#8B5CF6]' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center ${stat.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-[#333333]">{stat.value}</p>
                      <p className="text-xs text-gray-500">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>

      {/* Add Workspace Dialog */}
      <Dialog open={isAddWorkspaceOpen} onOpenChange={setIsAddWorkspaceOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Workspace</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Workspace Name</Label>
              <Input
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                placeholder="e.g., Marketing Leads"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newWorkspaceDescription}
                onChange={(e) => setNewWorkspaceDescription(e.target.value)}
                placeholder="Describe the purpose of this workspace..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddWorkspaceOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddWorkspace}
              className="bg-gradient-to-r from-[#7567F8] to-[#9B9BFF]"
            >
              Create Workspace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}