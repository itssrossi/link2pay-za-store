import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import ImageUpload from '@/components/ui/image-upload';
import { Package, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { OnboardingState } from '../NewOnboardingContainer';
import { useOnboardingTracking } from '@/hooks/useOnboardingTracking';

interface ProductStepProps {
  onNext: () => void;
  state: OnboardingState;
  setState: React.Dispatch<React.SetStateAction<OnboardingState>>;
  isOptional: boolean;
}

interface ProductForm {
  title: string;
  description: string;
  price: string;
  imageUrl: string;
}

const ProductStep: React.FC<ProductStepProps> = ({ onNext, state, setState }) => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  
  const { trackCompletion } = useOnboardingTracking({
    stepName: 'product_setup',
    stepNumber: 2,
    onboardingType: state.choice || undefined
  });
  const [product, setProduct] = useState<ProductForm>({
    title: '',
    description: '',
    price: '',
    imageUrl: ''
  });

  const handleInputChange = (field: keyof ProductForm, value: string) => {
    setProduct(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user) return;

    if (!product.title || !product.price) {
      toast.error('Please fill in the product title and price');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('products')
        .insert({
          user_id: user.id,
          title: product.title,
          description: product.description,
          price: parseFloat(product.price),
          image_url: product.imageUrl,
          category: 'General',
          is_active: true
        });

      if (error) throw error;

      // Create default products section and enable store visibility
      await Promise.all([
        supabase
          .from('store_sections')
          .upsert({
            user_id: user.id,
            section_type: 'products',
            section_title: 'Our Products',
            is_enabled: true,
            section_order: 1
          }, { onConflict: 'user_id,section_type' }),
        
        supabase
          .from('profiles')
          .update({ 
            store_visibility: true
          })
          .eq('id', user.id)
      ]);

      setState(prev => ({ ...prev, hasProducts: true }));
      await trackCompletion({ 
        product_title: product.title,
        product_price: product.price,
        has_image: !!product.imageUrl
      });
      toast.success('Product added successfully!');
      onNext();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    await trackCompletion({ 
      action: 'skipped'
    });
    onNext();
  };

  const isFormValid = product.title.trim() && product.price.trim() && !isNaN(parseFloat(product.price));

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center px-2 sm:px-0">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2">
          Add Your First Product
        </h2>
        <p className="text-xs sm:text-sm md:text-base text-gray-600">
          Create your first product listing to start selling on your store.
        </p>
      </div>

      <Card className="max-w-lg sm:max-w-xl md:max-w-2xl mx-auto">
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Package className="w-4 h-4 sm:w-5 sm:h-5" />
            Product Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
          <div className="grid gap-3 sm:gap-4 md:gap-6 md:grid-cols-2">
            <div className="space-y-3 sm:space-y-4 order-2 md:order-1">
              <div>
                <Label htmlFor="title" className="text-xs sm:text-sm font-medium">Product Name *</Label>
                <Input
                  id="title"
                  value={product.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g. Premium Coffee Beans"
                  required
                  className="mt-1 min-h-[40px] sm:min-h-[44px]"
                />
              </div>

              <div>
                <Label htmlFor="price" className="text-xs sm:text-sm font-medium">Price (R) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={product.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="0.00"
                  required
                  className="mt-1 min-h-[40px] sm:min-h-[44px]"
                />
              </div>

            </div>

            <div className="space-y-3 sm:space-y-4 order-1 md:order-2">
              <div>
                <Label className="text-xs sm:text-sm font-medium">Product Image</Label>
                <ImageUpload
                  value={product.imageUrl}
                  onChange={(url) => handleInputChange('imageUrl', url)}
                  label="Upload Image"
                  accept="image/*"
                  maxSize={5 * 1024 * 1024} // 5MB
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="description" className="text-xs sm:text-sm font-medium">Description</Label>
            <Textarea
              id="description"
              value={product.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe your product..."
              rows={3}
              className="mt-1 min-h-[80px] sm:min-h-[100px] resize-none"
            />
          </div>
        </CardContent>
      </Card>

      <div className="text-center px-2 sm:px-0 space-y-3">
        <Button
          onClick={handleSave}
          disabled={saving || !isFormValid}
          size="sm"
          className="min-h-[40px] sm:min-h-[44px] w-full sm:w-auto sm:min-w-40"
        >
          <Plus className="w-4 h-4 mr-2" />
          {saving ? 'Adding Product...' : 'Add Product & Continue'}
        </Button>
        
        <Button
          onClick={handleSkip}
          variant="outline"
          size="sm"
          className="min-h-[40px] sm:min-h-[44px] w-full sm:w-auto sm:min-w-40"
        >
          Add Later
        </Button>
        
        {!isFormValid && (
          <p className="text-xs text-muted-foreground mt-2">
            Please fill in the product name and price, or add a product later
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductStep;