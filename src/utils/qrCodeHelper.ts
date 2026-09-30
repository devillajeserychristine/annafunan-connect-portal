import QRCode from 'qrcode';

export function getVoucherConnectUrl(voucherCode: string): string {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    return `${origin}/?voucher=${encodeURIComponent(voucherCode.trim())}&code=${encodeURIComponent(voucherCode.trim())}`;
  }
  return `/?voucher=${encodeURIComponent(voucherCode.trim())}&code=${encodeURIComponent(voucherCode.trim())}`;
}

export async function generateQrDataUrl(text: string, size = 320): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: size,
      margin: 1,
      color: {
        dark: '#0b132b', // Ultra-high contrast deep navy/slate
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H', // High error correction for rapid camera scanning from distance & screens
    });
  } catch (err) {
    console.error('Failed to generate QR code', err);
    throw err;
  }
}

export async function generateVoucherQrDataUrl(voucherCode: string, size = 320): Promise<string> {
  const url = getVoucherConnectUrl(voucherCode);
  return generateQrDataUrl(url, size);
}

export async function generateVoucherQrSvg(voucherCode: string): Promise<string> {
  const url = getVoucherConnectUrl(voucherCode);
  try {
    return await QRCode.toString(url, {
      type: 'svg',
      margin: 1,
      color: {
        dark: '#0b132b',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    });
  } catch (err) {
    console.error('Failed to generate QR SVG', err);
    throw err;
  }
}
