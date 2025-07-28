
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Loader2, Building2, User, Mail, Lock, CheckCircle, AlertTriangle } from 'lucide-react';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [authStatus, setAuthStatus] = useState<string[]>([]);
  const navigate = useNavigate();
  const { signIn, signUp, user, session } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    businessName: '',
    fullName: ''
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (user && session) {
      console.log('User already authenticated, redirecting to dashboard');
      navigate('/dashboard');
    }
  }, [user, session, navigate]);

  const addAuthStatus = (status: string, type: 'info' | 'success' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const statusWithIcon = type === 'success' ? `✅ ${status}` : type === 'error' ? `❌ ${status}` : `ℹ️ ${status}`;
    setAuthStatus(prev => [...prev.slice(-4), `[${timestamp}] ${statusWithIcon}`]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = (isSignUp = false) => {
    if (!formData.email || !formData.password) {
      toast.error('Email and password are required');
      return false;
    }

    if (!formData.email.includes('@')) {
      toast.error('Please enter a valid email address');
      return false;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return false;
    }

    if (isSignUp && (!formData.businessName || !formData.fullName)) {
      toast.error('Business name and full name are required for sign up');
      return false;
    }

    return true;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(true)) return;

    setLoading(true);
    setAuthStatus([]);

    try {
      addAuthStatus('Starting sign up process...');
      
      const { error } = await signUp(formData.email, formData.password, {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          business_name: formData.businessName,
          full_name: formData.fullName
        }
      });

      if (error) {
        addAuthStatus(`Sign up failed: ${error.message}`, 'error');
        
        if (error.message.includes('User already registered')) {
          toast.error('An account with this email already exists. Please sign in instead.');
          setIsLogin(true);
        } else if (error.message.includes('Password')) {
          toast.error('Password must be at least 6 characters long.');
        } else if (error.message.includes('Email')) {
          toast.error('Please enter a valid email address.');
        } else if (error.message.includes('rate limit')) {
          toast.error('Too many requests. Please wait a moment and try again.');
        } else {
          toast.error(error.message || 'An error occurred during sign up.');
        }
      } else {
        addAuthStatus('Account created successfully!', 'success');
        addAuthStatus('📧 Check your email for verification link', 'info');
        toast.success('Account created! Please check your email and click the verification link before signing in.');
        
        // Switch to sign in tab
        setTimeout(() => {
          setIsLogin(true);
          setFormData(prev => ({ ...prev, businessName: '', fullName: '' }));
        }, 3000);
      }
    } catch (error: any) {
      addAuthStatus(`Unexpected error: ${error.message}`, 'error');
      console.error('Sign up error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(false)) return;

    setLoading(true);
    setAuthStatus([]);

    try {
      addAuthStatus('Starting sign in process...');
      
      const { error } = await signIn(formData.email, formData.password);

      if (error) {
        addAuthStatus(`Sign in failed: ${error.message}`, 'error');
        
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password. Please check your credentials.');
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Please check your email and click the confirmation link before signing in.');
        } else if (error.message.includes('rate limit')) {
          toast.error('Too many sign-in attempts. Please wait and try again.');
        } else {
          toast.error(error.message || 'An error occurred during sign in.');
        }
      } else {
        addAuthStatus('Sign in successful!', 'success');
        toast.success('Welcome back!');
        
        // Navigation will happen automatically via the useEffect
      }
    } catch (error: any) {
      addAuthStatus(`Unexpected error: ${error.message}`, 'error');
      console.error('Sign in error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img 
                src="/lovable-uploads/e6db2000-16be-4362-bb02-9bb7800e39bd.png" 
                alt="Link2Pay" 
                className="h-12 w-auto"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {isLogin ? 'Sign in to your account' : 'Start your 7-day free trial'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={isLogin ? 'login' : 'signup'} onValueChange={(value) => setIsLogin(value === 'login')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                      required
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Password
                    </Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter your password"
                      required
                      disabled={loading}
                      minLength={6}
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-[#4C9F70] hover:bg-[#3d7a59]"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName" className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Business Name *
                    </Label>
                    <Input
                      id="businessName"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleInputChange}
                      placeholder="Enter your business name"
                      required
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Full Name *
                    </Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      required
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signupEmail" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email *
                    </Label>
                    <Input
                      id="signupEmail"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                      required
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signupPassword" className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Password *
                    </Label>
                    <Input
                      id="signupPassword"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Choose a password (min 6 characters)"
                      required
                      minLength={6}
                      disabled={loading}
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-[#4C9F70] hover:bg-[#3d7a59]"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      'Start Free Trial'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Authentication Status */}
        {authStatus.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4" />
                Authentication Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {authStatus.map((status, index) => (
                  <p key={index} className="text-xs font-mono text-gray-600">
                    {status}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Configuration Help */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            If authentication isn't working, make sure your Supabase Site URL and Redirect URLs are configured properly in your Supabase dashboard under Authentication → URL Configuration.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default Auth;
