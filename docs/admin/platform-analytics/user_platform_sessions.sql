CREATE TABLE user_platform_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_start TIMESTAMP NOT NULL DEFAULT NOW(),
    session_end TIMESTAMP,
    platform VARCHAR(32) NOT NULL,           -- 'web', 'ios', 'android', etc.
    device_type VARCHAR(16),                 -- 'mobile', 'tablet', 'desktop', etc.
    os VARCHAR(32),
    os_version VARCHAR(32),
    browser VARCHAR(32),
    browser_version VARCHAR(32),
    app_version VARCHAR(32),
    user_agent TEXT,
    entry_point VARCHAR(64),                 -- e.g. 'dashboard', 'login'
    primary_feature_used VARCHAR(64),
    actions_count INTEGER,
    avg_page_load_time_ms INTEGER,
    network_type VARCHAR(16),                -- 'wifi', '4g', etc.
    ip_address INET,
    geo_country VARCHAR(64),
    geo_city VARCHAR(64),
    prefers_dark_mode BOOLEAN,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_platform_sessions_user_id ON user_platform_sessions(user_id);
CREATE INDEX idx_user_platform_sessions_created_at ON user_platform_sessions(created_at);