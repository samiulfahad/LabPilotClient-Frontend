import { useState } from "react";

// ─── icons (inline SVGs so zero extra deps) ──────────────────────────────────
const Icon = {
  Today: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Date: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Month: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <rect x="8" y="14" width="8" height="4" rx="1" />
    </svg>
  ),
  Range: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="7" y1="15" x2="17" y2="15" />
      <line x1="7" y1="19" x2="13" y2="19" />
    </svg>
  ),
  Arrow: () => (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  X: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Dot: () => (
    <svg width="6" height="6" viewBox="0 0 6 6">
      <circle cx="3" cy="3" r="3" fill="currentColor" />
    </svg>
  ),
};

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

// ─── inline styles ────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');

  .tf-root {
    font-family: 'DM Sans', sans-serif;
    background: #fff;
    border: 1.5px solid #e8e8f0;
    border-radius: 16px;
    padding: 14px 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,.05), 0 4px 12px rgba(80,60,180,.04);
  }

  .tf-row {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  .tf-tab {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 13px;
    border-radius: 10px;
    border: 1.5px solid #ebebf5;
    background: #fafafd;
    color: #6b6b8a;
    font-size: 12.5px;
    font-weight: 500;
    cursor: pointer;
    transition: all .15s ease;
    white-space: nowrap;
    letter-spacing: -.01em;
    outline: none;
    position: relative;
    overflow: hidden;
  }
  .tf-tab:hover {
    border-color: #c8c4f0;
    color: #4a3fbe;
    background: #f4f2ff;
  }
  .tf-tab.active {
    background: #4a3fbe;
    border-color: #4a3fbe;
    color: #fff;
    box-shadow: 0 2px 8px rgba(74,63,190,.28);
  }
  .tf-tab.open {
    background: #f0eeff;
    border-color: #c4bcf8;
    color: #4a3fbe;
  }

  .tf-badge {
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 6px 12px 6px 10px;
    border-radius: 10px;
    background: #f6f5ff;
    border: 1.5px solid #e0dcfc;
    color: #4a3fbe;
    font-size: 12px;
    font-weight: 600;
    font-family: 'DM Mono', monospace;
    letter-spacing: -.02em;
    white-space: nowrap;
    max-width: 240px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .tf-badge-dot {
    color: #7c6ff5;
    flex-shrink: 0;
    animation: tf-pulse 2s ease infinite;
  }
  @keyframes tf-pulse {
    0%,100% { opacity: 1; }
    50% { opacity: .4; }
  }

  /* picker panel */
  .tf-picker {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1.5px dashed #ebebf5;
    display: flex;
    align-items: flex-end;
    gap: 10px;
    flex-wrap: wrap;
    animation: tf-drop .15s ease;
  }
  @keyframes tf-drop {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .tf-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
    min-width: 140px;
  }
  .tf-label {
    font-size: 10.5px;
    font-weight: 600;
    color: #9898b8;
    text-transform: uppercase;
    letter-spacing: .06em;
  }
  .tf-input {
    width: 100%;
    padding: 8px 11px;
    font-size: 12.5px;
    font-family: 'DM Mono', monospace;
    font-weight: 500;
    border: 1.5px solid #e0ddf8;
    border-radius: 9px;
    background: #f8f7ff;
    color: #2d2b55;
    outline: none;
    transition: all .15s;
    box-sizing: border-box;
  }
  .tf-input:focus {
    border-color: #7c6ff5;
    background: #fff;
    box-shadow: 0 0 0 3px rgba(124,111,245,.12);
  }

  .tf-actions {
    display: flex;
    gap: 6px;
    align-items: center;
    flex-shrink: 0;
    padding-bottom: 1px;
  }
  .tf-cancel {
    width: 34px;
    height: 34px;
    border-radius: 9px;
    border: 1.5px solid #e8e8f0;
    background: #fafafd;
    color: #9898b8;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all .15s;
    outline: none;
  }
  .tf-cancel:hover {
    border-color: #f0a0a0;
    color: #d05050;
    background: #fff4f4;
  }
  .tf-apply {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: 9px;
    background: #4a3fbe;
    border: none;
    color: #fff;
    font-size: 12.5px;
    font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: all .15s;
    outline: none;
    white-space: nowrap;
  }
  .tf-apply:hover:not(:disabled) {
    background: #3b31a8;
    box-shadow: 0 3px 10px rgba(74,63,190,.3);
    transform: translateY(-1px);
  }
  .tf-apply:disabled {
    opacity: .38;
    cursor: not-allowed;
    transform: none;
  }

  .tf-err {
    width: 100%;
    font-size: 11px;
    color: #d05050;
    margin-top: -4px;
  }
`;

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

  return (
    <div className="tf-picker">
      {mode === "date" && (
        <div className="tf-field">
          <span className="tf-label">Date</span>
          <input type="date" value={a} max={today} onChange={(e) => setA(e.target.value)} className="tf-input" />
        </div>
      )}
      {mode === "month" && (
        <div className="tf-field">
          <span className="tf-label">Month</span>
          <input
            type="month"
            value={a.slice(0, 7)}
            max={thisMonth}
            onChange={(e) => setA(e.target.value + "-01")}
            className="tf-input"
          />
        </div>
      )}
      {mode === "dateRange" && (
        <>
          <div className="tf-field">
            <span className="tf-label">From</span>
            <input type="date" value={a} max={today} onChange={(e) => setA(e.target.value)} className="tf-input" />
          </div>
          <div className="tf-field">
            <span className="tf-label">To</span>
            <input
              type="date"
              value={b}
              min={a}
              max={today}
              onChange={(e) => setB(e.target.value)}
              className="tf-input"
            />
          </div>
        </>
      )}

      <div className="tf-actions">
        <button className="tf-cancel" onClick={onCancel}>
          <Icon.X />
        </button>
        <button className="tf-apply" onClick={apply} disabled={!valid}>
          <Icon.Arrow /> Apply
        </button>
      </div>

      {rangeErr && <p className="tf-err">End date must be after start date.</p>}
    </div>
  );
};

// ─── TimeFrame ────────────────────────────────────────────────────────────────
const FILTERS = [
  { key: "today", label: "Today", Icon: Icon.Today },
  { key: "date", label: "By Date", Icon: Icon.Date },
  { key: "month", label: "By Month", Icon: Icon.Month },
  { key: "dateRange", label: "Date Range", Icon: Icon.Range },
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
      <style>{css}</style>
      <div className="tf-root">
        <div className="tf-row">
          {FILTERS.map(({ key, label, Icon: I }) => (
            <button
              key={key}
              onClick={() => handleTab(key)}
              className={`tf-tab${activeMode === key ? " active" : pickerMode === key ? " open" : ""}`}
            >
              <I /> {label}
            </button>
          ))}

          <div className="tf-badge">
            <span className="tf-badge-dot">
              <Icon.Dot />
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
