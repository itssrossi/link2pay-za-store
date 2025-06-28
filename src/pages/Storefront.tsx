
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, ShoppingCart } from 'lucide-react';

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
}

const Storefront = () => {
  const { username } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStorefrontData();
  }, [username]);

  const fetchStorefrontData = async () => {
    try {
      // Fetch profile by store handle with customization fields
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          id, business_name, whatsapp_number, store_bio, logo_url,
          store_layout, store_font, primary_color, accent_color, header_banner_url
        `)
        .eq('store_handle', username)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch products for this user
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, title, description, price, image_url, category, product_id')
        .eq('user_id', profileData.id)
        .eq('is_active', true);

      if (productsError) throw productsError;
      setProducts(productsData || []);

    } catch (error) {
      console.error('Error fetching storefront data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppOrder = (product: Product) => {
    if (!profile?.whatsapp_number) return;
    
    const message = `Hi! I'd like to order ${product.title} for R${product.price.toFixed(2)}.`;
    const whatsappLink = `https://wa.me/${profile.whatsapp_number.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappLink, '_blank');
  };

  const getFontClass = (font: string) => {
    switch (font) {
      case 'poppins': return 'font-["Poppins"]';
      case 'roboto': return 'font-["Roboto"]';
      default: return 'font-["Inter"]';
    }
  };

  const getLayoutClass = () => {
    switch (profile?.store_layout) {
      case 'list': return 'grid grid-cols-1 gap-4';
      case 'carousel': return 'flex overflow-x-auto gap-4 pb-4';
      default: return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4C9F70]"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="text-center py-12">
            <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Store Not Found</h2>
            <p className="text-gray-600 mb-4">
              This store may not exist or is no longer available. Please check the URL and try again.
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

  return (
    <div 
      className={`min-h-screen bg-gray-50 ${getFontClass(profile.store_font)}`}
      style={{
        '--primary-color': primaryColor,
        '--accent-color': accentColor,
      } as React.CSSProperties}
    >
      {/* Header Banner */}
      {profile.header_banner_url && (
        <div className="w-full h-48 bg-cover bg-center" style={{ backgroundImage: `url(${profile.header_banner_url})` }} />
      )}

      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {profile.logo_url && (
              <img
                src={profile.logo_url}
                alt={profile.business_name}
                className="w-24 h-24 object-cover rounded-full"
                style={{ borderColor: primaryColor, borderWidth: '4px' }}
              />
            )}
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {profile.business_name}
              </h1>
              {profile.store_bio && (
                <p className="text-gray-600 mb-4 max-w-2xl">
                  {profile.store_bio}
                </p>
              )}
              <Button
                onClick={() => {
                  const message = `Hi! I found your store online and would like to know more about your products.`;
                  const whatsappLink = `https://wa.me/${profile.whatsapp_number?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
                  window.open(whatsappLink, '_blank');
                }}
                className="text-white hover:opacity-90"
                style={{ backgroundColor: primaryColor }}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat on WhatsApp
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {products.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products available</h3>
              <p className="text-gray-600">This store hasn't added any products yet.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Our Products</h2>
              <p className="text-gray-600">Browse our selection and order via WhatsApp</p>
            </div>
            
            <div className={getLayoutClass()}>
              {products.map((product) => (
                <Card key={product.id} className="hover:shadow-lg transition-shadow flex-shrink-0" style={{ minWidth: profile.store_layout === 'carousel' ? '280px' : 'auto' }}>
                  <CardHeader className="pb-4">
                    {product.image_url && (
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-4">
                        <img
                          src={product.image_url}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardTitle className="text-lg">{product.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      {product.category && (
                        <Badge variant="outline" className="w-fit">
                          {product.category}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="w-fit text-xs">
                        ID: {product.product_id}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {product.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="text-xl font-bold" style={{ color: primaryColor }}>
                        R{product.price.toFixed(2)}
                      </div>
                      <Button
                        onClick={() => handleWhatsAppOrder(product)}
                        size="sm"
                        className="text-white hover:opacity-90"
                        style={{ backgroundColor: accentColor }}
                      >
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Order Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center">
          <p className="text-gray-600">
            Powered by <span className="font-semibold" style={{ color: primaryColor }}>Link2Pay</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Storefront;
