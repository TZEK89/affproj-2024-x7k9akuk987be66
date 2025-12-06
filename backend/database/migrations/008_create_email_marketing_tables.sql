-- =====================================================
-- Migration 008: Email Marketing Tables
-- Purpose: Email sequences, templates, subscribers, and analytics
-- =====================================================

-- Email templates
CREATE TABLE IF NOT EXISTS email_templates (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100), -- 'welcome', 'promotional', 'nurture', 'abandoned_cart', 'transactional'
    
    -- Email content
    subject VARCHAR(255) NOT NULL,
    preview_text VARCHAR(255), -- Email preview text
    html_content TEXT NOT NULL,
    text_content TEXT, -- Plain text version
    
    -- Design
    design_json JSONB, -- Email builder JSON (if using drag-and-drop editor)
    thumbnail_url TEXT, -- Preview image
    
    -- Variables/Placeholders
    variables JSONB DEFAULT '[]', -- Array of available variables like {{first_name}}
    
    -- Performance
    avg_open_rate DECIMAL(5, 2),
    avg_click_rate DECIMAL(5, 2),
    total_sends INTEGER DEFAULT 0,
    
    -- Status
    is_system_template BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'active', 'archived'
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email sequences (automated email series)
CREATE TABLE IF NOT EXISTS email_sequences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Trigger configuration
    trigger_type VARCHAR(50) NOT NULL, -- 'manual', 'signup', 'purchase', 'tag_added', 'segment_entry', 'abandoned_cart'
    trigger_config JSONB DEFAULT '{}', -- Additional trigger settings
    
    -- Sequence settings
    send_time_type VARCHAR(50) DEFAULT 'optimal', -- 'optimal', 'fixed', 'subscriber_timezone'
    fixed_send_time TIME, -- If using fixed time
    
    -- Goals
    goal_type VARCHAR(50), -- 'open', 'click', 'conversion', 'revenue'
    goal_value DECIMAL(10, 2),
    
    -- Performance
    total_subscribers INTEGER DEFAULT 0,
    active_subscribers INTEGER DEFAULT 0,
    completed_subscribers INTEGER DEFAULT 0,
    avg_open_rate DECIMAL(5, 2),
    avg_click_rate DECIMAL(5, 2),
    total_revenue DECIMAL(10, 2) DEFAULT 0,
    
    -- Status
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'active', 'paused', 'archived'
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Individual emails within a sequence
CREATE TABLE IF NOT EXISTS sequence_emails (
    id SERIAL PRIMARY KEY,
    sequence_id INTEGER NOT NULL REFERENCES email_sequences(id) ON DELETE CASCADE,
    template_id INTEGER NOT NULL REFERENCES email_templates(id) ON DELETE RESTRICT,
    
    -- Position in sequence
    order_index INTEGER NOT NULL, -- 1, 2, 3, etc.
    delay_days INTEGER DEFAULT 0, -- Days after previous email (or trigger for first email)
    delay_hours INTEGER DEFAULT 0, -- Additional hours
    delay_minutes INTEGER DEFAULT 0, -- Additional minutes
    
    -- Conditions
    send_conditions JSONB DEFAULT '{}', -- Conditions that must be met to send
    
    -- Performance tracking
    sends INTEGER DEFAULT 0,
    opens INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    revenue DECIMAL(10, 2) DEFAULT 0,
    
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'paused'
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(sequence_id, order_index)
);

-- Subscribers (email list)
CREATE TABLE IF NOT EXISTS subscribers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Contact info
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    
    -- Status
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'unsubscribed', 'bounced', 'complained'
    
    -- Source tracking
    source VARCHAR(100), -- 'landing_page', 'manual_import', 'api', 'form'
    source_id INTEGER, -- ID of the source (e.g., landing_page_id)
    signup_ip VARCHAR(45),
    signup_user_agent TEXT,
    
    -- Engagement
    total_emails_sent INTEGER DEFAULT 0,
    total_emails_opened INTEGER DEFAULT 0,
    total_emails_clicked INTEGER DEFAULT 0,
    last_email_sent_at TIMESTAMP,
    last_email_opened_at TIMESTAMP,
    last_email_clicked_at TIMESTAMP,
    
    -- Scoring
    engagement_score INTEGER DEFAULT 0, -- 0-100 based on activity
    
    -- Custom fields
    custom_fields JSONB DEFAULT '{}',
    tags JSONB DEFAULT '[]', -- Array of tags
    
    -- Dates
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unsubscribed_at TIMESTAMP,
    bounced_at TIMESTAMP,
    complained_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, email)
);

-- Subscriber segments (dynamic groups)
CREATE TABLE IF NOT EXISTS subscriber_segments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Segment criteria
    criteria JSONB NOT NULL, -- Rules for segment membership
    is_dynamic BOOLEAN DEFAULT true, -- Auto-update based on criteria
    
    -- Stats
    subscriber_count INTEGER DEFAULT 0,
    last_calculated_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Segment membership (for static segments or cache for dynamic)
CREATE TABLE IF NOT EXISTS subscriber_segment_members (
    id SERIAL PRIMARY KEY,
    segment_id INTEGER NOT NULL REFERENCES subscriber_segments(id) ON DELETE CASCADE,
    subscriber_id INTEGER NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(segment_id, subscriber_id)
);

-- Subscriber sequence enrollment
CREATE TABLE IF NOT EXISTS subscriber_sequences (
    id SERIAL PRIMARY KEY,
    subscriber_id INTEGER NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
    sequence_id INTEGER NOT NULL REFERENCES email_sequences(id) ON DELETE CASCADE,
    
    -- Progress tracking
    current_email_index INTEGER DEFAULT 0, -- Which email they're on (0 = not started)
    next_email_id INTEGER REFERENCES sequence_emails(id) ON DELETE SET NULL,
    next_send_at TIMESTAMP, -- When next email should be sent
    
    -- Status
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'paused', 'completed', 'unsubscribed', 'bounced'
    
    -- Dates
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    paused_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(subscriber_id, sequence_id)
);

-- Email sends (individual email delivery records)
CREATE TABLE IF NOT EXISTS email_sends (
    id SERIAL PRIMARY KEY,
    subscriber_id INTEGER NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
    template_id INTEGER REFERENCES email_templates(id) ON DELETE SET NULL,
    sequence_id INTEGER REFERENCES email_sequences(id) ON DELETE SET NULL,
    sequence_email_id INTEGER REFERENCES sequence_emails(id) ON DELETE SET NULL,
    
    -- Email details
    subject VARCHAR(255) NOT NULL,
    from_email VARCHAR(255) NOT NULL,
    from_name VARCHAR(255),
    
    -- Delivery
    email_provider VARCHAR(50), -- 'sendgrid', 'mailgun', 'postmark'
    provider_message_id VARCHAR(255), -- Provider's tracking ID
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'failed'
    
    -- Engagement tracking
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    opened_at TIMESTAMP,
    first_clicked_at TIMESTAMP,
    bounced_at TIMESTAMP,
    complained_at TIMESTAMP,
    
    -- Counts
    open_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    
    -- Error handling
    error_message TEXT,
    bounce_type VARCHAR(50), -- 'hard', 'soft', 'spam'
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email clicks (track individual link clicks)
CREATE TABLE IF NOT EXISTS email_clicks (
    id SERIAL PRIMARY KEY,
    email_send_id INTEGER NOT NULL REFERENCES email_sends(id) ON DELETE CASCADE,
    subscriber_id INTEGER NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
    
    -- Click details
    url TEXT NOT NULL,
    link_label VARCHAR(255), -- Text of the link
    clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Context
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_type VARCHAR(50), -- 'desktop', 'mobile', 'tablet'
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email analytics (daily aggregates)
CREATE TABLE IF NOT EXISTS email_analytics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id INTEGER REFERENCES email_templates(id) ON DELETE SET NULL,
    sequence_id INTEGER REFERENCES email_sequences(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    
    -- Volume metrics
    sends INTEGER DEFAULT 0,
    delivered INTEGER DEFAULT 0,
    bounces INTEGER DEFAULT 0,
    
    -- Engagement metrics
    unique_opens INTEGER DEFAULT 0,
    total_opens INTEGER DEFAULT 0,
    unique_clicks INTEGER DEFAULT 0,
    total_clicks INTEGER DEFAULT 0,
    
    -- Negative metrics
    unsubscribes INTEGER DEFAULT 0,
    spam_complaints INTEGER DEFAULT 0,
    
    -- Rates
    delivery_rate DECIMAL(5, 2),
    open_rate DECIMAL(5, 2),
    click_rate DECIMAL(5, 2),
    click_to_open_rate DECIMAL(5, 2),
    unsubscribe_rate DECIMAL(5, 2),
    
    -- Revenue
    conversions INTEGER DEFAULT 0,
    revenue DECIMAL(10, 2) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, template_id, sequence_id, date)
);

-- Email A/B tests
CREATE TABLE IF NOT EXISTS email_ab_tests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sequence_id INTEGER REFERENCES email_sequences(id) ON DELETE CASCADE,
    
    test_name VARCHAR(255) NOT NULL,
    test_type VARCHAR(50) NOT NULL, -- 'subject', 'content', 'send_time', 'from_name'
    hypothesis TEXT,
    
    -- Test variants (stored as array of template IDs or configs)
    variants JSONB NOT NULL,
    
    -- Traffic split
    traffic_split JSONB NOT NULL, -- e.g., {"A": 50, "B": 50}
    
    -- Success metric
    success_metric VARCHAR(50) NOT NULL, -- 'open_rate', 'click_rate', 'conversion_rate', 'revenue'
    
    -- Statistical requirements
    confidence_level DECIMAL(5, 2) DEFAULT 95.00,
    min_sample_size INTEGER DEFAULT 100,
    current_sample_size INTEGER DEFAULT 0,
    
    -- Results
    winner_variant VARCHAR(10), -- 'A', 'B', 'C', etc.
    statistical_significance DECIMAL(5, 2),
    results JSONB, -- Detailed results for each variant
    
    status VARCHAR(50) DEFAULT 'running', -- 'draft', 'running', 'completed', 'inconclusive'
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email automation rules
CREATE TABLE IF NOT EXISTS email_automation_rules (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Trigger
    trigger_type VARCHAR(50) NOT NULL, -- 'tag_added', 'tag_removed', 'field_changed', 'link_clicked', 'email_opened', 'time_based'
    trigger_config JSONB NOT NULL,
    
    -- Action
    action_type VARCHAR(50) NOT NULL, -- 'add_to_sequence', 'remove_from_sequence', 'add_tag', 'remove_tag', 'update_field', 'send_email'
    action_config JSONB NOT NULL,
    
    -- Conditions
    conditions JSONB DEFAULT '[]', -- Additional conditions that must be met
    
    -- Stats
    times_triggered INTEGER DEFAULT 0,
    last_triggered_at TIMESTAMP,
    
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'paused', 'archived'
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_templates_user_id ON email_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_status ON email_templates(status);

CREATE INDEX IF NOT EXISTS idx_email_sequences_user_id ON email_sequences(user_id);
CREATE INDEX IF NOT EXISTS idx_email_sequences_status ON email_sequences(status);
CREATE INDEX IF NOT EXISTS idx_email_sequences_trigger_type ON email_sequences(trigger_type);

CREATE INDEX IF NOT EXISTS idx_sequence_emails_sequence_id ON sequence_emails(sequence_id);
CREATE INDEX IF NOT EXISTS idx_sequence_emails_template_id ON sequence_emails(template_id);

CREATE INDEX IF NOT EXISTS idx_subscribers_user_id ON subscribers(user_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_status ON subscribers(status);
CREATE INDEX IF NOT EXISTS idx_subscribers_engagement_score ON subscribers(engagement_score);

CREATE INDEX IF NOT EXISTS idx_subscriber_segments_user_id ON subscriber_segments(user_id);

CREATE INDEX IF NOT EXISTS idx_subscriber_segment_members_segment_id ON subscriber_segment_members(segment_id);
CREATE INDEX IF NOT EXISTS idx_subscriber_segment_members_subscriber_id ON subscriber_segment_members(subscriber_id);

CREATE INDEX IF NOT EXISTS idx_subscriber_sequences_subscriber_id ON subscriber_sequences(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_subscriber_sequences_sequence_id ON subscriber_sequences(sequence_id);
CREATE INDEX IF NOT EXISTS idx_subscriber_sequences_next_send_at ON subscriber_sequences(next_send_at);
CREATE INDEX IF NOT EXISTS idx_subscriber_sequences_status ON subscriber_sequences(status);

CREATE INDEX IF NOT EXISTS idx_email_sends_subscriber_id ON email_sends(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_template_id ON email_sends(template_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_sequence_id ON email_sends(sequence_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_status ON email_sends(status);
CREATE INDEX IF NOT EXISTS idx_email_sends_sent_at ON email_sends(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_sends_provider_message_id ON email_sends(provider_message_id);

CREATE INDEX IF NOT EXISTS idx_email_clicks_email_send_id ON email_clicks(email_send_id);
CREATE INDEX IF NOT EXISTS idx_email_clicks_subscriber_id ON email_clicks(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_email_clicks_clicked_at ON email_clicks(clicked_at);

CREATE INDEX IF NOT EXISTS idx_email_analytics_user_id ON email_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_email_analytics_date ON email_analytics(date);
CREATE INDEX IF NOT EXISTS idx_email_analytics_template_id ON email_analytics(template_id);
CREATE INDEX IF NOT EXISTS idx_email_analytics_sequence_id ON email_analytics(sequence_id);

CREATE INDEX IF NOT EXISTS idx_email_ab_tests_user_id ON email_ab_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_email_ab_tests_sequence_id ON email_ab_tests(sequence_id);
CREATE INDEX IF NOT EXISTS idx_email_ab_tests_status ON email_ab_tests(status);

CREATE INDEX IF NOT EXISTS idx_email_automation_rules_user_id ON email_automation_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_email_automation_rules_status ON email_automation_rules(status);

-- Add triggers for updated_at
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_sequences_updated_at BEFORE UPDATE ON email_sequences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sequence_emails_updated_at BEFORE UPDATE ON sequence_emails
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscribers_updated_at BEFORE UPDATE ON subscribers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriber_segments_updated_at BEFORE UPDATE ON subscriber_segments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriber_sequences_updated_at BEFORE UPDATE ON subscriber_sequences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_analytics_updated_at BEFORE UPDATE ON email_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_ab_tests_updated_at BEFORE UPDATE ON email_ab_tests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_automation_rules_updated_at BEFORE UPDATE ON email_automation_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
