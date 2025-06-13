-- GDPR Compliance Database Schema
-- This migration creates all necessary tables for GDPR compliance
-- including consent management, audit logging, data retention, exports, and deletions

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User Consents Table (GDPR Article 7)
CREATE TABLE IF NOT EXISTS user_consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    consent_type VARCHAR(50) NOT NULL CHECK (consent_type IN (
        'essential', 'analytics', 'marketing', 'personalization', 
        'transcription', 'ai_processing'
    )),
    status VARCHAR(20) NOT NULL CHECK (status IN (
        'granted', 'denied', 'withdrawn', 'pending'
    )),
    granted_at TIMESTAMPTZ,
    withdrawn_at TIMESTAMPTZ,
    ip_address INET,
    user_agent TEXT,
    consent_token VARCHAR(64) NOT NULL UNIQUE,
    legal_basis VARCHAR(50) NOT NULL,
    purpose TEXT NOT NULL,
    data_categories TEXT[] NOT NULL DEFAULT '{}',
    retention_period INTEGER, -- days
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure only one active consent per type per user
    UNIQUE(user_id, consent_type, created_at)
);

-- Audit Logs Table (GDPR Article 30 - Records of Processing)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL CHECK (action IN (
        'data_access', 'data_export', 'data_delete', 'data_modify',
        'consent_update', 'login', 'logout', 'account_create', 
        'account_delete', 'meeting_create', 'meeting_join',
        'transcript_access', 'ai_processing'
    )),
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(255),
    details JSONB NOT NULL DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    severity VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (severity IN (
        'low', 'medium', 'high', 'critical'
    )),
    gdpr_relevant BOOLEAN NOT NULL DEFAULT false,
    retention_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data Exports Table (GDPR Article 20 - Right to Data Portability)
CREATE TABLE IF NOT EXISTS data_exports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    export_id VARCHAR(64) NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    export_type VARCHAR(20) NOT NULL CHECK (export_type IN ('full', 'partial')),
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    download_url TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'processing', 'completed', 'failed', 'expired'
    )),
    data_categories TEXT[] NOT NULL DEFAULT '{}',
    file_format VARCHAR(10) NOT NULL DEFAULT 'json' CHECK (file_format IN (
        'json', 'csv', 'xml'
    )),
    file_size BIGINT,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deletion Requests Table (GDPR Article 17 - Right to Erasure)
CREATE TABLE IF NOT EXISTS deletion_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    request_type VARCHAR(20) NOT NULL CHECK (request_type IN (
        'full_account', 'specific_data'
    )),
    reason VARCHAR(50) NOT NULL CHECK (reason IN (
        'user_request', 'consent_withdrawn', 'data_no_longer_necessary',
        'unlawful_processing', 'legal_obligation', 'child_consent_withdrawn'
    )),
    data_categories TEXT[] DEFAULT '{}',
    specific_records JSONB DEFAULT '[]',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'in_progress', 'completed', 'failed', 'partially_completed'
    )),
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    verification_token VARCHAR(64) NOT NULL UNIQUE,
    verified_at TIMESTAMPTZ,
    notes TEXT,
    retention_exceptions TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data Processing Records Table (GDPR Article 30)
CREATE TABLE IF NOT EXISTS data_processing_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    processing_activity VARCHAR(100) NOT NULL,
    legal_basis VARCHAR(50) NOT NULL,
    data_categories TEXT[] NOT NULL DEFAULT '{}',
    data_subjects VARCHAR(100) NOT NULL,
    recipients TEXT[] DEFAULT '{}',
    international_transfers BOOLEAN DEFAULT false,
    retention_period INTEGER, -- days
    security_measures TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_type_status ON user_consents(consent_type, status);
CREATE INDEX IF NOT EXISTS idx_user_consents_created_at ON user_consents(created_at);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_gdpr_relevant ON audit_logs(gdpr_relevant);
CREATE INDEX IF NOT EXISTS idx_audit_logs_retention_until ON audit_logs(retention_until);

CREATE INDEX IF NOT EXISTS idx_data_exports_user_id ON data_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_data_exports_status ON data_exports(status);
CREATE INDEX IF NOT EXISTS idx_data_exports_expires_at ON data_exports(expires_at);

CREATE INDEX IF NOT EXISTS idx_deletion_requests_user_id ON deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_status ON deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_verification_token ON deletion_requests(verification_token);

-- Row Level Security (RLS) Policies
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_processing_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_consents
CREATE POLICY "Users can view their own consents" ON user_consents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consents" ON user_consents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own consents" ON user_consents
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for audit_logs (users can only see GDPR-relevant logs about themselves)
CREATE POLICY "Users can view their own GDPR audit logs" ON audit_logs
    FOR SELECT USING (auth.uid() = user_id AND gdpr_relevant = true);

-- RLS Policies for data_exports
CREATE POLICY "Users can view their own data exports" ON data_exports
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own data exports" ON data_exports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own data exports" ON data_exports
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for deletion_requests
CREATE POLICY "Users can view their own deletion requests" ON deletion_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own deletion requests" ON deletion_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own deletion requests" ON deletion_requests
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for data_processing_records (admin only)
CREATE POLICY "Only service role can access processing records" ON data_processing_records
    FOR ALL USING (auth.role() = 'service_role');

-- Functions for automatic cleanup
CREATE OR REPLACE FUNCTION cleanup_expired_exports()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM data_exports 
    WHERE expires_at < NOW() AND status != 'completed';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION cleanup_expired_audit_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM audit_logs 
    WHERE retention_until IS NOT NULL AND retention_until < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_consents_updated_at
    BEFORE UPDATE ON user_consents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_exports_updated_at
    BEFORE UPDATE ON data_exports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deletion_requests_updated_at
    BEFORE UPDATE ON deletion_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_processing_records_updated_at
    BEFORE UPDATE ON data_processing_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert initial data processing records
INSERT INTO data_processing_records (
    processing_activity,
    legal_basis,
    data_categories,
    data_subjects,
    recipients,
    international_transfers,
    retention_period,
    security_measures
) VALUES 
(
    'User Authentication and Account Management',
    'contract',
    ARRAY['identity', 'contact', 'technical'],
    'Platform users',
    ARRAY['Supabase (Auth provider)', 'Internal systems'],
    true,
    2555, -- 7 years
    ARRAY['Encryption at rest', 'Encryption in transit', 'Access controls', 'Audit logging']
),
(
    'Video Meeting Transcription',
    'consent',
    ARRAY['biometric', 'behavioral'],
    'Meeting participants',
    ARRAY['Google AI (Gemini)', 'Internal systems'],
    true,
    2555, -- 7 years
    ARRAY['End-to-end encryption', 'Access controls', 'Data minimization', 'Audit logging']
),
(
    'AI-Powered Meeting Analysis',
    'consent',
    ARRAY['behavioral', 'biometric'],
    'Meeting participants',
    ARRAY['Google AI (Gemini)', 'Internal systems'],
    true,
    1095, -- 3 years
    ARRAY['Data anonymization', 'Access controls', 'Secure processing', 'Audit logging']
);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Comments for documentation
COMMENT ON TABLE user_consents IS 'Stores user consent records for GDPR compliance (Article 7)';
COMMENT ON TABLE audit_logs IS 'Audit trail for data processing activities (Article 30)';
COMMENT ON TABLE data_exports IS 'User data export requests (Article 20 - Right to Data Portability)';
COMMENT ON TABLE deletion_requests IS 'User data deletion requests (Article 17 - Right to Erasure)';
COMMENT ON TABLE data_processing_records IS 'Records of processing activities (Article 30)';

COMMENT ON COLUMN user_consents.consent_token IS 'Unique token for tracking consent changes';
COMMENT ON COLUMN audit_logs.gdpr_relevant IS 'Whether this log entry is relevant for GDPR transparency';
COMMENT ON COLUMN data_exports.export_id IS 'Public identifier for the export request';
COMMENT ON COLUMN deletion_requests.verification_token IS 'Token for verifying deletion requests';
