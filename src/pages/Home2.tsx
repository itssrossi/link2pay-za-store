import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Check, ChevronDown, Globe } from 'lucide-react';
import MetaTags from '@/components/MetaTags';

const Home2 = () => {
  const [businessType, setBusinessType] = useState('');

  const companyLogos = [
    'AWS', 'Walmart', 'HBO', 'Vanguard', 'Vimeo', 'Levi\'s', 'NBA', 'Microsoft'
  ];

  const features = [
    {
      title: 'Secure Payments Powered by PayFast',
      description: 'Accept payments securely with South Africa\'s leading payment gateway'
    },
    {
      title: 'Seamless WhatsApp Integration',
      description: 'Connect with customers directly through WhatsApp for instant communication'
    },
    {
      title: 'Built for SA Entrepreneurs',
      description: 'Designed specifically for South African businesses and market needs'
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

  const faqs = [
    {
      question: 'What is Link2Pay?',
      answer: 'Link2Pay is a comprehensive platform that helps South African entrepreneurs create professional storefronts, generate invoices, and accept payments seamlessly through WhatsApp integration.'
    },
    {
      question: 'Do my customers need a special app to use Link2Pay?',
      answer: 'No, your customers don\'t need any special app. They can browse your store, make purchases, and complete payments directly through their web browser or WhatsApp.'
    },
    {
      question: 'How quickly do I receive payments?',
      answer: 'Payments are processed securely through PayFast, and funds are typically available in your account within 1-3 business days, depending on your bank.'
    },
    {
      question: 'Can I sell subscriptions or digital products through Link2Pay?',
      answer: 'Yes, Link2Pay supports various product types including physical products, digital downloads, services, and subscription-based offerings.'
    },
    {
      question: 'Is Link2Pay safe to use?',
      answer: 'Absolutely. Link2Pay uses industry-standard security measures and is powered by PayFast, a PCI DSS compliant payment processor trusted by thousands of South African businesses.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <MetaTags 
        title="Link2Pay - Professional Storefronts for South African Entrepreneurs"
        description="Create professional storefronts, generate invoices, and get paid faster with Link2Pay. Built for South African entrepreneurs with WhatsApp integration."
        image="/assets/home2/Frame_12.png"
      />

      {/* Header */}
      <header className="relative z-50 bg-white border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className="text-2xl font-bold text-primary">Link2Pay</div>
            </div>
            
            <div className="hidden md:flex items-center space-x-6">
              <Select defaultValue="sa">
                <SelectTrigger className="w-20 border-0 shadow-none">
                  <div className="flex items-center space-x-1">
                    <Globe className="w-4 h-4" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sa">SA</SelectItem>
                  <SelectItem value="en">EN</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                Sign In
              </Button>
              
              <Button className="bg-primary hover:bg-primary/90">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/assets/home2/hero-bg.jpg)' }}
        />
        <div className="absolute inset-0 bg-black/60" />
        
        <div className="relative z-10 container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Look Professional.
                <br />
                Get Paid faster.
              </h1>
              <h2 className="text-3xl lg:text-4xl font-bold text-green-400 mb-6">
                Grow with Confidence.
              </h2>
              <p className="text-xl text-gray-200 mb-8 leading-relaxed">
                Link2Pay helps you create a professional storefront and generate invoices 
                that get you paid faster. Built for South African entrepreneurs.
              </p>
            </div>
            
            <div className="flex justify-center lg:justify-end">
              <Card className="w-full max-w-md bg-white shadow-2xl">
                <CardContent className="p-8">
                  <div className="text-center mb-6">
                    <Badge variant="secondary" className="bg-green-100 text-green-800 mb-4">
                      New Suggestion
                    </Badge>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Create a store for a:
                    </h3>
                  </div>
                  
                  <div className="space-y-4">
                    <Select value={businessType} onValueChange={setBusinessType}>
                      <SelectTrigger className="w-full h-12 text-left">
                        <SelectValue placeholder="Select your business type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="retail">Retail Store</SelectItem>
                        <SelectItem value="restaurant">Restaurant</SelectItem>
                        <SelectItem value="beauty">Beauty Salon</SelectItem>
                        <SelectItem value="fitness">Fitness Studio</SelectItem>
                        <SelectItem value="tech">Tech Services</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white">
                      Build It Now
                    </Button>
                    
                    <div className="text-center">
                      <Button variant="link" className="text-primary hover:text-primary/80">
                        Build Free Store
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600 mb-8 text-lg">Trusted by 500,000 leading teams</p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-8 items-center">
            {companyLogos.map((logo, index) => (
              <div key={index} className="text-gray-400 font-semibold text-lg">
                {logo}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-green-50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Everything You Need To Sell Online
              </h2>
              <p className="text-xl text-gray-600 mb-12 leading-relaxed">
                Link2Pay provides all the tools you need to create a professional online presence, 
                manage your sales, and grow your business in South Africa.
              </p>
              
              <div className="space-y-6">
                {features.map((feature, index) => (
                  <Card key={index} className="bg-green-100 border-green-200">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-gray-700">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            
            <div className="flex justify-center">
              <img 
                src="/assets/home2/Hand_and_iPhone_16_Pro.png" 
                alt="Link2Pay mobile dashboard"
                className="max-w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-8">
                Why choose Link2Pay?
              </h2>
              
              <div className="space-y-6">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-1">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-lg text-gray-700">
                      {benefit}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-center">
              <Card className="bg-green-500 text-white p-8 max-w-md">
                <CardContent className="text-center">
                  <h3 className="text-2xl font-bold mb-4">
                    Ready to get started?
                  </h3>
                  <p className="text-green-100 mb-6">
                    Join thousands of South African entrepreneurs already using Link2Pay.
                  </p>
                  <Button className="w-full bg-white text-green-500 hover:bg-gray-100">
                    Create Your Store Now
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="bg-white rounded-lg border">
                <AccordionTrigger className="px-6 py-4 text-left text-lg font-semibold hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 text-gray-600 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="text-2xl font-bold text-primary mb-4">Link2Pay</div>
          <p className="text-gray-400">
            © 2024 Link2Pay. Made for South African entrepreneurs.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home2;