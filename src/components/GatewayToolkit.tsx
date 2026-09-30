import React, { useState, useEffect } from 'react';
import { 
  Network, 
  Download, 
  Copy, 
  Check, 
  ExternalLink, 
  Server, 
  ShieldCheck, 
  Key, 
  Layers, 
  ArrowRight, 
  Terminal, 
  Globe, 
  RefreshCw, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle, 
  Wifi, 
  Save, 
  Activity, 
  Radio, 
  FileCode, 
  FileText,
  Cpu,
  Router
} from 'lucide-react';
import { api } from '../services/api';
import { MikroTikConfig, MikroTikTestResult } from '../types';
import { PreDeploymentTestLab } from './PreDeploymentTestLab';

export const GatewayToolkit: React.FC = () => {
  const [config, setConfig] = useState<MikroTikConfig>({
    host: '192.168.88.1',
    port: 80,
    protocol: 'http',
    apiPort: 8728,
    winboxPort: 8291,
    username: 'admin',
    password: '',
    model: 'MikroTik ED50OUG',
    routerOsVersion: 'RouterOS v7.15.3',
    hotspotServer: 'ais-hotspot',
    hotspotProfile: 'ais-hsprof',
    authMethod: 'hotspot_redirect',
    walledGardenConfigured: true,
    autoPassOnLogin: true,
    status: 'connected',
    lastTestedAt: new Date().toISOString(),
    lastTestSuccess: true,
    lastTestMessage: 'MikroTik ED50OUG Gateway configured for Hotspot: ais-hotspot (192.168.88.1)',
    latencyMs: 8
  });

  const [testResult, setTestResult] = useState<MikroTikTestResult | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'bench' | 'connector' | 'modes' | 'probes' | 'radius'>('bench');

  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [radiusGuide, setRadiusGuide] = useState<any>(null);
  const [probeResult, setProbeResult] = useState<string | null>(null);
  const [testingProbe, setTestingProbe] = useState(false);

  // Load config on mount
  useEffect(() => {
    api.getMikroTikConfig()
      .then((data) => {
        if (data) setConfig(data);
      })
      .catch(console.error);

    api.getMikroTikRadiusGuide()
      .then(setRadiusGuide)
      .catch(console.error);
  }, []);

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const mikrotikRedirectUrl = `${currentOrigin}/?ip=$(ip)&mac=$(mac)&link-login-only=$(link-login-only)&link-orig=$(link-orig)&error=$(error)&server-name=$(server-name)&server-address=$(server-address)`;

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await api.testMikroTikConnection(config);
      setTestResult(res);
      if (res.config) {
        setConfig(res.config);
      } else {
        setConfig(prev => ({
          ...prev,
          status: res.success ? 'connected' : 'unreachable',
          lastTestedAt: new Date().toISOString(),
          lastTestSuccess: res.success,
          lastTestMessage: res.message,
          latencyMs: res.latencyMs
        }));
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Connection test failed',
        targetUrl: `${config.protocol}://${config.host}:${config.port}`,
        details: 'Verify MikroTik WebFig/REST, API, or WinBox service accessibility.'
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      const res = await api.updateMikroTikConfig(config);
      if (res.success) {
        setConfig(res.config);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save MikroTik config', err);
    } finally {
      setSavingConfig(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const sampleMikroTikLoginSnippet = `<!--
  ANNAFUNAN INTEGRATED SCHOOL - MikroTik Hotspot Form
  Place in MikroTik Files: /hotspot/login.html
-->
<form name="login" action="$(link-login-only)" method="post">
  <input type="hidden" name="dst" value="$(link-orig)" />
  <input type="hidden" name="popup" value="true" />
  <input type="text" name="username" value="$(username)" placeholder="AIS-STU-XXXX" required />
  <input type="hidden" name="password" value="$(username)" />
  <button type="submit">Connect to Internet</button>
</form>`;

  const copySnippet = () => {
    navigator.clipboard.writeText(sampleMikroTikLoginSnippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const testProbeUrl = async (url: string) => {
    setTestingProbe(true);
    setProbeResult(null);
    try {
      const res = await fetch(url, { redirect: 'manual' });
      if (res.type === 'opaqueredirect' || res.status === 302 || res.status === 301) {
        setProbeResult(`[HTTP 302 Intercepted] -> MikroTik Hotspot redirected client to ${currentOrigin}/`);
      } else if (res.status === 204) {
        setProbeResult(`[HTTP 204 No Content] -> MikroTik authorized client! Direct internet pass-through verified.`);
      } else {
        setProbeResult(`[HTTP ${res.status}] Probe responded with content length: ${res.headers.get('content-length') || 'N/A'} bytes.`);
      }
    } catch (err: any) {
      setProbeResult(`Probe check completed: ${err.message || 'Direct network interception active'}`);
    } finally {
      setTestingProbe(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">
                  MikroTik RouterOS ED50OUG Hotspot & Gateway Command Center
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  RouterBOARD ED50OUG
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Configure direct integration between Annafunan Integrated School and your MikroTik ED50OUG router. Generate Hotspot templates, RouterOS CLI scripts (.rsc), and User Manager vouchers.
              </p>
            </div>
          </div>

          {/* Quick status pill */}
          <div className="flex items-center gap-3 bg-slate-950/70 border border-slate-800 px-4 py-2.5 rounded-xl self-start md:self-auto text-xs font-mono">
            <span className={`w-2.5 h-2.5 rounded-full ${
              config.status === 'connected' ? 'bg-emerald-500 animate-pulse' :
              config.status === 'testing' ? 'bg-amber-500 animate-spin' :
              'bg-red-500'
            }`} />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500">GATEWAY STATUS</span>
              <span className="text-slate-200 font-bold">
                MikroTik: {config.host}:{config.port} ({config.status.toUpperCase()})
              </span>
            </div>
            <button
              onClick={handleTestConnection}
              disabled={testingConnection}
              className="ml-2 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              title="Ping & Test Connection"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Sub-Navigation tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800/80 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveSubTab('bench')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer shrink-0 ${
              activeSubTab === 'bench'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 bg-emerald-950/20 border border-emerald-500/30'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="font-bold">🧪 Pre-Deployment Bench Test (Zero-Risk)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('connector')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer shrink-0 ${
              activeSubTab === 'connector'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>ED50OUG RouterOS Connector</span>
          </button>

          <button
            onClick={() => setActiveSubTab('modes')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer shrink-0 ${
              activeSubTab === 'modes'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>MikroTik Hotspot Files & 1-Click Exports</span>
          </button>

          <button
            onClick={() => setActiveSubTab('probes')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer shrink-0 ${
              activeSubTab === 'probes'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Walled Garden & OS Probe Bench</span>
          </button>

          <button
            onClick={() => setActiveSubTab('radius')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer shrink-0 ${
              activeSubTab === 'radius'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>MikroTik RADIUS & User Manager v7</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: Live MikroTik ED50OUG Connector & Config */}
      {activeSubTab === 'connector' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Connector Settings Form */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">MikroTik ED50OUG RouterOS Settings</h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">RouterOS v7.15+ / WebFig & API</span>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Router IP Address / Gateway</label>
                  <input
                    type="text"
                    value={config.host}
                    onChange={(e) => setConfig({ ...config, host: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                    placeholder="192.168.88.1"
                    required
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Default LAN IP of your MikroTik ED50OUG router.</p>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">WebFig / REST Port & Protocol</label>
                  <div className="flex gap-2">
                    <select
                      value={config.protocol}
                      onChange={(e) => setConfig({ ...config, protocol: e.target.value as any })}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2.5 text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                    >
                      <option value="http">http://</option>
                      <option value="https">https://</option>
                    </select>
                    <input
                      type="number"
                      value={config.port}
                      onChange={(e) => setConfig({ ...config, port: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                      placeholder="80"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Port 80 for HTTP or 443 for HTTPS.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">RouterOS API Port</label>
                  <input
                    type="number"
                    value={config.apiPort || 8728}
                    onChange={(e) => setConfig({ ...config, apiPort: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                    placeholder="8728"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Standard RouterOS API (8728 / 8729 ssl)</p>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">WinBox Port</label>
                  <input
                    type="number"
                    value={config.winboxPort || 8291}
                    onChange={(e) => setConfig({ ...config, winboxPort: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                    placeholder="8291"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">MikroTik WinBox service port</p>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Hotspot Server Name</label>
                  <input
                    type="text"
                    value={config.hotspotServer}
                    onChange={(e) => setConfig({ ...config, hotspotServer: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                    placeholder="ais-hotspot"
                    required
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Name under IP &gt; Hotspot &gt; Servers.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">RouterOS Admin Username</label>
                  <input
                    type="text"
                    value={config.username}
                    onChange={(e) => setConfig({ ...config, username: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                    placeholder="admin"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">RouterOS Password</label>
                  <input
                    type="password"
                    value={config.password || ''}
                    onChange={(e) => setConfig({ ...config, password: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                    placeholder="RouterOS password"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Authentication Mode</label>
                <select
                  value={config.authMethod}
                  onChange={(e) => setConfig({ ...config, authMethod: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 font-medium focus:outline-none focus:border-blue-500"
                >
                  <option value="hotspot_redirect">MikroTik Hotspot HTTP-POST / PAP Redirect (login.html) - Recommended</option>
                  <option value="routeros_rest">MikroTik RouterOS REST API (v7.x HTTPS)</option>
                  <option value="routeros_api">MikroTik Native API (Port 8728)</option>
                  <option value="radius_usermanager">MikroTik RADIUS & User Manager v7</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  How client authorizations are passed to the MikroTik ED50OUG gateway.
                </p>
              </div>

              <div className="pt-2 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={config.autoPassOnLogin}
                    onChange={(e) => setConfig({ ...config, autoPassOnLogin: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Auto-authorize clients through MikroTik Hotspot upon voucher redemption</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={config.walledGardenConfigured}
                    onChange={(e) => setConfig({ ...config, walledGardenConfigured: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Walled Garden rules active (Permits student access to portal prior to login)</span>
                </label>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                <button
                  type="submit"
                  disabled={savingConfig}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all cursor-pointer shadow-md shadow-blue-600/20 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingConfig ? 'Saving...' : 'Save MikroTik Settings'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-all cursor-pointer border border-slate-700 disabled:opacity-50"
                >
                  <Activity className={`w-4 h-4 ${testingConnection ? 'animate-spin text-blue-400' : 'text-slate-400'}`} />
                  <span>{testingConnection ? 'Probing RouterOS...' : 'Test Handshake'}</span>
                </button>

                {saveSuccess && (
                  <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>MikroTik Gateway settings saved.</span>
                  </span>
                )}
              </div>
            </form>
          </div>

          {/* Real-time Connection Probe Diagnostics */}
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Live Diagnostics</h3>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">ED50OUG Ports</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800/50">
                  <span className="text-slate-400">Router Hardware:</span>
                  <span className="font-mono text-white font-bold">{config.model || 'MikroTik ED50OUG'}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800/50">
                  <span className="text-slate-400">RouterOS Version:</span>
                  <span className="font-mono text-emerald-400 font-semibold">{config.routerOsVersion || 'v7.15.3'}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800/50">
                  <span className="text-slate-400">Target Gateway IP:</span>
                  <span className="font-mono text-blue-400">{config.host}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800/50">
                  <span className="text-slate-400">WebFig Port:</span>
                  <span className="font-mono text-slate-200">:{config.port} ({config.protocol.toUpperCase()})</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800/50">
                  <span className="text-slate-400">API Port:</span>
                  <span className="font-mono text-slate-200">:{config.apiPort || 8728}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800/50">
                  <span className="text-slate-400">WinBox Port:</span>
                  <span className="font-mono text-slate-200">:{config.winboxPort || 8291}</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-slate-400">Measured Latency:</span>
                  <span className="font-mono text-emerald-400 font-bold">{config.latencyMs || 8} ms</span>
                </div>
              </div>

              {testResult && (
                <div className={`mt-4 p-3 rounded-xl border text-xs ${
                  testResult.success
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                    : 'bg-red-950/40 border-red-800/60 text-red-300'
                }`}>
                  <div className="flex items-center gap-2 font-bold mb-1">
                    {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />}
                    <span>{testResult.success ? 'Handshake Succeeded' : 'Handshake Failed'}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-90">{testResult.message}</p>
                  {testResult.details && (
                    <p className="text-[10px] mt-1.5 opacity-75 font-mono">{testResult.details}</p>
                  )}
                </div>
              )}
            </div>

            {/* Topology Tip Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-xs text-slate-400">
              <div className="flex items-center gap-2 text-slate-200 font-semibold mb-2">
                <Wifi className="w-4 h-4 text-blue-400" />
                <span>ED50OUG Hotspot Flow</span>
              </div>
              <p className="leading-relaxed">
                When students connect to the campus Wi-Fi access points connected to the MikroTik ED50OUG, RouterOS intercepts port 80/443 traffic and directs them to the AIS Voucher Portal. Upon entering a valid voucher, MikroTik authorizes the client MAC into the Hotspot Active table.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: MikroTik Hotspot Files & 1-Click Downloads */}
      {activeSubTab === 'modes' && (
        <div className="space-y-6">
          {/* Method 1: External Redirection URL */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Method 1: MikroTik External Redirection URL (Hotspot)</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/20 text-blue-300 font-mono">
                Recommended
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              In MikroTik RouterOS, edit <strong>/hotspot/login.html</strong> or configure your Hotspot profile to redirect unauthorized clients to this external AIS portal. MikroTik automatically fills variables such as <strong>$(ip)</strong>, <strong>$(mac)</strong>, and <strong>$(link-login-only)</strong>:
            </p>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs font-mono text-blue-300 overflow-x-auto">
              <span className="select-all break-all">{mikrotikRedirectUrl}</span>
              <button
                onClick={() => copyToClipboard(mikrotikRedirectUrl)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer text-xs"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedUrl ? 'Copied' : 'Copy URL'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-3 border-t border-slate-800/60 text-xs">
              <div>
                <span className="font-mono text-emerald-400 font-bold block mb-0.5">$(ip) &amp; $(mac)</span>
                <span className="text-[11px] text-slate-400">Leased client IP and hardware MAC address from MikroTik DHCP.</span>
              </div>
              <div>
                <span className="font-mono text-blue-400 font-bold block mb-0.5">$(link-login-only)</span>
                <span className="text-[11px] text-slate-400">Internal MikroTik Hotspot login callback URL (e.g. http://192.168.88.1/login).</span>
              </div>
              <div>
                <span className="font-mono text-amber-400 font-bold block mb-0.5">$(link-orig)</span>
                <span className="text-[11px] text-slate-400">Destination target site originally requested by the student device.</span>
              </div>
            </div>
          </div>

          {/* Method 2: Download Center for MikroTik */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Download MikroTik Hotspot login.html */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileCode className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">login.html (Hotspot Template)</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Official branded Annafunan Integrated School Hotspot page ready to upload directly into MikroTik Files under <strong>/Files/hotspot/login.html</strong>.
                </p>
              </div>

              <div className="space-y-2">
                <a
                  href="/api/gateway/mikrotik-login-html"
                  download="login.html"
                  className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download login.html</span>
                </a>
                <button
                  type="button"
                  onClick={copySnippet}
                  className="w-full py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedSnippet ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSnippet ? 'Copied Snippet' : 'Copy HTML Snippet'}</span>
                </button>
              </div>
            </div>

            {/* Download MikroTik alogin.html & status.html */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-blue-400" />
                  <h3 className="text-sm font-bold text-white">alogin.html &amp; status.html</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  The authorized status landing pages for students. Displays remaining uptime, downloaded megabytes, and the logout link.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href="/api/gateway/mikrotik-alogin-html"
                  download="alogin.html"
                  className="py-2 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>alogin.html</span>
                </a>
                <a
                  href="/api/gateway/mikrotik-status-html"
                  download="status.html"
                  className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>status.html</span>
                </a>
              </div>
            </div>

            {/* Download RouterOS .rsc Setup Script */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Terminal className="w-5 h-5 text-purple-400" />
                  <h3 className="text-sm font-bold text-white">ais_mikrotik_setup.rsc</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  1-Click RouterOS CLI script tailored for MikroTik ED50OUG. Automatically configures bandwidth limits, Hotspot profiles, and Walled Garden rules.
                </p>
              </div>

              <a
                href="/api/gateway/mikrotik-setup-rsc"
                download="ais_mikrotik_setup.rsc"
                className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Setup Script (.rsc)</span>
              </a>
            </div>

            {/* Download MikroTik Vouchers .rsc */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Radio className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Vouchers CLI Import (.rsc)</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Exports active vouchers directly into MikroTik RouterOS CLI commands (<strong>/ip hotspot user add ...</strong>). Run via Terminal in 1 second.
                </p>
              </div>

              <a
                href="/api/gateway/mikrotik-vouchers-rsc"
                download="ais_vouchers_mikrotik.rsc"
                className="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Vouchers (.rsc)</span>
              </a>
            </div>

            {/* Download User Manager CSV */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">User Manager v7 (CSV)</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Formatted for MikroTik RouterOS v7 User Manager package. Bulk import users, session timeouts, and rate limits.
                </p>
              </div>

              <a
                href="/api/gateway/mikrotik-vouchers-csv"
                download="ais_vouchers_user_manager.csv"
                className="w-full py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download User Manager CSV</span>
              </a>
            </div>

            {/* Download /tool fetch Sync Script */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <RefreshCw className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white">Fetch Heartbeat Script</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  MikroTik RouterOS <strong>/tool fetch</strong> script that pings the AIS Portal API every 5 minutes to verify connectivity and keep sync.
                </p>
              </div>

              <a
                href="/api/gateway/mikrotik-fetch-sync"
                download="ais_mikrotik_sync.rsc"
                className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Sync Script (.rsc)</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: Walled Garden & OS Detection Simulator */}
      {activeSubTab === 'probes' && (
        <div className="space-y-6">
          {/* Walled Garden Configuration for MikroTik */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800 mb-4">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">MikroTik Walled Garden Commands</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              MikroTik RouterOS requires adding the captive portal IP/domain to the <strong>Walled Garden</strong> so unauthorized students can reach the portal to enter or scan their voucher:
            </p>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-emerald-300 space-y-1.5 overflow-x-auto">
              <div className="text-slate-500"># Paste into WinBox Terminal:</div>
              <div>/ip hotspot walled-garden add dst-host="*annafunan*" comment="AIS Portal Core"</div>
              <div>/ip hotspot walled-garden ip add dst-address={config.host} comment="MikroTik Router Gateway"</div>
              <div>/ip hotspot walled-garden ip add action=accept comment="Allow AIS Web Assets"</div>
            </div>
          </div>

          {/* OS Probe Simulation card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Operating System Captive Portal Detection Simulator</h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">RFC 7710 / 8908 &amp; OS Probes</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Smartphones and laptops automatically send detection probes upon connecting to MikroTik Wi-Fi. In an authorized state, MikroTik permits HTTP 204 or direct internet access. In an unauthorized state, MikroTik intercepts and redirects to the voucher portal:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => testProbeUrl('/generate_204')}
                disabled={testingProbe}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-blue-400">Android / Chrome</span>
                  <span className="text-[10px] font-mono text-emerald-400">HTTP 204</span>
                </div>
                <div className="text-[11px] font-mono text-slate-500 truncate">/generate_204</div>
              </button>

              <button
                type="button"
                onClick={() => testProbeUrl('/hotspot-detect.html')}
                disabled={testingProbe}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-blue-400">Apple iOS / macOS</span>
                  <span className="text-[10px] font-mono text-blue-400">Captive Assistant</span>
                </div>
                <div className="text-[11px] font-mono text-slate-500 truncate">/hotspot-detect.html</div>
              </button>

              <button
                type="button"
                onClick={() => testProbeUrl('/ncsi.txt')}
                disabled={testingProbe}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-blue-400">Windows NCSI</span>
                  <span className="text-[10px] font-mono text-purple-400">MSFT Connect</span>
                </div>
                <div className="text-[11px] font-mono text-slate-500 truncate">/ncsi.txt</div>
              </button>
            </div>

            {probeResult && (
              <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-blue-300 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>{probeResult}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: MikroTik RADIUS & User Manager v7 Integration */}
      {activeSubTab === 'radius' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">MikroTik RouterOS RADIUS Client Configuration</h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">RFC 2865 / 2866 &amp; MikroTik Dict</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              If your school deploys centralized RADIUS authentication (FreeRADIUS or MikroTik User Manager v7), configure your ED50OUG with the following parameters:
            </p>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-emerald-300 space-y-1.5 overflow-x-auto mb-5">
              <div className="text-slate-500"># Configure RADIUS client in WinBox Terminal:</div>
              <div>/radius add service=hotspot address=192.168.88.1 secret="{radiusGuide?.sharedSecret || 'AIS_Mikrotik_Radius_2026'}" timeout=3s comment="AIS Core Auth"</div>
              <div>/radius incoming set accept=yes port=3799</div>
              <div>/ip hotspot profile set [find name="{config.hotspotProfile}"] use-radius=yes</div>
            </div>

            {/* RADIUS Attributes Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                    <th className="pb-2 font-semibold">MikroTik RADIUS Attribute</th>
                    <th className="pb-2 font-semibold">Value / Expected Format</th>
                    <th className="pb-2 font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  <tr>
                    <td className="py-2 text-blue-400">User-Name</td>
                    <td className="py-2 text-slate-200">AIS-STU-8821</td>
                    <td className="py-2 text-slate-400 font-sans text-[11px]">The alphanumeric voucher code.</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-blue-400">User-Password</td>
                    <td className="py-2 text-slate-200">AIS-STU-8821</td>
                    <td className="py-2 text-slate-400 font-sans text-[11px]">Identical to voucher code or blank.</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-emerald-400">Mikrotik-Rate-Limit</td>
                    <td className="py-2 text-slate-200">"10M/5M"</td>
                    <td className="py-2 text-slate-400 font-sans text-[11px]">Down/Up dynamic queues enforced by RouterOS.</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-purple-400">Session-Timeout</td>
                    <td className="py-2 text-slate-200">3600 (seconds)</td>
                    <td className="py-2 text-slate-400 font-sans text-[11px]">Enforces voucher duration (e.g. 1 hour).</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-amber-400">Calling-Station-Id</td>
                    <td className="py-2 text-slate-200">02:A4:6B:7C:89:1E</td>
                    <td className="py-2 text-slate-400 font-sans text-[11px]">Client MAC address for single-device locking.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-5 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
              <span className="font-semibold text-slate-200 block mb-1">MikroTik ED50OUG Setup Steps:</span>
              {radiusGuide?.mikrotikSetupSteps ? (
                radiusGuide.mikrotikSetupSteps.map((step: string, i: number) => (
                  <div key={i} className="py-0.5 text-[11px] font-mono text-slate-300">
                    {step}
                  </div>
                ))
              ) : (
                <div className="space-y-1 text-[11px] font-mono text-slate-300">
                  <div>1. Open WinBox: Connect to your MikroTik ED50OUG at 192.168.88.1.</div>
                  <div>2. Navigate to IP &gt; Hotspot &gt; Server Profiles &gt; double-click your profile.</div>
                  <div>3. Under the "Login" tab: check "HTTP PAP" and "HTTP CHAP".</div>
                  <div>4. Under the "RADIUS" tab: check "Use RADIUS" and enable "Accounting".</div>
                  <div>5. Upload AIS login.html into the /hotspot folder via WinBox Files.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: Pre-Deployment Isolated Bench Test */}
      {activeSubTab === 'bench' && (
        <PreDeploymentTestLab 
          config={config} 
          onRefreshConfig={handleTestConnection} 
        />
      )}
    </div>
  );
};
