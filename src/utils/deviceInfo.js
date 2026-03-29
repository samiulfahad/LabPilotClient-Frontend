// src/utils/deviceInfo.js

function detectDeviceType() {
  const ua = navigator.userAgent;
  if (/Mobi|Android.*Mobile|iPhone/.test(ua)) return "mobile";
  if (/iPad|Android(?!.*Mobile)|Tablet/.test(ua)) return "tablet";
  return "desktop";
}

/**
 * @returns {{ deviceType, timezone }}
 */
export function getDeviceInfo() {
  return {
    deviceType: detectDeviceType(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}
