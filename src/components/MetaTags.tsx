
import { useEffect } from 'react';

interface MetaTagsProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

const MetaTags = ({ 
  title = "Link2Pay — Smart Invoicing for WhatsApp Sellers",
  description = "Create invoices, showcase products, and get paid — all via WhatsApp.",
  image = "/lovable-uploads/d8795ab7-b901-48d0-ae71-c1d0fa49e16d.png",
  url = window.location.href,
  type = "website"
}: MetaTagsProps) => {
  useEffect(() => {
    // Update document title
    document.title = title;
    
    // Update or create meta tags
    const updateMetaTag = (property: string, content: string) => {
      let metaTag = document.querySelector(`meta[property="${property}"]`) || 
                   document.querySelector(`meta[name="${property}"]`);
      
      if (!metaTag) {
        metaTag = document.createElement('meta');
        if (property.startsWith('og:') || property.startsWith('twitter:')) {
          metaTag.setAttribute('property', property);
        } else {
          metaTag.setAttribute('name', property);
        }
        document.head.appendChild(metaTag);
      }
      
      metaTag.setAttribute('content', content);
    };
    
    // Basic meta tags
    updateMetaTag('description', description);
    
    // Open Graph tags
    updateMetaTag('og:title', title);
    updateMetaTag('og:description', description);
    updateMetaTag('og:image', image);
    updateMetaTag('og:url', url);
    updateMetaTag('og:type', type);
    updateMetaTag('og:site_name', 'Link2Pay');
    
    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);
    
  }, [title, description, image, url, type]);

  return null;
};

export default MetaTags;
