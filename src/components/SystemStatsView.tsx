import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Wifi, 
  Server, 
  Users, 
  Ticket, 
  HardDrive, 
  Clock, 
  ShieldCheck, 
  ArrowDownRight, 
  ArrowUpRight,
  Network,
  Cpu
} from 'lucide-react';
import { api } from '../services/api';
import { SystemStats } from '../types';

export const SystemStatsView: React.FC = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const data = await api.getSystemStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) {
    return (
      <div className="p-8 text-center text-slate-500 font-mono text-xs">
        Loading gateway network telemetry...
      </div>
    );
  }

  const formatUptime = (sec: number) => {
    const days = Math.floor(sec / 86400);
    const hrs = Math.floor((sec % 86400) / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    return `${days}d ${hrs}h ${mins}m`;
  };

  const totalGB = (stats.totalBandwidthServedBytes / (1024 * 1024 * 1024)).toFixed(2);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-400" />
          Network Telemetry & Gateway Health
        </h2>
        <p className="text-xs text-slate-400">
          Core router statistics for Annafunan Integrated School campus gateway.
        </p>
      </div>

      {/* Top metrics cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>ACTIVE CONNECTED USERS</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {stats.activeUsersCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Passing firewall rules</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>CAMPUS THROUGHPUT (RX/TX)</span>
            <Activity className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white flex items-center gap-2">
            <span className="text-emerald-400 flex items-center">
              <ArrowDownRight className="w-4 h-4" /> {stats.currentTotalThroughputDownMbps}M
            </span>
            <span className="text-slate-600">/</span>
            <span className="text-teal-400 flex items-center">
              <ArrowUpRight className="w-4 h-4" /> {stats.currentTotalThroughputUpMbps}M
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Live aggregated traffic</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>TOTAL BANDWIDTH SERVED</span>
            <HardDrive className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {totalGB} <span className="text-sm font-normal text-slate-400">GB</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">All sessions combined</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>GATEWAY UPTIME</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {formatUptime(stats.systemUptimeSeconds)}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 font-mono">MikroTik RouterOS Hotspot Online</div>
        </div>
      </div>

      {/* Hardware / Gateway Interfaces status grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* LAN Interface */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">LAN Interface ({stats.lanInterface.name})</h3>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
              TRUNK UP
            </span>
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Gateway IPv4 Address:</span>
              <span className="text-slate-200 font-semibold">{stats.lanInterface.ip}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Subnet Netmask:</span>
              <span className="text-slate-200">{stats.lanInterface.netmask}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">ISC-DHCP Pool Range:</span>
              <span className="text-slate-200">{stats.lanInterface.dhcpPool}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Active Leased IPs:</span>
              <span className="text-emerald-400 font-semibold">{stats.lanInterface.leasesActive} leases</span>
            </div>
          </div>
        </div>

        {/* WAN Interface */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white">WAN Gateway ({stats.wanInterface.name})</h3>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/30 font-mono">
              FIBER UP
            </span>
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Public Static IP:</span>
              <span className="text-slate-200 font-semibold">{stats.wanInterface.ip}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">ISP Uplink:</span>
              <span className="text-slate-200">{stats.wanInterface.isp}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Firewall Gateway OS:</span>
              <span className="text-slate-200">{stats.gatewayVersion}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Captive Portal Daemon:</span>
              <span className="text-emerald-400 font-semibold">Running (Active Zone)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Voucher Code Breakdown Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
          <Ticket className="w-4 h-4 text-emerald-400" />
          Voucher Pool Allocation
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="text-xs text-slate-400 mb-1">TOTAL VOUCHERS</div>
            <div className="text-xl font-bold font-mono text-white">{stats.totalVouchersCount}</div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="text-xs text-emerald-400 mb-1">ACTIVE NOW</div>
            <div className="text-xl font-bold font-mono text-emerald-400">{stats.activeVouchersCount}</div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="text-xs text-blue-400 mb-1">UNUSED (READY)</div>
            <div className="text-xl font-bold font-mono text-blue-400">{stats.unusedVouchersCount}</div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="text-xs text-slate-500 mb-1">EXPIRED / USED</div>
            <div className="text-xl font-bold font-mono text-slate-400">{stats.expiredVouchersCount}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
