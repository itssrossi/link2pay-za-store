/**
 * Formats phone number for WhatsApp links by:
 * - Removing all non-digit characters
 * - Adding +27 country code for South African numbers
 * - Handling numbers that start with 0 by replacing with 27
 */
export const formatPhoneForWhatsApp = (phoneNumber: string): string => {
  if (!phoneNumber) return '';
  
  // Remove all non-digit characters
  let formattedNumber = phoneNumber.replace(/\D/g, '');
  
  // Handle South African numbers starting with 0
  if (formattedNumber.startsWith('0')) {
    formattedNumber = '27' + formattedNumber.substring(1);
  }
  
  // Add country code for 9-digit numbers (assuming South African mobile)
  if (!formattedNumber.startsWith('27') && formattedNumber.length === 9) {
    formattedNumber = '27' + formattedNumber;
  }
  
  return formattedNumber;
};

/**
 * Creates a WhatsApp link with a formatted phone number and message
 */
export const createWhatsAppLink = (phoneNumber: string, message: string): string => {
  const formattedNumber = formatPhoneForWhatsApp(phoneNumber);
  return `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`;
};

/**
 * Safely opens a WhatsApp link with fallbacks for blocked scenarios
 */
export const openWhatsAppLink = (phoneNumber: string, message: string): boolean => {
  try {
    const whatsappLink = createWhatsAppLink(phoneNumber, message);
    
    // Try to open in new tab first
    const newWindow = window.open(whatsappLink, '_blank', 'noopener,noreferrer');
    
    if (newWindow) {
      // Successfully opened in new tab
      return true;
    } else {
      // Popup blocked, try direct navigation
      window.location.href = whatsappLink;
      return true;
    }
  } catch (error) {
    console.error('Failed to open WhatsApp link:', error);
    
    // Final fallback - copy link to clipboard and show instructions
    const whatsappLink = createWhatsAppLink(phoneNumber, message);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(whatsappLink).then(() => {
        alert(`WhatsApp link blocked by browser. Link copied to clipboard:\n${whatsappLink}\n\nPlease paste it in your browser or click the manual WhatsApp button.`);
      }).catch(() => {
        alert(`WhatsApp link blocked. Please manually open:\n${whatsappLink}`);
      });
    } else {
      alert(`WhatsApp link blocked. Please manually open:\n${whatsappLink}`);
    }
    return false;
  }
};