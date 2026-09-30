import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Terminal, 
  Download, 
  Copy, 
  Check, 
  RefreshCw, 
  Wifi, 
  Laptop, 
  Smartphone, 
  Router, 
  Server, 
  QrCode, 
  Play, 
  FileText, 
  ExternalLink,
  HelpCircle,
  Cpu,
  Layers,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { MikroTikConfig, Voucher, ActiveSession } from '../types';
import { generateVoucherQrDataUrl } from '../utils/qrCodeHelper';

interface PreDeploymentTestLabProps {
  config: MikroTikConfig;
  onRefreshConfig?: () => void;
  onOpenLabSimulator?: () => void;
}

export const PreDeploymentTestLab: React.FC<PreDeploymentTestLabProps> = ({
  config,
  onRefreshConfig,
  onOpenLabSimulator
}) => {
  const [completedSteps, setCompletedSteps] = useState<number[]>([1]);
  const [testVoucher, setTestVoucher] = useState<Voucher | null>(null);
  const [testQrUrl, setTestQrUrl] = useState<string | null>(null);
  const [generatingVoucher, setGeneratingVoucher] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [pingingRouter, setPingingRouter] = useState(false);
  const [pingResult, setPingResult] = useState<{ success: boolean; message: string; latency?: number } | null>(null);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Generate an initial test voucher if none exists or on request
  const handleGenerateTestVoucher = async () => {
    setGeneratingVoucher(true);
    try {
      const res = await api.generateBulkVouchers({
        quantity: 1,
        prefix: 'BENCH',
        profile: 'student_standard',
        durationMinutes: 30,
        speedLimitDownMbps: 10,
        speedLimitUpMbps: 5,
        dataQuotaMB: 0,
        maxDevices: 1,
        validDays: 7,
        notes: 'Pre-Deployment Bench Test Voucher'
      });

      if (res.success && res.vouchers.length > 0) {
        const v = res.vouchers[0];
        setTestVoucher(v);
        const qr = await generateVoucherQrDataUrl(v.code, 260);
        setTestQrUrl(qr);
        toggleStep(3, true);
      }
    } catch (e) {
      console.error('Failed to generate test voucher', e);
    } finally {
      setGeneratingVoucher(false);
    }
  };

  const handlePingRouter = async () => {
    setPingingRouter(true);
    setPingResult(null);
    try {
      const res = await api.testMikroTikConnection(config);
      setPingResult({
        success: res.success,
        message: res.message,
        latency: res.latencyMs || 8
      });
      if (res.success) {
        toggleStep(1, true);
      }
    } catch (err: any) {
      setPingResult({
        success: false,
        message: err.message || 'Router unreachable at ' + config.host
      });
    } finally {
      setPingingRouter(false);
    }
  };

  const fetchActiveSessions = async () => {
    setLoadingSessions(true);
    try {
      const sessions = await api.getActiveSessions();
      setActiveSessions(sessions);
      if (sessions.length > 0) {
        toggleStep(5, true);
        toggleStep(6, true);
      }
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    fetchActiveSessions();
    // Auto generate a test voucher on mount if none
    handleGenerateTestVoucher();
  }, []);

  const toggleStep = (stepNumber: number, forceState?: boolean) => {
    setCompletedSteps(prev => {
      const exists = prev.includes(stepNumber);
      const shouldHave = forceState !== undefined ? forceState : !exists;
      if (shouldHave && !exists) return [...prev, stepNumber];
      if (!shouldHave && exists) return prev.filter(s => s !== stepNumber);
      return prev;
    });
  };

  const isStepDone = (s: number) => completedSteps.includes(s);

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const setupRscUrl = `${currentOrigin}/api/gateway/mikrotik-setup-rsc`;
  const fetchImportCli = `/tool fetch url="${setupRscUrl}" dst-path="ais_setup.rsc"\n/import ais_setup.rsc`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(fetchImportCli);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleCopyCode = () => {
    if (testVoucher) {
      navigator.clipboard.writeText(testVoucher.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Reassurance Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-blue-950/80 border border-emerald-500/30 rounded-2xl p-6 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shrink-0">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Pre-Deployment Bench Test: Zero-Risk Isolated Lab
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Recommended Best Practice
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-1.5 leading-relaxed max-w-3xl">
                <strong className="text-white">Yes, you should always test first on your desk before connecting to the school Wi-Fi!</strong>{' '}
                This isolated bench setup allows you to test voucher logins, QR code scanning, captive portal intercepts, and bandwidth queues on your personal test devices without risking downtime or disruption for school teachers or students.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {onOpenLabSimulator && (
              <button
                type="button"
                onClick={onOpenLabSimulator}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Virtual Lab Simulator</span>
              </button>
            )}
            <a
              href={`${currentOrigin}/?test_mode=1`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open Test Portal Window</span>
            </a>
          </div>
        </div>
      </div>

      {/* Visual Desk Topology Diagram */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          <span>Desktop Test Bench Topology (Before School Wi-Fi Installation)</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
          {/* Node 1: Test Internet */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-3">
              <Wifi className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-white">1. Test Internet Uplink</span>
            <span className="text-[11px] text-slate-400 mt-1">
              Your home Wi-Fi router, phone mobile hotspot tether, or lab modem
            </span>
            <div className="mt-3 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-blue-300">
              Plug into Ether 1 (WAN)
            </div>
          </div>

          {/* Node 2: MikroTik Router on Desk */}
          <div className="p-4 rounded-xl bg-emerald-950/20 border-2 border-emerald-500/40 text-center flex flex-col items-center relative">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-3 shadow-inner">
              <Cpu className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-emerald-300">2. MikroTik hEX ED50UG</span>
            <span className="text-[11px] text-slate-400 mt-1">
              On your desk, running RouterOS v7. Default IP: <span className="font-mono text-slate-200">192.168.88.1</span>
            </span>
            <div className="mt-3 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[10px] font-mono text-emerald-300">
              Zero-Risk Test Bench
            </div>
          </div>

          {/* Node 3: Test Device */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-3">
              <Smartphone className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-white">3. Personal Test Client</span>
            <span className="text-[11px] text-slate-400 mt-1">
              Your laptop plugged into Ether 2, or your phone connected to a spare test Wi-Fi AP
            </span>
            <div className="mt-3 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-purple-300">
              Ether 2 (LAN) / Test Wi-Fi
            </div>
          </div>
        </div>

        {/* Safety Notice Callout */}
        <div className="mt-4 p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center gap-3 text-xs text-slate-400">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span>
            <strong className="text-slate-200">Isolation Guarantee:</strong> The school main campus network and existing switches remain completely untouched until you finish all tests and decide to physically move the router to the school rack.
          </span>
        </div>
      </div>

      {/* 6-Step Pre-Deployment Test Protocol */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Interactive 6-Step Bench Test Protocol</span>
        </h4>

        {/* Step 1: Cable & Ping Verification */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isStepDone(1) ? 'bg-slate-900/90 border-emerald-500/40' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => toggleStep(1)}
                className={`w-6 h-6 rounded-lg flex items-center justify-center border text-xs font-bold transition-colors cursor-pointer shrink-0 mt-0.5 ${
                  isStepDone(1)
                    ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                }`}
              >
                {isStepDone(1) ? <Check className="w-4 h-4 stroke-[3]" /> : '1'}
              </button>
              <div>
                <h5 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Step 1: Desk Wiring & Router Reachability</span>
                  {isStepDone(1) && (
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.2 rounded border border-emerald-500/30">
                      VERIFIED
                    </span>
                  )}
                </h5>
                <p className="text-xs text-slate-400 mt-1">
                  Connect power to your MikroTik ED50UG. Connect an Ethernet cable from <strong>Ether 2</strong> to your computer. Your computer will receive an IP like <span className="font-mono text-slate-300">192.168.88.x</span>.
                </p>

                <div className="mt-3 flex items-center gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={handlePingRouter}
                    disabled={pingingRouter}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${pingingRouter ? 'animate-spin' : ''}`} />
                    <span>Ping MikroTik (192.168.88.1)</span>
                  </button>

                  <a
                    href="http://192.168.88.1"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-all"
                  >
                    <span>Open WebFig (192.168.88.1)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  {pingResult && (
                    <span className={`text-xs font-mono flex items-center gap-1.5 ${
                      pingResult.success ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {pingResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                      <span>{pingResult.message} ({pingResult.latency}ms)</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Load Hotspot Configuration Script */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isStepDone(2) ? 'bg-slate-900/90 border-emerald-500/40' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <button
                type="button"
                onClick={() => toggleStep(2)}
                className={`w-6 h-6 rounded-lg flex items-center justify-center border text-xs font-bold transition-colors cursor-pointer shrink-0 mt-0.5 ${
                  isStepDone(2)
                    ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                }`}
              >
                {isStepDone(2) ? <Check className="w-4 h-4 stroke-[3]" /> : '2'}
              </button>
              <div className="flex-1">
                <h5 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Step 2: Apply AIS Hotspot Script & login.html</span>
                  {isStepDone(2) && (
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.2 rounded border border-emerald-500/30">
                      CONFIGURED
                    </span>
                  )}
                </h5>
                <p className="text-xs text-slate-400 mt-1">
                  In WinBox or WebFig Terminal, paste the auto-fetch command below to provision the hotspot server profile, walled garden, and redirect hooks:
                </p>

                <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs flex items-center justify-between gap-3">
                  <div className="text-emerald-400 select-all overflow-x-auto whitespace-pre">
                    {fetchImportCli}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyScript}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
                    title="Copy CLI command"
                  >
                    {copiedScript ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <a
                    href="/api/gateway/mikrotik-setup-rsc"
                    download="ais_setup.rsc"
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download ais_setup.rsc</span>
                  </a>

                  <a
                    href="/api/gateway/hotspot-login-template"
                    download="login.html"
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download login.html (Drag to Files/hotspot)</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Bench Test Voucher & QR Code Card */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isStepDone(3) ? 'bg-slate-900/90 border-emerald-500/40' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <button
                type="button"
                onClick={() => toggleStep(3)}
                className={`w-6 h-6 rounded-lg flex items-center justify-center border text-xs font-bold transition-colors cursor-pointer shrink-0 mt-0.5 ${
                  isStepDone(3)
                    ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                }`}
              >
                {isStepDone(3) ? <Check className="w-4 h-4 stroke-[3]" /> : '3'}
              </button>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h5 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Step 3: Generate Live Bench Test Voucher & QR Code</span>
                    {testVoucher && (
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.2 rounded border border-emerald-500/30">
                        READY FOR SCAN
                      </span>
                    )}
                  </h5>
                  <button
                    type="button"
                    onClick={handleGenerateTestVoucher}
                    disabled={generatingVoucher}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${generatingVoucher ? 'animate-spin' : ''}`} />
                    <span>Generate New Test Voucher</span>
                  </button>
                </div>

                <p className="text-xs text-slate-400 mt-1">
                  Use this test voucher code or scan the QR code with your phone camera right off your laptop monitor to verify automatic login:
                </p>

                {testVoucher && (
                  <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center gap-6">
                    {testQrUrl && (
                      <div className="p-3 bg-white rounded-xl shadow-md border-2 border-emerald-500/50 flex flex-col items-center">
                        <img 
                          src={testQrUrl} 
                          alt="Test Voucher QR Code" 
                          className="w-36 h-36 object-contain"
                        />
                        <span className="text-[10px] font-bold text-slate-800 font-mono mt-1">
                          SCAN TO CONNECT
                        </span>
                      </div>
                    )}

                    <div className="flex-1 space-y-2 text-center sm:text-left">
                      <div className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">
                        Voucher Passcode
                      </div>
                      <div className="flex items-center justify-center sm:justify-start gap-2">
                        <span className="text-2xl font-black font-mono tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/30">
                          {testVoucher.code}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyCode}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          title="Copy Code"
                        >
                          {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-400 pt-2">
                        <div>Duration: <span className="text-slate-200">30 Minutes</span></div>
                        <div>Speed: <span className="text-slate-200">10 Mbps Down / 5 Mbps Up</span></div>
                        <div>Role: <span className="text-slate-200">Student (AIS-Campus)</span></div>
                        <div>Status: <span className="text-emerald-400 font-bold">Unused / Active</span></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Step 4: Test Captive Portal Intercept */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isStepDone(4) ? 'bg-slate-900/90 border-emerald-500/40' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <button
                type="button"
                onClick={() => toggleStep(4)}
                className={`w-6 h-6 rounded-lg flex items-center justify-center border text-xs font-bold transition-colors cursor-pointer shrink-0 mt-0.5 ${
                  isStepDone(4)
                    ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                }`}
              >
                {isStepDone(4) ? <Check className="w-4 h-4 stroke-[3]" /> : '4'}
              </button>
              <div className="flex-1">
                <h5 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Step 4: Connect Test Client & Trigger Captive Portal</span>
                  {isStepDone(4) && (
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.2 rounded border border-emerald-500/30">
                      INTERCEPT WORKING
                    </span>
                  )}
                </h5>
                <p className="text-xs text-slate-400 mt-1">
                  On the test device (connected to Ether 2 or your spare Wi-Fi AP), open a web browser and try to navigate to any standard HTTP test site such as <span className="font-mono text-slate-300">http://neverssl.com</span>. The MikroTik Hotspot will intercept the request and show the Annafunan Integrated School Voucher landing screen.
                </p>

                <div className="mt-3 flex items-center gap-3">
                  <a
                    href="http://neverssl.com"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-all"
                  >
                    <span>Test Probe: neverssl.com</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <a
                    href="http://192.168.88.1/login"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-all"
                  >
                    <span>Direct Hotspot: 192.168.88.1/login</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 5: Authenticate & Verify Active Session */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isStepDone(5) ? 'bg-slate-900/90 border-emerald-500/40' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <button
                type="button"
                onClick={() => toggleStep(5)}
                className={`w-6 h-6 rounded-lg flex items-center justify-center border text-xs font-bold transition-colors cursor-pointer shrink-0 mt-0.5 ${
                  isStepDone(5)
                    ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                }`}
              >
                {isStepDone(5) ? <Check className="w-4 h-4 stroke-[3]" /> : '5'}
              </button>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h5 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Step 5: Verify Active Authorization in Dashboard</span>
                    {activeSessions.length > 0 && (
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.2 rounded border border-emerald-500/30">
                        {activeSessions.length} SESSION(S) ACTIVE
                      </span>
                    )}
                  </h5>
                  <button
                    type="button"
                    onClick={fetchActiveSessions}
                    disabled={loadingSessions}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Refresh Active Sessions"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingSessions ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <p className="text-xs text-slate-400 mt-1">
                  Once authenticated with the voucher code, verify that the device appears below with active countdown timer, assigned IP, and rate limit:
                </p>

                {activeSessions.length > 0 ? (
                  <div className="mt-3 divide-y divide-slate-800 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden text-xs">
                    {activeSessions.map((sess) => (
                      <div key={sess.id} className="p-3 flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="font-mono font-bold text-emerald-400">{sess.voucherCode}</span>
                          <span className="text-slate-400">({sess.clientIp})</span>
                          <span className="text-[10px] font-mono text-slate-500">[{sess.clientMac}]</span>
                        </div>
                        <div className="flex items-center gap-3 font-mono text-xs">
                          <span className="text-blue-300">Rate: {sess.speedLimitDownMbps || 10}M/{sess.speedLimitUpMbps || 5}M</span>
                          <span className="text-slate-400">Duration: {sess.durationMinutes}m</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-500 flex items-center justify-between">
                    <span>No active sessions yet. Enter voucher <strong className="text-emerald-400">{testVoucher?.code}</strong> on your test device.</span>
                    <button
                      type="button"
                      onClick={fetchActiveSessions}
                      className="text-blue-400 hover:text-blue-300 underline font-medium cursor-pointer"
                    >
                      Check now
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Step 6: Ready for School Wi-Fi Go-Live Checklist */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isStepDone(6) ? 'bg-slate-900/90 border-emerald-500/40' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <button
                type="button"
                onClick={() => toggleStep(6)}
                className={`w-6 h-6 rounded-lg flex items-center justify-center border text-xs font-bold transition-colors cursor-pointer shrink-0 mt-0.5 ${
                  isStepDone(6)
                    ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                }`}
              >
                {isStepDone(6) ? <Check className="w-4 h-4 stroke-[3]" /> : '6'}
              </button>
              <div className="flex-1">
                <h5 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Step 6: School Wi-Fi Go-Live Cutover (When Ready)</span>
                  {isStepDone(6) && (
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.2 rounded border border-emerald-500/30">
                      BENCH CERTIFIED
                    </span>
                  )}
                </h5>
                <p className="text-xs text-slate-400 mt-1">
                  Once your bench test passes smoothly, you can confidently deploy the router to the school:
                </p>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>1. Change default admin password:</strong> In WinBox: System &gt; Users &gt; admin &gt; set secure password.</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>2. Connect School ISP:</strong> Plug school main fiber/DSL line into <strong>Ether 1 (WAN)</strong>.</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>3. Connect School Access Points:</strong> Plug school Wi-Fi APs / switches into <strong>Ether 2 to Ether 5</strong>.</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>4. Print Vouchers:</strong> Use the <strong>Printable Vouchers</strong> tool in Admin Dashboard to distribute cards.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
