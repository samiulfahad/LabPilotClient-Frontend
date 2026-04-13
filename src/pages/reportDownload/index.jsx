import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, Printer, X } from "lucide-react";
import ReportViewer from "./ReportViewer";
import reportService from "../../api/report";
import { useAuthStore } from "../../store/authStore";

// ─── Styles ───────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

  #ur-portal-root {
    position: fixed;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    width: 100% !important;
    height: 100% !important;
    z-index: 99999 !important;
    overflow: hidden;
    height: 100dvh !important;
  }

  .ur-drawer {
    position: absolute;
    inset: 0;
    background: #f7f8fa;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: ur-slide-in 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards;
  }
  @keyframes ur-slide-in  { from { transform: translateX(-100%); } to { transform: translateX(0); } }
  .ur-drawer.closing      { animation: ur-slide-out 0.25s cubic-bezier(0.32, 0, 0.67, 0) forwards; }
  @keyframes ur-slide-out { from { transform: translateX(0); } to { transform: translateX(-100%); } }

  .ur-drawer-header {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
    min-height: 56px;
    padding-top: max(12px, env(safe-area-inset-top, 12px));
    padding-bottom: 12px;
    padding-left: 12px;
    padding-right: 12px;
    background: #0d1117;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    flex-shrink: 0;
    overflow: visible;
  }

  .ur-drawer-icon {
    width: 32px; height: 32px; min-width: 32px;
    border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .ur-drawer-icon.view { background: rgba(5, 150, 105, 0.25); }

  .ur-drawer-title {
    flex: 1 1 0%;
    min-width: 0;
    overflow: hidden;
  }
  .ur-drawer-title h2 {
    font-family: 'Outfit', sans-serif;
    font-size: 13px; font-weight: 700; color: #f1f5f9;
    letter-spacing: -0.01em; margin: 0; line-height: 1.25;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .ur-drawer-title p {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px; color: rgba(255,255,255,0.3);
    margin: 3px 0 0; text-transform: uppercase; letter-spacing: 0.07em;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }

  .ur-print-badge {
    display: flex; align-items: center; gap: 5px;
    padding: 3px 8px;
    border-radius: 20px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px; font-weight: 500;
    letter-spacing: 0.06em; text-transform: uppercase;
    flex-shrink: 0;
    white-space: nowrap;
  }
  @media (max-width: 400px) { .ur-print-badge { display: none !important; } }
  .ur-print-badge.pad   { background: rgba(124,58,237,0.18); border: 1px solid rgba(124,58,237,0.35); color: #c4b5fd; }
  .ur-print-badge.plain { background: rgba(37,99,235,0.18);  border: 1px solid rgba(37,99,235,0.35);  color: #93c5fd; }

  .ur-close-btn {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: 40px !important;
    height: 40px !important;
    min-width: 40px !important;
    min-height: 40px !important;
    flex-shrink: 0 !important;
    flex-grow: 0 !important;
    border-radius: 10px;
    background: rgba(255,255,255,0.10);
    border: 1.5px solid rgba(255,255,255,0.18);
    cursor: pointer;
    color: #ffffff;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
    padding: 0;
    box-sizing: border-box;
  }
  .ur-close-btn:hover,
  .ur-close-btn:active {
    background: rgba(220,38,38,0.30) !important;
    border-color: rgba(220,38,38,0.50) !important;
    color: #fca5a5 !important;
  }

  .ur-drawer-body {
    flex: 1 1 0%;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    background: #f7f8fa;
  }
  .ur-drawer-body::-webkit-scrollbar { width: 4px; }
  .ur-drawer-body::-webkit-scrollbar-track { background: transparent; }
  .ur-drawer-body::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

  .ur-loading {
    display: flex; align-items: center; justify-content: center;
    padding: 80px 24px; flex-direction: column; gap: 12px;
  }
  .ur-spinner {
    width: 28px; height: 28px; border-radius: 50%;
    border: 2.5px solid rgba(0,0,0,0.08);
    border-top-color: #60a5fa;
    animation: ur-spin 0.7s linear infinite;
  }
  @keyframes ur-spin { to { transform: rotate(360deg); } }
`;

// ─── Portal hook ──────────────────────────────────────────────────────────────
function useBodyPortal() {
  const [el, setEl] = useState(null);

  useEffect(() => {
    const styleId = "ur-styles-v4";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = STYLES;
      document.head.appendChild(style);
    }
    ["ur-styles-v2", "ur-styles-v3"].forEach((id) => {
      document.getElementById(id)?.remove();
    });

    const div = document.createElement("div");
    div.id = "ur-portal-root";
    document.body.appendChild(div);
    setEl(div);

    const savedOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.removeChild(div);
      document.body.style.overflow = savedOverflow;
    };
  }, []);

  return el;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (val) => {
  if (!val) return "";
  const d = new Date(val);
  return isNaN(d) ? "" : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

// Map the store's lab shape → ReportViewer's labInfo shape
function buildLabInfo(storeLab) {
  if (!storeLab) return null;
  return {
    name: storeLab.name ?? "Lab",
    tagline: storeLab.tagline ?? "",
    address: [storeLab.contact?.address, storeLab.contact?.district].filter(Boolean).join(", "),
    email: storeLab.contact?.publicEmail ?? "",
    phone: storeLab.contact?.primary ?? "",
    regNo: storeLab.labKey ? String(storeLab.labKey) : "",
  };
}

// ─── Error state ──────────────────────────────────────────────────────────────
function ErrorState({ message, onClose }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 24px",
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      <div
        style={{
          background: "#fff",
          border: "1px solid #e4e7ed",
          borderRadius: 16,
          padding: "36px 32px",
          maxWidth: 360,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            background: "#fef2f2",
            border: "1.5px solid rgba(220,38,38,0.2)",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <Eye style={{ width: 20, height: 20, color: "#dc2626" }} />
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#0d1117", marginBottom: 8 }}>
          {message || "Failed to load report"}
        </div>
        <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6, marginBottom: 20 }}>
          Please go back and try again.
        </div>
        <button
          onClick={onClose}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "10px 20px",
            background: "#0d1117",
            color: "#fff",
            border: "none",
            borderRadius: 9,
            fontFamily: "'Outfit', sans-serif",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <ArrowLeft style={{ width: 13, height: 13 }} /> Go Back
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ReportDownload() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // ── Pull lab from Zustand auth store ────────────────────────────────────────
  const storeLab = useAuthStore((s) => s.lab);
  const labInfo = buildLabInfo(storeLab);

  const invoiceId = searchParams.get("invoiceId");
  const testId = searchParams.get("testId");
  const testName = searchParams.get("testName") ?? "Report";
  const printType = searchParams.get("printType") ?? "PLAIN";
  const isPad = printType === "PAD";

  const [report, setReport] = useState(null);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [closing, setClosing] = useState(false);

  const portalEl = useBodyPortal();

  useEffect(() => {
    if (!invoiceId || !testId) {
      setError("Missing invoice or test information.");
      setLoading(false);
      return;
    }
    reportService
      .getById(invoiceId, testId)
      .then(({ data }) => {
        setReport(data.report);
        setPatient({
          name: data.patient?.name ?? "",
          age: data.patient?.age != null ? `${data.patient.age} yrs` : "",
          gender: data.patient?.gender ?? "",
          contact: data.patient?.contactNumber ?? "",
          referredBy: data.referrer?.name ?? "",
          sampleDate: formatDate(data.report?.sampleCollectionDate),
          reportDate: formatDate(data.report?.reportDate),
        });
      })
      .catch(() => setError("Failed to load report."))
      .finally(() => setLoading(false));
  }, [invoiceId, testId]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      if (window.history.length > 1) navigate(-1);
      else window.close();
    }, 250);
  };

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!portalEl) return null;

  return createPortal(
    <div className={`ur-drawer${closing ? " closing" : ""}`}>
      {/* ── Header ── */}
      <div className="ur-drawer-header">
        <div className="ur-drawer-icon view">
          <Eye style={{ width: 15, height: 15, color: "#6ee7b7" }} />
        </div>

        <div className="ur-drawer-title">
          <h2>View — {testName}</h2>
          <p>{invoiceId ? `Invoice #${invoiceId}` : "Report Details"}</p>
        </div>

        <div className={`ur-print-badge ${isPad ? "pad" : "plain"}`}>
          <Printer style={{ width: 10, height: 10 }} />
          {isPad ? "Pad" : "Plain A4"}
        </div>

        <button className="ur-close-btn" onClick={handleClose} title="Close (Esc)" aria-label="Close report">
          <X style={{ width: 18, height: 18, display: "block" }} />
        </button>
      </div>

      {/* ── Body ── */}
      <div className="ur-drawer-body">
        {loading && (
          <div className="ur-loading">
            <div className="ur-spinner" />
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
              }}
            >
              Loading report…
            </span>
          </div>
        )}
        {!loading && error && <ErrorState message={error} onClose={handleClose} />}
        {!loading && !error && report && (
          <div style={{ padding: "20px 16px" }}>
            <ReportViewer
              report={report}
              patient={patient}
              printType={printType}
              invoiceId={invoiceId}
              //  Pass dynamic lab info; ReportViewer falls back to its own
              //     LAB_INFO constant if labInfo is null (e.g. store cleared) 
              {...(labInfo && { labInfo })}
            />
          </div>
        )}
      </div>
    </div>,
    portalEl,
  );
}