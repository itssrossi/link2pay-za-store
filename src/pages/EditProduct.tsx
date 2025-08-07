import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import ImageUpload from '@/components/ui/image-upload';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  is_active: boolean;
  stock_quantity: number;
  inventory_enabled: boolean;
  product_id: string;
  delivery_method: string;
}

const EditProduct = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [formData, setFormData] = useState<Partial<Product>>({
    title: '',
    description: '',
    price: 0,
    category: '',
    is_active: true,
    stock_quantity: 0,
    inventory_enabled: false,
    delivery_method: 'Local Pickup'
  });

  useEffect(() => {
    if (id && user) {
      fetchProduct();
    }
  }, [id, user]);

  const fetchProduct = async () => {
    if (!id || !user) return;

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) {
        toast.error('Product not found or you do not have permission to edit it');
        navigate('/products');
        return;
      }

      setFormData(data);
      if (data.image_url) {
        setImagePreview(data.image_url);
      }
    } catch (error) {
      toast.error('Failed to load product');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    setFormData(prev => ({ ...prev, image_url: '' }));
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;

    if (!formData.title || !formData.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);

    try {
      let imageUrl = formData.image_url || '';

      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const { error } = await supabase
        .from('products')
        .update({
          title: formData.title,
          description: formData.description,
          price: formData.price,
          category: formData.category,
          is_active: formData.is_active,
          stock_quantity: formData.stock_quantity,
          inventory_enabled: formData.inventory_enabled,
          delivery_method: formData.delivery_method,
          image_url: imageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Product updated successfully!');
      navigate('/products');
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/products">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Products
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Edit Product</h1>
            <p className="text-muted-foreground">Update your product details</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Product Name *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price (R) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Product Image</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUpload
                value={imagePreview}
                onChange={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
                label="Product Image"
              />
              {imagePreview && (
                <div className="mt-2">
                  <img 
                    src={imagePreview} 
                    alt="Product preview" 
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={removeImage}
                    className="mt-2"
                  >
                    Remove Image
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inventory & Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="is_active">Product Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Active products are visible on your storefront
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="inventory_enabled">Track Inventory</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable stock quantity tracking
                  </p>
                </div>
                <Switch
                  id="inventory_enabled"
                  checked={formData.inventory_enabled}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, inventory_enabled: checked }))}
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
                    onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Link to="/products" className="flex-1">
              <Button type="button" variant="outline" className="w-full">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={saving} className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Updating...' : 'Update Product'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default EditProduct;