import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { CompletionPopup } from '@/components/ui/completion-popup';
import { triggerConfetti } from '@/components/ui/confetti';

const AddProduct = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [showCompletionPopup, setShowCompletionPopup] = useState(false);
  const [isFirstProduct, setIsFirstProduct] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    inventory_enabled: false,
    stock_quantity: 0,
    is_active: true
  });

  useEffect(() => {
    checkExistingProducts();
  }, [user]);

  const checkExistingProducts = async () => {
    if (!user) return;

    try {
      const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (error) throw error;
      setIsFirstProduct((count || 0) === 0);
    } catch (error) {
      console.error('Error checking existing products:', error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
  };

  const uploadImage = async (file: File): Promise<string> => {
    if (!user) {
      throw new Error('You must be logged in to upload images');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Image upload error:', uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const generateProductId = async (): Promise<string> => {
    try {
      const { data, error } = await supabase.rpc('generate_product_id');
      if (error) {
        console.error('Error generating product ID:', error);
        throw new Error(`Failed to generate product ID: ${error.message}`);
      }
      return data;
    } catch (error) {
      console.error('Error calling generate_product_id function:', error);
      // Fallback to timestamp-based ID
      return `prod-${Date.now()}`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to create products');
      navigate('/auth');
      return;
    }

    // Validate required fields
    if (!formData.title.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Product description is required');
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('Valid price is required');
      return;
    }
    if (!imageFile) {
      toast.error('Product image is required');
      return;
    }

    setLoading(true);

    try {
      console.log('Starting product creation for user:', user.id);
      
      // Generate unique product ID
      const productId = await generateProductId();
      console.log('Generated product ID:', productId);
      
      // Upload image
      const imageUrl = await uploadImage(imageFile);
      console.log('Image uploaded successfully:', imageUrl);

      // Create product data
      const productData = {
        user_id: user.id,
        product_id: productId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        category: formData.category.trim() || null,
        image_url: imageUrl,
        inventory_enabled: formData.inventory_enabled,
        stock_quantity: formData.inventory_enabled ? formData.stock_quantity : 0,
        is_active: formData.is_active
      };

      console.log('Inserting product data:', productData);

      const { error } = await supabase
        .from('products')
        .insert(productData);

      if (error) {
        console.error('Database error:', error);
        
        // Provide specific error messages based on the error type
        if (error.code === '42501') {
          throw new Error('You do not have permission to create products. Please contact support.');
        } else if (error.code === '23505') {
          throw new Error('A product with this ID already exists. Please try again.');
        } else if (error.message.includes('user_id must match authenticated user')) {
          throw new Error('Authentication error. Please log out and log back in.');
        } else if (error.message.includes('row-level security')) {
          throw new Error('Permission denied. You can only create products for your own store.');
        } else {
          throw new Error(`Failed to create product: ${error.message}`);
        }
      }

      console.log('Product created successfully');
      toast.success(`Product added successfully! Product ID: ${productId}`);
      
      // Only show completion popup and confetti for first product
      if (isFirstProduct) {
        triggerConfetti();
        setShowCompletionPopup(true);
        
        // Navigate after a delay to show the popup
        setTimeout(() => {
          navigate('/products');
        }, 2000);
      } else {
        // Navigate immediately for subsequent products
        navigate('/products');
      }
    } catch (error: any) {
      console.error('Error creating product:', error);
      
      // Show user-friendly error message
      const errorMessage = error.message || 'An unexpected error occurred while creating the product';
      toast.error(errorMessage);
      
      // If it's an authentication error, redirect to login
      if (errorMessage.includes('logged in') || errorMessage.includes('Authentication')) {
        setTimeout(() => navigate('/auth'), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/products')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-gray-600 mt-1">
            Create a new product for your store
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
            <CardDescription>
              Fill in the information about your product. All fields marked with * are required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Image Upload */}
              <div>
                <Label>Product Image *</Label>
                <div className="mt-2">
                  {imagePreview ? (
                    <div className="relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Product preview"
                        className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="absolute -top-2 -right-2 rounded-full w-6 h-6 p-0"
                        onClick={removeImage}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4">
                        <label htmlFor="image-upload" className="cursor-pointer">
                          <span className="text-[#4C9F70] font-medium hover:text-[#3d8159]">
                            Upload an image
                          </span>
                          <input
                            id="image-upload"
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageChange}
                          />
                        </label>
                        <p className="text-gray-500 text-sm mt-1">PNG, JPG up to 5MB</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Product Name *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter product name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price (ZAR) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Electronics, Clothing, Food"
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your product..."
                  rows={4}
                  required
                />
              </div>

              {/* Inventory Management */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Track Inventory</Label>
                    <p className="text-sm text-gray-600">
                      Enable if you want to track stock quantities
                    </p>
                  </div>
                  <Switch
                    checked={formData.inventory_enabled}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, inventory_enabled: checked })
                    }
                  />
                </div>

                {formData.inventory_enabled && (
                  <div>
                    <Label htmlFor="stock_quantity">Stock Quantity</Label>
                    <Input
                      id="stock_quantity"
                      type="number"
                      min="0"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        stock_quantity: parseInt(e.target.value) || 0 
                      })}
                      placeholder="0"
                    />
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="flex items-center justify-between">
                <div>
                  <Label>Product Status</Label>
                  <p className="text-sm text-gray-600">
                    Active products are visible in your store
                  </p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, is_active: checked })
                  }
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/products')}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#4C9F70] hover:bg-[#3d8159]"
                >
                  {loading ? 'Adding Product...' : 'Add Product'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <CompletionPopup
        isOpen={showCompletionPopup}
        onClose={() => setShowCompletionPopup(false)}
        title="First Product Added!"
        message="Click the dashboard button to complete the rest of the steps"
      />
    </Layout>
  );
};

export default AddProduct;
