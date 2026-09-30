import React, { useState, useEffect, useMemo } from 'react';
import { 
  Ticket, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Ban, 
  Printer, 
  Download, 
  RefreshCw, 
  Check, 
  Clock, 
  Gauge, 
  Layers, 
  Users,
  AlertCircle,
  FileText,
  CheckSquare,
  Square,
  Sparkles,
  QrCode
} from 'lucide-react';
import { api } from '../services/api';
import { Voucher, BulkVoucherParams, VoucherProfile } from '../types';
import { PrintableVouchersModal } from './PrintableVouchersModal';
import { VoucherQrModal } from './VoucherQrModal';

export const VoucherManager: React.FC = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printBatchId, setPrintBatchId] = useState<string | undefined>(undefined);
  const [autoOpenPdfOnGenerate, setAutoOpenPdfOnGenerate] = useState(true);
  const [selectedVoucherIds, setSelectedVoucherIds] = useState<Set<string>>(new Set());
  const [justGeneratedBatch, setJustGeneratedBatch] = useState<{ id: string; count: number; name?: string } | null>(null);
  const [selectedQrVoucher, setSelectedQrVoucher] = useState<Voucher | null>(null);

  const [bulkParams, setBulkParams] = useState<BulkVoucherParams>({
    quantity: 12,
    prefix: 'AIS-STU-',
    profile: 'student_standard',
    durationMinutes: 60,
    speedLimitDownMbps: 10,
    speedLimitUpMbps: 5,
    dataQuotaMB: 500,
    maxDevices: 1,
    validDays: 7,
    notes: 'Grade 11 & 12 Computer Research'
  });
  const [generating, setGenerating] = useState(false);

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const data = await api.getVouchers(search, statusFilter);
      setVouchers(data);
    } catch (err) {
      console.error('Failed to fetch vouchers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVouchers();
  };

  const handleRevoke = async (id: string) => {
    if (confirm('Revoke this voucher immediately? Any active device using it will be disconnected.')) {
      await api.revokeVoucher(id);
      fetchVouchers();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Permanently delete this voucher?')) {
      await api.deleteVoucher(id);
      fetchVouchers();
    }
  };

  const handleProfilePresetChange = (profile: VoucherProfile) => {
    switch (profile) {
      case 'student_standard':
        setBulkParams(p => ({
          ...p,
          profile,
          prefix: 'AIS-STU-',
          durationMinutes: 60,
          speedLimitDownMbps: 10,
          speedLimitUpMbps: 5,
          dataQuotaMB: 500,
          maxDevices: 1
        }));
        break;
      case 'student_day':
        setBulkParams(p => ({
          ...p,
          profile,
          prefix: 'AIS-DAY-',
          durationMinutes: 480,
          speedLimitDownMbps: 15,
          speedLimitUpMbps: 5,
          dataQuotaMB: 2048,
          maxDevices: 1
        }));
        break;
      case 'faculty_premium':
        setBulkParams(p => ({
          ...p,
          profile,
          prefix: 'AIS-FAC-',
          durationMinutes: 1440,
          speedLimitDownMbps: 50,
          speedLimitUpMbps: 25,
          dataQuotaMB: 0,
          maxDevices: 2
        }));
        break;
      case 'lab_session':
        setBulkParams(p => ({
          ...p,
          profile,
          prefix: 'AIS-LAB-',
          durationMinutes: 180,
          speedLimitDownMbps: 25,
          speedLimitUpMbps: 10,
          dataQuotaMB: 1024,
          maxDevices: 1
        }));
        break;
      case 'guest_temp':
        setBulkParams(p => ({
          ...p,
          profile,
          prefix: 'AIS-GST-',
          durationMinutes: 30,
          speedLimitDownMbps: 5,
          speedLimitUpMbps: 2,
          dataQuotaMB: 200,
          maxDevices: 1
        }));
        break;
    }
  };

  const handleGenerateBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await api.generateBulkVouchers(bulkParams);
      if (res.success) {
        setShowBulkModal(false);
        await fetchVouchers();

        if (res.vouchers && res.vouchers.length > 0) {
          const first = res.vouchers[0];
          const bId = first.batchId;
          setJustGeneratedBatch({
            id: bId || 'new-batch',
            count: res.vouchers.length,
            name: bulkParams.notes
          });

          if (autoOpenPdfOnGenerate) {
            setPrintBatchId(bId);
            setShowPrintModal(true);
          }
        }
      }
    } catch (err) {
      alert('Failed to generate vouchers');
    } finally {
      setGenerating(false);
    }
  };

  const handleExportCsv = () => {
    const headers = ['Voucher Code', 'Profile', 'Duration (Mins)', 'Down (Mbps)', 'Up (Mbps)', 'Quota (MB)', 'Status', 'Batch ID', 'Created At', 'Expires At', 'Notes'];
    const rows = vouchers.map(v => [
      v.code,
      v.profileLabel,
      v.durationMinutes,
      v.speedLimitDownMbps,
      v.speedLimitUpMbps,
      v.dataQuotaMB,
      v.status,
      v.batchId || '',
      v.createdAt,
      v.expiresAt,
      `"${(v.notes || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AIS_Vouchers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Selection toggle handlers
  const toggleSelectAll = () => {
    if (selectedVoucherIds.size === vouchers.length) {
      setSelectedVoucherIds(new Set());
    } else {
      setSelectedVoucherIds(new Set(vouchers.map(v => v.id)));
    }
  };

  const toggleSelectVoucher = (id: string) => {
    setSelectedVoucherIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const vouchersForPrint = useMemo(() => {
    if (selectedVoucherIds.size > 0) {
      return vouchers.filter(v => selectedVoucherIds.has(v.id));
    }
    return vouchers;
  }, [vouchers, selectedVoucherIds]);

  const handleOpenPrintModalForBatch = (batchId: string) => {
    setPrintBatchId(batchId);
    setShowPrintModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Newly generated batch quick banner notification */}
      {justGeneratedBatch && (
        <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Successfully generated {justGeneratedBatch.count} voucher slips!</span>
                <span className="font-mono text-emerald-300 text-[11px]">({justGeneratedBatch.id})</span>
              </div>
              <p className="text-[11px] text-slate-300">
                {justGeneratedBatch.name || 'Ready for physical distribution to students and faculty.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                setPrintBatchId(justGeneratedBatch.id);
                setShowPrintModal(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Export PDF for this Batch</span>
            </button>
            <button
              onClick={() => setJustGeneratedBatch(null)}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Ticket className="w-5 h-5 text-emerald-400" />
            Voucher Code Inventory
          </h2>
          <p className="text-xs text-slate-400">
            Create, monitor, and export access tickets for students, faculty, and computer labs into print-ready PDF sheets.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowBulkModal(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Generate Bulk Batch
          </button>

          {/* Quick Scan-to-Connect QR generator button */}
          <button
            onClick={() => {
              if (vouchers.length > 0) {
                const target = selectedVoucherIds.size > 0 
                  ? (vouchers.find(v => selectedVoucherIds.has(v.id)) || vouchers[0])
                  : vouchers[0];
                setSelectedQrVoucher(target);
              }
            }}
            disabled={vouchers.length === 0}
            className="px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-semibold flex items-center gap-1.5 border border-blue-500/40 shadow-sm transition-all disabled:opacity-40 cursor-pointer"
            title="Generate and display or print scan-to-connect QR codes for users"
          >
            <QrCode className="w-4 h-4 text-blue-400" />
            <span>Scan-to-Connect QR</span>
          </button>

          {/* Primary PDF export button */}
          <button
            onClick={() => {
              setPrintBatchId(undefined);
              setShowPrintModal(true);
            }}
            disabled={vouchers.length === 0}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold flex items-center gap-1.5 border border-emerald-500/40 hover:border-emerald-500/80 shadow-sm transition-all disabled:opacity-40 cursor-pointer"
            title="Export print-ready PDF slips for physical distribution"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Export Print-Ready PDF</span>
          </button>

          <button
            onClick={() => {
              setPrintBatchId(undefined);
              setShowPrintModal(true);
            }}
            disabled={vouchers.length === 0}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 border border-slate-700 disabled:opacity-40"
            title="Print slips"
          >
            <Printer className="w-4 h-4 text-slate-400" />
            <span>Print</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={vouchers.length === 0}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 border border-slate-700 disabled:opacity-40"
            title="Export CSV"
          >
            <Download className="w-4 h-4" />
            <span>CSV</span>
          </button>

          <button
            onClick={fetchVouchers}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter, search bar and selection banner */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search voucher code (e.g. AIS-STU-8821), profile, or batch..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 w-full sm:w-auto"
          >
            <option value="all">All Statuses</option>
            <option value="unused">Unused (Ready)</option>
            <option value="active">Active (Connected)</option>
            <option value="depleted">Depleted (Used Up)</option>
            <option value="expired">Expired</option>
            <option value="revoked">Revoked</option>
          </select>
        </div>
      </div>

      {/* Selected items quick action floating/inline bar */}
      {selectedVoucherIds.size > 0 && (
        <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-300">
            <CheckSquare className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">{selectedVoucherIds.size} vouchers selected</span>
            <span className="text-slate-400">out of {vouchers.length}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const firstSelected = vouchers.find(v => selectedVoucherIds.has(v.id));
                if (firstSelected) setSelectedQrVoucher(firstSelected);
              }}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Display / Print QR ({selectedVoucherIds.size})</span>
            </button>
            <button
              onClick={() => {
                setPrintBatchId(undefined);
                setShowPrintModal(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export to PDF</span>
            </button>
            <button
              onClick={() => setSelectedVoucherIds(new Set())}
              className="px-2.5 py-1.5 text-slate-400 hover:text-slate-200 text-xs cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Vouchers Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono uppercase tracking-wider">
              <tr>
                <th className="px-3 py-3 w-10 text-center">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-slate-400 hover:text-white"
                    title={selectedVoucherIds.size === vouchers.length ? 'Deselect All' : 'Select All'}
                  >
                    {selectedVoucherIds.size > 0 && selectedVoucherIds.size === vouchers.length ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3">Voucher Code & QR</th>
                <th className="px-4 py-3">Profile / Target</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Bandwidth (Down/Up)</th>
                <th className="px-4 py-3">Quota</th>
                <th className="px-4 py-3">Devices</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Expires</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {vouchers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-500">
                    No vouchers found matching your search.
                  </td>
                </tr>
              ) : (
                vouchers.map((v) => {
                  const isUnused = v.status === 'unused';
                  const isActive = v.status === 'active';
                  const isRevoked = v.status === 'revoked';
                  const isExpired = v.status === 'expired' || v.status === 'depleted';
                  const isSelected = selectedVoucherIds.has(v.id);

                  return (
                    <tr
                      key={v.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isSelected ? 'bg-emerald-950/20' : ''
                      }`}
                    >
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectVoucher(v.id)}
                          className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-950 w-3.5 h-3.5 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-white">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedQrVoucher(v)}
                            className="bg-slate-950 hover:bg-blue-500/10 px-2.5 py-1 rounded border border-slate-800 hover:border-blue-500/40 text-emerald-400 hover:text-blue-300 transition-colors cursor-pointer flex items-center gap-1.5 text-xs"
                            title="Click to generate and display or print QR code"
                          >
                            <QrCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            <span>{v.code}</span>
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-200">{v.profileLabel}</div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                          {v.batchId && (
                            <span className="font-mono bg-slate-950 px-1 rounded text-slate-400">
                              {v.batchId}
                            </span>
                          )}
                          {v.notes && <span>{v.notes}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-300">
                        {v.durationMinutes >= 60 ? `${v.durationMinutes / 60}h` : `${v.durationMinutes}m`}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-300">
                        {v.speedLimitDownMbps}M / {v.speedLimitUpMbps}M
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-300">
                        {v.dataQuotaMB > 0 ? `${v.dataQuotaMB} MB` : 'Unlimited'}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-300">
                        <span className={v.currentDevices > 0 ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                          {v.currentDevices}
                        </span>
                        /{v.maxDevices}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : isUnused
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                              : isRevoked
                              ? 'bg-red-500/10 text-red-400 border-red-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {v.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-[11px] font-mono">
                        {new Date(v.expiresAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick QR code generator / display button */}
                          <button
                            onClick={() => setSelectedQrVoucher(v)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 border border-blue-500/30 text-[11px] font-semibold transition-colors cursor-pointer"
                            title="Generate and display or print QR Code pass"
                          >
                            <QrCode className="w-3 h-3" />
                            <span>QR Code</span>
                          </button>

                          {/* Quick print slip button */}
                          <button
                            onClick={() => {
                              setSelectedVoucherIds(new Set([v.id]));
                              setShowPrintModal(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                            title="Export print-ready slip for this code"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          {v.status !== 'revoked' && (
                            <button
                              onClick={() => handleRevoke(v.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                              title="Revoke voucher"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(v.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                            title="Delete voucher"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Generator Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative text-slate-100 my-8">
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" />
              Generate Bulk Voucher Batch
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Create cryptographic voucher codes with speed throttling, quotas, and automatic print-ready PDF export.
            </p>

            <form onSubmit={handleGenerateBulk} className="space-y-4">
              {/* Presets */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Select Educational Preset
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'student_standard', label: 'Student 1-Hr' },
                    { id: 'student_day', label: 'Student All-Day' },
                    { id: 'faculty_premium', label: 'Faculty 24-Hr' },
                    { id: 'lab_session', label: 'ComLab 3-Hr' },
                    { id: 'guest_temp', label: 'Guest 30-Min' },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleProfilePresetChange(preset.id as VoucherProfile)}
                      className={`p-2 rounded-xl text-xs font-medium border text-center transition-all ${
                        bulkParams.profile === preset.id
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity & Prefix */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Number of Vouchers
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={bulkParams.quantity}
                    onChange={(e) => setBulkParams({ ...bulkParams, quantity: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                  <span className="text-[10px] text-slate-500">Recommended: 8 to 24 (1 to 3 sheets)</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Voucher Prefix
                  </label>
                  <input
                    type="text"
                    value={bulkParams.prefix}
                    onChange={(e) => setBulkParams({ ...bulkParams, prefix: e.target.value.toUpperCase() })}
                    placeholder="AIS-STU-"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Duration & Validity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min={5}
                    value={bulkParams.durationMinutes}
                    onChange={(e) => setBulkParams({ ...bulkParams, durationMinutes: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Valid for (Days)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={bulkParams.validDays}
                    onChange={(e) => setBulkParams({ ...bulkParams, validDays: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Bandwidth & Quota */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Down (Mbps)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={bulkParams.speedLimitDownMbps}
                    onChange={(e) => setBulkParams({ ...bulkParams, speedLimitDownMbps: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Up (Mbps)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={bulkParams.speedLimitUpMbps}
                    onChange={(e) => setBulkParams({ ...bulkParams, speedLimitUpMbps: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Quota (MB, 0=None)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={bulkParams.dataQuotaMB}
                    onChange={(e) => setBulkParams({ ...bulkParams, dataQuotaMB: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Batch Purpose / Class Note
                </label>
                <input
                  type="text"
                  value={bulkParams.notes || ''}
                  onChange={(e) => setBulkParams({ ...bulkParams, notes: e.target.value })}
                  placeholder="e.g. Grade 12 CSS Networking Class - ComLab 2"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Automatic PDF open toggle */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoOpenPdfOnGenerate}
                    onChange={(e) => setAutoOpenPdfOnGenerate(e.target.checked)}
                    className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-900 w-4 h-4 cursor-pointer"
                  />
                  <span className="font-semibold text-white">
                    Open print-ready PDF layout immediately after generation
                  </span>
                </label>
                <p className="text-[10px] text-slate-500 mt-1 pl-6">
                  Automatically prepares formatted cut-out sheets with school branding, SSID instructions, and scissor guides.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {generating ? 'Generating...' : `Create ${bulkParams.quantity} Vouchers`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Vouchers Modal with PDF export */}
      <PrintableVouchersModal
        isOpen={showPrintModal}
        onClose={() => {
          setShowPrintModal(false);
          setPrintBatchId(undefined);
        }}
        vouchers={vouchersForPrint}
        initialBatchId={printBatchId}
      />

      {/* Individual Voucher QR Code Modal */}
      <VoucherQrModal
        voucher={selectedQrVoucher}
        isOpen={Boolean(selectedQrVoucher)}
        onClose={() => setSelectedQrVoucher(null)}
        vouchersList={vouchers}
        onSelectVoucher={setSelectedQrVoucher}
      />
    </div>
  );
};
