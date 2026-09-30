import React, { useState, useEffect } from 'react';
import { FileText, Download, Search, RefreshCw, ShieldCheck, Filter } from 'lucide-react';
import { api } from '../services/api';
import { SessionLog } from '../types';

export const SessionLogs: React.FC = () => {
  const [logs, setLogs] = useState<SessionLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [reasonFilter, setReasonFilter] = useState('all');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getSessionLogs(150);
      setLogs(data);
    } catch (err) {
      console.error('Failed to load session logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const q = search.toLowerCase();
    const matchQuery = 
      log.clientIp.toLowerCase().includes(q) ||
      log.clientMac.toLowerCase().includes(q) ||
      log.voucherCode.toLowerCase().includes(q) ||
      (log.hostname && log.hostname.toLowerCase().includes(q));

    const matchReason = reasonFilter === 'all' || log.terminationReason === reasonFilter;
    return matchQuery && matchReason;
  });

  const handleExportCsv = () => {
    const headers = [
      'Log ID',
      'Voucher Code',
      'Profile',
      'Client IP',
      'Client MAC',
      'Hostname',
      'Login Time',
      'Logout Time',
      'Duration (Seconds)',
      'Bytes In',
      'Bytes Out',
      'Total MB',
      'Termination Reason'
    ];
    const rows = filteredLogs.map((l) => [
      l.id,
      l.voucherCode,
      l.profileLabel,
      l.clientIp,
      l.clientMac,
      `"${(l.hostname || '').replace(/"/g, '""')}"`,
      l.loginTime,
      l.logoutTime,
      l.sessionDurationSeconds,
      l.bytesIn,
      l.bytesOut,
      l.totalMB,
      l.terminationReason
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AIS_Session_Audit_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getReasonBadge = (reason: SessionLog['terminationReason']) => {
    switch (reason) {
      case 'user_logout':
        return <span className="bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded text-[10px]">User Logout</span>;
      case 'time_expired':
        return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded text-[10px]">Time Expired</span>;
      case 'quota_exhausted':
        return <span className="bg-purple-500/10 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded text-[10px]">Quota Reached</span>;
      case 'admin_disconnected':
        return <span className="bg-red-500/10 text-red-400 border border-red-500/30 px-2 py-0.5 rounded text-[10px]">Admin Kicked</span>;
      default:
        return <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-[10px]">Ended</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            Session Audit & Forensic Logs
          </h2>
          <p className="text-xs text-slate-400">
            Historical records containing client IP, MAC address, bandwidth usage, and login/logout timestamps.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            disabled={filteredLogs.length === 0}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-slate-700 disabled:opacity-40"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            Export Audit CSV
          </button>
          <button
            onClick={fetchLogs}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700"
            title="Refresh logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search MAC, IP, Voucher, Hostname..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          <select
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-500 w-full sm:w-auto"
          >
            <option value="all">All Disconnect Reasons</option>
            <option value="user_logout">User Logged Out</option>
            <option value="time_expired">Time Expired</option>
            <option value="quota_exhausted">Quota Reached</option>
            <option value="admin_disconnected">Admin Disconnected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Timestamp (Login/Logout)</th>
                <th className="px-4 py-3">Voucher Code</th>
                <th className="px-4 py-3">Client IP</th>
                <th className="px-4 py-3">Client MAC</th>
                <th className="px-4 py-3">Device / Host</th>
                <th className="px-4 py-3">Session Time</th>
                <th className="px-4 py-3">Total Consumed</th>
                <th className="px-4 py-3 text-right">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    No historical logs match your filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-300">
                      <div>{new Date(log.loginTime).toLocaleTimeString()}</div>
                      <div className="text-[10px] text-slate-500">{new Date(log.loginTime).toLocaleDateString()}</div>
                    </td>

                    <td className="px-4 py-3 font-mono font-semibold text-emerald-400">
                      {log.voucherCode}
                    </td>

                    <td className="px-4 py-3 font-mono text-slate-200">
                      {log.clientIp}
                    </td>

                    <td className="px-4 py-3 font-mono text-slate-400">
                      <span className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                        {log.clientMac}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-slate-300">
                      {log.hostname || 'Client Device'}
                    </td>

                    <td className="px-4 py-3 font-mono text-slate-300">
                      {Math.round(log.sessionDurationSeconds / 60)} mins
                    </td>

                    <td className="px-4 py-3 font-mono text-slate-300">
                      <span className="text-white font-semibold">{log.totalMB} MB</span>
                      <span className="text-[10px] text-slate-500 block">
                        {(log.bytesIn / (1024 * 1024)).toFixed(1)}M down / {(log.bytesOut / (1024 * 1024)).toFixed(1)}M up
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right font-mono">
                      {getReasonBadge(log.terminationReason)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
