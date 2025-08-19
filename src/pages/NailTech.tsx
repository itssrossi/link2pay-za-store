import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Check, MessageCircle, Smartphone, Zap, Shield, CreditCard, Flag, Heart, Star, Clock } from 'lucide-react';

const NailTech = () => {
  const features = [
    {
      icon: Zap,
      title: '💸 Instant Invoices',
      description: 'Get deposits upfront and avoid last-minute cancellations'
    },
    {
      icon: Smartphone,
      title: '🛍 Mini Storefront',
      description: 'Showcase your services and prices professionally'
    },
    {
      icon: MessageCircle,
      title: '📱 WhatsApp Integration',
      description: 'Clients book and pay without leaving WhatsApp'
    },
    {
      icon: Shield,
      title: '🔒 Safe & Secure',
      description: 'Payments powered by PayFast, trusted across South Africa'
    }
  ];

  const painPoints = [
    'Take deposits upfront',
    'Look legit with professional invoices',
    'Have a simple storefront where clients book and pay instantly'
  ];

  const promises = [
    'Every client books and pays their deposit straight from WhatsApp',
    'Your invoices look professional — like a real business',
    'You\'re no longer chasing people… they respect your time',
    'You focus on your art, not admin'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-pink-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img 
                src="/lovable-uploads/e6db2000-16be-4362-bb02-9bb7800e39bd.png" 
                alt="Link2Pay" 
                className="h-20 w-auto"
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
            💅 Nail Techs: Stop Chasing Payments.
            <span className="text-[#4C9F70] block">Start Growing Your Business.</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Link2Pay turns your WhatsApp into a storefront and invoice tool — so you look professional, secure deposits upfront, and never stress about late payments again.
          </p>
          
          <div className="flex justify-center mb-12">
            <Link to="/auth">
              <Button size="lg" className="bg-[#4C9F70] hover:bg-[#3d8159] text-white px-8 py-4 text-lg rounded-xl">
                👉 Build Your Free Store Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>

          {/* Trust Icons */}
          <div className="mb-8">
            <div className="flex justify-center items-center space-x-12 max-w-2xl mx-auto">
              <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-gray-600" />
                </div>
                <p className="text-xs text-gray-500 text-center max-w-24">Secure Payments Powered by PayFast</p>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-gray-600" />
                </div>
                <p className="text-xs text-gray-500 text-center max-w-24">Seamless WhatsApp Integration</p>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Flag className="w-6 h-6 text-gray-600" />
                </div>
                <p className="text-xs text-gray-500 text-center max-w-24">Built for SA Entrepreneurs</p>
              </div>
            </div>
          </div>

          {/* Quick Demo */}
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md mx-auto border border-pink-100">
            <h3 className="font-semibold text-gray-900 mb-4">Try the Quick Invoice Tool:</h3>
            <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
              <span className="text-gray-500">Type:</span> l2p:Sarah:R300
            </div>
            <div className="mt-3 text-sm text-gray-600">
              ↓ Instantly generates Gel Overlay invoice
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              💔 Tired of No-Shows, Late Payments, and Unprofessional WhatsApp Bookings?
            </h2>
            <div className="max-w-3xl mx-auto text-xl text-gray-600 mb-8">
              <p className="mb-6">
                As a nail tech, your time is money. But clients cancel last minute, forget to pay, or make you chase them endlessly.
              </p>
              <p className="mb-6">
                It's stressful. It feels unprofessional. And it stops you from growing.
              </p>
              <p className="font-semibold text-gray-900 mb-6">
                With Link2Pay, you can:
              </p>
            </div>
            
            <div className="space-y-4 max-w-2xl mx-auto">
              {painPoints.map((point, index) => (
                <div key={index} className="flex items-center space-x-3 justify-center">
                  <div className="w-6 h-6 bg-[#4C9F70] rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-700 text-lg">{point}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Transformation Promise Section */}
      <section className="py-16 bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              ✨ Imagine This:
            </h2>
            
            <div className="space-y-6 max-w-3xl mx-auto">
              {promises.map((promise, index) => (
                <div key={index} className="flex items-start space-x-4 text-left">
                  <div className="w-2 h-2 bg-[#4C9F70] rounded-full mt-3 flex-shrink-0"></div>
                  <span className="text-xl text-gray-700">{promise}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            🙌 Trusted by Nail Techs & Entrepreneurs Across South Africa
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Whether you're a home-based nail artist or running a full salon, Link2Pay helps you run your business like a pro.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              📲 Everything You Need in One App
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="border-pink-100 hover:shadow-lg transition-shadow duration-200">
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
        </div>
      </section>

      {/* Urgency Section */}
      <section className="py-16 bg-gradient-to-br from-[#4C9F70] to-[#3d8159] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            🚀 Start Free Today. Get Paid Faster by Your Next Appointment.
          </h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto opacity-90">
            Don't let another client cancel without paying. With Link2Pay, you can set up your store and send your first professional invoice in less than 10 minutes — all free.
          </p>
          
          <Link to="/auth">
            <Button size="lg" className="bg-white text-[#4C9F70] hover:bg-gray-100 px-8 py-4 text-lg rounded-xl">
              👉 Build Your Free Store Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
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
                className="h-20 w-auto brightness-0 invert"
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

export default NailTech;