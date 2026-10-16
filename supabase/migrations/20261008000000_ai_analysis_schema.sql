-- =============================================================================
-- AEROSYNC — Intelligence for Dynamic Air Operations
-- Migration: 20261008000000_ai_analysis_schema.sql
-- Description: AI Situation Analysis persistence table (Phase 8 Gemini layer).
-- Security: Row Level Security enabled; public read-only, service-role write.
-- =============================================================================

CREATE TABLE IF NOT EXISTS ai_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    optimization_run_id UUID NOT NULL REFERENCES optimization_runs(id) ON DELETE CASCADE,
    provider VARCHAR(40) NOT NULL DEFAULT 'gemini',
    model VARCHAR(60) NOT NULL,
    prompt_version VARCHAR(60) NOT NULL DEFAULT 'aerosync-ai-analysis-v1',
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    explanation JSONB NOT NULL,
    status VARCHAR(24) NOT NULL DEFAULT 'completed'
        CHECK (status IN ('completed', 'failed', 'fallback')),
    fallback_used BOOLEAN NOT NULL DEFAULT false,
    error_code VARCHAR(60),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE ai_analysis IS 'Persisted natural-language situation analysis and decision explanations grounded in optimization runs.';

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_ai_analysis_opt_run ON ai_analysis(optimization_run_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_created ON ai_analysis(created_at DESC);

-- Row Level Security (RLS)
ALTER TABLE ai_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read-only access for ai_analysis"
    ON ai_analysis FOR SELECT USING (true);
