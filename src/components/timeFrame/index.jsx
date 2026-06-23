import { useState } from "react";
import { Clock, Calendar, CalendarDays, CalendarRange, ArrowRight, X, Circle } from "lucide-react";

// ─── helpers ─────────────────────────────────────────────────────────────────
const toStartOfDay = (d) => new Date(d).setHours(0, 0, 0, 0);
const toEndOfDay = (d) => new Date(d).setHours(23, 59, 59, 999);

const buildRange = (mode, a, b) => {
  if (mode === "today") {
    const n = new Date();
    return { start: new Date(n).setHours(0, 0, 0, 0), end: new Date(n).setHours(23, 59, 59, 999) };
  }
  if (mode === "date") return { start: toStartOfDay(a), end: toEndOfDay(a) };
  if (mode === "month") {
    const d = new Date(a);
    return {
      start: new Date(d.getFullYear(), d.getMonth(), 1).setHours(0, 0, 0, 0),
      end: new Date(d.getFullYear(), d.getMonth() + 1, 0).setHours(23, 59, 59, 999),
    };
  }
  if (mode === "dateRange") return { start: toStartOfDay(a), end: toEndOfDay(b) };
};

const buildLabel = (mode, a, b) => {
  const fmt = (s, o) => new Date(s).toLocaleString("en-US", o);
  if (mode === "today") return "Today";
  if (mode === "date") return fmt(a, { year: "numeric", month: "long", day: "numeric" });
  if (mode === "month") return fmt(a, { year: "numeric", month: "long" });
  if (mode === "dateRange") {
    const s = fmt(a, { month: "short", day: "numeric", year: "numeric" });
    const e = fmt(b, { month: "short", day: "numeric", year: "numeric" });
    return `${s} – ${e}`;
  }
};

// ─── PickerPanel ──────────────────────────────────────────────────────────────
const PickerPanel = ({ mode, onConfirm, onCancel }) => {
  const today = new Date().toISOString().split("T")[0];
  const thisMonth = today.slice(0, 7);
  const [a, setA] = useState(today);
  const [b, setB] = useState(today);

  const rangeErr = mode === "dateRange" && a && b && a > b;
  const valid = mode === "date" || mode === "month" ? !!a : !!a && !!b && !rangeErr;

  const apply = () => {
    if (valid) onConfirm(mode, a, mode === "dateRange" ? b : a);
  };

  const inputClass =
    "w-full py-2 px-[11px] text-[12.5px] font-['DM_Mono',_monospace] font-medium border-[1.5px] border-[#e0ddf8] rounded-[9px] bg-[#f8f7ff] text-[#2d2b55] outline-none transition-all duration-150 focus:border-[#7c6ff5] focus:bg-white focus:shadow-[0_0_0_3px_rgba(124,111,245,0.12)] box-border";

  return (
    <div className="mt-3 pt-3 border-t-[1.5px] border-dashed border-[#ebebf5] flex items-end gap-2.5 flex-wrap animate-[tf-drop_0.15s_ease]">
      {mode === "date" && (
        <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
          <span className="text-[10.5px] font-semibold text-[#9898b8] uppercase tracking-[0.06em]">Date</span>
          <input type="date" value={a} max={today} onChange={(e) => setA(e.target.value)} className={inputClass} />
        </div>
      )}
      {mode === "month" && (
        <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
          <span className="text-[10.5px] font-semibold text-[#9898b8] uppercase tracking-[0.06em]">Month</span>
          <input
            type="month"
            value={a.slice(0, 7)}
            max={thisMonth}
            onChange={(e) => setA(e.target.value + "-01")}
            className={inputClass}
          />
        </div>
      )}
      {mode === "dateRange" && (
        <>
          <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
            <span className="text-[10.5px] font-semibold text-[#9898b8] uppercase tracking-[0.06em]">From</span>
            <input type="date" value={a} max={today} onChange={(e) => setA(e.target.value)} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
            <span className="text-[10.5px] font-semibold text-[#9898b8] uppercase tracking-[0.06em]">To</span>
            <input
              type="date"
              value={b}
              min={a}
              max={today}
              onChange={(e) => setB(e.target.value)}
              className={inputClass}
            />
          </div>
        </>
      )}

      <div className="flex gap-1.5 items-center shrink-0 pb-[1px]">
        <button
          className="w-[34px] h-[34px] rounded-[9px] border-[1.5px] border-[#e8e8f0] bg-[#fafafd] text-[#9898b8] flex items-center justify-center cursor-pointer transition-all duration-150 outline-none hover:border-[#f0a0a0] hover:text-[#d05050] hover:bg-[#fff4f4]"
          onClick={onCancel}
        >
          <X size={13} strokeWidth={2.5} />
        </button>
        <button
          className="inline-flex items-center gap-1.5 py-2 px-4 rounded-[9px] bg-[#4a3fbe] border-none text-white text-[12.5px] font-semibold font-['DM_Sans',_sans-serif] cursor-pointer transition-all duration-150 outline-none whitespace-nowrap enabled:hover:bg-[#3b31a8] enabled:hover:shadow-[0_3px_10px_rgba(74,63,190,0.3)] enabled:hover:-translate-y-[1px] disabled:opacity-[0.38] disabled:cursor-not-allowed disabled:transform-none"
          onClick={apply}
          disabled={!valid}
        >
          <ArrowRight size={12} strokeWidth={2.5} /> Apply
        </button>
      </div>

      {rangeErr && <p className="w-full text-[11px] text-[#d05050] mt-[-4px]">End date must be after start date.</p>}
    </div>
  );
};

// ─── TimeFrame ────────────────────────────────────────────────────────────────
const FILTERS = [
  { key: "today", label: "Today", icon: Clock },
  { key: "date", label: "By Date", icon: Calendar },
  { key: "month", label: "By Month", icon: CalendarDays },
  { key: "dateRange", label: "Date Range", icon: CalendarRange },
];

const TimeFrame = ({ onFetchData }) => {
  const [activeMode, setActiveMode] = useState("today");
  const [activeLabel, setActiveLabel] = useState("Today");
  const [pickerMode, setPickerMode] = useState(null);

  const fireToday = () => {
    const { start, end } = buildRange("today");
    setActiveMode("today");
    setActiveLabel("Today");
    setPickerMode(null);
    onFetchData(start, end, "Today");
  };

  const handleTab = (key) => {
    if (key === "today") {
      fireToday();
      return;
    }
    setPickerMode((p) => (p === key ? null : key));
  };

  const handleConfirm = (mode, a, b) => {
    const { start, end } = buildRange(mode, a, b);
    const label = buildLabel(mode, a, b);
    setActiveMode(mode);
    setActiveLabel(label);
    setPickerMode(null);
    onFetchData(start, end, label);
  };

  return (
    <>
      {/* Retaining the entry keyframe definition locally to preserve dropdown behavior seamlessly */}
      <style>{`
        @keyframes tf-drop {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="font-['DM_Sans',_sans-serif] bg-white border-[1.5px] border-[#e8e8f0] rounded-[16px] pt-[14px] pb-[14px] px-4 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(80,60,180,0.04)]">
        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTERS.map(({ key, label, icon: TabIcon }) => {
            const isActive = activeMode === key;
            const isOpen = pickerMode === key;

            return (
              <button
                key={key}
                onClick={() => handleTab(key)}
                className={`inline-flex items-center gap-1.5 py-[7px] px-[13px] rounded-[10px] border-[1.5px] text-[12.5px] font-medium cursor-pointer transition-all duration-150 whitespace-nowrap tracking-[-0.01em] outline-none relative overflow-hidden
                  ${
                    isActive
                      ? "bg-[#4a3fbe] border-[#4a3fbe] text-white shadow-[0_2px_8px_rgba(74,63,190,0.28)]"
                      : isOpen
                        ? "bg-[#f0eeff] border-[#c4bcf8] text-[#4a3fbe]"
                        : "border-[#ebebf5] bg-[#fafafd] text-[#6b6b8a] hover:border-[#c8c4f0] hover:text-[#4a3fbe] hover:bg-[#f4f2ff]"
                  }`}
              >
                <TabIcon size={14} strokeWidth={2.2} />
                {label}
              </button>
            );
          })}

          <div className="ml-auto inline-flex items-center gap-[7px] pt-1.5 pb-1.5 pr-3 pl-2.5 rounded-[10px] bg-[#f6f5ff] border-[1.5px] border-[#e0dcfc] text-[#4a3fbe] text-xs font-semibold font-['DM_Mono',_monospace] tracking-[-0.02em] whitespace-nowrap max-w-[240px] truncate">
            <span className="text-[#7c6ff5] shrink-0 animate-pulse">
              <Circle size={6} fill="currentColor" strokeWidth={0} />
            </span>
            {activeLabel}
          </div>
        </div>

        {pickerMode && <PickerPanel mode={pickerMode} onConfirm={handleConfirm} onCancel={() => setPickerMode(null)} />}
      </div>
    </>
  );
};

export default TimeFrame;
