import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Package } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  price: number;
  description?: string;
}

interface ProductSelectionProps {
  userId: string;
  selectedProducts: string[];
  onSelectionChange: (productIds: string[], totalAmount: number) => void;
  disabled?: boolean;
}

export function ProductSelection({ 
  userId, 
  selectedProducts, 
  onSelectionChange, 
  disabled = false 
}: ProductSelectionProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchProducts();
    }
  }, [userId]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, title, price, description')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('title');

      if (error) throw error;

      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to load available services.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProductToggle = (productId: string, checked: boolean) => {
    if (disabled) return;

    let newSelection: string[];
    if (checked) {
      newSelection = [...selectedProducts, productId];
    } else {
      newSelection = selectedProducts.filter(id => id !== productId);
    }

    // Calculate total amount
    const totalAmount = products
      .filter(product => newSelection.includes(product.id))
      .reduce((sum, product) => sum + product.price, 0);

    onSelectionChange(newSelection, totalAmount);
  };

  const selectedProductsData = products.filter(p => selectedProducts.includes(p.id));
  const totalAmount = selectedProductsData.reduce((sum, product) => sum + product.price, 0);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Select Services
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Select Services
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center">
            No services available for selection.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Select Services (Optional)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {products.map((product) => (
            <div key={product.id} className="flex items-start space-x-3 p-3 border border-border rounded-lg">
              <Checkbox
                id={`product-${product.id}`}
                checked={selectedProducts.includes(product.id)}
                onCheckedChange={(checked) => handleProductToggle(product.id, checked as boolean)}
                disabled={disabled}
              />
              <div className="flex-1 min-w-0">
                <Label 
                  htmlFor={`product-${product.id}`}
                  className="font-medium cursor-pointer"
                >
                  {product.title}
                </Label>
                {product.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {product.description}
                  </p>
                )}
                <Badge variant="secondary" className="mt-2">
                  R{product.price.toFixed(2)}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {selectedProducts.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-medium">Selected Services:</h4>
              {selectedProductsData.map((product) => (
                <div key={product.id} className="flex justify-between text-sm">
                  <span>{product.title}</span>
                  <span>R{product.price.toFixed(2)}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Total:</span>
                <span>R{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}