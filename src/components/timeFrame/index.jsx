import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Clock, Calendar, CalendarDays, CalendarRange, Circle, ChevronLeft, ChevronRight, X } from "lucide-react";

// ─── helpers ─────────────────────────────────────────────────────────────────
const toStartOfDay = (d) => new Date(d).setHours(0, 0, 0, 0);
const toEndOfDay = (d) => new Date(d).setHours(23, 59, 59, 999);
const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const buildRange = (mode, d, d2) => {
  if (mode === "today") {
    const n = new Date();
    return { start: new Date(n).setHours(0, 0, 0, 0), end: new Date(n).setHours(23, 59, 59, 999) };
  }
  if (mode === "date") return { start: toStartOfDay(d), end: toEndOfDay(d) };
  if (mode === "month") {
    return {
      start: new Date(d.getFullYear(), d.getMonth(), 1).setHours(0, 0, 0, 0),
      end: new Date(d.getFullYear(), d.getMonth() + 1, 0).setHours(23, 59, 59, 999),
    };
  }
  if (mode === "dateRange") return { start: toStartOfDay(d), end: toEndOfDay(d2) };
};

const buildLabel = (mode, d, d2) => {
  if (mode === "today") return "Today";
  if (mode === "date") return d.toLocaleString("en-US", { year: "numeric", month: "long", day: "numeric" });
  if (mode === "month") return d.toLocaleString("en-US", { year: "numeric", month: "long" });
  if (mode === "dateRange") {
    const s = d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const e = d2.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return `${s} – ${e}`;
  }
};

// ─── Modal shell ──────────────────────────────────────────────────────────────
const ModalShell = ({ onClose, children }) => {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return createPortal(
    <div
      className="fixed left-0 top-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-sm animate-[tf-fade_0.15s_ease] px-4"
      style={{ width: "100vw", height: "100dvh" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[20px] shadow-[0_20px_60px_rgba(30,20,90,0.25)] w-full max-w-[320px] p-4 animate-[tf-pop_0.18s_cubic-bezier(0.2,0.9,0.3,1.2)]"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
};

// ─── Day calendar ─────────────────────────────────────────────────────────────
const DayCalendar = ({ initial, onPick, onClose }) => {
  const [cursor, setCursor] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));
  const today = new Date();

  const firstWeekday = new Date(cursor.getFullYear(), cursor.getMonth(), 1).getDay();
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells = [...Array(firstWeekday).fill(null), ...Array(daysInMonth)].map((_, i) =>
    i < firstWeekday ? null : i - firstWeekday + 1,
  );

  const isFuture = (day) => new Date(cursor.getFullYear(), cursor.getMonth(), day) > today;
  const canGoNext =
    new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1) <= new Date(today.getFullYear(), today.getMonth(), 1);

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          className="w-8 h-8 rounded-[9px] flex items-center justify-center text-[#6b6b8a] hover:bg-[#f4f2ff] hover:text-[#4a3fbe] transition-colors"
        >
          <ChevronLeft size={16} strokeWidth={2.3} />
        </button>
        <span className="text-[13.5px] font-semibold text-[#2d2b55] font-['DM_Sans',_sans-serif]">
          {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
        </span>
        <button
          onClick={() => canGoNext && setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          disabled={!canGoNext}
          className="w-8 h-8 rounded-[9px] flex items-center justify-center text-[#6b6b8a] hover:bg-[#f4f2ff] hover:text-[#4a3fbe] transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronRight size={16} strokeWidth={2.3} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((w, i) => (
          <div key={i} className="text-center text-[10px] font-semibold text-[#a8a8c0] py-1 uppercase">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const dateObj = new Date(cursor.getFullYear(), cursor.getMonth(), day);
          const future = isFuture(day);
          const isToday = sameDay(dateObj, today);
          return (
            <button
              key={i}
              disabled={future}
              onClick={() => onPick(dateObj)}
              className={`h-9 rounded-[9px] text-[12.5px] font-medium font-['DM_Mono',_monospace] flex items-center justify-center transition-all duration-100
                ${
                  future
                    ? "text-[#d8d8e6] cursor-not-allowed"
                    : isToday
                      ? "border-[1.5px] border-[#4a3fbe] text-[#4a3fbe] hover:bg-[#f0eeff]"
                      : "text-[#3a3a55] hover:bg-[#4a3fbe] hover:text-white"
                }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </>
  );
};

// ─── Month grid ───────────────────────────────────────────────────────────────
const MonthGrid = ({ initial, onPick, onClose }) => {
  const [year, setYear] = useState(initial.getFullYear());
  const today = new Date();
  const canGoNextYear = year < today.getFullYear();

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setYear(year - 1)}
          className="w-8 h-8 rounded-[9px] flex items-center justify-center text-[#6b6b8a] hover:bg-[#f4f2ff] hover:text-[#4a3fbe] transition-colors"
        >
          <ChevronLeft size={16} strokeWidth={2.3} />
        </button>
        <span className="text-[13.5px] font-semibold text-[#2d2b55] font-['DM_Sans',_sans-serif]">{year}</span>
        <button
          onClick={() => canGoNextYear && setYear(year + 1)}
          disabled={!canGoNextYear}
          className="w-8 h-8 rounded-[9px] flex items-center justify-center text-[#6b6b8a] hover:bg-[#f4f2ff] hover:text-[#4a3fbe] transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronRight size={16} strokeWidth={2.3} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {MONTHS.map((m, i) => {
          const future = new Date(year, i, 1) > new Date(today.getFullYear(), today.getMonth(), 1);
          const isCurrent = year === today.getFullYear() && i === today.getMonth();
          return (
            <button
              key={m}
              disabled={future}
              onClick={() => onPick(new Date(year, i, 1))}
              className={`py-2.5 rounded-[9px] text-[12px] font-medium font-['DM_Sans',_sans-serif] transition-all duration-100
                ${
                  future
                    ? "text-[#d8d8e6] cursor-not-allowed"
                    : isCurrent
                      ? "border-[1.5px] border-[#4a3fbe] text-[#4a3fbe] hover:bg-[#f0eeff]"
                      : "text-[#3a3a55] hover:bg-[#4a3fbe] hover:text-white"
                }`}
            >
              {m.slice(0, 3)}
            </button>
          );
        })}
      </div>
    </>
  );
};

// ─── Date range calendar ───────────────────────────────────────────────────────
const MAX_RANGE_DAYS = 15;
const DAY_MS = 24 * 60 * 60 * 1000;
const daysBetween = (a, b) => Math.round((toStartOfDay(b) - toStartOfDay(a)) / DAY_MS) + 1;

const DateRangeCalendar = ({ initial, onPick, onClose }) => {
  const [cursor, setCursor] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [error, setError] = useState(false);
  const today = new Date();

  const firstWeekday = new Date(cursor.getFullYear(), cursor.getMonth(), 1).getDay();
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells = [...Array(firstWeekday).fill(null), ...Array(daysInMonth)].map((_, i) =>
    i < firstWeekday ? null : i - firstWeekday + 1,
  );

  const maxEnd = start ? new Date(toStartOfDay(start) + (MAX_RANGE_DAYS - 1) * DAY_MS) : null;

  const isFuture = (day) => new Date(cursor.getFullYear(), cursor.getMonth(), day) > today;
  const isBeyondMax = (dateObj) => start && !end && maxEnd && toStartOfDay(dateObj) > toStartOfDay(maxEnd);
  const canGoNext =
    new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1) <= new Date(today.getFullYear(), today.getMonth(), 1);

  const handleClick = (dateObj) => {
    if (!start || (start && end)) {
      setStart(dateObj);
      setEnd(null);
      setError(false);
      return;
    }
    if (dateObj < start) {
      setStart(dateObj);
      setEnd(null);
      setError(false);
      return;
    }
    if (daysBetween(start, dateObj) > MAX_RANGE_DAYS) {
      setError(true);
      return;
    }
    setEnd(dateObj);
    setError(false);
    onPick(start, dateObj);
  };

  const inRange = (dateObj) => {
    if (!start) return false;
    if (!end) return sameDay(dateObj, start);
    return dateObj >= toStartOfDay(start) && dateObj <= toStartOfDay(end);
  };
  const isEdge = (dateObj) => (start && sameDay(dateObj, start)) || (end && sameDay(dateObj, end));

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          className="w-8 h-8 rounded-[9px] flex items-center justify-center text-[#6b6b8a] hover:bg-[#f4f2ff] hover:text-[#4a3fbe] transition-colors"
        >
          <ChevronLeft size={16} strokeWidth={2.3} />
        </button>
        <span className="text-[13.5px] font-semibold text-[#2d2b55] font-['DM_Sans',_sans-serif]">
          {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
        </span>
        <button
          onClick={() => canGoNext && setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          disabled={!canGoNext}
          className="w-8 h-8 rounded-[9px] flex items-center justify-center text-[#6b6b8a] hover:bg-[#f4f2ff] hover:text-[#4a3fbe] transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronRight size={16} strokeWidth={2.3} />
        </button>
      </div>

      <div className="text-[11px] font-medium text-[#9898b8] mb-2 font-['DM_Sans',_sans-serif]">
        {error
          ? `Range can't exceed ${MAX_RANGE_DAYS} days`
          : !start
            ? "Select start date"
            : !end
              ? `Select end date (max ${MAX_RANGE_DAYS} days)`
              : "Range selected"}
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((w, i) => (
          <div key={i} className="text-center text-[10px] font-semibold text-[#a8a8c0] py-1 uppercase">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const dateObj = new Date(cursor.getFullYear(), cursor.getMonth(), day);
          const future = isFuture(day);
          const beyondMax = isBeyondMax(dateObj);
          const disabled = future || beyondMax;
          const isToday = sameDay(dateObj, today);
          const selected = inRange(dateObj);
          const edge = isEdge(dateObj);
          return (
            <button
              key={i}
              disabled={disabled}
              onClick={() => handleClick(dateObj)}
              className={`h-9 rounded-[9px] text-[12.5px] font-medium font-['DM_Mono',_monospace] flex items-center justify-center transition-all duration-100
                ${
                  disabled
                    ? "text-[#d8d8e6] cursor-not-allowed"
                    : edge
                      ? "bg-[#4a3fbe] text-white"
                      : selected
                        ? "bg-[#eeebff] text-[#4a3fbe]"
                        : isToday
                          ? "border-[1.5px] border-[#4a3fbe] text-[#4a3fbe] hover:bg-[#f0eeff]"
                          : "text-[#3a3a55] hover:bg-[#4a3fbe] hover:text-white"
                }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </>
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
  const [modal, setModal] = useState(null); // "date" | "month" | "dateRange" | null

  const fireToday = () => {
    const { start, end } = buildRange("today");
    setActiveMode("today");
    setActiveLabel("Today");
    onFetchData(start, end, "Today");
  };

  const handleTab = (key) => {
    if (key === "today") {
      fireToday();
      return;
    }
    setModal(key);
  };

  const handlePick = (mode, dateObj, dateObj2) => {
    const { start, end } = buildRange(mode, dateObj, dateObj2);
    const label = buildLabel(mode, dateObj, dateObj2);
    setActiveMode(mode);
    setActiveLabel(label);
    setModal(null);
    onFetchData(start, end, label);
  };

  return (
    <>
      <style>{`
        @keyframes tf-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes tf-pop { from { opacity: 0; transform: scale(0.92) translateY(6px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>

      <div className="font-['DM_Sans',_sans-serif] bg-white border-[1.5px] border-[#e8e8f0] rounded-[16px] pt-[14px] pb-[14px] px-4 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(80,60,180,0.04)]">
        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTERS.map(({ key, label, icon: TabIcon }) => {
            const isActive = activeMode === key;
            return (
              <button
                key={key}
                onClick={() => handleTab(key)}
                className={`inline-flex items-center gap-1.5 py-[7px] px-[13px] rounded-[10px] border-[1.5px] text-[12.5px] font-medium cursor-pointer transition-all duration-150 whitespace-nowrap tracking-[-0.01em] outline-none
                  ${
                    isActive
                      ? "bg-[#4a3fbe] border-[#4a3fbe] text-white shadow-[0_2px_8px_rgba(74,63,190,0.28)]"
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
      </div>

      {modal && (
        <ModalShell onClose={() => setModal(null)}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-[#9898b8] uppercase tracking-[0.06em]">
              {modal === "date" ? "Pick a date" : modal === "month" ? "Pick a month" : "Pick a range"}
            </span>
            <button
              onClick={() => setModal(null)}
              className="w-6 h-6 rounded-[7px] flex items-center justify-center text-[#a8a8c0] hover:bg-[#fff4f4] hover:text-[#d05050] transition-colors"
            >
              <X size={13} strokeWidth={2.5} />
            </button>
          </div>
          {modal === "date" && <DayCalendar initial={new Date()} onPick={(d) => handlePick("date", d)} />}
          {modal === "month" && <MonthGrid initial={new Date()} onPick={(d) => handlePick("month", d)} />}
          {modal === "dateRange" && (
            <DateRangeCalendar initial={new Date()} onPick={(a, b) => handlePick("dateRange", a, b)} />
          )}
        </ModalShell>
      )}
    </>
  );
};

export default TimeFrame;
