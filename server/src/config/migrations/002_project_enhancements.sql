-- Migration: Project Detail Enhancements
-- Created: 2026-01-28
-- Description: Add budget items, stakeholders, activity log, and file categories

-- 1. Project Budget Items - for budget breakdown by category
CREATE TABLE IF NOT EXISTS project_budget_items (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL, -- 'people_cost', 'licenses', 'external_consulting', 'external_data', 'infrastructure', 'other'
    name VARCHAR(255) NOT NULL,
    description TEXT,
    estimated_cost DECIMAL(12, 2) DEFAULT 0,
    actual_cost DECIMAL(12, 2) DEFAULT 0,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_budget_items_project ON project_budget_items(project_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_category ON project_budget_items(category);

-- 2. Project Stakeholders - business stakeholders registry
CREATE TABLE IF NOT EXISTS project_stakeholders (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    external_name VARCHAR(255),
    external_email VARCHAR(255),
    external_organization VARCHAR(255),
    role VARCHAR(50) NOT NULL, -- 'sponsor', 'business_owner', 'steering_committee', 'subject_matter_expert'
    is_primary BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stakeholders_project ON project_stakeholders(project_id);

-- 3. Add category column to project_files if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'project_files' AND column_name = 'category'
    ) THEN
        ALTER TABLE project_files ADD COLUMN category VARCHAR(50) DEFAULT 'other';
    END IF;
END $$;

-- 4. Activity Log - full audit trail
CREATE TABLE IF NOT EXISTS activity_log (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL, -- 'project', 'task', 'milestone', 'member', 'stakeholder', 'budget_item', 'file'
    entity_id INTEGER NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'deleted', 'status_changed', 'member_added', 'member_removed'
    field_name VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    performed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_activity_log_project ON activity_log(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_performed_at ON activity_log(performed_at DESC);

-- 5. Create project_files table if it doesn't exist
CREATE TABLE IF NOT EXISTS project_files (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    category VARCHAR(50) DEFAULT 'other', -- 'business_case', 'proposal', 'charter', 'budget', 'status_report', 'other'
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_project_files_project ON project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_category ON project_files(category);
