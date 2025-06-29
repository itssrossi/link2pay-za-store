import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, ShoppingCart, MapPin, Phone, Mail } from 'lucide-react';
import DeliveryForm from '@/components/DeliveryForm';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  product_id: string;
}

interface Profile {
  id: string;
  business_name: string;
  whatsapp_number: string;
  store_bio: string;
  logo_url: string;
  store_layout: string;
  store_font: string;
  primary_color: string;
  accent_color: string;
  header_banner_url: string;
  hero_image_url: string;
  hero_headline: string;
  hero_subheading: string;
  hero_cta_text: string;
  hero_cta_link: string;
  background_color: string;
  theme_preset: string;
  store_visibility: boolean;
  default_currency: string;
  store_location: string;
  delivery_note: string;
}

interface StoreSection {
  id: string;
  section_type: string;
  is_enabled: boolean;
  section_title: string;
  section_content: string;
  section_order: number;
  section_settings: any;
}

const Storefront = () => {
  const { username } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [sections, setSections] = useState<StoreSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchStorefrontData();
  }, [username]);

  const fetchStorefrontData = async () => {
    try {
      // Fetch profile by store handle with all customization fields
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('store_handle', username)
        .single();

      if (profileError) throw profileError;
      
      // Check if store is visible
      if (!profileData.store_visibility) {
        setProfile(null);
        setLoading(false);
        return;
      }

      setProfile(profileData);

      // Fetch products for this user
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, title, description, price, image_url, category, product_id')
        .eq('user_id', profileData.id)
        .eq('is_active', true);

      if (productsError) throw productsError;
      setProducts(productsData || []);

      // Fetch store sections
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('store_sections')
        .select('*')
        .eq('user_id', profileData.id)
        .eq('is_enabled', true)
        .order('section_order');

      if (sectionsError) throw sectionsError;
      setSections(sectionsData || []);

    } catch (error) {
      console.error('Error fetching storefront data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppOrder = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleHeroCTA = () => {
    if (!profile?.hero_cta_link) return;
    
    if (profile.hero_cta_link.includes('wa.me') || profile.hero_cta_link.includes('whatsapp')) {
      window.open(profile.hero_cta_link, '_blank');
    } else {
      window.location.href = profile.hero_cta_link;
    }
  };

  const getFontClass = (font: string) => {
    switch (font) {
      case 'poppins': return 'font-sans';
      case 'roboto': return 'font-sans';
      case 'playfair': return 'font-serif';
      case 'montserrat': return 'font-sans';
      default: return 'font-sans';
    }
  };

  const getLayoutClass = () => {
    switch (profile?.store_layout) {
      case 'list': return 'flex flex-col gap-4';
      case 'carousel': return 'flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory';
      default: return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6';
    }
  };

  const getCurrencySymbol = () => {
    switch (profile?.default_currency) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      default: return 'R';
    }
  };

  const renderSection = (section: StoreSection) => {
    switch (section.section_type) {
      case 'products':
        return (
          <div key={section.id} className="mb-8 sm:mb-12 px-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">{section.section_title}</h2>
            
            {/* Delivery Form Modal */}
            {selectedProduct && profile?.whatsapp_number && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute -top-2 -right-2 z-10 bg-white hover:bg-gray-100 rounded-full p-2"
                    onClick={() => setSelectedProduct(null)}
                  >
                    ×
                  </Button>
                  <DeliveryForm
                    productTitle={selectedProduct.title}
                    whatsappNumber={profile.whatsapp_number}
                    onSubmit={() => setSelectedProduct(null)}
                  />
                </div>
              </div>
            )}
            
            <div className={getLayoutClass()}>
              {products.map((product) => (
                <Card key={product.id} className="hover:shadow-lg transition-shadow flex-shrink-0 w-full" style={{ minWidth: profile.store_layout === 'carousel' ? '280px' : 'auto' }}>
                  <CardHeader className="pb-3 sm:pb-4 p-3 sm:p-6">
                    {product.image_url && (
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-3 sm:mb-4">
                        <img
                          src={product.image_url}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardTitle className="text-base sm:text-lg">{product.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {product.category && (
                        <Badge variant="outline" className="w-fit text-xs">
                          {product.category}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="w-fit text-xs">
                        ID: {product.product_id}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0">
                    {product.description && (
                      <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-lg sm:text-xl font-bold" style={{ color: profile.primary_color }}>
                        {getCurrencySymbol()}{product.price.toFixed(2)}
                      </div>
                      <Button
                        onClick={() => handleWhatsAppOrder(product)}
                        size="sm"
                        className="text-white hover:opacity-90 text-xs sm:text-sm"
                        style={{ backgroundColor: profile.accent_color }}
                      >
                        <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        Order Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'about':
        return (
          <div key={section.id} className="mb-8 sm:mb-12 px-4">
            <Card>
              <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">{section.section_title}</h2>
                <div className="prose max-w-none">
                  <p className="text-gray-600 whitespace-pre-wrap text-sm sm:text-base">{section.section_content}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'contact':
        return (
          <div key={section.id} className="mb-8 sm:mb-12 px-4">
            <Card>
              <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">{section.section_title}</h2>
                <div className="space-y-3 sm:space-y-4">
                  {profile.whatsapp_number && (
                    <Button
                      onClick={() => {
                        const message = `Hi! I found your store online and would like to know more about your products.`;
                        const whatsappLink = `https://wa.me/${profile.whatsapp_number?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
                        window.open(whatsappLink, '_blank');
                      }}
                      className="w-full text-white hover:opacity-90 text-sm sm:text-base"
                      style={{ backgroundColor: profile.primary_color }}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Chat on WhatsApp
                    </Button>
                  )}
                  
                  {profile.store_location && (
                    <div className="flex items-center gap-2 text-gray-600 text-sm sm:text-base">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span>{profile.store_location}</span>
                    </div>
                  )}
                  
                  {profile.delivery_note && (
                    <p className="text-xs sm:text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {profile.delivery_note}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'testimonials':
        return (
          <div key={section.id} className="mb-8 sm:mb-12 px-4">
            <Card>
              <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">{section.section_title}</h2>
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="italic mb-2 text-sm sm:text-base">"{section.section_content || 'Great products and excellent service!'}"</p>
                    <p className="text-gray-500 text-xs sm:text-sm">- Happy Customer</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'custom_html':
        return (
          <div key={section.id} className="mb-8 sm:mb-12 px-4">
            <Card>
              <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">{section.section_title}</h2>
                <div dangerouslySetInnerHTML={{ __html: section.section_content || '' }} />
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4C9F70]"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-8 sm:py-12 p-4 sm:p-6">
            <ShoppingCart className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mb-4" />
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Store Not Found</h2>
            <p className="text-gray-600 mb-4 text-sm sm:text-base">
              This store may not exist, is currently offline, or is no longer available.
            </p>
            <Button asChild>
              <a href="/">Back to Home</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const primaryColor = profile.primary_color || '#4C9F70';
  const accentColor = profile.accent_color || '#3d8159';
  const backgroundColor = profile.background_color || '#ffffff';

  return (
    <div 
      className={`min-h-screen ${getFontClass(profile.store_font)}`}
      style={{ backgroundColor }}
    >
      {/* Hero Section */}
      {(profile.hero_image_url || profile.hero_headline) && (
        <div className="relative">
          {profile.hero_image_url && (
            <div 
              className="w-full h-48 sm:h-64 md:h-96 bg-cover bg-center relative"
              style={{ backgroundImage: `url(${profile.hero_image_url})` }}
            >
              <div className="absolute inset-0 bg-black bg-opacity-40" />
            </div>
          )}
          <div className={`${profile.hero_image_url ? 'absolute inset-0 flex items-center justify-center' : 'py-8 sm:py-16'} text-center px-4`}>
            <div className="max-w-4xl mx-auto">
              {profile.hero_headline && (
                <h1 className={`text-2xl sm:text-4xl md:text-6xl font-bold mb-3 sm:mb-4 ${profile.hero_image_url ? 'text-white' : ''}`} style={{ color: profile.hero_image_url ? 'white' : primaryColor }}>
                  {profile.hero_headline}
                </h1>
              )}
              {profile.hero_subheading && (
                <p className={`text-sm sm:text-lg md:text-xl mb-6 sm:mb-8 ${profile.hero_image_url ? 'text-gray-200' : 'text-gray-600'}`}>
                  {profile.hero_subheading}
                </p>
              )}
              {profile.hero_cta_text && profile.hero_cta_link && (
                <Button
                  onClick={handleHeroCTA}
                  size="lg"
                  className="text-white hover:opacity-90 text-sm sm:text-lg px-6 sm:px-8 py-2 sm:py-3"
                  style={{ backgroundColor: accentColor }}
                >
                  {profile.hero_cta_text}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Store Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            {profile.logo_url && (
              <img
                src={profile.logo_url}
                alt={profile.business_name}
                className="w-16 h-16 sm:w-24 sm:h-24 object-cover rounded-full border-4"
                style={{ borderColor: primaryColor }}
              />
            )}
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                {profile.business_name}
              </h1>
              {profile.store_bio && (
                <p className="text-gray-600 mb-4 max-w-2xl text-sm sm:text-base">
                  {profile.store_bio}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Sections */}
      <div className="max-w-6xl mx-auto py-6 sm:py-8">
        {products.length === 0 && sections.length === 0 ? (
          <div className="px-4">
            <Card className="text-center py-8 sm:py-12">
              <CardContent className="p-4 sm:p-6">
                <ShoppingCart className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Store Coming Soon</h3>
                <p className="text-gray-600 text-sm sm:text-base">This store is being set up. Check back soon!</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          sections.map(renderSection)
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-8 sm:mt-12">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6 text-center">
          <p className="text-gray-600 text-xs sm:text-sm">
            Powered by <span className="font-semibold" style={{ color: primaryColor }}>Link2Pay</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Storefront;
