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
  Clock,
  CheckCheck,
} from "lucide-react";

// ─── Inject global styles ─────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@300;400;500&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

  .sr-root {
    --ink: #0b0f1a;
    --ink-2: #1e2535;
    --ink-3: #2d3550;
    --surface: #f4f5f8;
    --surface-2: #ecedf2;
    --surface-3: #e2e4eb;
    --border: #d6d9e4;
    --border-2: #c4c8d8;
    --amber: #e8a020;
    --amber-light: #fef6e4;
    --emerald: #1a9e6e;
    --emerald-light: #e6f7f1;
    --red: #d63a3a;
    --red-light: #fdf0f0;
    --orange: #d97316;
    --orange-light: #fff7ed;
    --violet: #7c3aed;
    --violet-light: #f5f3ff;
    --white: #ffffff;
    font-family: 'DM Sans', sans-serif;
    color: var(--ink);
    background: var(--surface);
    min-height: 100vh;
    padding: 0;
  }

  .sr-root * { box-sizing: border-box; }

  /* ── Mode Banner ── */
  .sr-mode-banner {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 16px; border-radius: 10px; margin-bottom: 16px;
    border: 1.5px solid; font-size: 12px; font-weight: 500;
  }
  .sr-mode-banner.edit-mode {
    background: var(--violet-light); border-color: rgba(124,58,237,0.25); color: #5b21b6;
  }
  .sr-mode-banner.edit-mode .sr-mode-dot {
    width: 6px; height: 6px; border-radius: 50%; background: var(--violet); flex-shrink: 0;
    animation: srpulse 1.8s ease-in-out infinite;
  }
  .sr-mode-banner.view-mode {
    background: var(--emerald-light); border-color: rgba(26,158,110,0.25); color: #065f46;
  }

  /* ── Card ── */
  .sr-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 14px;
    overflow: hidden;
    transition: box-shadow 0.2s;
  }
  .sr-card:hover { box-shadow: 0 4px 20px rgba(11,15,26,0.07); }
  .sr-card.sr-card-error { border-color: #f0a0a0; }

  /* ── Section header ── */
  .sr-section-header {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 16px;
    background: var(--ink);
    cursor: pointer; user-select: none;
    transition: background 0.15s;
    width: 100%; border: none; text-align: left;
  }
  .sr-section-header:hover { background: var(--ink-2); }
  .sr-section-header.error { background: #5c1a1a; }

  .sr-section-num {
    width: 26px; height: 26px; border-radius: 6px;
    background: rgba(255,255,255,0.12); color: #fff;
    font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 500;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; border: 1px solid rgba(255,255,255,0.18);
  }
  .sr-section-num.complete    { background: var(--amber); border-color: var(--amber); color: var(--ink); }
  .sr-section-num.error-state { background: var(--red);   border-color: var(--red); }

  .sr-section-title {
    flex: 1; font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 600;
    color: #e8eaf0; letter-spacing: 0.01em;
  }
  .sr-section-badge {
    font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500;
    padding: 3px 8px; border-radius: 4px;
    background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.55);
    letter-spacing: 0.04em; border: 1px solid rgba(255,255,255,0.1);
    white-space: nowrap;
  }
  .sr-section-badge.complete { background: var(--amber); color: var(--ink); border-color: var(--amber); }

  .sr-progress-track { height: 2px; background: var(--ink-3); }
  .sr-progress-fill  { height: 100%; background: var(--amber); transition: width 0.7s cubic-bezier(0.4,0,0.2,1); }

  /* ── Floating label field wrapper ── */
  .sr-field-wrap {
    position: relative;
    background: var(--white);
    border: 1.5px solid var(--border);
    border-radius: 9px;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .sr-field-wrap:focus-within {
    border-color: var(--ink-2);
    box-shadow: 0 0 0 3px rgba(30,37,53,0.08);
  }
  .sr-field-wrap.status-normal { border-color: var(--emerald); box-shadow: 0 0 0 3px rgba(26,158,110,0.08); }
  .sr-field-wrap.status-low    { border-color: var(--orange);  box-shadow: 0 0 0 3px rgba(217,115,22,0.08); }
  .sr-field-wrap.status-high   { border-color: var(--red);     box-shadow: 0 0 0 3px rgba(214,58,58,0.08); }
  .sr-field-wrap.field-error   { border-color: var(--red);     box-shadow: 0 0 0 3px rgba(214,58,58,0.08); background: var(--red-light); }
  .sr-field-wrap.edited-highlight { border-color: var(--violet); box-shadow: 0 0 0 3px rgba(124,58,237,0.08); }

  /* Floating label */
  .sr-float-label {
    position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
    font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 600;
    color: #9ea5b8; text-transform: uppercase; letter-spacing: 0.06em;
    pointer-events: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    max-width: calc(100% - 70px); background: transparent; line-height: 1;
    transition: all 0.15s ease;
  }
  .sr-field-wrap.floated .sr-float-label,
  .sr-field-wrap:focus-within .sr-float-label {
    top: 0; transform: translateY(-50%);
    font-size: 9px; letter-spacing: 0.08em; color: var(--ink-3);
    background: var(--white); padding: 0 4px; left: 9px; max-width: calc(100% - 30px);
  }
  .sr-field-wrap.field-error.floated .sr-float-label,
  .sr-field-wrap.field-error:focus-within .sr-float-label {
    background: var(--red-light); color: var(--red);
  }
  .sr-float-label .sr-req {
    display: inline-block; width: 4px; height: 4px; border-radius: 50%;
    background: var(--amber); margin-left: 3px; vertical-align: middle; margin-bottom: 1px;
  }

  /* Input inside float-label wrap */
  .sr-float-input {
    width: 100%; padding: 18px 14px 8px 12px;
    background: transparent; border: none; outline: none;
    font-family: 'DM Mono', monospace; font-size: 14px; font-weight: 500; color: var(--ink);
    line-height: 1.2; min-height: 52px;
  }
  .sr-float-input::placeholder { color: transparent; }
  .sr-float-input::-webkit-outer-spin-button,
  .sr-float-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }

  /* Unit tag */
  .sr-unit-tag {
    position: absolute; right: 0; top: 0; height: 100%;
    padding: 0 12px; display: flex; align-items: center;
    background: var(--surface); border-left: 1.5px solid var(--border);
    border-radius: 0 7px 7px 0;
    font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500;
    color: var(--ink-3); text-transform: uppercase; letter-spacing: 0.06em;
    pointer-events: none; user-select: none;
  }

  /* Range row */
  .sr-range-row {
    display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
    margin-top: 5px; min-height: 16px;
  }
  .sr-range-label { font-family: 'DM Mono', monospace; font-size: 10px; color: #9ea5b8; }
  .sr-range-label span { color: var(--ink-3); font-weight: 500; }

  .sr-status-badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 2px 7px; border-radius: 4px;
    font-family: 'Syne', sans-serif; font-size: 9.5px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.06em; border: 1px solid;
  }
  .sr-status-badge.normal { background: var(--emerald-light); color: var(--emerald); border-color: rgba(26,158,110,0.2); }
  .sr-status-badge.low    { background: var(--orange-light);  color: var(--orange);  border-color: rgba(217,115,22,0.2); }
  .sr-status-badge.high   { background: var(--red-light);     color: var(--red);     border-color: rgba(214,58,58,0.2); }

  /* Changed badge */
  .sr-changed-badge {
    display: inline-flex; align-items: center; gap: 3px;
    padding: 2px 6px; border-radius: 4px;
    background: var(--violet-light); color: var(--violet); border: 1px solid rgba(124,58,237,0.2);
    font-family: 'DM Mono', monospace; font-size: 9px; font-weight: 500;
  }

  .sr-field-error {
    display: flex; align-items: center; gap: 5px;
    font-size: 11px; color: var(--red); font-weight: 500; margin-top: 5px;
  }

  /* ── Toggle buttons ── */
  .sr-toggle-btn {
    padding: 10px 14px; border-radius: 8px;
    font-size: 13px; font-weight: 500;
    border: 1.5px solid var(--border); background: var(--white); color: #5a6282;
    cursor: pointer; transition: all 0.12s;
    display: flex; align-items: center; gap: 8px; min-height: 44px;
  }
  .sr-toggle-btn:hover { border-color: var(--ink-2); color: var(--ink); background: var(--surface); }
  .sr-toggle-btn.active { background: var(--ink); border-color: var(--ink); color: var(--white); box-shadow: 0 2px 8px rgba(11,15,26,0.2); }
  .sr-toggle-btn.edited { border-color: var(--violet); }
  .sr-toggle-btn.edited.active { background: var(--violet); border-color: var(--violet); }

  /* ── Dropdown ── */
  .sr-dropdown-wrap { position: relative; }
  .sr-dropdown-btn {
    width: 100%; display: flex; align-items: flex-end; justify-content: space-between;
    padding: 18px 14px 8px 12px;
    border: 1.5px solid var(--border); border-radius: 9px;
    background: var(--white); cursor: pointer; transition: all 0.15s;
    font-family: 'DM Mono', monospace; font-size: 14px; font-weight: 500; color: var(--ink);
    min-height: 52px;
  }
  .sr-dropdown-btn.empty { color: transparent; }
  .sr-dropdown-btn.open  { border-color: var(--ink-2); box-shadow: 0 0 0 3px rgba(30,37,53,0.08); }
  .sr-dropdown-label {
    position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
    font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 600;
    color: #9ea5b8; text-transform: uppercase; letter-spacing: 0.06em;
    pointer-events: none; transition: all 0.15s ease;
    background: transparent; line-height: 1; white-space: nowrap;
  }
  .sr-dropdown-label .sr-req {
    display: inline-block; width: 4px; height: 4px; border-radius: 50%;
    background: var(--amber); margin-left: 3px; vertical-align: middle; margin-bottom: 1px;
  }
  .sr-dropdown-wrap.floated .sr-dropdown-label {
    top: 0; transform: translateY(-50%);
    font-size: 9px; letter-spacing: 0.08em; color: var(--ink-3);
    background: var(--white); padding: 0 4px; left: 9px;
  }
  .sr-dropdown-menu {
    position: absolute; z-index: 40;
    top: calc(100% + 4px); left: 0; right: 0;
    background: var(--white); border: 1.5px solid var(--border); border-radius: 10px;
    box-shadow: 0 12px 40px rgba(11,15,26,0.14); overflow-y: auto; max-height: 200px;
  }
  .sr-dropdown-item {
    width: 100%; text-align: left; padding: 12px 14px;
    font-size: 13px; font-weight: 400; color: var(--ink-3);
    background: none; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: space-between;
    transition: background 0.1s; min-height: 44px;
  }
  .sr-dropdown-item:hover    { background: var(--surface); }
  .sr-dropdown-item.selected { background: var(--ink); color: #fff; font-weight: 600; }

  /* ── Textarea ── */
  .sr-textarea-wrap {
    position: relative; border: 1.5px solid var(--border); border-radius: 9px;
    background: var(--white); transition: all 0.15s; overflow: hidden;
  }
  .sr-textarea-wrap:focus-within { border-color: var(--ink-2); box-shadow: 0 0 0 3px rgba(30,37,53,0.08); }
  .sr-textarea-wrap.field-error  { border-color: var(--red); background: var(--red-light); }
  .sr-textarea-wrap.edited-highlight { border-color: var(--violet); box-shadow: 0 0 0 3px rgba(124,58,237,0.08); }
  .sr-textarea-label {
    position: absolute; left: 12px; top: 14px;
    font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 600;
    color: #9ea5b8; text-transform: uppercase; letter-spacing: 0.06em;
    pointer-events: none; transition: all 0.15s ease; background: transparent; line-height: 1;
  }
  .sr-textarea-label .sr-req {
    display: inline-block; width: 4px; height: 4px; border-radius: 50%;
    background: var(--amber); margin-left: 3px; vertical-align: middle; margin-bottom: 1px;
  }
  .sr-textarea-wrap.floated .sr-textarea-label,
  .sr-textarea-wrap:focus-within .sr-textarea-label {
    top: 0; transform: translateY(-50%); font-size: 9px; letter-spacing: 0.08em;
    color: var(--ink-3); background: var(--white); padding: 0 4px; left: 9px;
  }
  .sr-textarea {
    width: 100%; padding: 22px 14px 10px 12px;
    background: transparent; border: none; outline: none; resize: none;
    font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--ink);
  }
  .sr-textarea::placeholder { color: transparent; }
  .sr-char-count { font-family: 'DM Mono', monospace; font-size: 10px; color: #b0b7cc; text-align: right; padding: 2px 10px 6px; }

  /* ── Text input ── */
  .sr-text-input-wrap {
    position: relative; border: 1.5px solid var(--border); border-radius: 9px;
    background: var(--white); transition: all 0.15s;
  }
  .sr-text-input-wrap:focus-within { border-color: var(--ink-2); box-shadow: 0 0 0 3px rgba(30,37,53,0.08); }
  .sr-text-input-wrap.field-error  { border-color: var(--red); background: var(--red-light); }
  .sr-text-input-wrap.edited-highlight { border-color: var(--violet); box-shadow: 0 0 0 3px rgba(124,58,237,0.08); }
  .sr-text-input-label {
    position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
    font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 600;
    color: #9ea5b8; text-transform: uppercase; letter-spacing: 0.06em;
    pointer-events: none; transition: all 0.15s ease;
    background: transparent; line-height: 1; white-space: nowrap;
  }
  .sr-text-input-label .sr-req {
    display: inline-block; width: 4px; height: 4px; border-radius: 50%;
    background: var(--amber); margin-left: 3px; vertical-align: middle; margin-bottom: 1px;
  }
  .sr-text-input-wrap.floated .sr-text-input-label,
  .sr-text-input-wrap:focus-within .sr-text-input-label {
    top: 0; transform: translateY(-50%); font-size: 9px; letter-spacing: 0.08em;
    color: var(--ink-3); background: var(--white); padding: 0 4px; left: 9px;
  }
  .sr-text-input {
    width: 100%; padding: 18px 14px 8px 12px;
    background: transparent; border: none; outline: none;
    font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--ink); min-height: 52px;
  }
  .sr-text-input::placeholder { color: transparent; }
  .sr-char-count { font-family: 'DM Mono', monospace; font-size: 10px; color: #b0b7cc; text-align: right; padding: 2px 10px 6px; }

  /* ── Tooltip ── */
  .sr-tooltip-wrap { position: relative; display: inline-flex; }
  .sr-tooltip-box {
    position: absolute; z-index: 50;
    bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%);
    width: 200px; background: var(--ink); color: #e8eaf0;
    font-size: 11px; border-radius: 8px; padding: 10px 12px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.3); border: 1px solid var(--ink-3); pointer-events: none;
  }
  .sr-tooltip-arrow {
    position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
    border: 5px solid transparent; border-top-color: var(--ink);
  }
  .sr-tooltip-title {
    font-family: 'Syne', sans-serif; font-size: 9px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.1em; color: var(--amber); margin-bottom: 7px;
  }
  .sr-tooltip-row { color: #8d95af; line-height: 1.7; font-family: 'DM Mono', monospace; font-size: 10.5px; }
  .sr-tooltip-row span { color: #e8eaf0; font-weight: 500; }
  .sr-info-btn { background: none; border: none; cursor: pointer; padding: 0; display: inline-flex; line-height: 0; }

  /* ── Warn context ── */
  .sr-context-warn {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 10px; color: var(--amber); font-weight: 600; font-family: 'DM Mono', monospace;
  }

  /* ── Patient banner ── */
  .sr-patient-banner { border: 1.5px solid var(--border); border-radius: 14px; overflow: hidden; }
  .sr-patient-banner-header { display: flex; align-items: center; gap: 10px; padding: 10px 16px; background: var(--ink); }
  .sr-patient-banner-body { display: grid; grid-template-columns: repeat(4, 1fr); background: var(--white); }
  .sr-patient-cell { padding: 14px 16px; border-right: 1px solid var(--surface-3); }
  .sr-patient-cell:last-child { border-right: none; }
  .sr-patient-cell-label {
    font-family: 'Syne', sans-serif; font-size: 9.5px; font-weight: 700;
    color: #9ea5b8; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px;
  }
  .sr-patient-cell-val { font-size: 14px; font-weight: 600; color: var(--ink); }

  /* ── Alert boxes ── */
  .sr-alert { display: flex; align-items: flex-start; gap: 12px; padding: 12px 16px; border-radius: 10px; border: 1.5px solid; }
  .sr-alert.amber { background: var(--amber-light); border-color: rgba(232,160,32,0.35); }
  .sr-alert.red   { background: var(--red-light);   border-color: rgba(214,58,58,0.25); }
  .sr-alert.violet { background: var(--violet-light); border-color: rgba(124,58,237,0.25); }
  .sr-alert-title { font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
  .sr-alert.amber .sr-alert-title { color: #8a5a08; }
  .sr-alert.red   .sr-alert-title { color: #8b1a1a; }
  .sr-alert.violet .sr-alert-title { color: #5b21b6; }
  .sr-alert-body  { font-size: 12px; margin-top: 2px; }
  .sr-alert.amber .sr-alert-body { color: #a06c0e; }
  .sr-alert.red   .sr-alert-body { color: #b02020; }
  .sr-alert.violet .sr-alert-body { color: #6d28d9; }

  /* ── Buttons ── */
  .sr-btn-reset {
    display: flex; align-items: center; gap: 7px;
    padding: 11px 18px; border: 1.5px solid var(--border); border-radius: 9px;
    background: var(--white); color: #7a82a0;
    font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.03em;
    cursor: pointer; transition: all 0.15s; min-height: 44px;
  }
  .sr-btn-reset:hover { border-color: var(--ink-2); color: var(--ink); background: var(--surface); }

  .sr-btn-submit {
    display: flex; align-items: center; gap: 8px;
    padding: 11px 28px; border-radius: 9px;
    background: var(--ink); color: var(--white);
    font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.04em;
    border: none; cursor: pointer; transition: all 0.15s;
    box-shadow: 0 2px 10px rgba(11,15,26,0.18); position: relative; overflow: hidden; min-height: 44px;
  }
  .sr-btn-submit::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.07) 0%, transparent 60%); pointer-events: none;
  }
  .sr-btn-submit:hover  { background: #1e2535; box-shadow: 0 4px 16px rgba(11,15,26,0.28); transform: translateY(-1px); }
  .sr-btn-submit:active { transform: translateY(0); }
  .sr-btn-submit:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }
  .sr-btn-submit.edit-mode { background: var(--violet); box-shadow: 0 2px 10px rgba(124,58,237,0.3); }
  .sr-btn-submit.edit-mode:hover { background: #6d28d9; box-shadow: 0 4px 16px rgba(124,58,237,0.4); }
  .sr-btn-submit .sr-amber-dot {
    width: 6px; height: 6px; border-radius: 50%; background: var(--amber);
    animation: srpulse 1.8s ease-in-out infinite;
  }
  @keyframes srpulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.6; transform:scale(0.8); } }

  /* ── Gender toggle ── */
  .sr-gender-btn {
    flex: 1; padding: 10px; border-radius: 9px;
    font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.04em;
    border: 1.5px solid var(--border); background: var(--white); color: #7a82a0;
    cursor: pointer; transition: all 0.12s; min-height: 44px;
  }
  .sr-gender-btn:hover  { border-color: var(--ink-2); color: var(--ink); }
  .sr-gender-btn.active { background: var(--ink); border-color: var(--ink); color: var(--white); }

  /* ── Stats row ── */
  .sr-stats-row { display: flex; gap: 1px; background: var(--surface-3); border-radius: 10px; overflow: hidden; }
  .sr-stat-cell {
    flex: 1; background: var(--white); padding: 12px 14px;
    display: flex; flex-direction: column; align-items: flex-start; gap: 3px; min-width: 0;
  }
  .sr-stat-cell:first-child { border-radius: 10px 0 0 10px; }
  .sr-stat-cell:last-child  { border-radius: 0 10px 10px 0; }
  .sr-stat-label { font-family: 'Syne', sans-serif; font-size: 9px; font-weight: 700; color: #9ea5b8; text-transform: uppercase; letter-spacing: 0.08em; white-space: nowrap; }
  .sr-stat-val   { font-family: 'DM Mono', monospace; font-size: 18px; font-weight: 500; color: var(--ink); line-height: 1; }
  .sr-stat-val.emerald { color: var(--emerald); }
  .sr-stat-val.red     { color: var(--red); }
  .sr-stat-val.violet  { color: var(--violet); }

  .sr-main-progress-track { height: 3px; background: var(--surface-3); border-radius: 2px; overflow: hidden; }
  .sr-main-progress-fill  {
    height: 100%; background: linear-gradient(90deg, var(--amber), #f87316);
    transition: width 0.7s cubic-bezier(0.4,0,0.2,1); border-radius: 2px;
  }

  .sr-chevron { transition: transform 0.2s ease; flex-shrink: 0; }
  .sr-chevron.open { transform: rotate(180deg); }

  .sr-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 24px; text-align: center; }
  .sr-empty-icon { width: 56px; height: 56px; background: var(--surface); border: 1.5px solid var(--border); border-radius: 14px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }

  /* ── Fields grid ── */
  .sr-fields-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 16px 20px;
    padding: 20px 16px;
  }

  /* ── Responsive breakpoints ── */
  @media (max-width: 640px) {
    .sr-patient-banner-body { grid-template-columns: 1fr 1fr; }
    .sr-patient-cell:nth-child(2) { border-right: none; }
    .sr-patient-cell:nth-child(3) { border-top: 1px solid var(--surface-3); }
    .sr-patient-cell:nth-child(4) { border-top: 1px solid var(--surface-3); border-right: none; }

    .sr-stats-row   { flex-wrap: wrap; }
    .sr-stat-cell   { min-width: calc(50% - 1px); flex: none; width: calc(50% - 1px); }
    .sr-stat-cell:nth-child(1) { border-radius: 10px 0 0 0; }
    .sr-stat-cell:nth-child(2) { border-radius: 0 10px 0 0; }
    .sr-stat-cell:nth-child(3) { border-radius: 0 0 0 10px; }
    .sr-stat-cell:nth-child(4) { border-radius: 0 0 10px 0; }
    .sr-stat-val { font-size: 16px; }

    .sr-fields-grid { grid-template-columns: 1fr 1fr; padding: 14px 12px; gap: 12px; }
    .sr-btn-submit, .sr-btn-reset { padding: 11px 14px; font-size: 11px; }
  }

  @media (max-width: 380px) {
    .sr-fields-grid { grid-template-columns: 1fr; }
    .sr-stats-row   { flex-direction: column; }
    .sr-stat-cell   { width: 100%; min-width: 100%; border-radius: 0 !important; }
    .sr-stat-cell:first-child { border-radius: 10px 10px 0 0 !important; }
    .sr-stat-cell:last-child  { border-radius: 0 0 10px 10px !important; }
  }
`;

function StyleInjector() {
  useEffect(() => {
    const id = "sr-styles-v4";
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

// ─── Hydrate values from existing report data ─────────────────────────────────
// existingReport shape (what reportService.addReport saves):
// {
//   name: "rbs",
//   "Section A": { "Simple Number": { value: "5", unit: "mmHg", referenceRange: "1-10" }, ... , __showTitle: true },
//   "Section B": { "Result": { value: "Positive" }, ... , __showTitle: true },
//   invoiceId, patientName, patientAge, patientGender   (optional)
// }
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
      // checkbox values are stored as arrays, everything else as primitives
      values[key] = fieldData.value ?? fieldData;
    });
  });
  return values;
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────
function RangeInfoTooltip({ field }) {
  const [open, setOpen] = useState(false);
  const sr = field.standardRange;
  if (!sr || sr.type === "none") return null;
  return (
    <div className="sr-tooltip-wrap" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button className="sr-info-btn" type="button">
        <Info style={{ width: 12, height: 12, color: "#b0b7cc" }} />
      </button>
      {open && (
        <div className="sr-tooltip-box">
          <div className="sr-tooltip-title">Reference Ranges</div>
          {sr.type === "simple" && (
            <div className="sr-tooltip-row">
              {sr.data.min} – {sr.data.max} {field.unit || ""}
            </div>
          )}
          {sr.type === "age" &&
            Array.isArray(sr.data) &&
            sr.data.map((r, i) => (
              <div key={i} className="sr-tooltip-row">
                Age {r.minAge}–{r.maxAge === 999 ? "∞" : r.maxAge}:{" "}
                <span>
                  {r.minValue}–{r.maxValue}
                </span>
              </div>
            ))}
          {sr.type === "gender" &&
            sr.data &&
            Object.entries(sr.data).map(([g, v]) => (
              <div key={g} className="sr-tooltip-row" style={{ textTransform: "capitalize" }}>
                {g}:{" "}
                <span>
                  {v.min}–{v.max}
                </span>
              </div>
            ))}
          {sr.type === "combined" &&
            Array.isArray(sr.data) &&
            sr.data.map((r, i) => (
              <div key={i} className="sr-tooltip-row" style={{ textTransform: "capitalize" }}>
                {r.gender} {r.minAge}–{r.maxAge === 999 ? "∞" : r.maxAge}yr:{" "}
                <span>
                  {r.minValue}–{r.maxValue}
                </span>
              </div>
            ))}
          <div className="sr-tooltip-arrow" />
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
  const floated = hasValue;
  const isChanged = isEditMode && originalValue !== undefined && String(value) !== String(originalValue ?? "");

  const needsContext =
    ((field.standardRange?.type === "age" || field.standardRange?.type === "combined") && !patientAge) ||
    ((field.standardRange?.type === "gender" || field.standardRange?.type === "combined") && !patientGender);

  let wrapCls = "sr-field-wrap";
  if (error) wrapCls += " field-error";
  else if (isChanged) wrapCls += " edited-highlight";
  else if (hasValue && range && status !== "neutral") wrapCls += ` status-${status}`;
  if (floated) wrapCls += " floated";

  return (
    <div>
      <div className={wrapCls}>
        <span className="sr-float-label">
          {field.name}
          {field.required && <span className="sr-req" />}
        </span>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder=" "
          className="sr-float-input"
          style={{ paddingRight: field.unit ? "64px" : "14px" }}
        />
        {field.unit && <span className="sr-unit-tag">{field.unit}</span>}
      </div>
      <div className="sr-range-row">
        {range ? (
          <span className="sr-range-label">
            Range:{" "}
            <span>
              {range.min}–{range.max}
              {field.unit ? ` ${field.unit}` : ""}
            </span>
          </span>
        ) : (
          <span className="sr-range-label">—</span>
        )}
        {hasValue && range && status !== "neutral" && (
          <span className={`sr-status-badge ${status}`}>
            {status === "normal" && <CheckCircle2 style={{ width: 9, height: 9 }} />}
            {status === "low" && <TrendingDown style={{ width: 9, height: 9 }} />}
            {status === "high" && <TrendingUp style={{ width: 9, height: 9 }} />}
            {status === "normal" ? "Normal" : status === "low" ? "Low" : "High"}
          </span>
        )}
        <RangeInfoTooltip field={field} />
        {needsContext && !range && field.standardRange?.type !== "none" && (
          <span className="sr-context-warn">
            <AlertTriangle style={{ width: 10, height: 10 }} />
            {!patientAge && (field.standardRange?.type === "age" || field.standardRange?.type === "combined")
              ? "Enter age"
              : "Select gender"}
          </span>
        )}
        {isChanged && (
          <span className="sr-changed-badge">
            <Pencil style={{ width: 8, height: 8 }} />
            edited
          </span>
        )}
      </div>
      {error && (
        <div className="sr-field-error">
          <XCircle style={{ width: 11, height: 11, flexShrink: 0 }} />
          {error}
        </div>
      )}
    </div>
  );
}

// ─── Radio ────────────────────────────────────────────────────────────────────
function RadioField({ field, options = [], value, onChange, error, originalValue, isEditMode }) {
  return (
    <div>
      <div
        style={{
          marginBottom: 8,
          fontFamily: "'Syne',sans-serif",
          fontSize: 9.5,
          fontWeight: 700,
          color: "#9ea5b8",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {field.name}
        {field.required && (
          <span
            style={{
              display: "inline-block",
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: "var(--amber)",
              marginLeft: 3,
              verticalAlign: "middle",
              marginBottom: 1,
            }}
          />
        )}
        {isEditMode && originalValue !== undefined && value !== (originalValue ?? "") && (
          <span className="sr-changed-badge">
            <Pencil style={{ width: 8, height: 8 }} />
            edited
          </span>
        )}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {options.map((opt) => {
          const isChanged =
            isEditMode && originalValue !== undefined && opt === value && value !== (originalValue ?? "");
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(value === opt ? "" : opt)}
              className={`sr-toggle-btn ${value === opt ? "active" : ""} ${isChanged ? "edited" : ""}`}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  border: `2px solid ${value === opt ? "rgba(255,255,255,0.5)" : "#c4c8d8"}`,
                  background: value === opt ? "#fff" : "transparent",
                  flexShrink: 0,
                  boxShadow: value === opt ? "inset 0 0 0 2.5px #0b0f1a" : "none",
                }}
              />
              {opt}
            </button>
          );
        })}
      </div>
      {error && (
        <div className="sr-field-error">
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
      <div className={`sr-dropdown-wrap ${floated ? "floated" : ""}`}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`sr-dropdown-btn ${!value ? "empty" : ""} ${open ? "open" : ""}`}
          style={isChanged ? { borderColor: "var(--violet)", boxShadow: "0 0 0 3px rgba(124,58,237,0.08)" } : {}}
        >
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 14, fontWeight: 500 }}>{value || ""}</span>
          <ChevronDown
            className={`sr-chevron ${open ? "open" : ""}`}
            style={{ width: 15, height: 15, color: "#9ea5b8" }}
          />
        </button>
        <span className="sr-dropdown-label">
          {field.name}
          {field.required && <span className="sr-req" />}
        </span>
        {open && (
          <div className="sr-dropdown-menu">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                className={`sr-dropdown-item ${value === opt ? "selected" : ""}`}
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
          <span className="sr-changed-badge">
            <Pencil style={{ width: 8, height: 8 }} />
            edited
          </span>
        </div>
      )}
      {error && (
        <div className="sr-field-error" style={{ marginTop: 5 }}>
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
      <div
        style={{
          marginBottom: 8,
          fontFamily: "'Syne',sans-serif",
          fontSize: 9.5,
          fontWeight: 700,
          color: "#9ea5b8",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {field.name}
        {field.required && (
          <span
            style={{
              display: "inline-block",
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: "var(--amber)",
              marginLeft: 3,
              verticalAlign: "middle",
              marginBottom: 1,
            }}
          />
        )}
        {isChanged && (
          <span className="sr-changed-badge">
            <Pencil style={{ width: 8, height: 8 }} />
            edited
          </span>
        )}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {options.map((opt) => {
          const checked = value.includes(opt);
          const wasOriginal = origArr.includes(opt);
          const optChanged = isEditMode && originalValue !== undefined && checked !== wasOriginal;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={`sr-toggle-btn ${checked ? "active" : ""} ${optChanged ? "edited" : ""}`}
            >
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 4,
                  flexShrink: 0,
                  border: `2px solid ${checked ? "rgba(255,255,255,0.5)" : "#c4c8d8"}`,
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
                      stroke="#0b0f1a"
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
        <div className="sr-field-error">
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
      <div
        className={`sr-textarea-wrap ${error ? "field-error" : ""} ${floated ? "floated" : ""} ${isChanged ? "edited-highlight" : ""}`}
      >
        <span className="sr-textarea-label">
          {field.name}
          {field.required && <span className="sr-req" />}
        </span>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={field.maxLength}
          rows={3}
          placeholder=" "
          className="sr-textarea"
        />
        <div className="sr-char-count">
          {(value || "").length}/{field.maxLength}
        </div>
      </div>
      {isChanged && (
        <div style={{ marginTop: 5 }}>
          <span className="sr-changed-badge">
            <Pencil style={{ width: 8, height: 8 }} />
            edited
          </span>
        </div>
      )}
      {error && (
        <div className="sr-field-error" style={{ marginTop: 5 }}>
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
      <div
        className={`sr-text-input-wrap ${error ? "field-error" : ""} ${floated ? "floated" : ""} ${isChanged ? "edited-highlight" : ""}`}
      >
        <span className="sr-text-input-label">
          {field.name}
          {field.required && <span className="sr-req" />}
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={field.maxLength}
          placeholder=" "
          className="sr-text-input"
        />
        <div className="sr-char-count">
          {(value || "").length}/{field.maxLength}
        </div>
      </div>
      {isChanged && (
        <div style={{ marginTop: 5 }}>
          <span className="sr-changed-badge">
            <Pencil style={{ width: 8, height: 8 }} />
            edited
          </span>
        </div>
      )}
      {error && (
        <div className="sr-field-error" style={{ marginTop: 5 }}>
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
    const key = `${sectionIndex}_${f.name}`;
    const v = values[key];
    return Array.isArray(v) ? v.length > 0 : v !== "" && v !== undefined && v !== null;
  }).length;
  const hasError = section.fields.some((f) => errors[`${sectionIndex}_${f.name}`]);
  const complete = filledCount === fieldCount && fieldCount > 0;

  const fieldsGrid = (
    <div className="sr-fields-grid">
      {section.fields.map((field) => {
        const key = `${sectionIndex}_${field.name}`;
        const val = values[key] ?? (field.type === "checkbox" ? [] : "");
        const err = errors[key];
        const origVal = originalValues ? originalValues[key] : undefined;
        const spanFull = field.type === "textarea" || field.type === "checkbox" || field.type === "radio";
        return (
          <div key={key} style={spanFull ? { gridColumn: "1 / -1" } : {}}>
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

  if (hideTitle) return <div style={{ background: "#fff", borderRadius: 14 }}>{fieldsGrid}</div>;

  return (
    <div className={`sr-card ${hasError ? "sr-card-error" : ""}`}>
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className={`sr-section-header ${hasError ? "error" : ""}`}
      >
        <div className={`sr-section-num ${complete ? "complete" : hasError ? "error-state" : ""}`}>
          {sectionIndex + 1}
        </div>
        <span className="sr-section-title">{section.name}</span>
        <span className={`sr-section-badge ${complete ? "complete" : ""}`}>
          {filledCount}/{fieldCount}
        </span>
        <ChevronDown
          className={`sr-chevron ${!collapsed ? "open" : ""}`}
          style={{ width: 15, height: 15, color: "rgba(255,255,255,0.4)" }}
        />
      </button>
      <div className="sr-progress-track">
        <div
          className="sr-progress-fill"
          style={{ width: fieldCount > 0 ? `${(filledCount / fieldCount) * 100}%` : "0%" }}
        />
      </div>
      {!collapsed && fieldsGrid}
    </div>
  );
}

// ─── Patient Context Banner ───────────────────────────────────────────────────
function InvoicePatientBanner({ invoice }) {
  return (
    <div className="sr-patient-banner">
      <div className="sr-patient-banner-header">
        <User style={{ width: 13, height: 13, color: "var(--amber)" }} />
        <span
          style={{
            fontFamily: "'Syne',sans-serif",
            fontSize: 10,
            fontWeight: 700,
            color: "rgba(255,255,255,0.6)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          Patient Record
        </span>
        <span
          style={{
            fontFamily: "'DM Mono',monospace",
            fontSize: 10,
            color: "rgba(255,255,255,0.35)",
            marginLeft: "auto",
          }}
        >
          {invoice.invoiceId}
        </span>
      </div>
      <div className="sr-patient-banner-body">
        {[
          { label: "Full Name", val: invoice.patientName },
          { label: "Age", val: `${invoice.age} yrs` },
          { label: "Gender", val: invoice.gender, cap: true },
          { label: "Contact", val: invoice.contactNumber },
        ].map((c) => (
          <div key={c.label} className="sr-patient-cell">
            <div className="sr-patient-cell-label">{c.label}</div>
            <div className="sr-patient-cell-val" style={{ textTransform: c.cap ? "capitalize" : undefined }}>
              {c.val}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Manual Patient Context ───────────────────────────────────────────────────
function ManualPatientContext({ patientAge, setPatientAge, patientGender, setPatientGender }) {
  const floated = patientAge !== "" && patientAge !== null && patientAge !== undefined;
  return (
    <div className="sr-patient-banner">
      <div className="sr-patient-banner-header">
        <User style={{ width: 13, height: 13, color: "var(--amber)" }} />
        <span
          style={{
            fontFamily: "'Syne',sans-serif",
            fontSize: 10,
            fontWeight: 700,
            color: "rgba(255,255,255,0.6)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          Patient Context
        </span>
        <span
          style={{
            fontFamily: "'DM Mono',monospace",
            fontSize: 10,
            color: "rgba(255,255,255,0.35)",
            marginLeft: "auto",
          }}
        >
          Required for dynamic ranges
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", background: "#fff" }}>
        <div className="sr-patient-cell">
          <div className="sr-patient-cell-label" style={{ marginBottom: 8 }}>
            Age
          </div>
          <div className={`sr-field-wrap ${floated ? "floated" : ""}`} style={{ background: "#fff" }}>
            <span className="sr-float-label">Years</span>
            <input
              type="number"
              value={patientAge}
              onChange={(e) => setPatientAge(e.target.value)}
              placeholder=" "
              min="0"
              max="150"
              className="sr-float-input"
              style={{ paddingRight: "52px" }}
            />
            <span className="sr-unit-tag">yrs</span>
          </div>
        </div>
        <div className="sr-patient-cell" style={{ borderRight: "none" }}>
          <div className="sr-patient-cell-label" style={{ marginBottom: 8 }}>
            Gender
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {["male", "female"].map((g) => (
              <button
                key={g}
                type="button"
                className={`sr-gender-btn ${patientGender === g ? "active" : ""}`}
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

// ─── Build report payload (shared between create & update) ────────────────────
function buildPayload(schema, values, patientAge, patientGender, invoice) {
  const report = {};
  schema.sections.forEach((sec, si) => {
    const sectionData = {};
    sec.fields.forEach((field) => {
      const key = `${si}_${field.name}`;
      const val = values[key];
      if (val !== "" && val !== undefined && val !== null && !(Array.isArray(val) && val.length === 0)) {
        sectionData[field.name] = {
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
    if (Object.keys(sectionData).length > 0) {
      report[sec.name] = { ...sectionData, __showTitle: sec.showTitleInReport !== false };
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
/**
 * SchemaRenderer
 *
 * Props:
 *  - schema        {object}   – the schema definition (sections, fields, etc.)
 *  - invoice       {object?}  – optional patient/invoice context
 *  - onSubmit      {fn}       – called with payload on create  (upload mode)
 *  - onUpdate      {fn}       – called with payload on update  (edit mode)
 *  - loading       {boolean}  – disables submit while in-flight
 *  - existingReport {object?} – pre-filled report data → activates edit mode
 *    Shape: the exact object previously passed to onSubmit / returned by API
 */
function SchemaRenderer({ schema, invoice, onSubmit, onUpdate, loading = false, existingReport = null }) {
  const isEditMode = Boolean(existingReport);

  // Hydrate initial values: if edit mode, seed from existingReport; otherwise empty
  const computeInitialValues = () => (isEditMode ? hydrateValuesFromReport(schema, existingReport) : {});

  const [values, setValues] = useState(computeInitialValues);
  const [errors, setErrors] = useState({});

  // Original values snapshot for diff/highlight — only meaningful in edit mode
  const [originalValues] = useState(() => (isEditMode ? hydrateValuesFromReport(schema, existingReport) : {}));

  const [patientAge, setPatientAge] = useState(invoice?.age ?? existingReport?.patientAge ?? "");
  const [patientGender, setPatientGender] = useState(invoice?.gender ?? existingReport?.patientGender ?? "");

  if (!schema || !schema.sections) return null;

  // Re-hydrate if schema or existingReport changes (e.g. navigation between reports)
  useEffect(() => {
    setValues(computeInitialValues());
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Count changed fields for the edit-mode stats
  const changedCount = isEditMode
    ? Object.keys(originalValues).filter((k) => {
        const cur = values[k];
        const orig = originalValues[k];
        if (Array.isArray(orig)) return JSON.stringify([...(cur || [])].sort()) !== JSON.stringify([...orig].sort());
        return String(cur ?? "") !== String(orig ?? "");
      }).length
    : 0;

  // Also count newly filled fields that were empty before
  const allSchemaKeys = schema.sections.flatMap((sec, si) => sec.fields.map((f) => `${si}_${f.name}`));
  const newlyFilled = isEditMode
    ? allSchemaKeys.filter((k) => {
        const cur = values[k];
        const orig = originalValues[k];
        const isEmpty = (v) => v === "" || v === undefined || v === null || (Array.isArray(v) && v.length === 0);
        return isEmpty(orig) && !isEmpty(cur);
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

    if (isEditMode) {
      onUpdate?.(payload);
    } else {
      onSubmit?.(payload);
    }
  };

  const handleReset = () => {
    if (isEditMode) {
      // In edit mode: reset back to the originally loaded data
      setValues(hydrateValuesFromReport(schema, existingReport));
    } else {
      setValues({});
    }
    setErrors({});
  };

  const needsContext = schema.sections.some((sec) =>
    sec.fields.some(
      (f) => f.type === "number" && f.standardRange?.type !== "none" && f.standardRange?.type !== "simple",
    ),
  );
  const hasFields = schema.sections.some((s) => s.fields.length > 0);

  const totalFields = allSchemaKeys.length;
  const totalFilled = allSchemaKeys.filter((k) => {
    const v = values[k];
    return Array.isArray(v) ? v.length > 0 : v !== "" && v !== undefined && v !== null;
  }).length;
  const progress = totalFields > 0 ? (totalFilled / totalFields) * 100 : null;

  const allNumericFields = schema.sections.flatMap((sec, si) =>
    sec.fields
      .filter((f) => f.type === "number")
      .map((f) => {
        const range = getStandardRange(f, patientAge, patientGender);
        return getRangeStatus(values[`${si}_${f.name}`], range);
      }),
  );
  const abnormalCount = allNumericFields.filter((s) => s === "high" || s === "low").length;
  const normalCount = allNumericFields.filter((s) => s === "normal").length;

  if (!hasFields) {
    return (
      <div className="sr-root">
        <StyleInjector />
        <div className="sr-empty">
          <div className="sr-empty-icon">
            <Eye style={{ width: 22, height: 22, color: "#c4c8d8" }} />
          </div>
          <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, color: "#5a6282", fontSize: 14 }}>
            No fields configured
          </p>
          <p style={{ color: "#9ea5b8", fontSize: 12, marginTop: 4 }}>Add fields in the Builder to preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sr-root">
      <StyleInjector />
      <div style={{ maxWidth: 1600, margin: "0 auto", padding: "24px 16px 48px" }}>
        {/* ── Mode banner ── */}
        {isEditMode && (
          <div className="sr-mode-banner edit-mode">
            <span className="sr-mode-dot" />
            <Pencil style={{ width: 12, height: 12 }} />
            <span
              style={{
                fontFamily: "'Syne',sans-serif",
                fontWeight: 700,
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Edit Mode
            </span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, opacity: 0.7, marginLeft: 4 }}>
              — Modifying existing report
            </span>
            {totalChanges > 0 && (
              <span
                style={{
                  marginLeft: "auto",
                  fontFamily: "'DM Mono',monospace",
                  fontSize: 10,
                  background: "rgba(124,58,237,0.15)",
                  color: "var(--violet)",
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontWeight: 600,
                }}
              >
                {totalChanges} change{totalChanges !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}

        {/* ── Header ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: isEditMode ? "var(--violet)" : "var(--ink)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginTop: 2,
                transition: "background 0.2s",
              }}
            >
              {isEditMode ? (
                <Pencil style={{ width: 16, height: 16, color: "#fff" }} />
              ) : (
                <FlaskConical style={{ width: 16, height: 16, color: "var(--amber)" }} />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                <span
                  style={{
                    fontFamily: "'DM Mono',monospace",
                    fontSize: 10,
                    color: "#9ea5b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {isEditMode ? "Lab Report — Edit" : "Lab Report Entry"}
                </span>
                <span
                  style={{ width: 3, height: 3, borderRadius: "50%", background: "#d6d9e4", display: "inline-block" }}
                />
                <span
                  style={{
                    fontFamily: "'DM Mono',monospace",
                    fontSize: 10,
                    color: schema.isActive ? "var(--emerald)" : "#9ea5b8",
                    fontWeight: 500,
                    textTransform: "uppercase",
                  }}
                >
                  {schema.isActive ? "● Active" : "○ Inactive"}
                </span>
              </div>
              <h1
                style={{
                  fontFamily: "'Syne',sans-serif",
                  fontSize: "clamp(18px, 4vw, 26px)",
                  fontWeight: 800,
                  color: "var(--ink)",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.1,
                  margin: 0,
                }}
              >
                {schema.name || "Untitled Schema"}
              </h1>
              {schema.description && (
                <p style={{ marginTop: 5, fontSize: 13, color: "#7a82a0", lineHeight: 1.5 }}>{schema.description}</p>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="sr-stats-row">
            {progress !== null && (
              <div className="sr-stat-cell">
                <div className="sr-stat-label">Completed</div>
                <div className={`sr-stat-val ${progress === 100 ? "emerald" : ""}`}>{Math.round(progress)}%</div>
              </div>
            )}
            <div className="sr-stat-cell">
              <div className="sr-stat-label">Filled</div>
              <div className="sr-stat-val">
                {totalFilled}
                <span style={{ fontSize: 12, color: "#9ea5b8", fontWeight: 400 }}>/{totalFields}</span>
              </div>
            </div>
            <div className="sr-stat-cell">
              <div className="sr-stat-label">In Range</div>
              <div className={`sr-stat-val ${normalCount > 0 ? "emerald" : ""}`}>{normalCount}</div>
            </div>
            <div className="sr-stat-cell">
              <div className="sr-stat-label">Abnormal</div>
              <div className={`sr-stat-val ${abnormalCount > 0 ? "red" : ""}`}>{abnormalCount}</div>
            </div>
            {isEditMode && (
              <div className="sr-stat-cell">
                <div className="sr-stat-label">Changes</div>
                <div className={`sr-stat-val ${totalChanges > 0 ? "violet" : ""}`}>{totalChanges}</div>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {progress !== null && (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                <span
                  style={{
                    fontFamily: "'Syne',sans-serif",
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#9ea5b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                  }}
                >
                  All Fields
                </span>
                <span
                  style={{
                    fontFamily: "'DM Mono',monospace",
                    fontSize: 11,
                    fontWeight: 500,
                    color: progress === 100 ? "var(--emerald)" : "var(--ink-3)",
                  }}
                >
                  {totalFilled} / {totalFields}
                </span>
              </div>
              <div className="sr-main-progress-track">
                <div className="sr-main-progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Alerts */}
        {abnormalCount > 0 && (
          <div className="sr-alert amber" style={{ marginBottom: 14 }}>
            <AlertTriangle style={{ width: 16, height: 16, color: "var(--amber)", flexShrink: 0, marginTop: 1 }} />
            <div>
              <div className="sr-alert-title">Abnormal Values Detected</div>
              <div className="sr-alert-body">
                {abnormalCount} result{abnormalCount > 1 ? "s" : ""} outside the standard reference range — please
                review before submitting.
              </div>
            </div>
          </div>
        )}

        {/* Edit mode changes summary */}
        {isEditMode && totalChanges > 0 && (
          <div className="sr-alert violet" style={{ marginBottom: 14 }}>
            <Pencil style={{ width: 15, height: 15, color: "var(--violet)", flexShrink: 0, marginTop: 1 }} />
            <div>
              <div className="sr-alert-title">Unsaved Changes</div>
              <div className="sr-alert-body">
                You have made {totalChanges} change{totalChanges !== 1 ? "s" : ""} to this report. Fields with edits are
                highlighted in purple. Click <strong>Update Report</strong> to save.
              </div>
            </div>
          </div>
        )}

        {/* Patient Banner */}
        {invoice ? (
          <div style={{ marginBottom: 16 }}>
            <InvoicePatientBanner invoice={invoice} />
          </div>
        ) : (
          needsContext && (
            <div style={{ marginBottom: 16 }}>
              <ManualPatientContext
                patientAge={patientAge}
                setPatientAge={setPatientAge}
                patientGender={patientGender}
                setPatientGender={setPatientGender}
              />
            </div>
          )
        )}

        {/* Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
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

        {/* Static Range Note */}
        {schema.hasStaticStandardRange && schema.staticStandardRange && (
          <div className="sr-alert amber" style={{ marginBottom: 14 }}>
            <Info style={{ width: 15, height: 15, color: "var(--amber)", flexShrink: 0, marginTop: 1 }} />
            <div>
              <div className="sr-alert-title">Standard Reference</div>
              <div className="sr-alert-body">{schema.staticStandardRange}</div>
            </div>
          </div>
        )}

        {/* Validation Errors */}
        {Object.keys(errors).length > 0 && (
          <div className="sr-alert red" style={{ marginBottom: 14 }}>
            <XCircle style={{ width: 15, height: 15, color: "var(--red)", flexShrink: 0, marginTop: 1 }} />
            <div>
              <div className="sr-alert-title">Validation Failed</div>
              <div className="sr-alert-body">
                {Object.keys(errors).length} field{Object.keys(errors).length > 1 ? "s" : ""} require attention before
                submitting.
              </div>
            </div>
          </div>
        )}

        {/* Action Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 18,
            borderTop: "1px solid var(--border)",
            marginTop: 4,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <ShieldCheck style={{ width: 13, height: 13, color: "#b0b7cc" }} />
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#b0b7cc" }}>
              {isEditMode ? "Editing existing report" : "Validated entry"}
            </span>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              className="sr-btn-reset"
              onClick={handleReset}
              title={isEditMode ? "Revert all changes to original values" : "Clear all fields"}
            >
              <RotateCcw style={{ width: 13, height: 13 }} />
              {isEditMode ? "Revert" : "Reset"}
            </button>
            <button
              type="button"
              className={`sr-btn-submit ${isEditMode ? "edit-mode" : ""}`}
              disabled={loading || (isEditMode && totalChanges === 0)}
              onClick={handleSubmit}
              title={isEditMode && totalChanges === 0 ? "No changes to save" : undefined}
            >
              {loading ? (
                <span className="sr-amber-dot" />
              ) : isEditMode ? (
                <Save style={{ width: 13, height: 13 }} />
              ) : (
                <Send style={{ width: 13, height: 13 }} />
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
