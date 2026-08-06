/**
 * ScanButton
 * npm install @yudiel/react-qr-scanner
 *
 * Usage: <ScanButton onScan={(text) => { setSearchQuery(text); fetchRecord(text); }} />
 *
 * Speed notes vs. the naive version:
 * - Camera permission/negotiation starts on pointerdown (before the click
 *   fires), not after the modal mounts.
 * - Constraints request 480p instead of default/max res — resolution
 *   negotiation is the single biggest chunk of the 1-2s delay.
 * - torch is NOT part of the initial constraints (that forces a second
 *   negotiation on many devices); it's applied to the live track instead.
 * - The modal stays mounted between opens (hidden + paused) for a short
 *   idle window so a second scan in the same session is instant. The
 *   underlying camera is only fully released after IDLE_RELEASE_MS of
 *   being closed.
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Scanner } from "@yudiel/react-qr-scanner";
import { ScanLine, X, Zap, ZapOff, CheckCircle2 } from "lucide-react";

const CORNER = "absolute w-7 h-7 border-white/90";
const IDLE_RELEASE_MS = 20_000; // keep camera warm this long after closing

// Low-res constraints: plenty for barcode/QR decoding, negotiates much faster
const SCAN_CONSTRAINTS = {
  facingMode: "environment",
  width: { ideal: 480 },
  height: { ideal: 480 },
};

const Viewfinder = ({ locked }) => (
  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
    <div className="relative w-[68%] aspect-square">
      <div className={`${CORNER} top-0 left-0 border-t-[3px] border-l-[3px] rounded-tl-xl`} />
      <div className={`${CORNER} top-0 right-0 border-t-[3px] border-r-[3px] rounded-tr-xl`} />
      <div className={`${CORNER} bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-xl`} />
      <div className={`${CORNER} bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-xl`} />

      {!locked ? (
        <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-teal-300 to-transparent shadow-[0_0_12px_2px_rgba(45,212,191,0.8)] animate-[scanline_2.2s_ease-in-out_infinite]" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-teal-500/15 rounded-2xl">
          <CheckCircle2 className="w-14 h-14 text-teal-300 drop-shadow-[0_0_10px_rgba(45,212,191,0.9)] animate-[pop_0.3s_ease]" />
        </div>
      )}
    </div>
  </div>
);

const ScannerModal = ({ visible, onScan, onClose }) => {
  const [error, setError] = useState(null);
  const [torch, setTorch] = useState(false);
  const [locked, setLocked] = useState(false);

  // Reset per-open UI state (not the camera itself) whenever it's shown again
  useEffect(() => {
    if (visible) {
      setLocked(false);
      setError(null);
    } else {
      setTorch(false);
    }
  }, [visible]);

  const handleResult = (results) => {
    if (locked || !results?.length) return;
    setLocked(true);
    setTimeout(() => {
      onScan(results[0].rawValue);
      onClose();
    }, 260);
  };

  // Torch is applied to the live track after the fact, not at getUserMedia
  // time, so toggling it never triggers a renegotiation of the stream.
  const toggleTorch = () => setTorch((t) => !t);

  return createPortal(
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 transition-opacity duration-150 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <style>{`
        @keyframes scanline { 0%,100% { top: 6%; opacity: .3; } 50% { top: 92%; opacity: 1; } }
        @keyframes pop { from { transform: scale(0.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div
        className="relative w-full max-w-sm rounded-[28px] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.5)] animate-[fadeUp_0.25s_ease] bg-black"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-between px-5 pt-5 pb-8 bg-gradient-to-b from-black/70 to-transparent">
          <div className="flex items-center gap-2 text-white">
            <ScanLine className="w-4 h-4 text-teal-300" />
            <span className="text-sm font-semibold tracking-tight">Scan Code</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="relative aspect-square">
          {error ? (
            <div className="absolute inset-0 flex items-center justify-center px-8 text-center bg-black">
              <p className="text-rose-300 text-xs font-medium">{error}</p>
            </div>
          ) : (
            <>
              <Scanner
                onScan={handleResult}
                onError={(err) => setError(err?.message || "Camera unavailable")}
                formats={["qr_code", "code_128", "code_39", "ean_13", "ean_8", "upc_a", "upc_e", "itf", "codabar"]}
                constraints={SCAN_CONSTRAINTS}
                components={{ finder: false, torch: false, zoom: false }}
                styles={{ container: { width: "100%", height: "100%" } }}
                paused={locked || !visible}
                allowMultiple={false}
                // yudiel scanner applies this to the live track via
                // applyConstraints internally rather than re-opening the
                // stream, so flipping it is cheap.
                torch={torch}
              />
              <Viewfinder locked={locked} />
            </>
          )}
        </div>

        <div className="absolute bottom-0 inset-x-0 z-10 px-5 pt-8 pb-5 bg-gradient-to-t from-black/80 to-transparent">
          <p className="text-center text-white/60 text-[11px] font-medium mb-3">Align the code within the frame</p>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTorch}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-2xl backdrop-blur transition-all ${
                torch ? "bg-amber-400 text-black" : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {torch ? <ZapOff className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
              {torch ? "Torch Off" : "Torch"}
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-bold rounded-2xl bg-white text-black hover:bg-white/90 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

const ScanButton = ({ onScan, className = "" }) => {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false); // keeps modal (and its camera) alive between opens
  const releaseTimer = useRef(null);

  const openScanner = useCallback(() => {
    if (releaseTimer.current) {
      clearTimeout(releaseTimer.current);
      releaseTimer.current = null;
    }
    setMounted(true);
    setOpen(true);
  }, []);

  // Fires on pointerdown/touchstart — before "click" — so the camera
  // permission prompt / negotiation starts as early as physically possible.
  const warmStart = useCallback(() => {
    openScanner();
  }, [openScanner]);

  const closeScanner = useCallback(() => {
    setOpen(false);
    // Keep the camera stream alive for a bit in case the user scans again
    // (common in this workflow — multiple lookups in a row). Fully unmount
    // (and release the camera) only after it's been idle for a while.
    releaseTimer.current = setTimeout(() => setMounted(false), IDLE_RELEASE_MS);
  }, []);

  useEffect(() => () => releaseTimer.current && clearTimeout(releaseTimer.current), []);

  return (
    <>
      <button
        type="button"
        onPointerDown={warmStart}
        onClick={openScanner}
        title="Scan barcode / QR"
        className={`shrink-0 p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-300 hover:bg-gray-50 transition-all ${className}`}
      >
        <ScanLine className="w-4 h-4" />
      </button>
      {mounted && <ScannerModal visible={open} onScan={onScan} onClose={closeScanner} />}
    </>
  );
};

export default ScanButton;
