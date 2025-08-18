import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';

const FAQSection = () => {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const faqs = [
    {
      question: "What is Link2Pay?",
      answer: "Link2Pay is a solution for small businesses that helps you set up an online store, send invoices, and receive bookings — all fully integrated with WhatsApp."
    },
    {
      question: "Do my customers need a special app to use Link2Pay?",
      answer: "No. Customers can view your store, book a service, or pay invoices directly through a simple link you send them on WhatsApp. No extra apps are needed."
    },
    {
      question: "How quickly do I receive payments?",
      answer: "This depends on the bank or payment processor you choose to connect with Link2Pay. Settlement times may vary."
    },
    {
      question: "Can I sell subscriptions or digital products through Link2Pay?",
      answer: "Not yet. Link2Pay currently supports physical products, services, and bookings. Support for subscription-based businesses and digital products is coming soon."
    },
    {
      question: "Is Link2Pay safe to use?",
      answer: "Yes. Link2Pay is safe, and your information will never be shared."
    }
  ];

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600">
            Get answers to common questions about Link2Pay
          </p>
        </div>
        
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <Card key={index} className="border-gray-200 hover:shadow-md transition-shadow duration-200">
              <CardHeader 
                className="cursor-pointer pb-4"
                onClick={() => toggleItem(index)}
              >
                <CardTitle className="flex items-center justify-between text-left">
                  <span className="text-lg font-semibold text-gray-900 pr-4">
                    {faq.question}
                  </span>
                  {openItems.has(index) ? (
                    <ChevronUp className="w-5 h-5 text-[#4C9F70] flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[#4C9F70] flex-shrink-0" />
                  )}
                </CardTitle>
              </CardHeader>
              {openItems.has(index) && (
                <CardContent className="pt-0">
                  <p className="text-gray-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;