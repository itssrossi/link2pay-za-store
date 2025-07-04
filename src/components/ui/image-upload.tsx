
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label: string;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
}

const ImageUpload = ({
  value,
  onChange,
  label,
  accept = ".jpg,.jpeg,.png",
  maxSize = 5,
  className = ""
}: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string>(value || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPG, JPEG, or PNG)');
      return;
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File size must be less than ${maxSize}MB`);
      return;
    }

    setUploading(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `store-images/${fileName}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      const imageUrl = data.publicUrl;
      setPreview(imageUrl);
      onChange(imageUrl);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview('');
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUrlInput = (url: string) => {
    setPreview(url);
    onChange(url);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <Label className="text-sm font-medium">{label}</Label>
      
      {/* Preview */}
      {preview && (
        <div className="relative">
          <div className="relative w-full max-w-xs">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-32 object-cover rounded-lg border"
              onError={() => {
                setPreview('');
                toast.error('Failed to load image');
              }}
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 h-6 w-6 p-0"
              onClick={handleRemove}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Upload Button */}
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full sm:w-auto"
        >
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? 'Uploading...' : 'Upload Image'}
        </Button>
        
        <Input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* URL Input Alternative */}
        <div className="text-xs text-gray-500 text-center">or</div>
        <Input
          type="url"
          placeholder="Paste image URL"
          value={preview}
          onChange={(e) => handleUrlInput(e.target.value)}
          className="text-xs"
        />
      </div>

      {/* File Info */}
      <p className="text-xs text-gray-500">
        Supported formats: JPG, JPEG, PNG (max {maxSize}MB)
      </p>
    </div>
  );
};

export default ImageUpload;
