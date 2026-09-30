import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  QrCode, 
  Download, 
  Copy, 
  Check, 
  ExternalLink, 
  Wifi, 
  Smartphone, 
  ShieldCheck, 
  Clock, 
  Gauge, 
  Printer,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Sparkles,
  Layers,
  Monitor
} from 'lucide-react';
import { Voucher } from '../types';
import { generateVoucherQrDataUrl, getVoucherConnectUrl } from '../utils/qrCodeHelper';

interface VoucherQrModalProps {
  voucher: Voucher | null;
  isOpen: boolean;
  onClose: () => void;
  vouchersList?: Voucher[];
  onSelectVoucher?: (v: Voucher) => void;
}

export const VoucherQrModal: React.FC<VoucherQrModalProps> = ({
  voucher,
  isOpen,
  onClose,
  vouchersList = [],
  onSelectVoucher,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [displayMode, setDisplayMode] = useState<'card' | 'kiosk'>('card');

  // Find index in vouchersList for next/prev navigation
  const currentIndex = voucher && vouchersList.length > 0 
    ? vouchersList.findIndex(v => v.id === voucher.id) 
    : -1;

  useEffect(() => {
    if (voucher && isOpen) {
      setLoading(true);
      const size = displayMode === 'kiosk' ? 440 : 320;
      generateVoucherQrDataUrl(voucher.code, size)
        .then((url) => {
          setQrDataUrl(url);
        })
        .catch((err) => {
          console.error('Failed to generate QR code', err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setQrDataUrl(null);
    }
  }, [voucher, isOpen, displayMode]);

  if (!isOpen || !voucher) return null;

  const connectUrl = getVoucherConnectUrl(voucher.code);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(connectUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `AIS_QR_${voucher.code}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintSlip = () => {
    window.print();
  };

  const handlePrev = () => {
    if (onSelectVoucher && currentIndex > 0) {
      onSelectVoucher(vouchersList[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (onSelectVoucher && currentIndex >= 0 && currentIndex < vouchersList.length - 1) {
      onSelectVoucher(vouchersList[currentIndex + 1]);
    }
  };

  return (
    <>
      {/* ON-SCREEN MODAL */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto no-print">
        <div className={`w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-6 relative text-slate-100 my-4 transition-all duration-300 ${
          displayMode === 'kiosk' ? 'max-w-2xl' : 'max-w-md'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <span>Student Scan-to-Connect QR</span>
                  {vouchersList.length > 1 && currentIndex >= 0 && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-normal">
                      {currentIndex + 1} of {vouchersList.length}
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-400">Point mobile camera to auto-connect to campus Wi-Fi</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Display mode toggle (Card vs Large Kiosk Mode) */}
              <button
                type="button"
                onClick={() => setDisplayMode(m => m === 'card' ? 'kiosk' : 'card')}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                title={displayMode === 'kiosk' ? 'Switch to Standard Card' : 'Switch to Large Counter/Kiosk Display'}
              >
                {displayMode === 'kiosk' ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                title="Close Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Prev / Next voucher carousel header if list provided */}
          {vouchersList.length > 1 && onSelectVoucher && (
            <div className="flex items-center justify-between py-2 px-1 text-xs text-slate-400">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIndex <= 0}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <span className="font-mono text-emerald-400 font-semibold text-[11px]">
                {voucher.code}
              </span>

              <button
                type="button"
                onClick={handleNext}
                disabled={currentIndex >= vouchersList.length - 1}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* MAIN VOUCHER DISPLAY CARD */}
          <div className={`my-4 bg-white text-slate-950 rounded-2xl shadow-xl border border-slate-200 text-center flex flex-col items-center transition-all ${
            displayMode === 'kiosk' ? 'p-6 sm:p-8' : 'p-5'
          }`}>
            {/* Top School Ribbon */}
            <div className="w-full bg-slate-900 text-white rounded-xl py-2 px-3 mb-4 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2">
                <img
                  src="/school-seal.svg"
                  alt="Annafunan Integrated School"
                  className="w-5 h-5 object-contain"
                />
                <span className="font-bold tracking-wider uppercase font-sans text-xs">
                  Annafunan Integrated School
                </span>
              </div>
              <span className="bg-blue-600 text-white px-2 py-0.5 rounded font-mono text-[10px] font-semibold">
                AIS-Campus-WiFi
              </span>
            </div>

            {/* QR Code Container */}
            <div className={`bg-white border-2 border-slate-200 rounded-2xl shadow-sm flex items-center justify-center relative group ${
              displayMode === 'kiosk' ? 'p-4 min-w-[280px] min-h-[280px]' : 'p-3 min-w-[210px] min-h-[210px]'
            }`}>
              {loading ? (
                <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-2"></div>
                  Generating QR code...
                </div>
              ) : qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`Scan to connect voucher ${voucher.code}`}
                  className={`object-contain rounded-lg transition-transform ${
                    displayMode === 'kiosk' ? 'w-64 h-64 sm:w-72 sm:h-72' : 'w-48 h-48 sm:w-52 sm:h-52'
                  }`}
                />
              ) : (
                <div className="text-red-500 text-xs">Error generating QR code</div>
              )}
            </div>

            {/* Voucher Code Box */}
            <div className="mt-3 w-full bg-blue-50 rounded-xl py-2 px-3 border border-blue-200">
              <span className="text-[9px] text-blue-800 uppercase font-bold tracking-widest block mb-0.5">
                Voucher Authentication Code
              </span>
              <span className={`font-mono font-black text-slate-950 tracking-wider block ${
                displayMode === 'kiosk' ? 'text-2xl sm:text-3xl' : 'text-xl'
              }`}>
                {voucher.code}
              </span>
            </div>

            {/* Specifications Grid */}
            <div className="grid grid-cols-3 gap-2 w-full mt-3 pt-3 border-t border-slate-200 text-[11px] text-slate-600 font-mono">
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                <div className="text-slate-400 text-[9px] uppercase">Access Time</div>
                <div className="font-bold text-slate-900">
                  {voucher.durationMinutes >= 60 ? `${voucher.durationMinutes / 60} Hour(s)` : `${voucher.durationMinutes}m`}
                </div>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                <div className="text-slate-400 text-[9px] uppercase">Speed Limit</div>
                <div className="font-bold text-slate-900">
                  {voucher.speedLimitDownMbps}M / {voucher.speedLimitUpMbps}M
                </div>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                <div className="text-slate-400 text-[9px] uppercase">Data Quota</div>
                <div className="font-bold text-slate-900">
                  {voucher.dataQuotaMB > 0 ? `${voucher.dataQuotaMB} MB` : 'Unlimited'}
                </div>
              </div>
            </div>

            {/* Footer scan instruction banner */}
            <div className="mt-3 w-full bg-emerald-50 rounded-xl py-2 px-3 border border-emerald-200 text-emerald-900 text-left flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="text-[10px] leading-tight font-sans">
                <strong>Instant Auto-Connect:</strong> Open your smartphone camera, scan this QR code, and tap the prompt to immediately connect.
              </p>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <button
              type="button"
              onClick={handlePrintSlip}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition-colors cursor-pointer shadow-sm"
              title="Print voucher slip directly to connected printer"
            >
              <Printer className="w-4 h-4 text-blue-400" />
              <span>Print Slip</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition-colors cursor-pointer shadow-sm"
              title="Copy the auto-login URL to clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <span>{copied ? 'Copied Link' : 'Copy URL'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadQr}
              className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
              title="Save PNG image file of this QR code"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>Save PNG</span>
            </button>
          </div>
        </div>
      </div>

      {/* PRINT-ONLY SECTION (Only visible during window.print()) */}
      <div id="printable-voucher-section" className="hidden">
        <div style={{
          width: '80mm',
          padding: '4mm',
          border: '1.5px dashed #000000',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#000000',
          backgroundColor: '#ffffff',
          textAlign: 'center',
          boxSizing: 'border-box'
        }}>
          {/* Header */}
          <div style={{ borderBottom: '1px solid #000', paddingBottom: '3mm', marginBottom: '3mm' }}>
            <div style={{ fontSize: '11pt', fontWeight: 'bold', textTransform: 'uppercase' }}>
              Annafunan Integrated School
            </div>
            <div style={{ fontSize: '8pt', color: '#333333' }}>
              Campus Wi-Fi Voucher Access Pass
            </div>
          </div>

          {/* Wi-Fi & Gateway info */}
          <div style={{ fontSize: '8pt', marginBottom: '2mm', textAlign: 'left', background: '#f4f4f4', padding: '2mm', borderRadius: '3px' }}>
            <div><strong>Wi-Fi SSID:</strong> AIS-Campus-WiFi</div>
            <div><strong>Gateway:</strong> MikroTik ED50OUG</div>
          </div>

          {/* QR Code */}
          {qrDataUrl && (
            <div style={{ margin: '2mm auto', width: '45mm', height: '45mm' }}>
              <img
                src={qrDataUrl}
                alt={voucher.code}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
          )}

          {/* Voucher Code */}
          <div style={{
            fontSize: '14pt',
            fontWeight: 'bold',
            fontFamily: 'monospace',
            letterSpacing: '1px',
            border: '1.5px solid #000',
            padding: '2mm',
            margin: '2mm 0',
            background: '#ffffff'
          }}>
            {voucher.code}
          </div>

          {/* Specs */}
          <div style={{ fontSize: '8pt', marginBottom: '3mm', display: 'flex', justifyContent: 'space-between', borderTop: '1px dotted #ccc', paddingTop: '2mm' }}>
            <span><strong>Plan:</strong> {voucher.profileLabel}</span>
            <span><strong>Time:</strong> {voucher.durationMinutes >= 60 ? `${voucher.durationMinutes / 60}h` : `${voucher.durationMinutes}m`}</span>
          </div>

          {/* Instructions */}
          <div style={{ fontSize: '7pt', textAlign: 'left', borderTop: '1px solid #000', paddingTop: '2mm', color: '#444' }}>
            <div>1. Connect device to <strong>AIS-Campus-WiFi</strong>.</div>
            <div>2. Open camera &amp; scan QR code or enter code above.</div>
            <div>3. Enjoy high-speed access!</div>
          </div>
        </div>
      </div>
    </>
  );
};
