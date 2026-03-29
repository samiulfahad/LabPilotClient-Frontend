// src/utils/deviceInfo.js
// Call getDeviceInfo() before login and pass the result as `device` in the request body.

/**
 * Detect browser name + version from userAgent string.
 */
function detectBrowser(ua) {
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
function detectOS(ua) {
  if (/Windows NT 10/.test(ua)) return { os: "Windows", osVersion: "10/11" };
  if (/Windows NT 6.3/.test(ua)) return { os: "Windows", osVersion: "8.1" };
  if (/Windows NT 6.1/.test(ua)) return { os: "Windows", osVersion: "7" };
  if (/Windows/.test(ua)) return { os: "Windows", osVersion: "" };
  if (/iPhone OS ([\d_]+)/.test(ua)) {
    return { os: "iOS", osVersion: ua.match(/iPhone OS ([\d_]+)/)?.[1]?.replace(/_/g, ".") ?? "" };
  }
  if (/iPad/.test(ua)) {
    return { os: "iPadOS", osVersion: ua.match(/OS ([\d_]+)/)?.[1]?.replace(/_/g, ".") ?? "" };
  }
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
 * Classify device type from UA string.
 */
function detectDeviceType(ua) {
  if (/Mobi|Android.*Mobile|iPhone/.test(ua)) return "mobile";
  if (/iPad|Android(?!.*Mobile)|Tablet/.test(ua)) return "tablet";
  return "desktop";
}

/**
 * Try to extract a human-readable device model from the UA string.
 * Covers common Android patterns and Apple devices.
 * Returns an empty string when nothing useful is found.
 */
function extractModelFromUA(ua) {
  // iPhone / iPad — map known identifiers to marketing names
  const appleMap = {
    "iPhone16,2": "iPhone 15 Pro Max",
    "iPhone16,1": "iPhone 15 Pro",
    "iPhone15,5": "iPhone 15 Plus",
    "iPhone15,4": "iPhone 15",
    "iPhone15,3": "iPhone 14 Pro Max",
    "iPhone15,2": "iPhone 14 Pro",
    "iPhone14,8": "iPhone 14 Plus",
    "iPhone14,7": "iPhone 14",
    "iPhone14,5": "iPhone 13",
    "iPhone14,4": "iPhone 13 Mini",
    "iPhone14,3": "iPhone 13 Pro Max",
    "iPhone14,2": "iPhone 13 Pro",
    "iPhone13,4": "iPhone 12 Pro Max",
    "iPhone13,3": "iPhone 12 Pro",
    "iPhone13,2": "iPhone 12",
    "iPhone13,1": "iPhone 12 Mini",
    "iPhone12,8": "iPhone SE (2nd)",
    "iPhone12,5": "iPhone 11 Pro Max",
    "iPhone12,3": "iPhone 11 Pro",
    "iPhone12,1": "iPhone 11",
  };
  for (const [id, name] of Object.entries(appleMap)) {
    if (ua.includes(id)) return name;
  }

  // Generic Apple fallback
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";

  // Android — most OEMs embed "Make Model Build" inside parentheses
  // e.g. "Mozilla/5.0 (Linux; Android 13; SM-S918B Build/TP1A…)"
  const androidMatch = ua.match(/Android[\s\d.]+;\s*([^;)]+?)(?:\s+Build|\))/);
  if (androidMatch) {
    const raw = androidMatch[1].trim();
    // Skip if it's just the kernel/build noise
    if (raw && !/^Linux|^Android|^\d/.test(raw)) return raw;
  }

  return "";
}

/**
 * Use the User-Agent Client Hints API (Chromium-based browsers only) to get
 * the real device model string.  Falls back to UA parsing when unavailable.
 *
 * @returns {Promise<string>}  e.g. "Samsung Galaxy S23", "Pixel 7", or ""
 */
async function getDeviceModel() {
  try {
    if (navigator.userAgentData?.getHighEntropyValues) {
      const hints = await navigator.userAgentData.getHighEntropyValues(["model", "platform"]);
      if (hints.model && hints.model.trim()) return hints.model.trim();
    }
  } catch {
    // Client Hints blocked or not supported — fall through
  }
  return extractModelFromUA(navigator.userAgent);
}

/**
 * Collect all device / environment info.
 * This is async because fetching the device model may require a Client Hints
 * round-trip on Chromium-based mobile browsers.
 *
 * @returns {Promise<{
 *   browser: string, browserVersion: string,
 *   os: string, osVersion: string,
 *   deviceType: string, deviceModel: string,
 *   screenRes: string, timezone: string, language: string
 * }>}
 */
export async function getDeviceInfo() {
  const ua = navigator.userAgent;
  const deviceModel = await getDeviceModel();

  return {
    ...detectBrowser(ua),
    ...detectOS(ua),
    deviceType: detectDeviceType(ua),
    deviceModel, // ← NEW: "Samsung Galaxy S23", "iPhone 15", …
    screenRes: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language || "",
  };
}
