import React, { useState, useEffect, useRef } from 'react';
import { 
  Wifi, 
  ArrowRight, 
  Shield, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  CheckCircle2,
  QrCode,
  Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ActiveSession, AdminUser } from '../types';
import { QrScannerModal } from './QrScannerModal';

interface PortalLandingProps {
  onAuthenticate: (code: string) => Promise<{ success: boolean; message: string; session?: ActiveSession }>;
  clientInfo: { 
    ip: string; 
    mac: string; 
    gateway: string; 
    ssid: string;
    portalAction?: string;
    portalZone?: string;
  };
  onOpenAdmin: () => void;
  onOpenLabSimulator: () => void;
  isSimulatorActive?: boolean;
  adminUser?: AdminUser | null;
}

export const PortalLanding: React.FC<PortalLandingProps> = ({
  onAuthenticate,
  clientInfo,
  onOpenAdmin,
  onOpenLabSimulator,
  isSimulatorActive,
  adminUser
}) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [qrAutoConnecting, setQrAutoConnecting] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check if user arrived via QR Code scan with URL parameter: ?voucher=... or ?code=...
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlVoucher = params.get('voucher') || params.get('code');
      const mikrotikError = params.get('error');
      if (mikrotikError) {
        setErrorMessage(`MikroTik Notice: ${mikrotikError}`);
      }
      if (urlVoucher) {
        const clean = urlVoucher.trim().toUpperCase();
        setCode(clean);
        setQrAutoConnecting(true);
        setLoading(true);

        onAuthenticate(clean)
          .then((res) => {
            if (!res.success) {
              setErrorMessage(res.message || 'The QR voucher code is invalid or has expired.');
            }
          })
          .catch(() => {
            setErrorMessage('Network gateway timeout. Please check your Wi-Fi signal.');
          })
          .finally(() => {
            setLoading(false);
            setQrAutoConnecting(false);
          });
        return;
      }
    }

    // Auto-focus the single voucher input field
    inputRef.current?.focus();
  }, [onAuthenticate]);

  const handleSubmit = async (e?: React.FormEvent, overrideCode?: string) => {
    if (e) e.preventDefault();
    const raw = (overrideCode || code).trim();
    if (!raw) {
      setErrorMessage('Please enter or scan your voucher code.');
      inputRef.current?.focus();
      return;
    }

    const cleanNoSpaces = raw.replace(/\s+/g, '').toUpperCase();
    const targetCode = cleanNoSpaces;

    // Secret entry: typing ADMIN or MIKROTIK opens the administrator login modal
    if (targetCode === 'ADMIN' || targetCode === 'MIKROTIK' || targetCode === 'ROUTEROS' || targetCode === 'AIS-ADMIN' || targetCode === 'AISADMIN') {
      setCode('');
      onOpenAdmin();
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await onAuthenticate(targetCode);
      if (!res.success) {
        setErrorMessage(res.message || 'Invalid voucher code. Please try again.');
        inputRef.current?.select();
      }
    } catch (err: any) {
      setErrorMessage('Network gateway timeout. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setCode(val);
    if (errorMessage) setErrorMessage(null);
  };

  const handleScanSuccess = (scannedVoucherCode: string) => {
    setCode(scannedVoucherCode);
    setErrorMessage(null);
    handleSubmit(undefined, scannedVoucherCode);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between bg-gradient-to-b from-blue-50/70 via-white to-sky-50/60 text-slate-800 overflow-hidden">
      {/* Background ambient network grid pattern in blue */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, rgba(37, 99, 235, 0.08) 0%, transparent 65%),
            linear-gradient(to right, rgba(37, 99, 235, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(37, 99, 235, 0.04) 1px, transparent 1px)`,
          backgroundSize: '100% 100%, 32px 32px, 32px 32px'
        }}
      />

      {/* School Seal Background Watermark - High visibility with gentle subtle blur */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none z-0">
        <img
          src="/school-seal.svg"
          alt="Annafunan Integrated School Seal"
          referrerPolicy="no-referrer"
          className="w-[380px] h-[380px] sm:w-[540px] sm:h-[540px] max-w-none opacity-45 filter blur-[1.5px] transform scale-105"
        />
      </div>

      {/* Top Bar: School identity & Admin login */}
      <header className="relative z-10 px-6 h-[70px] flex items-center justify-between border-b border-blue-100/80 bg-white/85 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            id="admin-logo-btn"
            onClick={onOpenAdmin}
            className="group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl p-1 transition-transform hover:opacity-90 active:scale-95 z-20"
            title={adminUser ? "Admin logged in (Click to open Admin Console)" : "Admin Access"}
          >
            <img 
              src="/school-seal.svg" 
              alt="Annafunan Integrated School Logo" 
              referrerPolicy="no-referrer" 
              className="w-12 h-12 object-contain drop-shadow-sm shrink-0 transition-transform group-hover:scale-105" 
            />
          </button>
          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-bold text-slate-800 tracking-tight leading-none uppercase">
              Annafunan Integrated School
            </span>
            <span className="text-[10px] text-slate-500 leading-tight">
              Hotspot Gateway &bull; MikroTik hEX ED50UG
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Pre-Deployment Test Simulator Toggle */}
          <button
            type="button"
            onClick={onOpenLabSimulator}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer shadow-sm ${
              isSimulatorActive
                ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
            }`}
            title="Toggle Pre-Deployment Bench Simulator (Test safely without school Wi-Fi)"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isSimulatorActive ? 'Hide Test Bench' : '🧪 Test / Bench Simulator'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenAdmin}
            className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
          >
            {adminUser ? 'Admin Console' : 'Admin Login'}
          </button>
        </div>
      </header>

      {/* Main Single-Input Center Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-lg mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="w-full text-center"
        >
          <h2 id="portal-heading" className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mb-2 uppercase leading-snug">
            ANNAFUNAN INTEGRATED SCHOOL WI-FI VOUCHER CONNECT
          </h2>
          <p id="portal-subtitle" className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
            Enter your Voucher Code
          </p>

          {/* QR Auto-connect banner if scanned via native phone camera */}
          {qrAutoConnecting && (
            <div className="mb-4 p-3 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center justify-center gap-2 animate-pulse">
              <QrCode className="w-4 h-4 text-blue-600" />
              <span>QR Voucher detected (<strong>{code}</strong>). Authenticating session...</span>
            </div>
          )}

          {/* THE SINGLE INPUT BOX FORM */}
          <form onSubmit={handleSubmit} className="w-full relative">
            <div className="relative group">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-500/15 via-sky-400/15 to-blue-500/15 blur-sm opacity-60 group-focus-within:opacity-100 transition duration-300 pointer-events-none" />
              
              <div className="relative flex items-center bg-white border-2 border-blue-200 rounded-2xl p-2 shadow-xl shadow-blue-900/5 transition-all focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-500/10">
                <input
                  ref={inputRef}
                  id="portal-voucher-input"
                  type="text"
                  value={code}
                  onChange={handleInputChange}
                  placeholder="AIS-XXXX-XXXX"
                  disabled={loading}
                  autoComplete="off"
                  spellCheck="false"
                  maxLength={20}
                  className="w-full bg-transparent px-4 py-3.5 text-center text-xl sm:text-2xl font-mono tracking-widest text-slate-900 placeholder:text-slate-400 focus:outline-none uppercase selection:bg-blue-600 selection:text-white"
                />

                <button
                  id="portal-connect-button"
                  type="submit"
                  disabled={loading || !code.trim()}
                  className="shrink-0 h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/25 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span className="hidden sm:inline">Connect</span>
                      <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* In-Portal Camera QR Scanner Launcher */}
            <div className="mt-3 flex items-center justify-center">
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white hover:bg-blue-50 border border-blue-200 hover:border-blue-400 text-blue-700 hover:text-blue-800 text-xs font-medium transition-all shadow-sm cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-blue-600" />
                <span>Scan Voucher QR with Camera</span>
              </button>
            </div>

            {/* Error Message banner */}
            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5 text-left"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span className="flex-1">{errorMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* MikroTik ED50OUG Gateway & Network Status Footnote */}
            <div className="mt-8 pt-4 border-t border-slate-200/80 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-xs text-slate-500 font-mono">
              <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>MikroTik ED50OUG: {clientInfo.gateway || '192.168.88.1'}</span>
              </span>
              <span className="text-slate-300">&bull;</span>
              <span>IP: {clientInfo.ip}</span>
              <span className="text-slate-300">&bull;</span>
              <span>SSID: {clientInfo.ssid}</span>
            </div>

            {clientInfo.portalAction && (
              <div className="mt-2 text-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium">
                  <Shield className="w-3 h-3 text-emerald-600" />
                  MikroTik Hotspot Intercept Active
                </span>
              </div>
            )}
          </form>
        </motion.div>
      </main>

      {/* In-Portal Camera Scanner Modal */}
      <QrScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScanSuccess={handleScanSuccess}
      />
    </div>
  );
};
