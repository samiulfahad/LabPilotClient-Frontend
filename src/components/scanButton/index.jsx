/**
 * ScanButton
 * npm install @yudiel/react-qr-scanner
 *
 * Icon button that opens a camera scanner modal. On successful scan,
 * calls onScan(text) — wire it to whatever setSearchQuery/fetchRecord
 * you already have. Manual typing in the host input keeps working as-is;
 * this only adds the scan path.
 *
 * Usage (drop next to any search input):
 *   <ScanButton onScan={(text) => { setSearchQuery(text); fetchRecord(text); }} />
 */
import { useState } from "react";
import { createPortal } from "react-dom";
import { Scanner } from "@yudiel/react-qr-scanner";
import { ScanLine, X, Zap, ZapOff } from "lucide-react";

const ScannerModal = ({ onScan, onClose }) => {
  const [error, setError] = useState(null);
  const [torch, setTorch] = useState(false);
  const [paused, setPaused] = useState(false);

  const handleResult = (results) => {
    if (paused || !results?.length) return;
    setPaused(true);
    onScan(results[0].rawValue);
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-[0_25px_60px_rgba(15,23,42,0.25)] w-full max-w-sm overflow-hidden animate-[fadeUp_0.25s_ease]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gray-900 text-white flex items-center justify-center shrink-0">
              <ScanLine className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-gray-800">Scan Code</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="relative aspect-square bg-black">
          {error ? (
            <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
              <p className="text-rose-300 text-xs font-medium">{error}</p>
            </div>
          ) : (
            <Scanner
              onScan={handleResult}
              onError={(err) => setError(err?.message || "Camera unavailable")}
              formats={["qr_code", "code_128", "code_39", "ean_13", "ean_8", "upc_a", "upc_e", "itf", "codabar"]}
              constraints={{ facingMode: "environment", torch }}
              components={{ finder: true, torch: false, zoom: false }}
              styles={{ container: { width: "100%", height: "100%" } }}
              paused={paused}
              allowMultiple={false}
            />
          )}
        </div>

        <div className="px-5 py-4 flex items-center gap-2">
          <button
            onClick={() => setTorch((t) => !t)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-xl border transition-all ${
              torch ? "bg-amber-50 border-amber-200 text-amber-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {torch ? <ZapOff className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
            {torch ? "Torch Off" : "Torch"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-gray-900 text-white hover:bg-gray-700 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

const ScanButton = ({ onScan, className = "" }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Scan barcode / QR"
        className={`shrink-0 p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-300 hover:bg-gray-50 transition-all ${className}`}
      >
        <ScanLine className="w-4 h-4" />
      </button>
      {open && <ScannerModal onScan={onScan} onClose={() => setOpen(false)} />}
    </>
  );
};

export default ScanButton;
