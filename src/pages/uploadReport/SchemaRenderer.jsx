import { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  ChevronDown,
  Info,
  TrendingUp,
  TrendingDown,
  User,
  RotateCcw,
  Send,
  AlertTriangle,
  Eye,
  FlaskConical,
  ShieldCheck,
  Pencil,
  Save,
  Activity,
  CheckCheck,
} from "lucide-react";

// ─── Global Styles ─────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500;600&display=swap');

  :root {
    --c-bg:        #f7f8fa;
    --c-surface:   #ffffff;
    --c-surface-2: #f2f4f7;
    --c-border:    #e4e7ed;
    --c-border-2:  #d1d5de;

    --c-ink:       #0d1117;
    --c-ink-2:     #1e2530;
    --c-ink-3:     #4a5568;
    --c-ink-4:     #8492a6;

    --c-blue:      #2563eb;
    --c-blue-dim:  #eff4ff;
    --c-blue-glow: rgba(37,99,235,0.12);

    --c-green:     #059669;
    --c-green-dim: #ecfdf5;

    --c-amber:     #d97316;
    --c-amber-dim: #fff7ed;

    --c-red:       #dc2626;
    --c-red-dim:   #fef2f2;

    --c-violet:    #7c3aed;
    --c-violet-dim:#f5f3ff;

    --c-teal:      #0891b2;

    --radius-sm:   6px;
    --radius-md:   10px;
    --radius-lg:   14px;
    --radius-xl:   18px;

    --shadow-sm:   0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
    --shadow-md:   0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04);
    --shadow-lg:   0 10px 30px rgba(0,0,0,0.1), 0 4px 10px rgba(0,0,0,0.06);

    font-family: 'Outfit', sans-serif;
    color: var(--c-ink);
    background: var(--c-bg);
  }

  .sr2 * { box-sizing: border-box; margin: 0; padding: 0; }
  .sr2 { background: var(--c-bg); min-height: 100vh; }

  /* ── Mode ribbon ── */
  .sr2-ribbon {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 14px; border-radius: var(--radius-md);
    margin-bottom: 20px; font-size: 12px; font-weight: 500;
    border: 1px solid;
  }
  .sr2-ribbon.edit {
    background: var(--c-violet-dim);
    border-color: rgba(124,58,237,0.2);
    color: #5b21b6;
  }
  .sr2-ribbon.edit .dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--c-violet); flex-shrink: 0;
    animation: pulse2 2s ease-in-out infinite;
  }
  @keyframes pulse2 {
    0%,100% { opacity:1; transform:scale(1); }
    50%      { opacity:0.4; transform:scale(0.75); }
  }

  /* ── Header ── */
  .sr2-header {
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-radius: var(--radius-xl);
    padding: 24px;
    margin-bottom: 16px;
    box-shadow: var(--shadow-sm);
  }
  .sr2-header-top {
    display: flex; align-items: flex-start; gap: 16px; margin-bottom: 20px;
  }
  .sr2-icon-box {
    width: 44px; height: 44px; border-radius: var(--radius-md);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    transition: background 0.2s;
  }
  .sr2-icon-box.default { background: var(--c-ink); }
  .sr2-icon-box.edit    { background: var(--c-violet); }

  .sr2-meta { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--c-ink-4); text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 4px; display: flex; align-items: center; gap: 8px; }
  .sr2-meta-dot { width: 3px; height: 3px; border-radius: 50%; background: var(--c-border-2); }
  .sr2-meta-active { color: var(--c-green); }
  .sr2-title {
    font-size: clamp(20px, 4vw, 28px); font-weight: 800;
    color: var(--c-ink); letter-spacing: -0.03em; line-height: 1.1;
  }
  .sr2-desc { margin-top: 6px; font-size: 13.5px; color: var(--c-ink-3); line-height: 1.6; font-weight: 400; }

  /* ── Stat tiles ── */
  .sr2-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 8px;
  }
  .sr2-stat {
    background: var(--c-surface-2);
    border: 1px solid var(--c-border);
    border-radius: var(--radius-md);
    padding: 12px 14px;
    display: flex; flex-direction: column; gap: 2px;
  }
  .sr2-stat-label {
    font-size: 10px; font-weight: 600; color: var(--c-ink-4);
    text-transform: uppercase; letter-spacing: 0.07em;
  }
  .sr2-stat-val {
    font-family: 'JetBrains Mono', monospace;
    font-size: 22px; font-weight: 600; color: var(--c-ink); line-height: 1;
  }
  .sr2-stat-val.green  { color: var(--c-green); }
  .sr2-stat-val.red    { color: var(--c-red); }
  .sr2-stat-val.violet { color: var(--c-violet); }
  .sr2-stat-val.blue   { color: var(--c-blue); }

  /* ── Progress bar ── */
  .sr2-progress-wrap { margin-top: 16px; }
  .sr2-progress-row {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 6px;
  }
  .sr2-progress-label { font-size: 11px; font-weight: 600; color: var(--c-ink-4); text-transform: uppercase; letter-spacing: 0.07em; }
  .sr2-progress-count { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--c-ink-3); }
  .sr2-track { height: 4px; background: var(--c-border); border-radius: 4px; overflow: hidden; }
  .sr2-fill  {
    height: 100%; border-radius: 4px;
    background: linear-gradient(90deg, var(--c-blue), var(--c-teal));
    transition: width 0.6s cubic-bezier(0.4,0,0.2,1);
  }
  .sr2-fill.complete { background: linear-gradient(90deg, var(--c-green), #10b981); }

  /* ── Alert ── */
  .sr2-alert {
    display: flex; align-items: flex-start; gap: 12px;
    padding: 12px 16px; border-radius: var(--radius-md);
    border-left: 3px solid; margin-bottom: 12px;
  }
  .sr2-alert.amber { background: var(--c-amber-dim); border-color: var(--c-amber); }
  .sr2-alert.red   { background: var(--c-red-dim);   border-color: var(--c-red); }
  .sr2-alert.violet{ background: var(--c-violet-dim); border-color: var(--c-violet); }
  .sr2-alert-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 2px; }
  .sr2-alert.amber .sr2-alert-title { color: #92400e; }
  .sr2-alert.red   .sr2-alert-title { color: #991b1b; }
  .sr2-alert.violet .sr2-alert-title { color: #4c1d95; }
  .sr2-alert-body  { font-size: 12.5px; line-height: 1.5; }
  .sr2-alert.amber .sr2-alert-body { color: #b45309; }
  .sr2-alert.red   .sr2-alert-body { color: #b91c1c; }
  .sr2-alert.violet .sr2-alert-body { color: #6d28d9; }

  /* ── Patient banner ── */
  .sr2-patient {
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    margin-bottom: 16px;
    box-shadow: var(--shadow-sm);
  }
  .sr2-patient-head {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 18px; background: var(--c-ink-2);
  }
  .sr2-patient-head-label {
    font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.55);
    text-transform: uppercase; letter-spacing: 0.1em;
  }
  .sr2-patient-head-id {
    font-family: 'JetBrains Mono', monospace; font-size: 10px;
    color: rgba(255,255,255,0.3); margin-left: auto;
  }
  .sr2-patient-body { display: grid; grid-template-columns: repeat(4, 1fr); }
  .sr2-patient-cell { padding: 14px 18px; border-right: 1px solid var(--c-border); }
  .sr2-patient-cell:last-child { border-right: none; }
  .sr2-patient-cell-label { font-size: 10px; font-weight: 600; color: var(--c-ink-4); text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 4px; }
  .sr2-patient-cell-val { font-size: 14px; font-weight: 600; color: var(--c-ink); }

  /* ── Section card ── */
  .sr2-section {
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    transition: box-shadow 0.2s, border-color 0.2s;
  }
  .sr2-section:hover { box-shadow: var(--shadow-md); }
  .sr2-section.has-error { border-color: rgba(220,38,38,0.4); }

  .sr2-section-head {
    display: flex; align-items: center; gap: 12px;
    padding: 14px 18px;
    background: var(--c-ink);
    cursor: pointer; border: none; width: 100%; text-align: left;
    transition: background 0.15s;
  }
  .sr2-section-head:hover { background: var(--c-ink-2); }
  .sr2-section-head.error { background: #7f1d1d; }

  .sr2-section-num {
    width: 28px; height: 28px; border-radius: var(--radius-sm);
    background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.7);
    font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 600;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    border: 1px solid rgba(255,255,255,0.15);
  }
  .sr2-section-num.done { background: var(--c-blue); border-color: var(--c-blue); color: #fff; }
  .sr2-section-num.err  { background: var(--c-red);  border-color: var(--c-red); color: #fff; }

  .sr2-section-name {
    flex: 1; font-size: 13px; font-weight: 600;
    color: rgba(255,255,255,0.9); letter-spacing: 0.01em;
  }
  .sr2-section-badge {
    font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 500;
    padding: 3px 9px; border-radius: 20px;
    background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.45);
    border: 1px solid rgba(255,255,255,0.1);
  }
  .sr2-section-badge.done { background: rgba(37,99,235,0.3); color: #93c5fd; border-color: rgba(37,99,235,0.4); }

  .sr2-section-bar { height: 2px; background: rgba(255,255,255,0.06); }
  .sr2-section-bar-fill { height: 100%; background: var(--c-blue); transition: width 0.5s ease; }

  .sr2-chevron { color: rgba(255,255,255,0.3); transition: transform 0.2s ease; flex-shrink: 0; }
  .sr2-chevron.open { transform: rotate(180deg); }

  /* ── Fields grid ── */
  .sr2-fields {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
    gap: 14px 18px;
    padding: 20px 18px;
  }

  /* ── Floating-label field ── */
  .sr2-field-wrap {
    position: relative;
    background: var(--c-surface);
    border: 1.5px solid var(--c-border);
    border-radius: var(--radius-md);
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .sr2-field-wrap:focus-within {
    border-color: var(--c-blue);
    box-shadow: 0 0 0 3px var(--c-blue-glow);
  }
  .sr2-field-wrap.ok    { border-color: var(--c-green); box-shadow: 0 0 0 3px rgba(5,150,105,0.1); }
  .sr2-field-wrap.low   { border-color: var(--c-amber); box-shadow: 0 0 0 3px rgba(217,115,22,0.1); }
  .sr2-field-wrap.high  { border-color: var(--c-red);   box-shadow: 0 0 0 3px rgba(220,38,38,0.1); }
  .sr2-field-wrap.err   { border-color: var(--c-red);   box-shadow: 0 0 0 3px rgba(220,38,38,0.1); background: #fff8f8; }
  .sr2-field-wrap.edited { border-color: var(--c-violet); box-shadow: 0 0 0 3px rgba(124,58,237,0.1); }

  .sr2-float-label {
    position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
    font-size: 12px; font-weight: 600; color: var(--c-ink-4);
    text-transform: uppercase; letter-spacing: 0.05em;
    pointer-events: none; line-height: 1; background: transparent;
    transition: all 0.15s ease; white-space: nowrap; max-width: calc(100% - 64px);
    overflow: hidden; text-overflow: ellipsis;
  }
  .sr2-field-wrap.floated .sr2-float-label,
  .sr2-field-wrap:focus-within .sr2-float-label {
    top: 0; transform: translateY(-50%);
    font-size: 9px; color: var(--c-blue);
    background: var(--c-surface); padding: 0 4px; left: 9px;
  }
  .sr2-field-wrap.err.floated .sr2-float-label { background: #fff8f8; color: var(--c-red); }
  .sr2-req { display: inline-block; width: 4px; height: 4px; border-radius: 50%; background: var(--c-blue); margin-left: 3px; vertical-align: middle; margin-bottom: 1px; }

  .sr2-num-input {
    width: 100%; padding: 18px 14px 8px 12px;
    background: transparent; border: none; outline: none;
    font-family: 'JetBrains Mono', monospace; font-size: 15px; font-weight: 500; color: var(--c-ink);
    line-height: 1.2; min-height: 54px;
  }
  .sr2-num-input::placeholder { color: transparent; }
  .sr2-num-input::-webkit-outer-spin-button,
  .sr2-num-input::-webkit-inner-spin-button { -webkit-appearance: none; }

  .sr2-unit {
    position: absolute; right: 0; top: 0; height: 100%;
    padding: 0 11px; display: flex; align-items: center;
    background: var(--c-surface-2); border-left: 1.5px solid var(--c-border);
    border-radius: 0 8px 8px 0;
    font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 500;
    color: var(--c-ink-3); text-transform: uppercase; letter-spacing: 0.06em;
    pointer-events: none;
  }

  /* ── Range row ── */
  .sr2-range-row {
    display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 5px;
  }
  .sr2-range-text { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--c-ink-4); }
  .sr2-range-text span { color: var(--c-ink-3); font-weight: 500; }

  .sr2-badge {
    display: inline-flex; align-items: center; gap: 3px;
    padding: 2px 7px; border-radius: 20px; font-size: 10px; font-weight: 600;
    letter-spacing: 0.04em; border: 1px solid;
  }
  .sr2-badge.ok     { background: var(--c-green-dim); color: var(--c-green); border-color: rgba(5,150,105,0.25); }
  .sr2-badge.low    { background: var(--c-amber-dim); color: var(--c-amber); border-color: rgba(217,115,22,0.25); }
  .sr2-badge.high   { background: var(--c-red-dim);   color: var(--c-red);   border-color: rgba(220,38,38,0.25); }
  .sr2-badge.edited { background: var(--c-violet-dim); color: var(--c-violet); border-color: rgba(124,58,237,0.2); font-family: 'JetBrains Mono', monospace; font-size: 9px; }

  .sr2-context-warn {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 10px; color: var(--c-amber); font-weight: 600;
    font-family: 'JetBrains Mono', monospace;
  }

  .sr2-field-err {
    display: flex; align-items: center; gap: 5px;
    font-size: 11.5px; color: var(--c-red); font-weight: 500; margin-top: 5px;
  }

  /* ── Tooltip ── */
  .sr2-tip-wrap { position: relative; display: inline-flex; }
  .sr2-tip-box {
    position: absolute; z-index: 50;
    bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%);
    width: 210px; background: var(--c-ink-2); color: #e2e8f0;
    font-size: 11px; border-radius: var(--radius-md); padding: 10px 12px;
    box-shadow: var(--shadow-lg); border: 1px solid rgba(255,255,255,0.08);
    pointer-events: none;
  }
  .sr2-tip-title {
    font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;
    color: #60a5fa; margin-bottom: 7px;
  }
  .sr2-tip-row { color: #94a3b8; line-height: 1.75; font-family: 'JetBrains Mono', monospace; font-size: 10.5px; }
  .sr2-tip-row span { color: #e2e8f0; font-weight: 500; }
  .sr2-tip-arrow {
    position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
    border: 5px solid transparent; border-top-color: var(--c-ink-2);
  }
  .sr2-info-btn { background: none; border: none; cursor: pointer; padding: 0; display: inline-flex; line-height: 0; }

  /* ── Toggle button (radio/checkbox) ── */
  .sr2-toggle {
    padding: 9px 14px; border-radius: var(--radius-sm);
    font-size: 13px; font-weight: 500;
    border: 1.5px solid var(--c-border); background: var(--c-surface); color: var(--c-ink-3);
    cursor: pointer; transition: all 0.12s;
    display: flex; align-items: center; gap: 8px; min-height: 42px;
  }
  .sr2-toggle:hover { border-color: var(--c-ink-3); color: var(--c-ink); background: var(--c-surface-2); }
  .sr2-toggle.on {
    background: var(--c-ink); border-color: var(--c-ink); color: #fff;
    box-shadow: 0 2px 8px rgba(13,17,23,0.2);
  }
  .sr2-toggle.edited-on { background: var(--c-violet); border-color: var(--c-violet); }
  .sr2-toggle.edited-off { border-color: var(--c-violet); }

  /* ── Dropdown ── */
  .sr2-dd-wrap { position: relative; }
  .sr2-dd-btn {
    width: 100%; display: flex; align-items: flex-end; justify-content: space-between;
    padding: 18px 14px 8px 12px;
    border: 1.5px solid var(--c-border); border-radius: var(--radius-md);
    background: var(--c-surface); cursor: pointer; transition: all 0.15s;
    font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 500; color: var(--c-ink);
    min-height: 54px;
  }
  .sr2-dd-btn.empty { color: transparent; }
  .sr2-dd-btn.open,
  .sr2-dd-btn:focus { border-color: var(--c-blue); box-shadow: 0 0 0 3px var(--c-blue-glow); outline: none; }
  .sr2-dd-label {
    position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
    font-size: 12px; font-weight: 600; color: var(--c-ink-4);
    text-transform: uppercase; letter-spacing: 0.05em;
    pointer-events: none; transition: all 0.15s ease;
    background: transparent; line-height: 1; white-space: nowrap;
  }
  .sr2-dd-wrap.floated .sr2-dd-label {
    top: 0; transform: translateY(-50%); font-size: 9px; color: var(--c-blue);
    background: var(--c-surface); padding: 0 4px; left: 9px;
  }
  .sr2-dd-menu {
    position: absolute; z-index: 40;
    top: calc(100% + 4px); left: 0; right: 0;
    background: var(--c-surface); border: 1.5px solid var(--c-border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg); overflow-y: auto; max-height: 200px;
  }
  .sr2-dd-item {
    width: 100%; text-align: left; padding: 11px 14px;
    font-size: 13.5px; font-weight: 400; color: var(--c-ink-3);
    background: none; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: space-between;
    transition: background 0.1s; min-height: 42px;
  }
  .sr2-dd-item:hover    { background: var(--c-surface-2); color: var(--c-ink); }
  .sr2-dd-item.selected { background: var(--c-ink); color: #fff; font-weight: 600; }

  /* ── Textarea ── */
  .sr2-ta-wrap {
    position: relative; border: 1.5px solid var(--c-border); border-radius: var(--radius-md);
    background: var(--c-surface); transition: all 0.15s; overflow: hidden;
  }
  .sr2-ta-wrap:focus-within { border-color: var(--c-blue); box-shadow: 0 0 0 3px var(--c-blue-glow); }
  .sr2-ta-wrap.err    { border-color: var(--c-red); background: #fff8f8; }
  .sr2-ta-wrap.edited { border-color: var(--c-violet); box-shadow: 0 0 0 3px rgba(124,58,237,0.1); }
  .sr2-ta-label {
    position: absolute; left: 12px; top: 14px;
    font-size: 12px; font-weight: 600; color: var(--c-ink-4);
    text-transform: uppercase; letter-spacing: 0.05em;
    pointer-events: none; transition: all 0.15s ease; line-height: 1;
  }
  .sr2-ta-wrap.floated .sr2-ta-label,
  .sr2-ta-wrap:focus-within .sr2-ta-label {
    top: 0; transform: translateY(-50%); font-size: 9px; color: var(--c-blue);
    background: var(--c-surface); padding: 0 4px; left: 9px;
  }
  .sr2-ta {
    width: 100%; padding: 22px 14px 10px 12px;
    background: transparent; border: none; outline: none; resize: none;
    font-family: 'Outfit', sans-serif; font-size: 13.5px; color: var(--c-ink);
  }
  .sr2-ta::placeholder { color: transparent; }
  .sr2-char { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--c-ink-4); text-align: right; padding: 2px 10px 6px; }

  /* ── Text input ── */
  .sr2-ti-wrap {
    position: relative; border: 1.5px solid var(--c-border); border-radius: var(--radius-md);
    background: var(--c-surface); transition: all 0.15s;
  }
  .sr2-ti-wrap:focus-within { border-color: var(--c-blue); box-shadow: 0 0 0 3px var(--c-blue-glow); }
  .sr2-ti-wrap.err    { border-color: var(--c-red); background: #fff8f8; }
  .sr2-ti-wrap.edited { border-color: var(--c-violet); box-shadow: 0 0 0 3px rgba(124,58,237,0.1); }
  .sr2-ti-label {
    position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
    font-size: 12px; font-weight: 600; color: var(--c-ink-4);
    text-transform: uppercase; letter-spacing: 0.05em;
    pointer-events: none; transition: all 0.15s ease; line-height: 1; white-space: nowrap;
  }
  .sr2-ti-wrap.floated .sr2-ti-label,
  .sr2-ti-wrap:focus-within .sr2-ti-label {
    top: 0; transform: translateY(-50%); font-size: 9px; color: var(--c-blue);
    background: var(--c-surface); padding: 0 4px; left: 9px;
  }
  .sr2-ti {
    width: 100%; padding: 18px 14px 8px 12px;
    background: transparent; border: none; outline: none;
    font-family: 'Outfit', sans-serif; font-size: 13.5px; color: var(--c-ink); min-height: 54px;
  }
  .sr2-ti::placeholder { color: transparent; }

  /* ── Gender btn ── */
  .sr2-gender {
    flex: 1; padding: 10px; border-radius: var(--radius-md);
    font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em;
    border: 1.5px solid var(--c-border); background: var(--c-surface); color: var(--c-ink-3);
    cursor: pointer; transition: all 0.12s; min-height: 42px;
  }
  .sr2-gender:hover  { border-color: var(--c-ink-3); color: var(--c-ink); }
  .sr2-gender.on { background: var(--c-ink); border-color: var(--c-ink); color: #fff; }

  /* ── Action bar ── */
  .sr2-action-bar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 20px;
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    flex-wrap: wrap; gap: 12px;
  }
  .sr2-action-hint {
    display: flex; align-items: center; gap: 7px;
    font-size: 11.5px; color: var(--c-ink-4);
  }

  .sr2-btn-ghost {
    display: flex; align-items: center; gap: 7px;
    padding: 10px 16px; border: 1.5px solid var(--c-border); border-radius: var(--radius-md);
    background: var(--c-surface); color: var(--c-ink-3);
    font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 0.02em;
    cursor: pointer; transition: all 0.15s; min-height: 42px;
  }
  .sr2-btn-ghost:hover { border-color: var(--c-ink-2); color: var(--c-ink); background: var(--c-surface-2); }

  .sr2-btn-primary {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 24px; border-radius: var(--radius-md);
    background: var(--c-blue); color: #fff;
    font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 0.02em;
    border: none; cursor: pointer; transition: all 0.15s;
    box-shadow: 0 2px 8px rgba(37,99,235,0.3); min-height: 42px;
  }
  .sr2-btn-primary:hover  { background: #1d4ed8; box-shadow: 0 4px 14px rgba(37,99,235,0.4); transform: translateY(-1px); }
  .sr2-btn-primary:active { transform: translateY(0); }
  .sr2-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
  .sr2-btn-primary.edit { background: var(--c-violet); box-shadow: 0 2px 8px rgba(124,58,237,0.3); }
  .sr2-btn-primary.edit:hover { background: #6d28d9; box-shadow: 0 4px 14px rgba(124,58,237,0.4); }
  .sr2-spin-dot {
    width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.7);
    animation: pulse2 1.5s ease-in-out infinite;
  }

  /* ── Empty state ── */
  .sr2-empty {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 80px 24px; text-align: center;
  }
  .sr2-empty-icon {
    width: 56px; height: 56px; background: var(--c-surface-2);
    border: 1.5px solid var(--c-border); border-radius: var(--radius-lg);
    display: flex; align-items: center; justify-content: center; margin-bottom: 16px;
  }

  /* ── Responsive ── */
  @media (max-width: 640px) {
    .sr2-patient-body { grid-template-columns: 1fr 1fr; }
    .sr2-patient-cell:nth-child(2) { border-right: none; }
    .sr2-patient-cell:nth-child(3),
    .sr2-patient-cell:nth-child(4) { border-top: 1px solid var(--c-border); }
    .sr2-patient-cell:nth-child(4) { border-right: none; }
    .sr2-stats { grid-template-columns: 1fr 1fr; }
    .sr2-fields { grid-template-columns: 1fr 1fr; padding: 14px; gap: 10px; }
    .sr2-btn-primary, .sr2-btn-ghost { padding: 10px 14px; font-size: 12px; }
    .sr2-title { font-size: 20px; }
  }
  @media (max-width: 380px) {
    .sr2-fields { grid-template-columns: 1fr; }
    .sr2-stats  { grid-template-columns: 1fr 1fr; }
  }
`;

function StyleInjector() {
  useEffect(() => {
    const id = "sr2-styles-v1";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = STYLES;
      document.head.appendChild(el);
    }
  }, []);
  return null;
}

// ─── Range Logic ──────────────────────────────────────────────────────────────
export function getStandardRange(field, patientAge, patientGender) {
  const sr = field.standardRange;
  if (!sr || sr.type === "none") return null;
  if (sr.type === "simple") return { min: parseFloat(sr.data.min), max: parseFloat(sr.data.max) };
  if (sr.type === "age" && patientAge) {
    const age = parseFloat(patientAge);
    const row = sr.data.find((r) => age >= parseFloat(r.minAge) && age <= parseFloat(r.maxAge));
    if (row) return { min: parseFloat(row.minValue), max: parseFloat(row.maxValue) };
  }
  if (sr.type === "gender" && patientGender) {
    const g = sr.data[patientGender];
    if (g) return { min: parseFloat(g.min), max: parseFloat(g.max) };
  }
  if (sr.type === "combined" && patientAge && patientGender) {
    const age = parseFloat(patientAge);
    const row = sr.data.find(
      (r) => r.gender === patientGender && age >= parseFloat(r.minAge) && age <= parseFloat(r.maxAge),
    );
    if (row) return { min: parseFloat(row.minValue), max: parseFloat(row.maxValue) };
  }
  return null;
}

export function getRangeStatus(value, range) {
  if (!range || value === "" || value === null || value === undefined) return "neutral";
  const v = parseFloat(value);
  if (isNaN(v)) return "neutral";
  if (v < range.min) return "low";
  if (v > range.max) return "high";
  return "normal";
}

export function hydrateValuesFromReport(schema, existingReport) {
  if (!existingReport || !schema?.sections) return {};
  const values = {};
  schema.sections.forEach((section, si) => {
    const sectionData = existingReport[section.name];
    if (!sectionData) return;
    section.fields.forEach((field) => {
      const key = `${si}_${field.name}`;
      const fieldData = sectionData[field.name];
      if (!fieldData) return;
      values[key] = fieldData.value ?? fieldData;
    });
  });
  return values;
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────
function RangeTooltip({ field }) {
  const [open, setOpen] = useState(false);
  const sr = field.standardRange;
  if (!sr || sr.type === "none") return null;
  return (
    <div className="sr2-tip-wrap" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button className="sr2-info-btn" type="button">
        <Info style={{ width: 12, height: 12, color: "var(--c-ink-4)" }} />
      </button>
      {open && (
        <div className="sr2-tip-box">
          <div className="sr2-tip-title">Reference Ranges</div>
          {sr.type === "simple" && (
            <div className="sr2-tip-row">
              {sr.data.min} – {sr.data.max} {field.unit || ""}
            </div>
          )}
          {sr.type === "age" &&
            Array.isArray(sr.data) &&
            sr.data.map((r, i) => (
              <div key={i} className="sr2-tip-row">
                Age {r.minAge}–{r.maxAge === 999 ? "∞" : r.maxAge}:{" "}
                <span>
                  {r.minValue}–{r.maxValue}
                </span>
              </div>
            ))}
          {sr.type === "gender" &&
            sr.data &&
            Object.entries(sr.data).map(([g, v]) => (
              <div key={g} className="sr2-tip-row" style={{ textTransform: "capitalize" }}>
                {g}:{" "}
                <span>
                  {v.min}–{v.max}
                </span>
              </div>
            ))}
          {sr.type === "combined" &&
            Array.isArray(sr.data) &&
            sr.data.map((r, i) => (
              <div key={i} className="sr2-tip-row" style={{ textTransform: "capitalize" }}>
                {r.gender} {r.minAge}–{r.maxAge === 999 ? "∞" : r.maxAge}yr:{" "}
                <span>
                  {r.minValue}–{r.maxValue}
                </span>
              </div>
            ))}
          <div className="sr2-tip-arrow" />
        </div>
      )}
    </div>
  );
}

// ─── Number Field ─────────────────────────────────────────────────────────────
function NumberField({ field, value, onChange, error, patientAge, patientGender, originalValue, isEditMode }) {
  const range = getStandardRange(field, patientAge, patientGender);
  const status = getRangeStatus(value, range);
  const hasValue = value !== "" && value !== null && value !== undefined;
  const isChanged = isEditMode && originalValue !== undefined && String(value) !== String(originalValue ?? "");
  const needsContext =
    ((field.standardRange?.type === "age" || field.standardRange?.type === "combined") && !patientAge) ||
    ((field.standardRange?.type === "gender" || field.standardRange?.type === "combined") && !patientGender);

  let cls = "sr2-field-wrap";
  if (error) cls += " err";
  else if (isChanged) cls += " edited";
  else if (hasValue && range && status !== "neutral") cls += ` ${status === "normal" ? "ok" : status}`;
  if (hasValue) cls += " floated";

  return (
    <div>
      <div className={cls}>
        <span className="sr2-float-label">
          {field.name}
          {field.required && <span className="sr2-req" />}
        </span>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder=" "
          className="sr2-num-input"
          style={{ paddingRight: field.unit ? "62px" : "14px" }}
        />
        {field.unit && <span className="sr2-unit">{field.unit}</span>}
      </div>
      <div className="sr2-range-row">
        {range ? (
          <span className="sr2-range-text">
            Ref:{" "}
            <span>
              {range.min}–{range.max}
              {field.unit ? ` ${field.unit}` : ""}
            </span>
          </span>
        ) : (
          <span className="sr2-range-text">—</span>
        )}
        {hasValue && range && status !== "neutral" && (
          <span className={`sr2-badge ${status === "normal" ? "ok" : status}`}>
            {status === "normal" && <CheckCircle2 style={{ width: 9, height: 9 }} />}
            {status === "low" && <TrendingDown style={{ width: 9, height: 9 }} />}
            {status === "high" && <TrendingUp style={{ width: 9, height: 9 }} />}
            {status === "normal" ? "Normal" : status === "low" ? "Low" : "High"}
          </span>
        )}
        <RangeTooltip field={field} />
        {needsContext && !range && field.standardRange?.type !== "none" && (
          <span className="sr2-context-warn">
            <AlertTriangle style={{ width: 10, height: 10 }} />
            {!patientAge && (field.standardRange?.type === "age" || field.standardRange?.type === "combined")
              ? "Enter age"
              : "Select gender"}
          </span>
        )}
        {isChanged && (
          <span className="sr2-badge edited">
            <Pencil style={{ width: 8, height: 8 }} />
            edited
          </span>
        )}
      </div>
      {error && (
        <div className="sr2-field-err">
          <XCircle style={{ width: 11, height: 11, flexShrink: 0 }} />
          {error}
        </div>
      )}
    </div>
  );
}

// ─── Radio ────────────────────────────────────────────────────────────────────
function RadioField({ field, options = [], value, onChange, error, originalValue, isEditMode }) {
  const isChanged = isEditMode && originalValue !== undefined && value !== (originalValue ?? "");
  return (
    <div>
      <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--c-ink-4)",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
          }}
        >
          {field.name}
          {field.required && <span className="sr2-req" style={{ marginLeft: 3 }} />}
        </span>
        {isChanged && (
          <span className="sr2-badge edited">
            <Pencil style={{ width: 8, height: 8 }} />
            edited
          </span>
        )}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {options.map((opt) => {
          const sel = value === opt;
          const optChanged = isEditMode && originalValue !== undefined && sel && value !== (originalValue ?? "");
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(value === opt ? "" : opt)}
              className={`sr2-toggle ${sel ? (optChanged ? "on edited-on" : "on") : optChanged ? "edited-off" : ""}`}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  flexShrink: 0,
                  border: `2px solid ${sel ? "rgba(255,255,255,0.5)" : "var(--c-border-2)"}`,
                  background: sel ? "#fff" : "transparent",
                  boxShadow: sel ? "inset 0 0 0 2.5px var(--c-ink)" : "none",
                }}
              />
              {opt}
            </button>
          );
        })}
      </div>
      {error && (
        <div className="sr2-field-err" style={{ marginTop: 6 }}>
          <XCircle style={{ width: 11, height: 11, flexShrink: 0 }} />
          {error}
        </div>
      )}
    </div>
  );
}

// ─── Dropdown ─────────────────────────────────────────────────────────────────
function DropdownField({ field, options = [], value, onChange, error, originalValue, isEditMode }) {
  const [open, setOpen] = useState(false);
  const floated = !!value;
  const isChanged = isEditMode && originalValue !== undefined && value !== (originalValue ?? "");
  return (
    <div>
      <div className={`sr2-dd-wrap ${floated ? "floated" : ""}`}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`sr2-dd-btn ${!value ? "empty" : ""} ${open ? "open" : ""}`}
          style={isChanged ? { borderColor: "var(--c-violet)", boxShadow: "0 0 0 3px rgba(124,58,237,0.1)" } : {}}
        >
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 14, fontWeight: 500 }}>{value || ""}</span>
          <ChevronDown
            className={`sr2-chevron ${open ? "open" : ""}`}
            style={{ width: 15, height: 15, color: "var(--c-ink-4)" }}
          />
        </button>
        <span className="sr2-dd-label">
          {field.name}
          {field.required && <span className="sr2-req" />}
        </span>
        {open && (
          <div className="sr2-dd-menu">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                className={`sr2-dd-item ${value === opt ? "selected" : ""}`}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
              >
                {opt}
                {value === opt && <CheckCircle2 style={{ width: 13, height: 13 }} />}
              </button>
            ))}
          </div>
        )}
      </div>
      {isChanged && (
        <div style={{ marginTop: 5 }}>
          <span className="sr2-badge edited">
            <Pencil style={{ width: 8, height: 8 }} />
            edited
          </span>
        </div>
      )}
      {error && (
        <div className="sr2-field-err" style={{ marginTop: 5 }}>
          <XCircle style={{ width: 11, height: 11, flexShrink: 0 }} />
          {error}
        </div>
      )}
    </div>
  );
}

// ─── Checkbox ─────────────────────────────────────────────────────────────────
function CheckboxField({ field, options = [], value = [], onChange, error, originalValue, isEditMode }) {
  const toggle = (opt) => onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
  const origArr = Array.isArray(originalValue) ? originalValue : [];
  const isChanged =
    isEditMode &&
    originalValue !== undefined &&
    JSON.stringify([...(value || [])].sort()) !== JSON.stringify([...origArr].sort());
  return (
    <div>
      <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--c-ink-4)",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
          }}
        >
          {field.name}
          {field.required && <span className="sr2-req" style={{ marginLeft: 3 }} />}
        </span>
        {isChanged && (
          <span className="sr2-badge edited">
            <Pencil style={{ width: 8, height: 8 }} />
            edited
          </span>
        )}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {options.map((opt) => {
          const checked = value.includes(opt);
          const optChanged = isEditMode && originalValue !== undefined && checked !== origArr.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={`sr2-toggle ${checked ? (optChanged ? "on edited-on" : "on") : optChanged ? "edited-off" : ""}`}
            >
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 3,
                  flexShrink: 0,
                  border: `2px solid ${checked ? "rgba(255,255,255,0.5)" : "var(--c-border-2)"}`,
                  background: checked ? "#fff" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {checked && (
                  <svg width="8" height="7" viewBox="0 0 10 8" fill="none">
                    <path
                      d="M1 4L3.5 6.5L9 1"
                      stroke="var(--c-ink)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              {opt}
            </button>
          );
        })}
      </div>
      {error && (
        <div className="sr2-field-err" style={{ marginTop: 6 }}>
          <XCircle style={{ width: 11, height: 11, flexShrink: 0 }} />
          {error}
        </div>
      )}
    </div>
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────────
function TextareaField({ field, value, onChange, error, originalValue, isEditMode }) {
  const floated = !!(value && value.length > 0);
  const isChanged = isEditMode && originalValue !== undefined && value !== (originalValue ?? "");
  return (
    <div>
      <div className={`sr2-ta-wrap ${error ? "err" : ""} ${floated ? "floated" : ""} ${isChanged ? "edited" : ""}`}>
        <span className="sr2-ta-label">
          {field.name}
          {field.required && <span className="sr2-req" />}
        </span>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={field.maxLength}
          rows={3}
          placeholder=" "
          className="sr2-ta"
        />
        <div className="sr2-char">
          {(value || "").length}/{field.maxLength}
        </div>
      </div>
      {isChanged && (
        <div style={{ marginTop: 5 }}>
          <span className="sr2-badge edited">
            <Pencil style={{ width: 8, height: 8 }} />
            edited
          </span>
        </div>
      )}
      {error && (
        <div className="sr2-field-err" style={{ marginTop: 5 }}>
          <XCircle style={{ width: 11, height: 11, flexShrink: 0 }} />
          {error}
        </div>
      )}
    </div>
  );
}

// ─── Text Input ───────────────────────────────────────────────────────────────
function TextInputField({ field, value, onChange, error, originalValue, isEditMode }) {
  const floated = !!(value && value.length > 0);
  const isChanged = isEditMode && originalValue !== undefined && value !== (originalValue ?? "");
  return (
    <div>
      <div className={`sr2-ti-wrap ${error ? "err" : ""} ${floated ? "floated" : ""} ${isChanged ? "edited" : ""}`}>
        <span className="sr2-ti-label">
          {field.name}
          {field.required && <span className="sr2-req" />}
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={field.maxLength}
          placeholder=" "
          className="sr2-ti"
        />
        <div className="sr2-char" style={{ position: "absolute", right: 0, bottom: 0, padding: "2px 10px 4px" }}>
          {(value || "").length}/{field.maxLength}
        </div>
      </div>
      {isChanged && (
        <div style={{ marginTop: 5 }}>
          <span className="sr2-badge edited">
            <Pencil style={{ width: 8, height: 8 }} />
            edited
          </span>
        </div>
      )}
      {error && (
        <div className="sr2-field-err" style={{ marginTop: 5 }}>
          <XCircle style={{ width: 11, height: 11, flexShrink: 0 }} />
          {error}
        </div>
      )}
    </div>
  );
}

// ─── Section Panel ────────────────────────────────────────────────────────────
function SectionPanel({
  section,
  sectionIndex,
  values,
  onChange,
  errors,
  patientAge,
  patientGender,
  hideTitle,
  originalValues,
  isEditMode,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const fieldCount = section.fields.length;
  const filledCount = section.fields.filter((f) => {
    const v = values[`${sectionIndex}_${f.name}`];
    return Array.isArray(v) ? v.length > 0 : v !== "" && v !== undefined && v !== null;
  }).length;
  const hasError = section.fields.some((f) => errors[`${sectionIndex}_${f.name}`]);
  const complete = filledCount === fieldCount && fieldCount > 0;
  const pct = fieldCount > 0 ? (filledCount / fieldCount) * 100 : 0;

  const grid = (
    <div className="sr2-fields">
      {section.fields.map((field) => {
        const key = `${sectionIndex}_${field.name}`;
        const val = values[key] ?? (field.type === "checkbox" ? [] : "");
        const err = errors[key];
        const origVal = originalValues ? originalValues[key] : undefined;
        const full = field.type === "textarea" || field.type === "checkbox" || field.type === "radio";
        return (
          <div key={key} style={full ? { gridColumn: "1 / -1" } : {}}>
            {field.type === "number" && (
              <NumberField
                field={field}
                value={val}
                onChange={(v) => onChange(key, v)}
                error={err}
                patientAge={patientAge}
                patientGender={patientGender}
                originalValue={origVal}
                isEditMode={isEditMode}
              />
            )}
            {field.type === "radio" && (
              <RadioField
                field={field}
                options={field.options}
                value={val}
                onChange={(v) => onChange(key, v)}
                error={err}
                originalValue={origVal}
                isEditMode={isEditMode}
              />
            )}
            {field.type === "select" && (
              <DropdownField
                field={field}
                options={field.options}
                value={val}
                onChange={(v) => onChange(key, v)}
                error={err}
                originalValue={origVal}
                isEditMode={isEditMode}
              />
            )}
            {field.type === "checkbox" && (
              <CheckboxField
                field={field}
                options={field.options}
                value={val}
                onChange={(v) => onChange(key, v)}
                error={err}
                originalValue={origVal}
                isEditMode={isEditMode}
              />
            )}
            {field.type === "textarea" && (
              <TextareaField
                field={field}
                value={val}
                onChange={(v) => onChange(key, v)}
                error={err}
                originalValue={origVal}
                isEditMode={isEditMode}
              />
            )}
            {field.type === "input" && (
              <TextInputField
                field={field}
                value={val}
                onChange={(v) => onChange(key, v)}
                error={err}
                originalValue={origVal}
                isEditMode={isEditMode}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  if (hideTitle) return <div style={{ background: "var(--c-surface)", borderRadius: "var(--radius-lg)" }}>{grid}</div>;

  return (
    <div className={`sr2-section ${hasError ? "has-error" : ""}`}>
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className={`sr2-section-head ${hasError ? "error" : ""}`}
      >
        <div className={`sr2-section-num ${complete ? "done" : hasError ? "err" : ""}`}>{sectionIndex + 1}</div>
        <span className="sr2-section-name">{section.name}</span>
        <span className={`sr2-section-badge ${complete ? "done" : ""}`}>
          {filledCount}/{fieldCount}
        </span>
        <ChevronDown className={`sr2-chevron ${!collapsed ? "open" : ""}`} style={{ width: 15, height: 15 }} />
      </button>
      <div className="sr2-section-bar">
        <div className="sr2-section-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      {!collapsed && grid}
    </div>
  );
}

// ─── Patient Banner ───────────────────────────────────────────────────────────
function PatientBanner({ invoice }) {
  return (
    <div className="sr2-patient">
      <div className="sr2-patient-head">
        <User style={{ width: 13, height: 13, color: "#60a5fa" }} />
        <span className="sr2-patient-head-label">Patient Record</span>
        <span className="sr2-patient-head-id">{invoice.invoiceId}</span>
      </div>
      <div className="sr2-patient-body">
        {[
          { label: "Full Name", val: invoice.patientName },
          { label: "Age", val: `${invoice.age} yrs` },
          { label: "Gender", val: invoice.gender, cap: true },
          { label: "Contact", val: invoice.contactNumber },
        ].map((c) => (
          <div key={c.label} className="sr2-patient-cell">
            <div className="sr2-patient-cell-label">{c.label}</div>
            <div className="sr2-patient-cell-val" style={{ textTransform: c.cap ? "capitalize" : undefined }}>
              {c.val}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Manual Patient Context ───────────────────────────────────────────────────
function ManualPatient({ patientAge, setPatientAge, patientGender, setPatientGender }) {
  const floated = patientAge !== "" && patientAge !== null && patientAge !== undefined;
  return (
    <div className="sr2-patient">
      <div className="sr2-patient-head">
        <User style={{ width: 13, height: 13, color: "#60a5fa" }} />
        <span className="sr2-patient-head-label">Patient Context</span>
        <span className="sr2-patient-head-id">Required for dynamic ranges</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", background: "var(--c-surface)" }}>
        <div className="sr2-patient-cell">
          <div className="sr2-patient-cell-label" style={{ marginBottom: 8 }}>
            Age
          </div>
          <div className={`sr2-field-wrap ${floated ? "floated" : ""}`} style={{ background: "var(--c-surface)" }}>
            <span className="sr2-float-label">Years</span>
            <input
              type="number"
              value={patientAge}
              onChange={(e) => setPatientAge(e.target.value)}
              placeholder=" "
              min="0"
              max="150"
              className="sr2-num-input"
              style={{ paddingRight: "50px" }}
            />
            <span className="sr2-unit">yrs</span>
          </div>
        </div>
        <div className="sr2-patient-cell" style={{ borderRight: "none" }}>
          <div className="sr2-patient-cell-label" style={{ marginBottom: 8 }}>
            Gender
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {["male", "female"].map((g) => (
              <button
                key={g}
                type="button"
                className={`sr2-gender ${patientGender === g ? "on" : ""}`}
                onClick={() => setPatientGender(patientGender === g ? "" : g)}
              >
                {g === "male" ? "♂ Male" : "♀ Female"}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Build Payload ────────────────────────────────────────────────────────────
function buildPayload(schema, values, patientAge, patientGender, invoice) {
  const report = {};
  schema.sections.forEach((sec, si) => {
    const sd = {};
    sec.fields.forEach((field) => {
      const key = `${si}_${field.name}`;
      const val = values[key];
      if (val !== "" && val !== undefined && val !== null && !(Array.isArray(val) && val.length === 0)) {
        sd[field.name] = {
          value: val,
          ...(field.unit ? { unit: field.unit } : {}),
          ...(field.type === "number"
            ? (() => {
                const range = getStandardRange(field, patientAge, patientGender);
                return range ? { referenceRange: `${range.min}–${range.max}` } : {};
              })()
            : {}),
        };
      }
    });
    if (Object.keys(sd).length > 0) {
      report[sec.name] = { ...sd, __showTitle: sec.showTitleInReport !== false };
    }
  });
  return {
    ...report,
    name: schema.name,
    ...(invoice
      ? {
          invoiceId: invoice.invoiceId,
          patientName: invoice.patientName,
          patientAge: invoice.age,
          patientGender: invoice.gender,
        }
      : { patientAge: patientAge || null, patientGender: patientGender || null }),
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────
function SchemaRenderer({ schema, invoice, onSubmit, onUpdate, loading = false, existingReport = null }) {
  const isEditMode = Boolean(existingReport);
  const computeInitial = () => (isEditMode ? hydrateValuesFromReport(schema, existingReport) : {});

  const [values, setValues] = useState(computeInitial);
  const [errors, setErrors] = useState({});
  const [originalValues] = useState(() => (isEditMode ? hydrateValuesFromReport(schema, existingReport) : {}));
  const [patientAge, setPatientAge] = useState(invoice?.age ?? existingReport?.patientAge ?? "");
  const [patientGender, setPatientGender] = useState(invoice?.gender ?? existingReport?.patientGender ?? "");

  if (!schema || !schema.sections) return null;
  if (schema.version !== "V1") {
    return (
      <div
        className="sr2"
        style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 24 }}
      >
        <StyleInjector />
        <div
          style={{
            background: "var(--c-surface)",
            border: "1px solid var(--c-border)",
            borderRadius: "var(--radius-xl)",
            padding: "40px 36px",
            maxWidth: 420,
            width: "100%",
            textAlign: "center",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "var(--radius-md)",
              background: "var(--c-surface-2)",
              border: "1.5px solid var(--c-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <FlaskConical style={{ width: 22, height: 22, color: "var(--c-ink-4)" }} />
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 10,
              fontWeight: 600,
              color: "var(--c-ink-4)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 8,
            }}
          >
            Unsupported Schema Version
          </div>
          <div
            style={{
              fontFamily: "'Outfit',sans-serif",
              fontSize: 18,
              fontWeight: 700,
              color: "var(--c-ink)",
              letterSpacing: "-0.02em",
              marginBottom: 10,
            }}
          >
            This renderer requires V1
          </div>
          <div style={{ fontSize: 13.5, color: "var(--c-ink-3)", lineHeight: 1.6, marginBottom: 20 }}>
            The schema <strong style={{ color: "var(--c-ink)", fontWeight: 600 }}>{schema.name || "Untitled"}</strong>{" "}
            uses version{" "}
            <code
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 12,
                background: "var(--c-surface-2)",
                padding: "1px 7px",
                borderRadius: 4,
                border: "1px solid var(--c-border)",
              }}
            >
              {schema.version ?? "unknown"}
            </code>
            , which is not supported by this renderer. Please use the appropriate renderer for this schema version.
          </div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "var(--c-surface-2)",
              border: "1px solid var(--c-border)",
              borderRadius: 20,
              padding: "5px 14px",
            }}
          >
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "var(--c-ink-4)" }}>
              Compatible:
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 11,
                fontWeight: 600,
                color: "var(--c-blue)",
              }}
            >
              V1
            </span>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    setValues(computeInitial());
    setErrors({});
  }, [JSON.stringify(schema?.sections), JSON.stringify(existingReport)]);

  useEffect(() => {
    if (invoice) {
      setPatientAge(invoice.age ?? "");
      setPatientGender(invoice.gender ?? "");
    }
  }, [invoice?._id]);

  const handleChange = (key, val) => {
    setValues((v) => ({ ...v, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    const errs = {};
    schema.sections.forEach((sec, si) => {
      sec.fields.forEach((field) => {
        if (!field.required) return;
        const key = `${si}_${field.name}`;
        const val = values[key];
        if (field.type === "checkbox") {
          if (!val || val.length === 0) errs[key] = "At least one option is required";
        } else {
          if (val === "" || val === undefined || val === null) errs[key] = "This field is required";
        }
      });
    });
    return errs;
  };

  const allKeys = schema.sections.flatMap((sec, si) => sec.fields.map((f) => `${si}_${f.name}`));
  const changedCount = isEditMode
    ? Object.keys(originalValues).filter((k) => {
        const cur = values[k],
          orig = originalValues[k];
        if (Array.isArray(orig)) return JSON.stringify([...(cur || [])].sort()) !== JSON.stringify([...orig].sort());
        return String(cur ?? "") !== String(orig ?? "");
      }).length
    : 0;
  const newlyFilled = isEditMode
    ? allKeys.filter((k) => {
        const cur = values[k],
          orig = originalValues[k];
        const empty = (v) => v === "" || v === undefined || v === null || (Array.isArray(v) && v.length === 0);
        return empty(orig) && !empty(cur);
      }).length
    : 0;
  const totalChanges = changedCount + newlyFilled;

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    const payload = buildPayload(schema, values, patientAge, patientGender, invoice);
    if (isEditMode) onUpdate?.(payload);
    else onSubmit?.(payload);
  };

  const handleReset = () => {
    setValues(isEditMode ? hydrateValuesFromReport(schema, existingReport) : {});
    setErrors({});
  };

  const needsContext = schema.sections.some((sec) =>
    sec.fields.some(
      (f) => f.type === "number" && f.standardRange?.type !== "none" && f.standardRange?.type !== "simple",
    ),
  );
  const hasFields = schema.sections.some((s) => s.fields.length > 0);
  const totalFields = allKeys.length;
  const totalFilled = allKeys.filter((k) => {
    const v = values[k];
    return Array.isArray(v) ? v.length > 0 : v !== "" && v !== undefined && v !== null;
  }).length;
  const progress = totalFields > 0 ? (totalFilled / totalFields) * 100 : null;

  const numStatuses = schema.sections.flatMap((sec, si) =>
    sec.fields
      .filter((f) => f.type === "number")
      .map((f) => {
        const range = getStandardRange(f, patientAge, patientGender);
        return getRangeStatus(values[`${si}_${f.name}`], range);
      }),
  );
  const abnormalCount = numStatuses.filter((s) => s === "high" || s === "low").length;
  const normalCount = numStatuses.filter((s) => s === "normal").length;

  if (!hasFields) {
    return (
      <div className="sr2">
        <StyleInjector />
        <div className="sr2-empty">
          <div className="sr2-empty-icon">
            <Eye style={{ width: 22, height: 22, color: "var(--c-border-2)" }} />
          </div>
          <p style={{ fontWeight: 700, color: "var(--c-ink-3)", fontSize: 14 }}>No fields configured</p>
          <p style={{ color: "var(--c-ink-4)", fontSize: 13, marginTop: 4 }}>Add fields in the Builder to preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sr2">
      <StyleInjector />
      <div style={{ maxWidth: 1600, margin: "0 auto", padding: "28px 20px 56px" }}>
        {/* Edit mode ribbon */}
        {isEditMode && (
          <div className="sr2-ribbon edit">
            <span className="dot" />
            <Pencil style={{ width: 12, height: 12 }} />
            <span style={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Edit Mode
            </span>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, opacity: 0.6, marginLeft: 2 }}>
              — Modifying existing report
            </span>
            {totalChanges > 0 && (
              <span
                style={{
                  marginLeft: "auto",
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 10,
                  background: "rgba(124,58,237,0.15)",
                  color: "var(--c-violet)",
                  padding: "2px 9px",
                  borderRadius: 20,
                  fontWeight: 600,
                }}
              >
                {totalChanges} change{totalChanges !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}

        {/* Header card */}
        <div className="sr2-header">
          <div className="sr2-header-top">
            <div className={`sr2-icon-box ${isEditMode ? "edit" : "default"}`}>
              {isEditMode ? (
                <Pencil style={{ width: 18, height: 18, color: "#fff" }} />
              ) : (
                <Activity style={{ width: 18, height: 18, color: "#60a5fa" }} />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="sr2-meta">
                <span style={{ fontFamily: "'JetBrains Mono',monospace" }}>
                  {isEditMode ? "Lab Report · Edit" : "Lab Report Entry"}
                </span>
                <span className="sr2-meta-dot" />
                <span
                  className={`sr2-meta-active`}
                  style={{ color: schema.isActive ? "var(--c-green)" : "var(--c-ink-4)" }}
                >
                  {schema.isActive ? "● Active" : "○ Inactive"}
                </span>
              </div>
              <h1 className="sr2-title">{schema.name || "Untitled Schema"}</h1>
              {schema.description && <p className="sr2-desc">{schema.description}</p>}
            </div>
          </div>

          {/* Stats */}
          <div className="sr2-stats">
            {progress !== null && (
              <div className="sr2-stat">
                <span className="sr2-stat-label">Progress</span>
                <span className={`sr2-stat-val ${progress === 100 ? "green" : "blue"}`}>{Math.round(progress)}%</span>
              </div>
            )}
            <div className="sr2-stat">
              <span className="sr2-stat-label">Filled</span>
              <span className="sr2-stat-val">
                {totalFilled}
                <span style={{ fontSize: 13, color: "var(--c-ink-4)", fontWeight: 400 }}>/{totalFields}</span>
              </span>
            </div>
            <div className="sr2-stat">
              <span className="sr2-stat-label">In Range</span>
              <span className={`sr2-stat-val ${normalCount > 0 ? "green" : ""}`}>{normalCount}</span>
            </div>
            <div className="sr2-stat">
              <span className="sr2-stat-label">Abnormal</span>
              <span className={`sr2-stat-val ${abnormalCount > 0 ? "red" : ""}`}>{abnormalCount}</span>
            </div>
            {isEditMode && (
              <div className="sr2-stat">
                <span className="sr2-stat-label">Changes</span>
                <span className={`sr2-stat-val ${totalChanges > 0 ? "violet" : ""}`}>{totalChanges}</span>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {progress !== null && (
            <div className="sr2-progress-wrap">
              <div className="sr2-progress-row">
                <span className="sr2-progress-label">Completion</span>
                <span className="sr2-progress-count">
                  {totalFilled} / {totalFields} fields
                </span>
              </div>
              <div className="sr2-track">
                <div className={`sr2-fill ${progress === 100 ? "complete" : ""}`} style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Alerts */}
        {abnormalCount > 0 && (
          <div className="sr2-alert amber">
            <AlertTriangle style={{ width: 16, height: 16, color: "var(--c-amber)", flexShrink: 0, marginTop: 1 }} />
            <div>
              <div className="sr2-alert-title">Abnormal Values Detected</div>
              <div className="sr2-alert-body">
                {abnormalCount} result{abnormalCount > 1 ? "s" : ""} outside the standard reference range — please
                review before submitting.
              </div>
            </div>
          </div>
        )}

        {isEditMode && totalChanges > 0 && (
          <div className="sr2-alert violet">
            <Pencil style={{ width: 15, height: 15, color: "var(--c-violet)", flexShrink: 0, marginTop: 1 }} />
            <div>
              <div className="sr2-alert-title">Unsaved Changes</div>
              <div className="sr2-alert-body">
                {totalChanges} change{totalChanges !== 1 ? "s" : ""} pending. Edited fields are highlighted in purple.
                Click <strong>Update Report</strong> to save.
              </div>
            </div>
          </div>
        )}

        {/* Patient banner */}
        {invoice ? (
          <PatientBanner invoice={invoice} />
        ) : (
          needsContext && (
            <ManualPatient
              patientAge={patientAge}
              setPatientAge={setPatientAge}
              patientGender={patientGender}
              setPatientGender={setPatientGender}
            />
          )
        )}

        {/* Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          {schema.sections.map((section, si) => (
            <SectionPanel
              key={si}
              section={section}
              sectionIndex={si}
              values={values}
              onChange={handleChange}
              errors={errors}
              patientAge={patientAge}
              patientGender={patientGender}
              hideTitle={section.showTitleInReport === false}
              originalValues={isEditMode ? originalValues : undefined}
              isEditMode={isEditMode}
            />
          ))}
        </div>

        {/* Static range note */}
        {schema.hasStaticStandardRange && schema.staticStandardRange && (
          <div className="sr2-alert amber" style={{ marginBottom: 12 }}>
            <Info style={{ width: 15, height: 15, color: "var(--c-amber)", flexShrink: 0, marginTop: 1 }} />
            <div>
              <div className="sr2-alert-title">Standard Reference</div>
              <div className="sr2-alert-body">{schema.staticStandardRange}</div>
            </div>
          </div>
        )}

        {/* Validation errors */}
        {Object.keys(errors).length > 0 && (
          <div className="sr2-alert red" style={{ marginBottom: 12 }}>
            <XCircle style={{ width: 15, height: 15, color: "var(--c-red)", flexShrink: 0, marginTop: 1 }} />
            <div>
              <div className="sr2-alert-title">Validation Failed</div>
              <div className="sr2-alert-body">
                {Object.keys(errors).length} field{Object.keys(errors).length > 1 ? "s" : ""} require attention before
                submitting.
              </div>
            </div>
          </div>
        )}

        {/* Action bar */}
        <div className="sr2-action-bar">
          <div className="sr2-action-hint">
            <ShieldCheck style={{ width: 14, height: 14 }} />
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>
              {isEditMode ? "Editing existing report" : "Form validated on submit"}
            </span>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              className="sr2-btn-ghost"
              onClick={handleReset}
              title={isEditMode ? "Revert all changes" : "Clear all fields"}
            >
              <RotateCcw style={{ width: 13, height: 13 }} />
              {isEditMode ? "Revert" : "Reset"}
            </button>
            <button
              type="button"
              className={`sr2-btn-primary ${isEditMode ? "edit" : ""}`}
              disabled={loading || (isEditMode && totalChanges === 0)}
              onClick={handleSubmit}
            >
              {loading ? (
                <span className="sr2-spin-dot" />
              ) : isEditMode ? (
                <Save style={{ width: 14, height: 14 }} />
              ) : (
                <Send style={{ width: 14, height: 14 }} />
              )}
              {loading
                ? isEditMode
                  ? "Updating…"
                  : "Submitting…"
                : isEditMode
                  ? totalChanges > 0
                    ? `Update Report (${totalChanges})`
                    : "No Changes"
                  : "Submit Report"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SchemaRenderer;
