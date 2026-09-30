import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  FileText, 
  Scissors, 
  Layers, 
  Check, 
  ExternalLink,
  Settings,
  Sparkles,
  Filter,
  Users,
  QrCode
} from 'lucide-react';
import { Voucher } from '../types';
import { generateVouchersPdf, VoucherPdfOptions } from '../utils/voucherPdfGenerator';
import { generateVoucherQrDataUrl } from '../utils/qrCodeHelper';

interface PrintableVouchersModalProps {
  isOpen: boolean;
  onClose: () => void;
  vouchers: Voucher[];
  initialBatchId?: string;
}

export const PrintableVouchersModal: React.FC<PrintableVouchersModalProps> = ({
  isOpen,
  onClose,
  vouchers,
  initialBatchId,
}) => {
  const [paperSize, setPaperSize] = useState<'a4' | 'letter'>('a4');
  const [layoutDensity, setLayoutDensity] = useState<'8_per_page' | '6_per_page'>('8_per_page');
  const [showCutGuides, setShowCutGuides] = useState(true);
  const [includeQrCodes, setIncludeQrCodes] = useState(true);
  const [filterMode, setFilterMode] = useState<'all' | 'unused' | 'batch'>('all');
  const [selectedBatchId, setSelectedBatchId] = useState<string>(initialBatchId || 'all');
  const [distributeTo, setDistributeTo] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [previewQrMap, setPreviewQrMap] = useState<Record<string, string>>({});

  // Extract unique batches
  const batches = useMemo(() => {
    const map = new Map<string, { id: string; count: number; date: string; notes?: string }>();
    vouchers.forEach((v) => {
      const bId = v.batchId || 'default';
      if (!map.has(bId)) {
        map.set(bId, {
          id: bId,
          count: 1,
          date: v.createdAt,
          notes: v.notes
        });
      } else {
        const item = map.get(bId)!;
        item.count += 1;
      }
    });
    return Array.from(map.values());
  }, [vouchers]);

  // Filter vouchers according to selected mode
  const filteredVouchers = useMemo(() => {
    let list = [...vouchers];
    if (filterMode === 'unused') {
      list = list.filter((v) => v.status === 'unused');
    } else if (filterMode === 'batch' && selectedBatchId !== 'all') {
      list = list.filter((v) => (v.batchId || 'default') === selectedBatchId);
    }
    return list;
  }, [vouchers, filterMode, selectedBatchId]);

  // Pre-generate QR codes for preview cards
  useEffect(() => {
    if (!isOpen || !includeQrCodes || filteredVouchers.length === 0) return;

    let isMounted = true;
    const generateAll = async () => {
      const map: Record<string, string> = {};
      // Generate preview QRs for visible vouchers (up to 32 to keep snappy)
      const toGenerate = filteredVouchers.slice(0, 32);
      await Promise.all(
        toGenerate.map(async (v) => {
          try {
            const url = await generateVoucherQrDataUrl(v.code, 150);
            map[v.code] = url;
          } catch (e) {
            // fallback
          }
        })
      );
      if (isMounted) {
        setPreviewQrMap(map);
      }
    };

    generateAll();
    return () => {
      isMounted = false;
    };
  }, [isOpen, includeQrCodes, filteredVouchers]);

  if (!isOpen) return null;

  const handleDownloadPdf = async () => {
    if (filteredVouchers.length === 0) return;
    setIsExporting(true);
    try {
      const options: VoucherPdfOptions = {
        paperSize,
        layoutDensity,
        showCutGuides,
        includeQrCodes,
        distributeTo: distributeTo.trim(),
        batchLabel: selectedBatchId !== 'all' ? `Batch ${selectedBatchId}` : undefined,
      };

      const doc = await generateVouchersPdf(filteredVouchers, options);
      const safeTarget = distributeTo.trim().replace(/[^a-zA-Z0-9-_]/g, '_') || 'Batch';
      const filename = `AIS_Vouchers_${safeTarget}_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(filename);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to generate PDF', err);
      alert('Error exporting PDF. Please check the browser console.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenPdfPreview = async () => {
    if (filteredVouchers.length === 0) return;
    setIsExporting(true);
    try {
      const options: VoucherPdfOptions = {
        paperSize,
        layoutDensity,
        showCutGuides,
        includeQrCodes,
        distributeTo: distributeTo.trim(),
        batchLabel: selectedBatchId !== 'all' ? `Batch ${selectedBatchId}` : undefined,
      };
      const doc = await generateVouchersPdf(filteredVouchers, options);
      const blobUrl = doc.output('bloburl');
      window.open(blobUrl, '_blank');
    } catch (err) {
      console.error('Failed to preview PDF', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleBrowserPrint = () => {
    window.print();
  };

  const cardsPerPageCount = layoutDensity === '8_per_page' ? 8 : 6;
  const estimatedPages = Math.max(1, Math.ceil(filteredVouchers.length / cardsPerPageCount));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-6 my-6 text-slate-100 no-print flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <FileText className="w-5 h-5" />
              </span>
              <h3 className="text-lg font-bold text-white">
                Export Print-Ready Voucher Distribution Sheets
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                QR & PDF Enabled
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Produce formatted, high-contrast cut-out voucher slips with scannable QR codes for mobile one-tap student connection.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 my-4 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs shrink-0">
          {/* Filter selection */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1.5 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-emerald-400" />
              Voucher Filter
            </label>
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-500 text-xs"
            >
              <option value="all">All Vouchers ({vouchers.length})</option>
              <option value="unused">
                Only Unused ({vouchers.filter((v) => v.status === 'unused').length})
              </option>
              {batches.length > 1 && <option value="batch">Filter by Specific Batch</option>}
            </select>

            {filterMode === 'batch' && (
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="w-full mt-1.5 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-emerald-400 font-mono text-[11px]"
              >
                <option value="all">All Batches</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.id} ({b.count} vouchers)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Paper Size & Density */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1.5 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              Paper & Grid
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <select
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value as any)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white focus:outline-none focus:border-emerald-500 text-xs"
              >
                <option value="a4">A4</option>
                <option value="letter">Letter</option>
              </select>
              <select
                value={layoutDensity}
                onChange={(e) => setLayoutDensity(e.target.value as any)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white focus:outline-none focus:border-emerald-500 text-xs"
              >
                <option value="8_per_page">8 / Page</option>
                <option value="6_per_page">6 / Page</option>
              </select>
            </div>
          </div>

          {/* QR Code Feature Toggle */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1.5 flex items-center gap-1">
              <QrCode className="w-3.5 h-3.5 text-emerald-400" />
              QR Code Connect
            </label>
            <label className="flex items-center gap-2 cursor-pointer py-1 text-slate-300">
              <input
                type="checkbox"
                checked={includeQrCodes}
                onChange={(e) => setIncludeQrCodes(e.target.checked)}
                className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-900 w-4 h-4 cursor-pointer"
              />
              <span className="font-semibold text-emerald-300">Include QR codes</span>
            </label>
            <span className="text-[10px] text-slate-500 block">Camera auto-scan</span>
          </div>

          {/* Cut Guides */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1.5 flex items-center gap-1">
              <Scissors className="w-3.5 h-3.5 text-amber-400" />
              Guidelines
            </label>
            <label className="flex items-center gap-2 cursor-pointer py-1 text-slate-300">
              <input
                type="checkbox"
                checked={showCutGuides}
                onChange={(e) => setShowCutGuides(e.target.checked)}
                className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-900 w-4 h-4 cursor-pointer"
              />
              <span>Dashed cut lines</span>
            </label>
            <span className="text-[10px] text-slate-500 block">Scissor marks</span>
          </div>

          {/* Target Group / Class Banner */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1.5 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-purple-400" />
              Group / Section
            </label>
            <input
              type="text"
              placeholder="e.g. Grade 11 STEM"
              value={distributeTo}
              onChange={(e) => setDistributeTo(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
            />
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>Ready: <strong className="text-white">{filteredVouchers.length}</strong> vouchers</span>
            <span>&bull;</span>
            <span>QR: <strong className={includeQrCodes ? 'text-emerald-400' : 'text-slate-500'}>{includeQrCodes ? 'Active' : 'Off'}</strong></span>
            <span>&bull;</span>
            <span>Pages: <strong className="text-white">{estimatedPages}</strong> {estimatedPages === 1 ? 'sheet' : 'sheets'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenPdfPreview}
              disabled={filteredVouchers.length === 0 || isExporting}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition-colors disabled:opacity-40 cursor-pointer"
              title="Open vector PDF preview in a new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Preview PDF Tab</span>
            </button>

            <button
              onClick={handleBrowserPrint}
              disabled={filteredVouchers.length === 0}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition-colors disabled:opacity-40 cursor-pointer"
              title="Direct browser printing"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Print via Browser</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={filteredVouchers.length === 0 || isExporting}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-40 cursor-pointer"
            >
              {exportSuccess ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Downloaded!</span>
                </>
              ) : isExporting ? (
                <span>Generating PDF with QR Codes...</span>
              ) : (
                <>
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>Download Print-Ready PDF</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Printable section live preview */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-950/70 rounded-xl border border-slate-800 my-2">
          {filteredVouchers.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No vouchers match the current filter. Select "All Vouchers" to view available passes.
            </div>
          ) : (
            <div
              id="printable-voucher-section"
              className={`grid gap-4 ${
                layoutDensity === '8_per_page'
                  ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                  : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
              }`}
            >
              {filteredVouchers.map((v) => {
                const qrUrl = previewQrMap[v.code];
                return (
                  <div
                    key={v.id}
                    className={`bg-white text-slate-900 rounded-xl p-3 flex flex-col justify-between shadow-sm relative overflow-hidden transition-all ${
                      showCutGuides ? 'border-2 border-dashed border-slate-300' : 'border border-slate-200'
                    }`}
                    style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
                  >
                    {/* Scissor trim icon on card */}
                    {showCutGuides && (
                      <div className="absolute top-1 left-1.5 text-[9px] text-slate-400 flex items-center gap-0.5 pointer-events-none font-mono">
                        <span>✂</span>
                        <span className="text-[7px] text-slate-300">--</span>
                      </div>
                    )}

                    {/* Header with school name */}
                    <div className="bg-emerald-900 text-white rounded-lg p-2.5 -mx-1 -mt-1 mb-2">
                      <div className="flex items-center justify-between text-[9px]">
                        <span className="font-bold tracking-wider uppercase">
                          Annafunan Integrated School
                        </span>
                        <span className="text-[8px] bg-emerald-800 text-emerald-200 px-1.5 py-0.2 rounded font-mono">
                          SSID: AIS-Campus-WiFi
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1 text-[8px] text-emerald-100">
                        <span className="font-semibold uppercase tracking-wide">
                          {v.profileLabel}
                        </span>
                        {distributeTo && (
                          <span className="text-emerald-200 italic font-sans text-[7.5px]">
                            {distributeTo}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle Section: Code + Specs + QR Code */}
                    <div className="flex gap-2 items-center my-1">
                      {/* Left: Code Box & Specs */}
                      <div className="flex-1 min-w-0">
                        <div className="py-1.5 px-2 bg-slate-100 border border-slate-300 rounded-lg text-center">
                          <span className="text-[7.5px] text-slate-500 uppercase font-bold block tracking-wider mb-0.5">
                            Authentication Code
                          </span>
                          <span className="text-xs sm:text-sm font-mono font-extrabold text-slate-950 tracking-wider break-all">
                            {v.code}
                          </span>
                        </div>

                        {/* Specs */}
                        <div className="text-[8px] text-slate-600 space-y-0.5 font-mono mt-1.5 px-1">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Duration:</span>
                            <span className="font-bold text-slate-800">
                              {v.durationMinutes >= 60 ? `${v.durationMinutes / 60}h` : `${v.durationMinutes}m`}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Quota:</span>
                            <span className="font-bold text-slate-800">
                              {v.dataQuotaMB > 0 ? `${v.dataQuotaMB} MB` : 'Unlim'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Speed:</span>
                            <span className="font-bold text-slate-800">
                              {v.speedLimitDownMbps}M / {v.speedLimitUpMbps}M
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Real QR Code */}
                      {includeQrCodes && (
                        <div className="w-18 flex flex-col items-center justify-center p-1 bg-white border border-slate-200 rounded-lg shrink-0">
                          {qrUrl ? (
                            <img
                              src={qrUrl}
                              alt={`QR for ${v.code}`}
                              className="w-16 h-16 object-contain rounded"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-slate-100 flex items-center justify-center text-[8px] text-slate-400 animate-pulse">
                              Loading...
                            </div>
                          )}
                          <span className="text-[6.5px] font-bold text-emerald-700 mt-0.5 uppercase tracking-tighter">
                            Scan to Connect
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Instructions */}
                    <div className="text-[8px] text-slate-500 pt-1.5 border-t border-slate-200 text-center leading-tight mt-1">
                      <div>
                        1. Connect to <strong>AIS-Campus-WiFi</strong> &bull; 2. Scan QR or enter code
                      </div>
                      <div className="text-[7px] text-slate-400 mt-0.5 italic">
                        Camera scan auto-connects &bull; DepEd ICT Guidelines
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer info */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <div>
            Students can scan the printed QR code with their mobile phone's native camera to authenticate instantly without typing.
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
