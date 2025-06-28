
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, ShoppingCart } from 'lucide-react';

interface StorefrontPreviewProps {
  profile: any;
  sections: any[];
  mode: 'desktop' | 'mobile';
}

const StorefrontPreview = ({ profile, sections, mode }: StorefrontPreviewProps) => {
  const getFontClass = (font: string) => {
    switch (font) {
      case 'poppins': return 'font-["Poppins"]';
      case 'roboto': return 'font-["Roboto"]';
      case 'playfair': return 'font-["Playfair_Display"]';
      case 'montserrat': return 'font-["Montserrat"]';
      default: return 'font-["Inter"]';
    }
  };

  const mockProducts = [
    { id: 1, title: 'Sample Product 1', price: 99.99, image: '/placeholder.svg' },
    { id: 2, title: 'Sample Product 2', price: 149.99, image: '/placeholder.svg' },
    { id: 3, title: 'Sample Product 3', price: 79.99, image: '/placeholder.svg' }
  ];

  const enabledSections = sections.filter(section => section.is_enabled);

  return (
    <div 
      className={`${mode === 'mobile' ? 'max-w-sm' : 'w-full'} mx-auto border rounded-lg overflow-hidden`}
      style={{ 
        maxHeight: mode === 'mobile' ? '600px' : '500px',
        backgroundColor: profile.background_color || '#ffffff'
      }}
    >
      <div 
        className={`overflow-y-auto h-full ${getFontClass(profile.store_font)}`}
        style={{
          '--primary-color': profile.primary_color || '#4C9F70',
          '--accent-color': profile.accent_color || '#3d8159',
        } as React.CSSProperties}
      >
        {/* Hero Section */}
        {(profile.hero_image_url || profile.hero_headline) && (
          <div className="relative">
            {profile.hero_image_url && (
              <div 
                className="h-32 bg-cover bg-center"
                style={{ backgroundImage: `url(${profile.hero_image_url})` }}
              />
            )}
            <div className="p-4 text-center">
              {profile.hero_headline && (
                <h1 className="text-lg font-bold mb-1" style={{ color: profile.primary_color }}>
                  {profile.hero_headline}
                </h1>
              )}
              {profile.hero_subheading && (
                <p className="text-sm text-gray-600 mb-3">{profile.hero_subheading}</p>
              )}
              {profile.hero_cta_text && (
                <Button 
                  size="sm"
                  className="text-white"
                  style={{ backgroundColor: profile.accent_color }}
                >
                  {profile.hero_cta_text}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Store Header */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            {profile.logo_url && (
              <img
                src={profile.logo_url}
                alt={profile.business_name}
                className="w-10 h-10 object-cover rounded-full"
              />
            )}
            <div>
              <h2 className="font-bold text-sm">{profile.business_name || 'Your Store'}</h2>
              {profile.store_bio && (
                <p className="text-xs text-gray-600 line-clamp-1">{profile.store_bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Sections */}
        {enabledSections.map((section) => (
          <div key={section.id} className="p-4 border-b">
            {section.section_type === 'products' && (
              <div>
                <h3 className="font-semibold text-sm mb-3">{section.section_title}</h3>
                <div className={`grid ${profile.store_layout === 'list' ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
                  {mockProducts.slice(0, profile.store_layout === 'list' ? 2 : 4).map((product) => (
                    <Card key={product.id} className="p-2">
                      <div className="aspect-square bg-gray-100 rounded mb-2" />
                      <div className="text-xs">
                        <p className="font-medium line-clamp-1">{product.title}</p>
                        <p className="font-bold" style={{ color: profile.primary_color }}>
                          {profile.default_currency === 'USD' ? '$' : 'R'}{product.price}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {section.section_type === 'about' && (
              <div>
                <h3 className="font-semibold text-sm mb-2">{section.section_title}</h3>
                <p className="text-xs text-gray-600">
                  {section.section_content || 'Tell customers about your story...'}
                </p>
              </div>
            )}

            {section.section_type === 'contact' && (
              <div>
                <h3 className="font-semibold text-sm mb-2">{section.section_title}</h3>
                <Button 
                  size="sm" 
                  className="w-full text-white text-xs"
                  style={{ backgroundColor: profile.accent_color }}
                >
                  <MessageCircle className="w-3 h-3 mr-1" />
                  Chat on WhatsApp
                </Button>
              </div>
            )}

            {section.section_type === 'testimonials' && (
              <div>
                <h3 className="font-semibold text-sm mb-2">{section.section_title}</h3>
                <div className="bg-gray-50 p-2 rounded text-xs">
                  <p className="italic mb-1">"Great products and service!"</p>
                  <p className="text-gray-500">- Happy Customer</p>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Footer */}
        <div className="p-4 text-center text-xs text-gray-500">
          <p>Powered by <span style={{ color: profile.primary_color }}>Link2Pay</span></p>
        </div>
      </div>
    </div>
  );
};

export default StorefrontPreview;
