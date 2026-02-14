import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { User } from '@/types';
import { supabase } from '@/lib/supabase';
import { deserializeProfile, serializeProfileUpdate } from '@/lib/serialization';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  addUser: (userData: Omit<User, 'id' | 'createdAt'>, password: string) => Promise<User>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  changePassword: (userId: string, currentPassword: string, newPassword: string) => Promise<boolean>;
  resetPassword: (userId: string, newPassword: string) => Promise<void>;
  canAccessWorkspace: (workspaceId: string) => boolean;
  canManageUsers: () => boolean;
  canDeleteData: () => boolean;
  canManageWorkspaces: () => boolean;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchUserProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, user_workspaces(workspace_id)')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return deserializeProfile(data);
}

async function fetchAllUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, user_workspaces(workspace_id)')
    .order('created_at', { ascending: true });

  if (error || !data) return [];
  return data.map(deserializeProfile);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Initialize auth state from Supabase session
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && mounted) {
        const profile = await fetchUserProfile(session.user.id);
        if (profile && mounted) {
          setCurrentUser(profile);
          setIsAuthenticated(true);
          const allUsers = await fetchAllUsers();
          if (mounted) setUsers(allUsers);
        }
      }
      if (mounted) setIsAuthLoading(false);
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        if (mounted) {
          setCurrentUser(null);
          setIsAuthenticated(false);
          setUsers([]);
        }
      } else if (event === 'SIGNED_IN' && session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        if (profile && mounted) {
          setCurrentUser(profile);
          setIsAuthenticated(true);
          const allUsers = await fetchAllUsers();
          if (mounted) setUsers(allUsers);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return false;
    // Auth state change listener handles setting currentUser
    return true;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const addUser = useCallback(async (userData: Omit<User, 'id' | 'createdAt'>, password: string): Promise<User> => {
    // Sign up new user via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password,
      options: {
        data: {
          name: userData.name,
          role: userData.role,
        },
      },
    });

    if (authError || !authData.user) {
      throw new Error(authError?.message || 'Failed to create user');
    }

    const userId = authData.user.id;

    // Update profile with additional fields
    await supabase
      .from('profiles')
      .update({
        phone: userData.phone || null,
        is_active: userData.isActive,
        role: userData.role,
      })
      .eq('id', userId);

    // Assign workspaces
    if (userData.assignedWorkspaces.length > 0) {
      await supabase
        .from('user_workspaces')
        .insert(userData.assignedWorkspaces.map(wsId => ({
          user_id: userId,
          workspace_id: wsId,
        })));
    }

    // Fetch the complete profile
    const profile = await fetchUserProfile(userId);
    if (!profile) throw new Error('Failed to fetch created user profile');

    // Refresh users list
    const allUsers = await fetchAllUsers();
    setUsers(allUsers);

    return profile;
  }, []);

  const updateUser = useCallback(async (id: string, updates: Partial<User>) => {
    const serialized = serializeProfileUpdate(updates);
    if (Object.keys(serialized).length > 0) {
      await supabase.from('profiles').update(serialized).eq('id', id);
    }

    // Handle workspace assignments if changed
    if (updates.assignedWorkspaces) {
      // Remove all existing assignments
      await supabase.from('user_workspaces').delete().eq('user_id', id);
      // Insert new assignments
      if (updates.assignedWorkspaces.length > 0) {
        await supabase.from('user_workspaces').insert(
          updates.assignedWorkspaces.map(wsId => ({
            user_id: id,
            workspace_id: wsId,
          }))
        );
      }
    }

    // Refresh users list and current user
    const allUsers = await fetchAllUsers();
    setUsers(allUsers);

    if (currentUser?.id === id) {
      const updated = await fetchUserProfile(id);
      if (updated) setCurrentUser(updated);
    }
  }, [currentUser]);

  const deleteUser = useCallback(async (id: string) => {
    // Delete profile (cascade will handle user_workspaces)
    await supabase.from('profiles').delete().eq('id', id);
    const allUsers = await fetchAllUsers();
    setUsers(allUsers);
  }, []);

  const changePassword = useCallback(async (_userId: string, currentPassword: string, newPassword: string): Promise<boolean> => {
    // Verify current password by attempting sign-in with current user's email
    if (!currentUser) return false;

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: currentUser.email,
      password: currentPassword,
    });
    if (verifyError) return false;

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return !error;
  }, [currentUser]);

  const resetPassword = useCallback(async (_userId: string, _newPassword: string) => {
    // Note: Resetting another user's password requires admin/service_role access.
    // For now, this is a no-op from the client. Admin should use Supabase dashboard.
    console.warn('Password reset for other users requires Supabase dashboard or Edge Function');
  }, []);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    if (!currentUser) return;
    await updateUser(currentUser.id, updates);
  }, [currentUser, updateUser]);

  const canAccessWorkspace = useCallback((workspaceId: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    return currentUser.assignedWorkspaces.includes(workspaceId);
  }, [currentUser]);

  const canManageUsers = useCallback((): boolean => {
    if (!currentUser) return false;
    return currentUser.role === 'admin';
  }, [currentUser]);

  const canDeleteData = useCallback((): boolean => {
    if (!currentUser) return false;
    return currentUser.role === 'admin' || currentUser.role === 'manager';
  }, [currentUser]);

  const canManageWorkspaces = useCallback((): boolean => {
    if (!currentUser) return false;
    return currentUser.role === 'admin';
  }, [currentUser]);

  return (
    <AuthContext.Provider value={{
      currentUser,
      users,
      login,
      logout,
      addUser,
      updateUser,
      deleteUser,
      changePassword,
      resetPassword,
      canAccessWorkspace,
      canManageUsers,
      canDeleteData,
      canManageWorkspaces,
      updateProfile,
      isAuthenticated,
      isAuthLoading,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
