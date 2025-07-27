// src/utils/collectPlatformInfo.ts
import platform from 'platform';

export function collectPlatformInfo() {
  return {
    platform: 'web',
    device_type: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
    os: platform.os?.family || '',
    os_version: platform.os?.version || '',
    browser: platform.name || '',
    browser_version: platform.version || '',
    user_agent: navigator.userAgent,
    prefers_dark_mode: window.matchMedia('(prefers-color-scheme: dark)').matches,
    entry_point: window.location.pathname,
    session_start: new Date().toISOString(),
    // fill other fields as needed
  };
}