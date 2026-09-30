import jsPDF from 'jspdf';
import { Voucher } from '../types';
import { generateVoucherQrDataUrl } from './qrCodeHelper';

export interface VoucherPdfOptions {
  paperSize?: 'a4' | 'letter';
  layoutDensity?: '8_per_page' | '6_per_page';
  showCutGuides?: boolean;
  includeQrCodes?: boolean;
  batchLabel?: string;
  distributeTo?: string; // e.g., "Grade 11 STEM Section A"
  schoolName?: string;
  ssid?: string;
}

export async function generateVouchersPdf(
  vouchers: Voucher[], 
  options: VoucherPdfOptions = {}
): Promise<jsPDF> {
  const paperSize = options.paperSize || 'a4';
  const density = options.layoutDensity || '8_per_page';
  const showCutGuides = options.showCutGuides !== false;
  const includeQrCodes = options.includeQrCodes !== false;
  const schoolName = options.schoolName || 'ANNANFUNAN INTEGRATED SCHOOL';
  const ssid = options.ssid || 'AIS-Campus-WiFi';
  const batchLabel = options.batchLabel || (vouchers[0]?.batchId ? `Batch: ${vouchers[0].batchId}` : 'Campus Wi-Fi Vouchers');
  const distributeTo = options.distributeTo || '';

  // Pre-generate QR codes for each voucher in parallel if enabled
  const qrCodeMap = new Map<string, string>();
  if (includeQrCodes) {
    await Promise.all(
      vouchers.map(async (v) => {
        try {
          const dataUrl = await generateVoucherQrDataUrl(v.code, 180);
          qrCodeMap.set(v.code, dataUrl);
        } catch (err) {
          console.warn(`Failed to generate QR for voucher ${v.code}`, err);
        }
      })
    );
  }

  // Page dimensions in mm
  // A4: 210 x 297, Letter: 215.9 x 279.4
  const isLetter = paperSize === 'letter';
  const pageWidth = isLetter ? 215.9 : 210;
  const pageHeight = isLetter ? 279.4 : 297;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: paperSize,
    compress: true
  });

  // Layout parameters
  const cols = 2;
  const rows = density === '8_per_page' ? 4 : 3;
  const vouchersPerPage = cols * rows;

  const marginX = 10;
  const marginTop = 18; // space for sheet header
  const marginBottom = 12; // space for sheet footer

  const printableWidth = pageWidth - (marginX * 2);
  const printableHeight = pageHeight - marginTop - marginBottom;

  const colGap = 6;
  const rowGap = 5;

  const cardWidth = (printableWidth - (colGap * (cols - 1))) / cols;
  const cardHeight = (printableHeight - (rowGap * (rows - 1))) / rows;

  const totalPages = Math.max(1, Math.ceil(vouchers.length / vouchersPerPage));

  for (let p = 0; p < totalPages; p++) {
    if (p > 0) {
      doc.addPage(paperSize, 'portrait');
    }

    // 1. Sheet Header
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(0, 0, pageWidth, 14, 'F');
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.3);
    doc.line(0, 14, pageWidth, 14);

    // School title in header
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(schoolName, marginX, 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139); // slate-500
    const subHeaderText = `Distribution Sheet • ${batchLabel}${distributeTo ? ` • Group: ${distributeTo}` : ''} • Date: ${new Date().toLocaleDateString()}`;
    doc.text(subHeaderText, marginX, 10.5);

    // Page indicator on right
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(5, 150, 105); // emerald-600
    doc.text(`SHEET ${p + 1} OF ${totalPages} (${vouchers.length} Vouchers)`, pageWidth - marginX, 6, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Cut along dashed lines for physical handout', pageWidth - marginX, 10.5, { align: 'right' });

    // 2. Render Cards on this page
    const pageVouchers = vouchers.slice(p * vouchersPerPage, (p + 1) * vouchersPerPage);

    pageVouchers.forEach((voucher, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);

      const x = marginX + (col * (cardWidth + colGap));
      const y = marginTop + (row * (cardHeight + rowGap));

      const qrDataUrl = qrCodeMap.get(voucher.code);

      renderVoucherCard(
        doc, 
        voucher, 
        x, 
        y, 
        cardWidth, 
        cardHeight, 
        ssid, 
        showCutGuides, 
        density,
        qrDataUrl
      );
    });

    // 3. Sheet Footer
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(marginX, pageHeight - 7, pageWidth - marginX, pageHeight - 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(
      'Annafunan Integrated School - ICT Network Administration Gateway • Mobile Camera QR Scan Supported • MikroTik RouterOS ED50OUG',
      pageWidth / 2,
      pageHeight - 3.5,
      { align: 'center' }
    );
  }

  return doc;
}

function renderVoucherCard(
  doc: jsPDF,
  voucher: Voucher,
  x: number,
  y: number,
  w: number,
  h: number,
  ssid: string,
  showCutGuides: boolean,
  density: '8_per_page' | '6_per_page',
  qrDataUrl?: string
) {
  const isSpacious = density === '6_per_page';

  // 1. Cut Guide outer border (dashed)
  if (showCutGuides) {
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineDashPattern([1.5, 1.5], 0);
    doc.setLineWidth(0.25);
    doc.rect(x, y, w, h, 'S');
    doc.setLineDashPattern([], 0); // reset to solid

    // Draw little scissor symbol text at top-left
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.text('✄ - - -', x + 1.5, y + 2.5);
  }

  // 2. Card Content Area (inset slightly so cut doesn't clip content)
  const inset = 1.2;
  const cx = x + inset;
  const cy = y + inset;
  const cw = w - (inset * 2);
  const ch = h - (inset * 2);

  // Background card rounded rect
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(cx, cy, cw, ch, 2, 2, 'FD');

  // 3. Card Header Banner
  const headerHeight = isSpacious ? 11 : 9.5;
  doc.setFillColor(6, 78, 59); // emerald-900 (deep professional green)
  doc.roundedRect(cx, cy, cw, headerHeight, 2, 2, 'F');
  // Fill the bottom corners to make them square with body
  doc.rect(cx, cy + headerHeight - 2, cw, 2, 'F');

  // School name in banner
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isSpacious ? 7.5 : 6.8);
  doc.text('ANNANFUNAN INTEGRATED SCHOOL', cx + 2.5, cy + (isSpacious ? 4.8 : 4.2));

  // SSID badge in banner (top-right)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(isSpacious ? 6.2 : 5.8);
  doc.setTextColor(167, 243, 208); // emerald-200
  doc.text(`Wi-Fi: ${ssid}`, cx + cw - 2.5, cy + (isSpacious ? 4.8 : 4.2), { align: 'right' });

  // Subtitle in banner
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(isSpacious ? 6 : 5.3);
  doc.setTextColor(209, 250, 229); // emerald-100
  doc.text(`OFFICIAL CAMPUS ACCESS PASS • ${voucher.profileLabel.toUpperCase()}`, cx + 2.5, cy + (isSpacious ? 8.8 : 7.6));

  // 4. Content section: Code, specs, and QR Code
  const hasQr = Boolean(qrDataUrl);
  const qrSize = isSpacious ? 23 : 19;
  const qrX = cx + cw - qrSize - 2.5;
  const qrY = cy + headerHeight + (isSpacious ? 3 : 2);

  // Left column width (for code + specs)
  const leftW = hasQr ? (cw - qrSize - 6) : (cw - 5);
  const codeBoxX = cx + 2.5;
  const codeBoxY = cy + headerHeight + (isSpacious ? 3 : 2);
  const codeBoxH = isSpacious ? 14 : 11.5;

  // Background for code
  doc.setFillColor(241, 245, 249); // slate-100
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.4);
  doc.roundedRect(codeBoxX, codeBoxY, leftW, codeBoxH, 1.5, 1.5, 'FD');

  // Small label above code
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isSpacious ? 5.2 : 4.6);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('AUTHENTICATION VOUCHER CODE', codeBoxX + (leftW / 2), codeBoxY + (isSpacious ? 3.6 : 3), { align: 'center' });

  // The actual voucher code
  doc.setFont('courier', 'bold');
  doc.setFontSize(isSpacious ? 11.5 : 9.5);
  doc.setTextColor(15, 23, 42); // slate-900 high-contrast
  doc.text(voucher.code, codeBoxX + (leftW / 2), codeBoxY + (isSpacious ? 9.5 : 7.8), { align: 'center' });

  // 5. Draw QR Code if available
  if (hasQr && qrDataUrl) {
    // White background & border around QR code
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.roundedRect(qrX, qrY, qrSize, qrSize, 1, 1, 'FD');

    // Add image
    const imgPadding = 0.8;
    doc.addImage(
      qrDataUrl,
      'PNG',
      qrX + imgPadding,
      qrY + imgPadding,
      qrSize - (imgPadding * 2),
      qrSize - (imgPadding * 2)
    );

    // Label under QR code
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(4.5);
    doc.setTextColor(5, 150, 105); // emerald-600
    doc.text('SCAN TO CONNECT', qrX + (qrSize / 2), qrY + qrSize + 2.8, { align: 'center' });
  }

  // 6. Specs & Allowances Grid
  const specsY = codeBoxY + codeBoxH + (isSpacious ? 3 : 2.2);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isSpacious ? 5.6 : 4.8);
  doc.setTextColor(71, 85, 105); // slate-600

  const durationStr = voucher.durationMinutes >= 60
    ? `${(voucher.durationMinutes / 60).toFixed(voucher.durationMinutes % 60 === 0 ? 0 : 1)} Hr${voucher.durationMinutes > 60 ? 's' : ''}`
    : `${voucher.durationMinutes} Mins`;

  const quotaStr = voucher.dataQuotaMB > 0 ? `${voucher.dataQuotaMB} MB` : 'Unlimited';
  const speedStr = `${voucher.speedLimitDownMbps}M / ${voucher.speedLimitUpMbps}M`;
  const expiryDate = new Date(voucher.expiresAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  });

  const col1X = codeBoxX + 1;
  const col2X = codeBoxX + (leftW / 2);

  // Row 1
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Duration:', col1X, specsY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(durationStr, col1X + 12, specsY);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Quota:', col2X, specsY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(quotaStr, col2X + 9, specsY);

  // Row 2
  const specsY2 = specsY + (isSpacious ? 3.8 : 3.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Speed:', col1X, specsY2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(speedStr, col1X + 10, specsY2);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Expires:', col2X, specsY2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(expiryDate, col2X + 11, specsY2);

  // 7. Step-by-step instructions box at bottom
  const footerH = isSpacious ? 10 : 8;
  const footerY = cy + ch - footerH;

  // Divider line
  doc.setDrawColor(241, 245, 249);
  doc.setLineWidth(0.2);
  doc.line(cx + 2, footerY, cx + cw - 2, footerY);

  // Instruction step text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(isSpacious ? 5 : 4.3);
  doc.setTextColor(71, 85, 105);

  const stepText = hasQr
    ? `1. Connect to ${ssid}   2. Scan QR with Camera OR enter code   3. Immediate internet`
    : `1. Connect Wi-Fi: ${ssid}   2. Open browser login page   3. Enter voucher code`;
  doc.text(stepText, cx + (cw / 2), footerY + (isSpacious ? 3.5 : 2.8), { align: 'center' });

  // Security warning / note
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(isSpacious ? 4.5 : 3.9);
  doc.setTextColor(148, 163, 184); // slate-400
  const noteText = voucher.notes
    ? `Note: ${voucher.notes.slice(0, 38)} • Academic use only`
    : 'Keep ticket confidential • Single-student use • DepEd ICT Guidelines apply';
  doc.text(noteText, cx + (cw / 2), footerY + (isSpacious ? 7.2 : 6), { align: 'center' });
}
