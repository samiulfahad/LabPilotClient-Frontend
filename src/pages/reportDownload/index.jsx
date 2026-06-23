import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, Printer, X } from "lucide-react";
import ReportViewer from "./ReportViewer";
import reportService from "../../api/report";
import { useAuthStore } from "../../store/authStore";

// ─── Portal hook ──────────────────────────────────────────────────────────────
function useBodyPortal() {
  const [el, setEl] = useState(null);

  useEffect(() => {
    // Clean up any old injected styles if they exist from previous versions
    ["ur-styles-v2", "ur-styles-v3", "ur-styles-v4"].forEach((id) => {
      document.getElementById(id)?.remove();
    });

    const div = document.createElement("div");
    // Tailwind classes applied directly to the portal root
    div.className = "fixed inset-0 w-full h-full z-[99999] overflow-hidden h-[100dvh]";
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

function buildLabInfo(storeLab) {
  if (!storeLab) return null;
  return {
    name: storeLab.name ?? "Lab",
    tagline: storeLab.tagline ?? "",
    address: [storeLab.contact?.address, storeLab.contact?.district].filter(Boolean).join(", "),
    email: storeLab.contact?.publicEmail ?? "",
    phone: storeLab.contact?.primary ?? "",
    regNo: storeLab.registrationNumber ? String(storeLab.registrationNumber) : "",
  };
}

// ─── Error state ──────────────────────────────────────────────────────────────
function ErrorState({ message, onClose }) {
  return (
    <div className="flex items-center justify-center py-[60px] px-6 font-['Outfit',_sans-serif]">
      <div className="bg-white border border-[#e4e7ed] rounded-[16px] py-9 px-8 max-w-[360px] w-full text-center shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
        <div className="w-12 h-12 bg-[#fef2f2] border-[1.5px] border-[#dc2626]/20 rounded-[12px] flex items-center justify-center mx-auto mb-4">
          <Eye className="w-5 h-5 text-[#dc2626]" />
        </div>
        <div className="text-base font-bold text-[#0d1117] mb-2">{message || "Failed to load report"}</div>
        <div className="text-[13px] text-[#6b7280] leading-[1.6] mb-5">Please go back and try again.</div>
        <button
          onClick={onClose}
          className="inline-flex items-center gap-[7px] py-2.5 px-5 bg-[#0d1117] text-white border-none rounded-[9px] font-['Outfit',_sans-serif] text-[13px] font-semibold cursor-pointer"
        >
          <ArrowLeft className="w-[13px] h-[13px]" /> Go Back
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ReportDownload() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const storeLab = useAuthStore((s) => s.lab);
  const labInfo = buildLabInfo(storeLab);

  // ── Params — indoor uses patientId + type=indoor, outdoor uses invoiceId ────
  const type = searchParams.get("type") ?? "outdoor";
  const isIndoor = type === "indoor";

  const invoiceId = searchParams.get("invoiceId");
  const patientId = searchParams.get("patientId");
  const testId = searchParams.get("testId");
  const testName = searchParams.get("testName") ?? "Report";
  const printType = searchParams.get("printType") ?? "PLAIN";
  const isPad = printType === "PAD";

  const [report, setReport] = useState(null);
  const [patient, setPatient] = useState(null);
  const [displayId, setDisplayId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [closing, setClosing] = useState(false);

  const portalEl = useBodyPortal();

  useEffect(() => {
    const hasIds = isIndoor ? patientId && testId : invoiceId && testId;
    if (!hasIds) {
      setError("Missing patient or test information.");
      setLoading(false);
      return;
    }

    const fetch = isIndoor
      ? reportService.getIndoorReport(patientId, testId)
      : reportService.getReport(invoiceId, testId);

    fetch
      .then(({ data }) => {
        setDisplayId(isIndoor ? data.admissionId : data.invoiceId);
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
  }, []);

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
    <>
      <style>{`
        @keyframes ur-slide-in  { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        @keyframes ur-slide-out { from { transform: translateX(0); } to { transform: translateX(-100%); } }
        @keyframes ur-spin { to { transform: rotate(360deg); } }

        .ur-drawer-body-scroll::-webkit-scrollbar { width: 4px; }
        .ur-drawer-body-scroll::-webkit-scrollbar-track { background: transparent; }
        .ur-drawer-body-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}</style>

      <div
        className={`absolute inset-0 bg-[#f7f8fa] flex flex-col overflow-hidden ${closing ? "animate-[ur-slide-out_0.25s_cubic-bezier(0.32,0,0.67,0)_forwards]" : "animate-[ur-slide-in_0.3s_cubic-bezier(0.32,0.72,0,1)_forwards]"}`}
      >
        {/* ── Header ── */}
        <div className="flex flex-row items-center gap-2 min-h-[56px] pt-[max(12px,env(safe-area-inset-top,12px))] pb-3 px-3 bg-[#0d1117] border-b border-white/5 shrink-0 overflow-visible">
          <div className="w-8 h-8 min-w-[32px] rounded-[9px] bg-[#059669]/25 flex items-center justify-center shrink-0">
            <Eye className="w-[15px] h-[15px] text-[#6ee7b7]" />
          </div>

          <div className="flex-1 min-w-0 overflow-hidden">
            <h2 className="font-['Outfit',_sans-serif] text-[13px] font-bold text-[#f1f5f9] tracking-[-0.01em] m-0 leading-[1.25] whitespace-nowrap overflow-hidden text-ellipsis">
              View — {testName}
            </h2>
            <p className="font-['JetBrains_Mono',_monospace] text-[9px] text-white/30 mt-[3px] uppercase tracking-[0.07em] whitespace-nowrap overflow-hidden text-ellipsis">
              {displayId
                ? `${isIndoor ? "Admission" : "Invoice"} #${displayId}`
                : isIndoor
                  ? "Indoor Patient"
                  : "Report Details"}
            </p>
          </div>

          <div
            className={`hidden min-[400px]:flex items-center gap-[5px] px-2 py-[3px] rounded-[20px] font-['JetBrains_Mono',_monospace] text-[9px] font-medium tracking-[0.06em] uppercase shrink-0 whitespace-nowrap ${isPad ? "bg-[#7c3aed]/20 border border-[#7c3aed]/35 text-[#c4b5fd]" : "bg-[#2563eb]/20 border border-[#2563eb]/35 text-[#93c5fd]"}`}
          >
            <Printer className="w-[10px] h-[10px]" />
            {isPad ? "Pad" : "Plain A4"}
          </div>

          <button
            className="flex items-center justify-center w-10 h-10 min-w-[40px] min-h-[40px] shrink-0 grow-0 rounded-[10px] bg-white/10 border-[1.5px] border-white/20 cursor-pointer text-white touch-manipulation transition-colors duration-150 p-0 box-border hover:bg-[#dc2626]/30 hover:border-[#dc2626]/50 hover:text-[#fca5a5] active:bg-[#dc2626]/30 active:border-[#dc2626]/50 active:text-[#fca5a5]"
            onClick={handleClose}
            title="Close (Esc)"
            aria-label="Close report"
          >
            <X className="w-[18px] h-[18px] block" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="ur-drawer-body-scroll flex-1 min-h-0 overflow-y-auto overscroll-contain bg-[#f7f8fa]">
          {loading && (
            <div className="flex flex-col items-center justify-center py-[80px] px-6 gap-3">
              <div className="w-7 h-7 rounded-full border-[2.5px] border-black/10 border-t-[#60a5fa] animate-[ur-spin_0.7s_linear_infinite]" />
              <span className="font-['JetBrains_Mono',_monospace] text-[11px] text-[#64748b] uppercase tracking-[0.07em]">
                Loading report…
              </span>
            </div>
          )}
          {!loading && error && <ErrorState message={error} onClose={handleClose} />}
          {!loading && !error && report && (
            <div className="py-5 px-4">
              <ReportViewer
                report={report}
                patient={patient}
                printType={printType}
                invoiceId={displayId}
                isIndoor={isIndoor}
                {...(labInfo && { labInfo })}
              />
            </div>
          )}
        </div>
      </div>
    </>,
    portalEl,
  );
}
