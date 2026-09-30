import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Search, 
  LogOut, 
  RefreshCw, 
  Download, 
  Upload, 
  Activity, 
  Wifi, 
  Laptop, 
  Smartphone, 
  Clock, 
  ShieldAlert,
  ShieldCheck,
  Server,
  Plus,
  X,
  Check,
  QrCode
} from 'lucide-react';
import { api } from '../services/api';
import { ActiveSession, Voucher } from '../types';
import { VoucherQrModal } from './VoucherQrModal';

export const ConnectedDevices: React.FC = () => {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [terminatingId, setTerminatingId] = useState<string | null>(null);
  const [selectedQrVoucher, setSelectedQrVoucher] = useState<Voucher | null>(null);

  // Direct Device Authorization State
  const [showAuthorizeModal, setShowAuthorizeModal] = useState(false);
  const [authIp, setAuthIp] = useState('192.168.88.145');
  const [authMac, setAuthMac] = useState('02:A4:6B:7C:89:1E');
  const [authHostname, setAuthHostname] = useState('Student Smartphone');
  const [authDuration, setAuthDuration] = useState('480'); // 8 hours
  const [authSpeedDown, setAuthSpeedDown] = useState('25');
  const [authNotes, setAuthNotes] = useState('Teacher / Administrator Approved');
  const [authorizing, setAuthorizing] = useState(false);
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      const data = await api.getActiveSessions();
      setSessions(data);
    } catch (err) {
      console.error('Failed to load active sessions', err);
    }
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 3000); // 3-second live refresh
    return () => clearInterval(interval);
  }, []);

  const handleDisconnect = async (id: string, mac: string) => {
    if (confirm(`Terminate access for MAC ${mac}? Gateway firewall rules will immediately drop their traffic.`)) {
      setTerminatingId(id);
      try {
        await api.disconnectSession(id);
        await fetchSessions();
      } finally {
        setTerminatingId(null);
      }
    }
  };

  const handleDirectAuthorize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authIp && !authMac) return;

    setAuthorizing(true);
    setAuthSuccessMsg(null);
    try {
      const res = await api.authorizeDevice({
        clientIp: authIp.trim(),
        clientMac: authMac.trim(),
        hostname: authHostname.trim() || 'Authorized Device',
        durationMinutes: Number(authDuration) || 480,
        speedLimitDownMbps: Number(authSpeedDown) || 25,
        notes: authNotes.trim()
      });

      if (res.success) {
        setAuthSuccessMsg(`Device ${authMac} successfully authorized! Internet access is active.`);
        await fetchSessions();
        setTimeout(() => {
          setShowAuthorizeModal(false);
          setAuthSuccessMsg(null);
        }, 1200);
      }
    } catch (err: any) {
      alert('Failed to authorize device: ' + err.message);
    } finally {
      setAuthorizing(false);
    }
  };

  const filteredSessions = sessions.filter(s => {
    const q = search.toLowerCase();
    return (
      s.clientIp.toLowerCase().includes(q) ||
      s.clientMac.toLowerCase().includes(q) ||
      s.voucherCode.toLowerCase().includes(q) ||
      (s.hostname && s.hostname.toLowerCase().includes(q))
    );
  });

  const formatSeconds = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${s}s`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            Live Connected Devices & Sessions ({sessions.length})
          </h2>
          <p className="text-xs text-slate-400">
            Real-time monitoring of campus clients authenticated through the MikroTik ED50OUG RouterOS Hotspot.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAuthorizeModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            title="Directly authorize a student or guest device without voucher"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Authorize Device</span>
          </button>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by IP, MAC, Voucher..."
              className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 font-mono w-56"
            />
          </div>

          <button
            onClick={() => {
              setLoading(true);
              fetchSessions().finally(() => setLoading(false));
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700"
            title="Refresh now"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Active Clients Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Client Host & IP</th>
                <th className="px-4 py-3">MAC Address</th>
                <th className="px-4 py-3">Voucher / Tier</th>
                <th className="px-4 py-3">Throughput</th>
                <th className="px-4 py-3">Total Data</th>
                <th className="px-4 py-3">Remaining Time</th>
                <th className="px-4 py-3">Signal & Ping</th>
                <th className="px-4 py-3">Interface</th>
                <th className="px-4 py-3 text-right">Firewall Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                    No active clients connected at this moment.
                  </td>
                </tr>
              ) : (
                filteredSessions.map((s) => {
                  const downMB = (s.bytesIn / (1024 * 1024)).toFixed(1);
                  const upMB = (s.bytesOut / (1024 * 1024)).toFixed(1);

                  return (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          {s.hostname?.toLowerCase().includes('phone') || s.hostname?.toLowerCase().includes('android') || s.hostname?.toLowerCase().includes('iphone') ? (
                            <Smartphone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          ) : (
                            <Laptop className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                          <span>{s.hostname || 'Client Device'}</span>
                        </div>
                        <div className="text-[11px] font-mono text-emerald-400">{s.clientIp}</div>
                      </td>

                      <td className="px-4 py-3 font-mono text-slate-300">
                        <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {s.clientMac}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs text-white font-semibold">{s.voucherCode}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedQrVoucher({
                                id: s.id,
                                code: s.voucherCode,
                                profile: s.voucherProfile,
                                profileLabel: s.profileLabel,
                                durationMinutes: s.durationMinutes,
                                speedLimitDownMbps: s.speedLimitDownMbps,
                                speedLimitUpMbps: s.speedLimitUpMbps,
                                dataQuotaMB: s.dataQuotaMB,
                                maxDevices: 1,
                                currentDevices: 1,
                                totalUsedMinutes: 0,
                                totalUsedBytes: s.bytesIn + s.bytesOut,
                                createdAt: s.loginTime,
                                expiresAt: s.expiresAt,
                                status: 'active'
                              });
                            }}
                            className="p-1 rounded bg-slate-950 hover:bg-blue-500/20 text-slate-400 hover:text-blue-300 border border-slate-800 transition-colors cursor-pointer"
                            title="Generate & Display Scan-to-Connect QR Code"
                          >
                            <QrCode className="w-3 h-3 text-blue-400" />
                          </button>
                        </div>
                        <div className="text-[10px] text-slate-400">{s.profileLabel}</div>
                      </td>

                      <td className="px-4 py-3 font-mono text-slate-300">
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400 flex items-center">
                            <Download className="w-3 h-3 mr-0.5" />
                            {s.currentSpeedDownKbps}k
                          </span>
                          <span className="text-teal-400 flex items-center">
                            <Upload className="w-3 h-3 mr-0.5" />
                            {s.currentSpeedUpKbps}k
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 font-mono text-slate-300">
                        <div>{downMB} MB / {upMB} MB</div>
                        {s.dataQuotaMB > 0 && (
                          <div className="text-[10px] text-slate-500">Max: {s.dataQuotaMB}MB</div>
                        )}
                      </td>

                      <td className="px-4 py-3 font-mono text-slate-300">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {formatSeconds(s.remainingSeconds)}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-mono text-xs">
                        <div className="text-slate-300">{s.signalStrengthDbm} dBm</div>
                        <div className="text-[10px] text-slate-500">{s.latencyMs} ms</div>
                      </td>

                      <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                        <span className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                          {s.gatewayInterface}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDisconnect(s.id, s.clientMac)}
                          disabled={terminatingId === s.id}
                          className="px-2.5 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-red-200 border border-red-900/50 text-xs font-medium flex items-center gap-1 ml-auto transition-colors disabled:opacity-50 cursor-pointer"
                          title="Drop firewall state and disconnect"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>{terminatingId === s.id ? 'Dropping...' : 'Kick'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Direct Device Authorization Modal */}
      {showAuthorizeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 relative">
            <button
              onClick={() => setShowAuthorizeModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Direct Client Authorization</h3>
                <p className="text-xs text-slate-400">Bypass voucher portal and grant firewall access immediately</p>
              </div>
            </div>

            {authSuccessMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{authSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleDirectAuthorize} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Client IP Address</label>
                  <input
                    type="text"
                    required
                    value={authIp}
                    onChange={(e) => setAuthIp(e.target.value)}
                    placeholder="192.168.10.145"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Client MAC Address</label>
                  <input
                    type="text"
                    required
                    value={authMac}
                    onChange={(e) => setAuthMac(e.target.value)}
                    placeholder="02:A4:6B:7C:89:1E"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500 uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Device Label / Student Name</label>
                <input
                  type="text"
                  value={authHostname}
                  onChange={(e) => setAuthHostname(e.target.value)}
                  placeholder="e.g. Juan Dela Cruz - Grade 10 Phone"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Access Duration</label>
                  <select
                    value={authDuration}
                    onChange={(e) => setAuthDuration(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="60">1 Hour (Standard)</option>
                    <option value="240">4 Hours (Half Day)</option>
                    <option value="480">8 Hours (Full School Day)</option>
                    <option value="1440">24 Hours (All Day)</option>
                    <option value="10080">7 Days (Weekly Pass)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Speed Limit Down (Mbps)</label>
                  <select
                    value={authSpeedDown}
                    onChange={(e) => setAuthSpeedDown(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="10">10 Mbps (Standard)</option>
                    <option value="25">25 Mbps (High Speed)</option>
                    <option value="50">50 Mbps (Faculty Premium)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Authorization Reason / Notes</label>
                <input
                  type="text"
                  value={authNotes}
                  onChange={(e) => setAuthNotes(e.target.value)}
                  placeholder="e.g. Approved by ICT Coordinator"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAuthorizeModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={authorizing}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{authorizing ? 'Authorizing in Gateway...' : 'Authorize Internet Access'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Instant QR Code Generator Modal */}
      <VoucherQrModal
        voucher={selectedQrVoucher}
        isOpen={Boolean(selectedQrVoucher)}
        onClose={() => setSelectedQrVoucher(null)}
      />
    </div>
  );
};
