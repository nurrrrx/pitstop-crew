-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'member',
    avatar_url VARCHAR(500),
    hourly_rate DECIMAL(10, 2) DEFAULT 0,
    employment_type VARCHAR(20) DEFAULT 'fte', -- 'fte' or 'contractor'
    department VARCHAR(100),
    title VARCHAR(100),
    start_date DATE,
    end_date DATE, -- NULL for active employees
    is_admin BOOLEAN DEFAULT false,
    bio TEXT,
    location VARCHAR(255),
    phone VARCHAR(50),
    linkedin_url VARCHAR(500),
    -- FTE band for cost calculation: G=10K, H=20K, I=30K monthly
    band VARCHAR(5), -- 'G', 'H', 'I'
    -- Consultant rate category: A=1K/21K, AA=1.5K/31.5K, AAA=2K/42K, AAAA=3K/63K (daily/monthly)
    rate_category VARCHAR(10), -- 'A', 'AA', 'AAA', 'AAAA'
    daily_rate DECIMAL(10, 2) DEFAULT 0,
    monthly_rate DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_band ON users(band);
CREATE INDEX IF NOT EXISTS idx_users_rate_category ON users(rate_category);
CREATE INDEX IF NOT EXISTS idx_users_employment_type ON users(employment_type);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'planning',
    priority VARCHAR(50) DEFAULT 'medium',
    start_date DATE,
    end_date DATE,
    budget DECIMAL(12, 2) DEFAULT 0,
    spent DECIMAL(12, 2) DEFAULT 0,
    owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    color VARCHAR(7) DEFAULT '#3498db',
    -- Additional fields for Excel import
    head VARCHAR(255), -- Project head/owner name
    domain VARCHAR(100), -- Project domain (Finance, Marketing, etc.)
    phase VARCHAR(255), -- Project phase
    implemented TEXT, -- What has been implemented
    business_interaction TEXT, -- Business interaction notes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);

-- Create project_members table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS project_members (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);

-- Create milestones table
CREATE TABLE IF NOT EXISTS milestones (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_milestones_project ON milestones(project_id);

-- Create time_entries table
CREATE TABLE IF NOT EXISTS time_entries (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    hours DECIMAL(5, 2) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    billable BOOLEAN DEFAULT true,
    hourly_rate DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_time_entries_project ON time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(date);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    milestone_id INTEGER REFERENCES milestones(id) ON DELETE SET NULL,
    assignee_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'todo',
    priority VARCHAR(50) DEFAULT 'medium',
    start_date DATE,
    due_date DATE,
    estimated_hours DECIMAL(5, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_milestone ON tasks(milestone_id);

-- Create project_files table
CREATE TABLE IF NOT EXISTS project_files (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_project_files_project ON project_files(project_id);

-- Create dependencies table
CREATE TABLE IF NOT EXISTS task_dependencies (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    depends_on_task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    UNIQUE(task_id, depends_on_task_id)
);

-- Create contractor_cost_plans table (for non-FTE cost planning)
CREATE TABLE IF NOT EXISTS contractor_cost_plans (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL, -- 1-12
    planned_hours DECIMAL(6, 2) DEFAULT 0,
    planned_rate DECIMAL(10, 2) DEFAULT 0,
    actual_hours DECIMAL(6, 2) DEFAULT 0,
    actual_cost DECIMAL(12, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, year, month)
);

CREATE INDEX IF NOT EXISTS idx_contractor_cost_plans_user ON contractor_cost_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_contractor_cost_plans_period ON contractor_cost_plans(year, month);

-- Create deliverables table
CREATE TABLE IF NOT EXISTS deliverables (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    due_date DATE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_deliverables_project ON deliverables(project_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_user ON deliverables(user_id);

-- Create ad-hoc requests table
CREATE TABLE IF NOT EXISTS adhoc_requests (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    requestor_name VARCHAR(255) NOT NULL,
    requestor_email VARCHAR(255),
    requestor_department VARCHAR(100),
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    priority VARCHAR(50) DEFAULT 'medium', -- low, medium, high, urgent
    status VARCHAR(50) DEFAULT 'new', -- new, in_progress, on_hold, completed, cancelled
    due_date DATE,
    estimated_hours DECIMAL(5, 2),
    actual_hours DECIMAL(5, 2) DEFAULT 0,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL, -- optional link to project
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_adhoc_requests_status ON adhoc_requests(status);
CREATE INDEX IF NOT EXISTS idx_adhoc_requests_assigned ON adhoc_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_adhoc_requests_requestor ON adhoc_requests(requestor_name);

-- Create adhoc_request_comments table
CREATE TABLE IF NOT EXISTS adhoc_request_comments (
    id SERIAL PRIMARY KEY,
    request_id INTEGER REFERENCES adhoc_requests(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_adhoc_comments_request ON adhoc_request_comments(request_id);

-- Create ADO Budget table for 2026 budget tracking
CREATE TABLE IF NOT EXISTS ado_budget (
    id SERIAL PRIMARY KEY,
    year INTEGER NOT NULL DEFAULT 2026,
    item_name VARCHAR(255) NOT NULL,
    budget_aed DECIMAL(15, 2) DEFAULT 0,
    capex DECIMAL(15, 2) DEFAULT 0,
    opex DECIMAL(15, 2) DEFAULT 0,
    category VARCHAR(50), -- 'aed' or 'fte'
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ado_budget_year ON ado_budget(year);
CREATE INDEX IF NOT EXISTS idx_ado_budget_category ON ado_budget(category);
