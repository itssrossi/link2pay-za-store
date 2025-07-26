
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
import { Loader2, Building2, User, Mail, Lock, AlertTriangle } from 'lucide-react';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
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

  const addDebugInfo = (info: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => [...prev.slice(-4), `[${timestamp}] ${info}`]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setDebugInfo([]);

    try {
      addDebugInfo('Starting sign up process...');
      
      if (!formData.email || !formData.password || !formData.businessName || !formData.fullName) {
        toast.error('Please fill in all required fields.');
        return;
      }

      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters long.');
        return;
      }

      addDebugInfo('Calling signUp function...');
      
      const { error } = await signUp(formData.email, formData.password, {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          business_name: formData.businessName,
          full_name: formData.fullName
        }
      });

      if (error) {
        addDebugInfo(`Sign up error: ${error.message}`);
        
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
        addDebugInfo('Sign up successful');
        toast.success('Account created successfully! Please check your email for verification.');
        
        // Small delay to allow the auth state to update
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      }
    } catch (error: any) {
      addDebugInfo(`Unexpected error: ${error.message}`);
      console.error('Sign up error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setDebugInfo([]);

    try {
      addDebugInfo('Starting sign in process...');
      
      if (!formData.email || !formData.password) {
        toast.error('Please enter both email and password.');
        return;
      }

      addDebugInfo('Calling signIn function...');
      
      const { error } = await signIn(formData.email, formData.password);

      if (error) {
        addDebugInfo(`Sign in error: ${error.message}`);
        
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password. Please check your credentials and try again.');
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Please check your email and click the confirmation link before signing in.');
        } else if (error.message.includes('rate limit')) {
          toast.error('Too many sign-in attempts. Please wait a moment and try again.');
        } else {
          toast.error(error.message || 'An error occurred during sign in.');
        }
      } else {
        addDebugInfo('Sign in successful');
        toast.success('Welcome back!');
        
        // Small delay to allow the auth state to update
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      }
    } catch (error: any) {
      addDebugInfo(`Unexpected error: ${error.message}`);
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
              {isLogin ? 'Sign in to your account' : 'Start your business journey today'}
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
                      'Create Account'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Debug Information */}
        {debugInfo.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <AlertTriangle className="w-4 h-4" />
                Debug Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {debugInfo.map((info, index) => (
                  <p key={index} className="text-xs font-mono text-gray-600">
                    {info}
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
            If you're having trouble signing in or up, make sure the Supabase Site URL and Redirect URLs are configured properly in your Supabase dashboard under Authentication → URL Configuration.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default Auth;
