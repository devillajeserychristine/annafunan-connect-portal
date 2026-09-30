import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, RefreshCw, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import jsQR from 'jsqr';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (code: string) => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  const stopCamera = () => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const startCamera = async () => {
    setError(null);
    setScannedCode(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera access is not supported by your browser or environment.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setScanning(true);
        requestScan();
      }
    } catch (err: any) {
      console.error('Camera error', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission was denied. Please allow camera access in your browser settings.');
      } else {
        setError('Could not access device camera. You may also type your voucher code directly.');
      }
    }
  };

  const parseVoucherString = (data: string): string => {
    try {
      // Check if data is a URL containing ?voucher= or ?code=
      if (data.includes('?') && (data.includes('voucher=') || data.includes('code='))) {
        const url = new URL(data, window.location.origin);
        const v = url.searchParams.get('voucher') || url.searchParams.get('code');
        if (v) return v.trim().toUpperCase();
      }
    } catch (e) {
      // Not a valid URL, treat as raw text
    }
    return data.trim().toUpperCase();
  };

  const requestScan = () => {
    const scanLoop = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState >= 2) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const qr = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (qr && qr.data) {
            const raw = qr.data;
            const extractedCode = parseVoucherString(raw);
            if (extractedCode) {
              setScannedCode(extractedCode);
              stopCamera();
              // Haptic feedback if supported
              if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate([40, 60, 40]);
              }
              setTimeout(() => {
                onScanSuccess(extractedCode);
                onClose();
              }, 600);
              return;
            }
          }
        }
      }

      animFrameIdRef.current = requestAnimationFrame(scanLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(scanLoop);
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 text-slate-100 flex flex-col items-center relative overflow-hidden">
        {/* Header */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Camera className="w-4 h-4" />
            </span>
            <span className="text-sm font-bold text-white">Scan Voucher QR Code</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Viewport */}
        <div className="w-full aspect-square bg-slate-950 rounded-2xl overflow-hidden relative my-4 border border-slate-800 flex items-center justify-center">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            muted
            playsInline
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Reticle / Aiming Box */}
          {scanning && !scannedCode && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-2 border-blue-400/80 rounded-2xl relative">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-blue-400 -mt-1 -ml-1 rounded-tl" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-blue-400 -mt-1 -mr-1 rounded-tr" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-blue-400 -mb-1 -ml-1 rounded-bl" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-blue-400 -mb-1 -mr-1 rounded-br" />
                {/* Scanning laser line */}
                <div className="w-full h-0.5 bg-blue-400 shadow-sm shadow-blue-400 animate-pulse mt-24" />
              </div>
            </div>
          )}

          {/* Success overlay */}
          {scannedCode && (
            <div className="absolute inset-0 bg-blue-950/90 flex flex-col items-center justify-center p-4 text-center">
              <CheckCircle2 className="w-12 h-12 text-blue-400 mb-2 animate-bounce" />
              <div className="text-xs font-semibold text-blue-200">Voucher Detected!</div>
              <div className="text-sm font-mono font-bold text-white mt-1 bg-slate-900 px-3 py-1 rounded-lg border border-blue-500/40">
                {scannedCode}
              </div>
              <div className="text-[11px] text-blue-300 mt-2">Connecting to school Wi-Fi...</div>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="absolute inset-0 p-5 bg-slate-950/95 flex flex-col items-center justify-center text-center">
              <AlertCircle className="w-8 h-8 text-amber-400 mb-2" />
              <div className="text-xs font-semibold text-white mb-1">Camera Unavailable</div>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                {error}
              </p>
              <button
                onClick={startCamera}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-white font-medium flex items-center gap-1.5 border border-slate-700"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Camera</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Hint */}
        <p className="text-[11px] text-slate-400 text-center">
          Hold your printed voucher slip or teacher's screen in front of the camera to connect without typing.
        </p>

        <button
          onClick={onClose}
          className="w-full mt-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
        >
          Cancel & Enter Manually
        </button>
      </div>
    </div>
  );
};
