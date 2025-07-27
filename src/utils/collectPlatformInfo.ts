// src/utils/collectPlatformInfo.ts
import { UAParser } from 'ua-parser-js';

export function collectPlatformInfo() {
  const parser = new UAParser(navigator.userAgent);
  const result = parser.getResult();

  // 'mobile', 'tablet', etc. If undefined, it's likely a desktop.
  const deviceType = result.device.type || 'desktop';

  return {
    platform: 'web',
    device_type: deviceType,
    os: result.os.name || '',
    os_version: result.os.version || null,
    browser: result.browser.name || null,
    browser_version: result.browser.version || null,
    user_agent: navigator.userAgent,
    prefers_dark_mode: window.matchMedia('(prefers-color-scheme: dark)').matches,
    entry_point: window.location.pathname,
    session_start: new Date().toISOString(),
    // Untracked fields
    session_end: null,
    app_version: null,
    primary_feature_used: null,
    actions_count: null,
    avg_page_load_time_ms: null,
    network_type: null,
  };
}