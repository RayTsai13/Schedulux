-- Migration 010: Password reset tokens
-- Supports the password reset flow (Phase 4)

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for token lookup (primary access pattern)
CREATE INDEX IF NOT EXISTS idx_prt_token ON password_reset_tokens(token);

-- Index for cleaning up old tokens by user
CREATE INDEX IF NOT EXISTS idx_prt_user_id ON password_reset_tokens(user_id);
