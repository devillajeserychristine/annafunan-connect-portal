import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Wifi, 
  Clock, 
  ArrowUpRight, 
  Download, 
  Upload, 
  LogOut, 
  ExternalLink, 
  ShieldCheck, 
  Gauge, 
  Activity,
  AlertTriangle
} from 'lucide-react';
import { motion } from 'motion/react';
import { ActiveSession, AdminUser } from '../types';

interface ConnectedStatusProps {
  session: ActiveSession;
  onDisconnect: () => Promise<void>;
  redirUrl?: string;
  onOpenAdmin: () => void;
  adminUser?: AdminUser | null;
}

export const ConnectedStatus: React.FC<ConnectedStatusProps> = ({
  session,
  onDisconnect,
  redirUrl,
  onOpenAdmin,
  adminUser,
}) => {
  const [remainingSec, setRemainingSec] = useState(session.remainingSeconds);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    setRemainingSec(session.remainingSeconds);
    const interval = setInterval(() => {
      setRemainingSec((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [session.remainingSeconds]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
    }
    return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
  };

  const handleDisconnect = async () => {
    if (confirm('Are you sure you want to disconnect? Your remaining voucher balance will be preserved.')) {
      setDisconnecting(true);
      try {
        await onDisconnect();
      } finally {
        setDisconnecting(false);
      }
    }
  };

  const destination = redirUrl || 'https://www.google.com';
  const totalMB = Math.round(((session.bytesIn + session.bytesOut) / (1024 * 1024)) * 10) / 10;
  const quotaPercent = session.dataQuotaMB > 0 
    ? Math.min(100, Math.round((totalMB / session.dataQuotaMB) * 100)) 
    : 0;

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between bg-gradient-to-b from-blue-50/70 via-white to-sky-50/60 text-slate-800 overflow-hidden">
      {/* Background ambient network grid in blue */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 30%, rgba(37, 99, 235, 0.12) 0%, transparent 70%),
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

      {/* Header */}
      <header className="relative z-10 px-6 h-[70px] flex items-center justify-between border-b border-blue-100/80 bg-white/85 backdrop-blur-md">
        <button
          type="button"
          id="connected-admin-logo-btn"
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
      </header>

      {/* Main Status Container */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full bg-white border border-blue-200/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-blue-900/10 backdrop-blur-xl"
        >
          {/* Status Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 mb-4 shadow-md shadow-blue-500/10">
              <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Internet Access Authorized
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              Voucher: <strong className="text-blue-700 font-semibold">{session.voucherCode}</strong> ({session.profileLabel})
            </p>
          </div>

          {/* Real-time Countdown Timer Block */}
          <div className="bg-blue-50/60 border border-blue-200/70 rounded-2xl p-5 mb-6 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-blue-700 font-semibold mb-1">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>REMAINING ACCESS TIME</span>
            </div>
            <div className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-blue-950">
              {formatTime(remainingSec)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Session expires at {new Date(session.expiresAt).toLocaleTimeString()}
            </p>
          </div>

          {/* Network Telemetry Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-blue-50/40 border border-blue-100 rounded-xl p-3">
              <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-1">
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Downloaded</span>
              </div>
              <div className="text-sm font-semibold font-mono text-slate-900">
                {(session.bytesIn / (1024 * 1024)).toFixed(1)} MB
              </div>
            </div>

            <div className="bg-blue-50/40 border border-blue-100 rounded-xl p-3">
              <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-1">
                <Upload className="w-3.5 h-3.5 text-sky-600" />
                <span>Uploaded</span>
              </div>
              <div className="text-sm font-semibold font-mono text-slate-900">
                {(session.bytesOut / (1024 * 1024)).toFixed(1)} MB
              </div>
            </div>

            <div className="bg-blue-50/40 border border-blue-100 rounded-xl p-3">
              <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-1">
                <Gauge className="w-3.5 h-3.5 text-indigo-600" />
                <span>Bandwidth</span>
              </div>
              <div className="text-sm font-semibold font-mono text-slate-900">
                {session.speedLimitDownMbps}M / {session.speedLimitUpMbps}M
              </div>
            </div>

            <div className="bg-blue-50/40 border border-blue-100 rounded-xl p-3">
              <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-1">
                <Activity className="w-3.5 h-3.5 text-amber-600" />
                <span>Latency</span>
              </div>
              <div className="text-sm font-semibold font-mono text-slate-900">
                {session.latencyMs} ms
              </div>
            </div>
          </div>

          {/* Quota Progress if enabled */}
          {session.dataQuotaMB > 0 && (
            <div className="mb-6 bg-blue-50/40 border border-blue-100 rounded-xl p-3">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-600">Data Quota Consumed</span>
                <span className="font-mono text-slate-800">{totalMB} MB / {session.dataQuotaMB} MB ({quotaPercent}%)</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${
                    quotaPercent > 85 ? 'bg-red-500' : quotaPercent > 60 ? 'bg-amber-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${quotaPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Client Device Details */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 text-xs text-slate-600 font-mono mb-6 space-y-1">
            <div className="flex justify-between">
              <span>Client IP:</span>
              <span className="text-slate-900 font-semibold">{session.clientIp}</span>
            </div>
            <div className="flex justify-between">
              <span>MAC Address:</span>
              <span className="text-slate-900 font-semibold">{session.clientMac}</span>
            </div>
            <div className="flex justify-between">
              <span>Device Name:</span>
              <span className="text-slate-900 font-semibold">{session.hostname || 'Mobile Device'}</span>
            </div>
            <div className="flex justify-between">
              <span>Firewall Pass-through:</span>
              <span className="text-blue-700 font-semibold">ACTIVE (MikroTik RouterOS pass)</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              id="btn-continue-browsing"
              href={destination}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/25"
            >
              <span>Continue Browsing</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              id="btn-disconnect-session"
              type="button"
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="py-3 px-4 rounded-xl bg-white hover:bg-red-50 text-slate-700 hover:text-red-700 hover:border-red-200 font-medium text-sm flex items-center justify-center gap-2 transition-all border border-slate-200 shadow-xs"
            >
              <LogOut className="w-4 h-4" />
              <span>{disconnecting ? 'Disconnecting...' : 'Disconnect'}</span>
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};
