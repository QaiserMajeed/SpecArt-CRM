import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ArrowLeft, 
  Users, 
  Shield, 
  UserCog, 
  User,
  Plus,
  Edit2,
  Trash2,
  Building2,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import type { UserRole } from '@/types';
import { toast } from 'sonner';

interface AdminPanelProps {
  onBack: () => void;
  onGoToProfile: () => void;
}

export function AdminPanel({ onBack, onGoToProfile }: AdminPanelProps) {
  const { currentUser, users, addUser, updateUser, deleteUser, canManageUsers, resetPassword } = useAuth();
  const { workspaces, getActiveWorkspaces } = useData();
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<typeof users[0] | null>(null);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<typeof users[0] | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [selectedWorkspaces, setSelectedWorkspaces] = useState<string[]>([]);
  const [password, setPassword] = useState('');

  const activeWorkspaces = getActiveWorkspaces();

  if (!canManageUsers()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-gray-500 mb-4">
              You don't have permission to access the admin panel.
            </p>
            <Button onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const resetForm = () => {
    setName('');
    setEmail('');
    setRole('user');
    setSelectedWorkspaces([]);
    setPassword('');
    setEditingUser(null);
  };

  const handleAddUser = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error('Name, email, and password are required');
      return;
    }

    if (users.some(u => u.email.toLowerCase() === email.trim().toLowerCase())) {
      toast.error('User with this email already exists');
      return;
    }

    try {
      await addUser({
        name: name.trim(),
        email: email.trim(),
        role,
        assignedWorkspaces: selectedWorkspaces,
        isActive: true,
      }, password.trim());
      resetForm();
      setIsAddUserOpen(false);
      toast.success('User created successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create user');
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    if (!name.trim() || !email.trim()) {
      toast.error('Name and email are required');
      return;
    }

    try {
      await updateUser(editingUser.id, {
        name: name.trim(),
        email: email.trim(),
        role,
        assignedWorkspaces: selectedWorkspaces,
      });
      resetForm();
      setIsAddUserOpen(false);
      toast.success('User updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (id === currentUser?.id) {
      toast.error('You cannot delete your own account');
      return;
    }

    if (confirm('Are you sure you want to delete this user?')) {
      await deleteUser(id);
      toast.success('User deleted');
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordUser || !newPassword.trim()) {
      toast.error('Password is required');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    await resetPassword(resetPasswordUser.id, newPassword.trim());
    setNewPassword('');
    setResetPasswordUser(null);
    setIsResetPasswordOpen(false);
    toast.success('Password reset successfully');
  };

  const startEditing = (user: typeof users[0]) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setSelectedWorkspaces(user.assignedWorkspaces);
    setIsAddUserOpen(true);
  };

  const startResetPassword = (user: typeof users[0]) => {
    setResetPasswordUser(user);
    setNewPassword('');
    setIsResetPasswordOpen(true);
  };

  const toggleWorkspace = (workspaceId: string) => {
    setSelectedWorkspaces(prev => 
      prev.includes(workspaceId)
        ? prev.filter(w => w !== workspaceId)
        : [...prev, workspaceId]
    );
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return (
          <Badge className="bg-purple-100 text-purple-700">
            <Shield className="w-3 h-3 mr-1" />
            Admin
          </Badge>
        );
      case 'manager':
        return (
          <Badge className="bg-blue-100 text-blue-700">
            <UserCog className="w-3 h-3 mr-1" />
            Manager
          </Badge>
        );
      case 'user':
        return (
          <Badge className="bg-gray-100 text-gray-700">
            <User className="w-3 h-3 mr-1" />
            User
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="text-gray-500 hover:text-[#7567F8] hover:bg-[#7567F8]/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-[#333333]">Admin Panel</h1>
              <p className="text-sm text-gray-500">Manage users and system settings</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onGoToProfile}
              className="border-gray-200"
            >
              <User className="w-4 h-4 mr-2" />
              Profile
            </Button>
            <Button
              onClick={() => {
                resetForm();
                setIsAddUserOpen(true);
              }}
              className="bg-gradient-to-r from-[#7567F8] to-[#9B9BFF]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto">
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-white/80 backdrop-blur-sm border border-gray-200">
            <TabsTrigger 
              value="users"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7567F8] data-[state=active]:to-[#9B9BFF] data-[state=active]:text-white"
            >
              <Users className="w-4 h-4 mr-2" />
              Users ({users.length})
            </TabsTrigger>
            <TabsTrigger 
              value="workspaces"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7567F8] data-[state=active]:to-[#9B9BFF] data-[state=active]:text-white"
            >
              <Building2 className="w-4 h-4 mr-2" />
              Workspaces ({workspaces.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>All Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">User</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Role</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Workspaces</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7567F8] to-[#9B9BFF] flex items-center justify-center">
                                <span className="text-white text-sm font-medium">
                                  {user.name.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-[#333333]">{user.name}</p>
                                <p className="text-sm text-gray-500">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {getRoleBadge(user.role)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {user.assignedWorkspaces.map((wsId) => {
                                const ws = workspaces.find(w => w.id === wsId);
                                return ws ? (
                                  <Badge key={wsId} variant="outline" className="text-xs">
                                    {ws.name}
                                  </Badge>
                                ) : null;
                              })}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {user.isActive ? (
                              <Badge className="bg-green-100 text-green-700">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Active
                              </Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-700">
                                <XCircle className="w-3 h-3 mr-1" />
                                Inactive
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startResetPassword(user)}
                              >
                                Reset PW
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEditing(user)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                disabled={user.id === currentUser?.id}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workspaces" className="space-y-4">
            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>All Workspaces</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {workspaces.map((workspace) => (
                    <Card key={workspace.id} className="border border-gray-100">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${workspace.color} flex items-center justify-center`}>
                            <Building2 className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-[#333333]">{workspace.name}</h4>
                            <p className="text-sm text-gray-500">{workspace.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant={workspace.isActive ? 'default' : 'secondary'}>
                                {workspace.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Add/Edit User Dialog */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Edit User' : 'Add New User'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@company.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-purple-600" />
                      Admin
                    </div>
                  </SelectItem>
                  <SelectItem value="manager">
                    <div className="flex items-center gap-2">
                      <UserCog className="w-4 h-4 text-blue-600" />
                      Manager
                    </div>
                  </SelectItem>
                  <SelectItem value="user">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-600" />
                      User
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Workspace Access</Label>
              <div className="space-y-2 border rounded-lg p-3">
                {activeWorkspaces.map((workspace) => (
                  <div key={workspace.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={workspace.id}
                      checked={selectedWorkspaces.includes(workspace.id)}
                      onCheckedChange={() => toggleWorkspace(workspace.id)}
                    />
                    <label htmlFor={workspace.id} className="text-sm flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#7567F8]" />
                      {workspace.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {!editingUser && (
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Set temporary password"
                />
                <p className="text-xs text-gray-500">
                  User can change password after first login
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={editingUser ? handleUpdateUser : handleAddUser}
              className="bg-gradient-to-r from-[#7567F8] to-[#9B9BFF]"
            >
              {editingUser ? 'Save Changes' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Reset password for <strong>{resetPasswordUser?.name}</strong>
            </p>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 chars)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetPasswordOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleResetPassword}
              className="bg-gradient-to-r from-[#7567F8] to-[#9B9BFF]"
            >
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
