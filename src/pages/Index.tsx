
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Check, MessageCircle, Smartphone, Zap, Shield } from 'lucide-react';

const Index = () => {
  const features = [
    {
      icon: Smartphone,
      title: 'WhatsApp Integration',
      description: 'Seamlessly connect with your customers via WhatsApp for orders and support'
    },
    {
      icon: Zap,
      title: 'Quick Invoice Generation',
      description: 'Create professional invoices in seconds with our l2p:Client:Amount command'
    },
    {
      icon: Shield,
      title: 'Secure Payments',
      description: 'Accept payments via SnapScan, PayFast, and EFT with enterprise-grade security'
    }
  ];

  const benefits = [
    'Set up your storefront in minutes',
    'Generate professional invoices instantly',
    'Accept multiple payment methods',
    'Track sales and analytics',
    'Mobile-first responsive design',
    'WhatsApp business integration'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-green-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img 
                src="/lovable-uploads/e6db2000-16be-4362-bb02-9bb7800e39bd.png" 
                alt="Link2Pay" 
                className="h-10 w-auto"
              />
              <Badge variant="secondary" className="ml-2">SA</Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link to="/auth">
                <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth">
                <Button className="bg-[#4C9F70] hover:bg-[#3d8159] text-white">
                  Get Started
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Your WhatsApp Business
            <span className="text-[#4C9F70] block">Made Simple</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            The all-in-one storefront and invoice generator designed for South African entrepreneurs. 
            Create your online store, generate professional invoices, and get paid faster.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link to="/auth">
              <Button size="lg" className="bg-[#4C9F70] hover:bg-[#3d8159] text-white px-8 py-4 text-lg rounded-xl">
                Start Your Free Store
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="px-8 py-4 text-lg rounded-xl border-[#4C9F70] text-[#4C9F70] hover:bg-[#4C9F70] hover:text-white">
              View Demo Store
            </Button>
          </div>

          {/* Quick Demo */}
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md mx-auto border border-green-100">
            <h3 className="font-semibold text-gray-900 mb-4">Try the Quick Invoice Tool:</h3>
            <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
              <span className="text-gray-500">Type:</span> l2p:John:R750
            </div>
            <div className="mt-3 text-sm text-gray-600">
              ↓ Instantly generates WhatsApp message link
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to sell online
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built specifically for South African entrepreneurs who want to grow their WhatsApp business
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="border-green-100 hover:shadow-lg transition-shadow duration-200">
                  <CardHeader>
                    <div className="w-12 h-12 bg-[#4C9F70] rounded-xl flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl text-gray-900">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-600 text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Benefits List */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Why choose Link2Pay?
              </h3>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-[#4C9F70] rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-[#4C9F70] to-[#3d8159] rounded-2xl p-8 text-white">
              <h4 className="text-xl font-bold mb-4">Ready to get started?</h4>
              <p className="mb-6 opacity-90">
                Join thousands of South African entrepreneurs already using Link2Pay to grow their business.
              </p>
              <Link to="/auth">
                <Button className="bg-white text-[#4C9F70] hover:bg-gray-100 w-full">
                  Create Your Store Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <img 
                src="/lovable-uploads/e6db2000-16be-4362-bb02-9bb7800e39bd.png" 
                alt="Link2Pay" 
                className="h-8 w-auto brightness-0 invert"
              />
            </div>
            <div className="text-center md:text-right">
              <p className="text-gray-400">© 2024 Link2Pay. Made for South African entrepreneurs.</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Support Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button 
          size="lg" 
          className="rounded-full w-14 h-14 bg-[#4C9F70] hover:bg-[#3d8159] shadow-xl"
          onClick={() => alert('Chat support coming soon!')}
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
};

export default Index;
