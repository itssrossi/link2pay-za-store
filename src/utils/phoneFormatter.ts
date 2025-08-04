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