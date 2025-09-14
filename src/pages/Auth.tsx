
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, Building2, User, Mail, Lock, CheckCircle, AlertTriangle, MessageCircle } from 'lucide-react';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [authStatus, setAuthStatus] = useState<string[]>([]);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState('');
  const navigate = useNavigate();
  const { signIn, signUp, user, session, resendConfirmation } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    businessName: '',
    fullName: '',
    whatsappNumber: '',
    acceptTerms: false,
    keepSignedIn: true
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

    if (isSignUp && (!formData.businessName || !formData.fullName || !formData.whatsappNumber)) {
      toast.error('Business name, full name, and WhatsApp number are required for sign up');
      return false;
    }

    if (isSignUp && !formData.acceptTerms) {
      toast.error('You must accept the Terms & Conditions to create an account');
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
          full_name: formData.fullName,
          whatsapp_number: formData.whatsappNumber
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
        
        // Set email confirmation state
        setNeedsEmailConfirmation(true);
        setConfirmationEmail(formData.email);
        
        // Switch to sign in tab
        setTimeout(() => {
          setIsLogin(true);
          setFormData(prev => ({ ...prev, businessName: '', fullName: '', whatsappNumber: '', acceptTerms: false }));
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
      
      const { error } = await signIn(formData.email, formData.password, formData.keepSignedIn);

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

  const handleResendConfirmation = async () => {
    if (!confirmationEmail) return;

    setLoading(true);
    try {
      addAuthStatus('Resending confirmation email...');
      
      const { error } = await resendConfirmation(confirmationEmail);

      if (error) {
        addAuthStatus(`Resend failed: ${error.message}`, 'error');
        toast.error(error.message || 'Failed to resend confirmation email.');
      } else {
        addAuthStatus('Confirmation email resent successfully!', 'success');
        toast.success('Confirmation email sent! Please check your inbox.');
      }
    } catch (error: any) {
      addAuthStatus(`Unexpected error: ${error.message}`, 'error');
      console.error('Resend confirmation error:', error);
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

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="keepSignedIn"
                      checked={formData.keepSignedIn}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, keepSignedIn: !!checked }))
                      }
                      disabled={loading}
                    />
                    <Label htmlFor="keepSignedIn" className="text-sm cursor-pointer">
                      Keep me signed in
                    </Label>
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
                    <Label htmlFor="whatsappNumber" className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp Number *
                    </Label>
                    <Input
                      id="whatsappNumber"
                      name="whatsappNumber"
                      type="tel"
                      value={formData.whatsappNumber}
                      onChange={handleInputChange}
                      placeholder="e.g. +27812345678"
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
                  
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="acceptTerms"
                        checked={formData.acceptTerms}
                        onCheckedChange={(checked) => 
                          setFormData(prev => ({ ...prev, acceptTerms: !!checked }))
                        }
                        disabled={loading}
                        className="mt-1"
                      />
                      <div className="text-sm text-gray-600 leading-relaxed">
                        <Label htmlFor="acceptTerms" className="cursor-pointer">
                          I agree to the{" "}
                          <button
                            type="button"
                            className="text-[#4C9F70] hover:underline font-medium"
                            onClick={() => {
                              const modal = document.createElement('div');
                              modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
                              modal.innerHTML = `
                                <div class="bg-white rounded-lg max-w-2xl max-h-96 overflow-y-auto p-6">
                                  <h2 class="text-xl font-bold mb-4">Terms & Conditions</h2>
                                  <div class="text-sm space-y-4">
                                    <h3 class="font-semibold">1. Service Description</h3>
                                    <p>Link2Pay provides small businesses with tools to set up an online store, send invoices, and receive bookings, all integrated with WhatsApp. We act as a facilitator between you (the merchant) and your customers.</p>
                                    
                                    <h3 class="font-semibold">2. Account Responsibility</h3>
                                    <p>You are responsible for maintaining the accuracy of your business and payment information. You agree to use Link2Pay only for lawful purposes and in compliance with all applicable laws. You are solely responsible for all activity under your account.</p>
                                    
                                    <h3 class="font-semibold">3. Payments & Processing</h3>
                                    <p>Link2Pay does not process payments directly. We integrate with third-party payment providers and banks of your choice. Settlement times for payments depend on your chosen payment processor or bank. Link2Pay is not responsible for delays, chargebacks, or disputes arising from your customers.</p>
                                    
                                    <h3 class="font-semibold">4. Refund Policy</h3>
                                    <p>All payments made through Link2Pay are final and non-refundable. It is the merchant's responsibility to communicate their own refund or exchange policies directly with customers. Link2Pay will not issue refunds on behalf of merchants or customers under any circumstances.</p>
                                    
                                    <h3 class="font-semibold">5. Limitations of Use</h3>
                                    <p>Link2Pay does not currently support subscription-based businesses or the sale of digital products. Attempting to use the platform for unsupported products or services may result in suspension or termination of your account.</p>
                                    
                                    <h3 class="font-semibold">6. Data & Privacy</h3>
                                    <p>Link2Pay will not share or sell your business or personal information. We take reasonable steps to ensure your information is protected, but you acknowledge that no platform is 100% secure.</p>
                                    
                                    <h3 class="font-semibold">7. Limitation of Liability</h3>
                                    <p>Link2Pay is provided "as is" without warranties of any kind. We are not liable for any direct, indirect, or consequential damages resulting from the use of our platform, including but not limited to payment disputes, service downtime, or data loss.</p>
                                    
                                    <h3 class="font-semibold">8. Changes to Terms</h3>
                                    <p>We may update these Terms & Conditions from time to time. Continued use of Link2Pay after changes are made constitutes your acceptance of the revised terms.</p>
                                    
                                    <h3 class="font-semibold">9. Contact</h3>
                                    <p>For any questions regarding these Terms & Conditions, please contact us at: 📧 support@link2pay.co.za</p>
                                  </div>
                                  <button class="mt-4 bg-[#4C9F70] text-white px-4 py-2 rounded hover:bg-[#3d7a59]" onclick="this.closest('.fixed').remove()">Close</button>
                                </div>
                              `;
                              document.body.appendChild(modal);
                            }}
                          >
                            Terms & Conditions
                          </button>
                        </Label>
                      </div>
                    </div>
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

        {/* Email Confirmation Resend */}
        {needsEmailConfirmation && confirmationEmail && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm text-blue-800">
                <Mail className="w-4 h-4" />
                Email Confirmation Required
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-blue-700">
                A confirmation email was sent to <strong>{confirmationEmail}</strong>
              </p>
              <p className="text-xs text-blue-600">
                Didn't receive the email? Check your spam folder or click below to resend.
              </p>
              <Button 
                onClick={handleResendConfirmation}
                variant="outline"
                size="sm"
                disabled={loading}
                className="w-full border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Resending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-3 w-3" />
                    Resend Confirmation Email
                  </>
                )}
              </Button>
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
