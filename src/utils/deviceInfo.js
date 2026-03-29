// src/utils/deviceInfo.js
// Call getDeviceInfo() before login and pass the result as `device` in the request body.

/**
 * Detect browser name + version from userAgent string.
 */
function detectBrowser() {
  const ua = navigator.userAgent;

  if (/Edg\//.test(ua)) return { browser: "Edge", browserVersion: ua.match(/Edg\/([\d.]+)/)?.[1] ?? "" };
  if (/OPR\//.test(ua)) return { browser: "Opera", browserVersion: ua.match(/OPR\/([\d.]+)/)?.[1] ?? "" };
  if (/Chrome\//.test(ua)) return { browser: "Chrome", browserVersion: ua.match(/Chrome\/([\d.]+)/)?.[1] ?? "" };
  if (/Firefox\//.test(ua)) return { browser: "Firefox", browserVersion: ua.match(/Firefox\/([\d.]+)/)?.[1] ?? "" };
  if (/Safari\//.test(ua) && !/Chrome/.test(ua))
    return { browser: "Safari", browserVersion: ua.match(/Version\/([\d.]+)/)?.[1] ?? "" };
  return { browser: "Unknown", browserVersion: "" };
}

/**
 * Detect OS name + version from userAgent string.
 */
function detectOS() {
  const ua = navigator.userAgent;

  if (/Windows NT 10/.test(ua)) return { os: "Windows", osVersion: "10/11" };
  if (/Windows NT 6.3/.test(ua)) return { os: "Windows", osVersion: "8.1" };
  if (/Windows NT 6.1/.test(ua)) return { os: "Windows", osVersion: "7" };
  if (/Windows/.test(ua)) return { os: "Windows", osVersion: "" };
  if (/iPhone OS ([\d_]+)/.test(ua)) {
    return { os: "iOS", osVersion: ua.match(/iPhone OS ([\d_]+)/)?.[1]?.replace(/_/g, ".") ?? "" };
  }
  if (/iPad/.test(ua)) return { os: "iPadOS", osVersion: ua.match(/OS ([\d_]+)/)?.[1]?.replace(/_/g, ".") ?? "" };
  if (/Android ([\d.]+)/.test(ua)) {
    return { os: "Android", osVersion: ua.match(/Android ([\d.]+)/)?.[1] ?? "" };
  }
  if (/Mac OS X ([\d_]+)/.test(ua)) {
    return { os: "macOS", osVersion: ua.match(/Mac OS X ([\d_]+)/)?.[1]?.replace(/_/g, ".") ?? "" };
  }
  if (/Linux/.test(ua)) return { os: "Linux", osVersion: "" };
  return { os: "Unknown", osVersion: "" };
}

/**
 * Classify device type.
 */
function detectDeviceType() {
  const ua = navigator.userAgent;
  if (/Mobi|Android.*Mobile|iPhone/.test(ua)) return "mobile";
  if (/iPad|Android(?!.*Mobile)|Tablet/.test(ua)) return "tablet";
  return "desktop";
}

/**
 * Attempts to extract a human-readable device model from the UA string.
 *
 * Results by platform:
 *  - Android phones  → raw model string from UA e.g. "Pixel 7", "SM-S908B", "Redmi Note 12"
 *  - iPhone          → "iPhone"
 *  - iPad            → "iPad"
 *  - macOS           → "Mac"
 *  - Windows         → "Windows PC"
 *  - Linux           → "Linux PC"
 *
 * No user prompt required — all info comes from the UA string.
 */
function detectDeviceName() {
  const ua = navigator.userAgent;

  // ── iPhone ────────────────────────────────────────────────────────────────
  if (/iPhone/.test(ua)) return "iPhone";

  // ── iPad ──────────────────────────────────────────────────────────────────
  if (/iPad/.test(ua)) return "iPad";

  // ── Android — model string sits between "Android x.x; " and "Build/" or ")" ──
  // Examples:
  //   "Mozilla/5.0 (Linux; Android 13; Pixel 7 Build/...)"
  //   "Mozilla/5.0 (Linux; Android 12; SM-S908B) ..."
  //   "Mozilla/5.0 (Linux; Android 11; Redmi Note 9 Pro)"
  const androidModel = ua.match(/Android[\d\s.]+;\s*([^;)]+?)(?:\s+Build|\))/i)?.[1]?.trim();
  if (androidModel) return androidModel;

  // ── macOS ─────────────────────────────────────────────────────────────────
  if (/Mac OS X/.test(ua)) return "Mac";

  // ── Windows ───────────────────────────────────────────────────────────────
  if (/Windows/.test(ua)) return "Windows PC";

  // ── Linux desktop ─────────────────────────────────────────────────────────
  if (/Linux/.test(ua)) return "Linux PC";

  return "Unknown Device";
}

/**
 * Collect all device/environment info.
 * @returns {{ browser, browserVersion, os, osVersion, deviceType, deviceName, screenRes, timezone, language }}
 */
export function getDeviceInfo() {
  return {
    ...detectBrowser(),
    ...detectOS(),
    deviceType: detectDeviceType(),
    deviceName: detectDeviceName(),
    screenRes: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language || "",
  };
}
