import React, { useState } from 'react';
import { Sparkles, Laptop, Smartphone, Monitor, ChevronUp, ChevronDown, Check, RefreshCw, Ticket, Copy, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

interface NetworkLabSimulatorProps {
  currentIp: string;
  currentMac: string;
  onSelectVirtualClient: (ip: string, mac: string, hostname: string) => void;
  onClose: () => void;
}

export const NetworkLabSimulator: React.FC<NetworkLabSimulatorProps> = ({
  currentIp,
  currentMac,
  onSelectVirtualClient,
  onClose
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [customIp, setCustomIp] = useState('');
  const [customMac, setCustomMac] = useState('');
  const [instantTestVoucher, setInstantTestVoucher] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const virtualClients = [
    {
      name: 'Student Mobile (Android)',
      ip: '192.168.88.142',
      mac: '3C:28:6D:88:51:A4',
      type: 'mobile',
      tag: 'Hotspot Pool'
    },
    {
      name: 'Faculty MacBook Pro',
      ip: '192.168.88.104',
      mac: 'F8:E4:3B:11:90:2C',
      type: 'laptop',
      tag: 'Faculty Pool'
    },
    {
      name: 'ComLab-204 Workstation',
      ip: '192.168.88.180',
      mac: '00:1B:44:11:3A:B7',
      type: 'desktop',
      tag: 'Lab Bridge'
    },
    {
      name: 'New Unregistered Guest',
      ip: '192.168.88.222',
      mac: '5A:44:E2:10:98:C3',
      type: 'mobile',
      tag: 'Hotspot Trap'
    }
  ];

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customIp && customMac) {
      onSelectVirtualClient(customIp.trim(), customMac.trim(), 'Custom-Test-Host');
    }
  };

  const handleGenerateInstantVoucher = async () => {
    setGenerating(true);
    try {
      const res = await api.generateBulkVouchers({
        quantity: 1,
        prefix: 'SIM',
        profile: 'student_standard',
        durationMinutes: 30,
        speedLimitDownMbps: 10,
        speedLimitUpMbps: 5,
        dataQuotaMB: 0,
        maxDevices: 1,
        validDays: 7,
        notes: 'Lab Simulator Test Voucher'
      });
      if (res.success && res.vouchers.length > 0) {
        setInstantTestVoucher(res.vouchers[0].code);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyCode = () => {
    if (instantTestVoucher) {
      navigator.clipboard.writeText(instantTestVoucher);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-slate-900 border-b border-emerald-500/30 text-slate-200 text-xs shadow-md">
      <div className="px-4 py-2 flex items-center justify-between bg-emerald-950/40 border-b border-emerald-900/40">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-semibold text-emerald-300">
            🧪 Pre-Deployment Test Bench & Virtual Client Simulator
          </span>
          <span className="text-[10px] text-slate-400 hidden md:inline">
            (Safe isolated mode: test Mikrotik ED50UG captive portal rules, QR scan, & voucher login without school Wi-Fi)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleGenerateInstantVoucher}
            disabled={generating}
            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[11px] flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            title="Generate instant 30-min voucher for test"
          >
            <Ticket className="w-3 h-3" />
            <span>{generating ? 'Creating...' : 'Quick Test Voucher'}</span>
          </button>

          {instantTestVoucher && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 font-mono text-[11px] text-emerald-300">
              <span>{instantTestVoucher}</span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="hover:text-white p-0.5 cursor-pointer"
                title="Copy code"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-slate-400 hover:text-white p-1 rounded"
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white px-1.5 py-0.5 rounded text-[10px] border border-slate-700 cursor-pointer"
          >
            Hide
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="p-4 space-y-3 bg-slate-950/70">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {virtualClients.map((client) => {
              const isSelected = currentIp === client.ip || currentMac === client.mac;
              return (
                <button
                  key={client.ip}
                  type="button"
                  onClick={() => onSelectVirtualClient(client.ip, client.mac, client.name)}
                  className={`p-2.5 rounded-xl text-left border transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-white">
                      {client.type === 'mobile' && <Smartphone className="w-3.5 h-3.5 text-emerald-400" />}
                      {client.type === 'laptop' && <Laptop className="w-3.5 h-3.5 text-blue-400" />}
                      {client.type === 'desktop' && <Monitor className="w-3.5 h-3.5 text-purple-400" />}
                      <span>{client.name}</span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-950 font-mono text-slate-400 border border-slate-800">
                      {client.tag}
                    </span>
                  </div>

                  <div className="font-mono text-[11px] text-slate-400 space-y-0.5">
                    <div>IP: <span className="text-slate-200">{client.ip}</span></div>
                    <div>MAC: <span className="text-slate-200">{client.mac}</span></div>
                  </div>

                  {isSelected && (
                    <div className="mt-2 text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Active Virtual Client
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleApplyCustom} className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Or simulate custom device:</span>
            <input
              type="text"
              placeholder="IP (e.g. 192.168.88.99)"
              value={customIp}
              onChange={(e) => setCustomIp(e.target.value)}
              className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="MAC (e.g. AA:BB:CC:11:22:33)"
              value={customMac}
              onChange={(e) => setCustomMac(e.target.value)}
              className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-medium text-[11px] cursor-pointer"
            >
              Simulate Device
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
