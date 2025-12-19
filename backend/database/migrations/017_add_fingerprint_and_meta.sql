-- Add session fingerprint and metadata columns to integration_sessions

ALTER TABLE integration_sessions
ADD COLUMN IF NOT EXISTS fingerprint JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}';

-- Add index on meta for faster queries
CREATE INDEX IF NOT EXISTS idx_integration_sessions_meta ON integration_sessions USING GIN (meta);

-- Add comment
COMMENT ON COLUMN integration_sessions.fingerprint IS 'Browser environment fingerprint (userAgent, locale, timezone) to prevent session invalidation';
COMMENT ON COLUMN integration_sessions.meta IS 'Debugging metadata (screenshots, URLs, cookie counts, errors)';
