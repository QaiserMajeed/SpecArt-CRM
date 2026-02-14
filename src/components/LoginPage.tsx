import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// Tabs component not used in simplified login
import { Users, Mail, Lock, ArrowRight, Building2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const success = await login(email, password);
    if (success) {
      toast.success('Welcome to SpecArt Follow Up System!');
    } else {
      toast.error('Invalid credentials. Please try again.');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <div className="space-y-6 text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start gap-3">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#7567F8] to-[#9B9BFF] flex items-center justify-center shadow-lg shadow-[#7567F8]/30">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#333333]">SpecArt</h1>
              <p className="text-sm text-gray-500">Follow Up System</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-4xl lg:text-5xl font-light text-[#333333] leading-tight">
              Manage Your <span className="text-[#7567F8] font-medium">Leads</span> & <span className="text-[#7567F8] font-medium">Clients</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-md mx-auto lg:mx-0">
              A powerful follow-up system designed for your business development and sales workflow. 
              Organize, track, and convert leads efficiently.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
            <div className="px-4 py-2 bg-white/80 backdrop-blur-sm rounded-lg border border-[#7567F8]/20 text-sm text-[#7567F8]">
              <Building2 className="w-4 h-4 inline mr-2" />
              BD Lead Management
            </div>
            <div className="px-4 py-2 bg-white/80 backdrop-blur-sm rounded-lg border border-[#7567F8]/20 text-sm text-[#7567F8]">
              <Users className="w-4 h-4 inline mr-2" />
              Sales Leads Management
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="space-y-6">
          <Card className="border-0 shadow-2xl shadow-[#7567F8]/10 bg-white/90 backdrop-blur-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
              <CardDescription className="text-center">
                Sign in to access your workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 border-gray-200 focus:border-[#7567F8] focus:ring-[#7567F8]/20"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 border-gray-200 focus:border-[#7567F8] focus:ring-[#7567F8]/20"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#7567F8] to-[#9B9BFF] hover:from-[#6558E8] hover:to-[#8B8BEF] text-white shadow-lg shadow-[#7567F8]/30 transition-all duration-300 hover:shadow-xl hover:shadow-[#7567F8]/40"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    'Signing in...'
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
