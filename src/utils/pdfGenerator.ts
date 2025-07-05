
import jsPDF from 'jspdf';

export interface InvoiceData {
  invoice_number: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  business_name: string;
  logo_url?: string;
  items: Array<{
    title: string;
    description?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  subtotal: number;
  vat_amount?: number;
  total_amount: number;
  delivery_method?: string;
  delivery_address?: string;
  delivery_notes?: string;
  delivery_date?: string;
  delivery_fee?: number;
  payment_instructions?: string;
  eft_details?: string;
  snapscan_link?: string;
  payfast_link?: string;
  payment_enabled?: boolean;
  created_at: string;
}

export const generateInvoicePDF = async (invoiceData: InvoiceData): Promise<void> => {
  try {
    console.log('Generating PDF for invoice:', invoiceData.invoice_number);
    
    // Create new PDF document
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    let currentY = margin;

    // Set default font
    pdf.setFont('helvetica');

    // Header Section
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('INVOICE', pageWidth - margin, currentY, { align: 'right' });
    
    // Business name on the left
    pdf.setFontSize(18);
    pdf.text(invoiceData.business_name || 'Link2Pay Business', margin, currentY);
    
    currentY += 15;

    // Invoice details
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Invoice #: ${invoiceData.invoice_number}`, pageWidth - margin, currentY, { align: 'right' });
    currentY += 6;
    pdf.text(`Date: ${new Date(invoiceData.created_at).toLocaleDateString()}`, pageWidth - margin, currentY, { align: 'right' });
    
    currentY += 20;

    // Bill To Section
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Bill To:', margin, currentY);
    currentY += 8;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(invoiceData.client_name, margin, currentY);
    currentY += 6;
    
    if (invoiceData.client_email) {
      pdf.text(invoiceData.client_email, margin, currentY);
      currentY += 6;
    }
    
    if (invoiceData.client_phone) {
      pdf.text(invoiceData.client_phone, margin, currentY);
      currentY += 6;
    }

    currentY += 10;

    // Delivery Information Section
    if (invoiceData.delivery_method) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('Delivery Information:', margin, currentY);
      currentY += 8;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text(`Method: ${invoiceData.delivery_method}`, margin, currentY);
      currentY += 6;
      
      if (invoiceData.delivery_address) {
        pdf.text('Address:', margin, currentY);
        currentY += 5;
        const addressLines = pdf.splitTextToSize(invoiceData.delivery_address, pageWidth - 2 * margin - 20);
        pdf.text(addressLines, margin + 20, currentY);
        currentY += addressLines.length * 4 + 2;
      }
      
      if (invoiceData.delivery_date) {
        pdf.text(`Expected Date: ${new Date(invoiceData.delivery_date).toLocaleDateString()}`, margin, currentY);
        currentY += 6;
      }
      
      if (invoiceData.delivery_notes) {
        pdf.text('Notes:', margin, currentY);
        currentY += 5;
        const notesLines = pdf.splitTextToSize(invoiceData.delivery_notes, pageWidth - 2 * margin - 20);
        pdf.text(notesLines, margin + 20, currentY);
        currentY += notesLines.length * 4 + 2;
      }
      
      currentY += 10;
    }

    // Items Table Header
    const tableStartY = currentY;
    const colWidths = [80, 25, 30, 30];
    const colPositions = [margin, margin + colWidths[0], margin + colWidths[0] + colWidths[1], margin + colWidths[0] + colWidths[1] + colWidths[2]];

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    
    // Draw table header
    pdf.rect(margin, currentY - 2, pageWidth - 2 * margin, 8);
    pdf.setFillColor(242, 242, 242);
    pdf.rect(margin, currentY - 2, pageWidth - 2 * margin, 8, 'F');
    
    pdf.text('Description', colPositions[0] + 2, currentY + 3);
    pdf.text('Qty', colPositions[1] + 2, currentY + 3);
    pdf.text('Unit Price', colPositions[2] + 2, currentY + 3);
    pdf.text('Total', colPositions[3] + 2, currentY + 3);
    
    currentY += 10;

    // Items
    pdf.setFont('helvetica', 'normal');
    invoiceData.items.forEach((item, index) => {
      const rowHeight = 15;
      
      // Draw row background (alternating)
      if (index % 2 === 1) {
        pdf.setFillColor(248, 248, 248);
        pdf.rect(margin, currentY - 2, pageWidth - 2 * margin, rowHeight, 'F');
      }
      
      // Item details
      pdf.text(item.title, colPositions[0] + 2, currentY + 3);
      if (item.description) {
        pdf.setFontSize(8);
        pdf.text(item.description, colPositions[0] + 2, currentY + 8);
        pdf.setFontSize(10);
      }
      
      pdf.text(item.quantity.toString(), colPositions[1] + 2, currentY + 3);
      pdf.text(`R${item.unit_price.toFixed(2)}`, colPositions[2] + 2, currentY + 3);
      pdf.text(`R${item.total_price.toFixed(2)}`, colPositions[3] + 2, currentY + 3);
      
      // Draw row border
      pdf.rect(margin, currentY - 2, pageWidth - 2 * margin, rowHeight);
      
      currentY += rowHeight;
    });

    currentY += 10;

    // Totals Section
    const totalsX = pageWidth - margin - 60;
    
    // Calculate items subtotal (excluding delivery fee)
    const itemsSubtotal = invoiceData.subtotal - (invoiceData.delivery_fee || 0);
    
    pdf.text('Items Subtotal:', totalsX, currentY);
    pdf.text(`R${itemsSubtotal.toFixed(2)}`, totalsX + 40, currentY, { align: 'right' });
    currentY += 8;
    
    if (invoiceData.delivery_fee && invoiceData.delivery_fee > 0) {
      pdf.text('Delivery Fee:', totalsX, currentY);
      pdf.text(`R${invoiceData.delivery_fee.toFixed(2)}`, totalsX + 40, currentY, { align: 'right' });
      currentY += 8;
    }
    
    pdf.text('Subtotal:', totalsX, currentY);
    pdf.text(`R${invoiceData.subtotal.toFixed(2)}`, totalsX + 40, currentY, { align: 'right' });
    currentY += 8;
    
    if (invoiceData.vat_amount && invoiceData.vat_amount > 0) {
      pdf.text('VAT (15%):', totalsX, currentY);
      pdf.text(`R${invoiceData.vat_amount.toFixed(2)}`, totalsX + 40, currentY, { align: 'right' });
      currentY += 8;
    }
    
    // Total line
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.line(totalsX, currentY - 2, totalsX + 40, currentY - 2);
    pdf.text('Total:', totalsX, currentY + 5);
    pdf.text(`R${invoiceData.total_amount.toFixed(2)}`, totalsX + 40, currentY + 5, { align: 'right' });
    
    currentY += 20;

    // Payment Instructions
    if (invoiceData.payment_instructions) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text('Payment Instructions:', margin, currentY);
      currentY += 8;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      const instructionLines = pdf.splitTextToSize(invoiceData.payment_instructions, pageWidth - 2 * margin);
      pdf.text(instructionLines, margin, currentY);
      currentY += instructionLines.length * 4 + 10;
    }

    // Banking Details
    if (invoiceData.eft_details) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text('Banking Details:', margin, currentY);
      currentY += 8;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      const eftLines = pdf.splitTextToSize(invoiceData.eft_details, pageWidth - 2 * margin);
      pdf.text(eftLines, margin, currentY);
      currentY += eftLines.length * 4 + 10;
    }

    // Payment Links
    if (invoiceData.payment_enabled && (invoiceData.snapscan_link || invoiceData.payfast_link)) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text('Quick Payment Options:', margin, currentY);
      currentY += 8;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      
      if (invoiceData.snapscan_link) {
        pdf.text('SnapScan: ', margin, currentY);
        pdf.setTextColor(0, 0, 255);
        pdf.text(invoiceData.snapscan_link, margin + 25, currentY);
        pdf.setTextColor(0, 0, 0);
        currentY += 6;
      }
      
      if (invoiceData.payfast_link) {
        pdf.text('PayFast: ', margin, currentY);
        pdf.setTextColor(0, 0, 255);
        pdf.text(invoiceData.payfast_link, margin + 25, currentY);
        pdf.setTextColor(0, 0, 0);
        currentY += 6;
      }
      
      currentY += 10;
    }

    // Footer
    const footerY = pdf.internal.pageSize.getHeight() - 20;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text('Powered by Link2Pay', pageWidth / 2, footerY, { align: 'center' });

    // Download the PDF
    const filename = `invoice-${invoiceData.invoice_number}.pdf`;
    pdf.save(filename);
    
    console.log('PDF generated successfully:', filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
};
