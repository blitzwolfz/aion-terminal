CREATE TABLE IF NOT EXISTS token_usage (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id   TEXT NOT NULL,
    agent        TEXT NOT NULL DEFAULT 'claude-code',
    cost_usd     REAL NOT NULL,
    tokens_in    INTEGER NOT NULL,
    tokens_out   INTEGER NOT NULL,
    tokens_total INTEGER NOT NULL,
    duration_s   INTEGER,
    captured_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    raw_output   TEXT
);

CREATE TABLE IF NOT EXISTS budgets (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    month       TEXT NOT NULL,
    limit_usd   REAL NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_usage_date ON token_usage(captured_at);
CREATE INDEX IF NOT EXISTS idx_usage_agent ON token_usage(agent);
