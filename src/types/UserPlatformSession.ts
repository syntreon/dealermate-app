
export interface UserPlatformSession {
    id: string;
    user_id: string;
    session_start: string; // ISO string
    session_end: string | null;
    platform: string;
    device_type: string;
    os: string;
    os_version: string | null;
    browser: string | null;
    browser_version: string | null;
    app_version: string | null;
    user_agent: string;
    entry_point: string | null;
    primary_feature_used: string | null;
    actions_count: number | null;
    avg_page_load_time_ms: number | null;
    network_type: string | null;
    ip_address: string | null;
    geo_country: string | null;
    geo_city: string | null;
    prefers_dark_mode: boolean | null;
    created_at: string;
}