-- Migration: Create Claude-Manus Tasks Table
-- This table logs all tasks sent from Claude (supervisor) to Manus (executor)

CREATE TABLE IF NOT EXISTS claude_manus_tasks (
    id SERIAL PRIMARY KEY,
    task_type VARCHAR(50) NOT NULL,
    prompt TEXT,
    parameters JSONB DEFAULT '{}',
    success BOOLEAN DEFAULT false,
    result JSONB,
    duration_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for querying by task type
CREATE INDEX IF NOT EXISTS idx_claude_manus_tasks_type ON claude_manus_tasks(task_type);

-- Index for querying by success status
CREATE INDEX IF NOT EXISTS idx_claude_manus_tasks_success ON claude_manus_tasks(success);

-- Index for date-based queries
CREATE INDEX IF NOT EXISTS idx_claude_manus_tasks_created_at ON claude_manus_tasks(created_at DESC);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_claude_manus_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_claude_manus_tasks_timestamp ON claude_manus_tasks;
CREATE TRIGGER update_claude_manus_tasks_timestamp
    BEFORE UPDATE ON claude_manus_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_claude_manus_tasks_updated_at();

-- Comments
COMMENT ON TABLE claude_manus_tasks IS 'Logs all tasks sent from Claude (supervisor) to Manus (executor)';
COMMENT ON COLUMN claude_manus_tasks.task_type IS 'Type of task: research_products, generate_content, etc.';
COMMENT ON COLUMN claude_manus_tasks.prompt IS 'The detailed prompt sent to Manus';
COMMENT ON COLUMN claude_manus_tasks.parameters IS 'Task parameters in JSON format';
COMMENT ON COLUMN claude_manus_tasks.success IS 'Whether the task completed successfully';
COMMENT ON COLUMN claude_manus_tasks.result IS 'Task result or error details';
COMMENT ON COLUMN claude_manus_tasks.duration_ms IS 'Task execution time in milliseconds';
