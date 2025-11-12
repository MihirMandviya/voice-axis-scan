-- ============================================================================
-- COMPLETE DATABASE SCHEMA DUMP FOR VOICE AXIS SCAN
-- Generated from Supabase Database
-- This file contains all tables, functions, triggers, indexes, and constraints.
-- RLS policies are NOT included as the current database has no RLS policies.
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CREATE TABLE STATEMENTS (in dependency order)
-- ============================================================================

-- 1. companies (no dependencies)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  phone VARCHAR(20),
  address TEXT,
  website VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. user_roles (depends on companies)
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  company_id UUID,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'manager', 'employee')),
  manager_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. managers (depends on companies)
CREATE TABLE managers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_id UUID NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  department VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  contact_number VARCHAR(255),
  phone VARCHAR(20)
);

-- 4. employees (depends on companies and managers)
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_id UUID NOT NULL,
  manager_id UUID NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  contact_number VARCHAR(255),
  phone VARCHAR(20)
);

-- 5. user_profiles (depends on auth.users - cannot create FK)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  company_name TEXT,
  company_email TEXT,
  company_industry TEXT,
  position TEXT,
  use_cases TEXT[],
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. lead_groups (depends on companies, managers, auth.users)
CREATE TABLE lead_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  group_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  company_id UUID,
  assigned_to UUID
);

-- 7. leads (depends on lead_groups, companies)
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  contact VARCHAR(255) NOT NULL,
  description TEXT,
  other JSONB,
  group_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  company_id UUID,
  assigned_to UUID,
  status VARCHAR(20) DEFAULT 'unassigned'
);

-- 8. recordings (depends on companies, employees)
CREATE TABLE recordings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  drive_file_id TEXT,
  file_name TEXT,
  file_size BIGINT,
  stored_file_url TEXT,
  status TEXT CHECK (status = ANY (ARRAY['queued'::text, 'processing'::text, 'completed'::text, 'failed'::text, 'pending'::text, 'in_progress'::text, 'analyzing'::text, 'analyzed'::text, 'error'::text, 'cancelled'::text, 'uploaded'::text, 'transcribing'::text, 'transcribed'::text, 'done'::text, 'finished'::text, 'success'::text])),
  duration_seconds INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  transcript TEXT,
  company_id UUID,
  assigned_to UUID
);

-- 9. analyses (depends on recordings, call_history, companies)
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recording_id UUID,
  call_id UUID,
  user_id UUID NOT NULL,
  sentiment_score NUMERIC,
  engagement_score NUMERIC,
  confidence_score_executive NUMERIC,
  confidence_score_person NUMERIC,
  objections_handled TEXT,
  next_steps TEXT,
  improvements TEXT,
  call_outcome TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  detailed_call_analysis JSONB,
  short_summary TEXT,
  participants JSONB,
  objections_raised INTEGER DEFAULT 0,
  objections_tackled INTEGER DEFAULT 0,
  company_id UUID,
  assigned_to UUID,
  status VARCHAR(20) DEFAULT 'pending'
);

-- 10. metrics_aggregates (depends on companies, auth.users)
CREATE TABLE metrics_aggregates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  total_calls INTEGER,
  avg_sentiment NUMERIC,
  avg_engagement NUMERIC,
  conversion_rate NUMERIC,
  objections_rate NUMERIC,
  company_id UUID
);

-- 11. call_history (depends on companies, employees, leads)
CREATE TABLE call_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID,
  employee_id UUID,
  company_id UUID,
  notes TEXT,
  next_follow_up DATE,
  exotel_response JSONB NOT NULL,
  exotel_call_sid VARCHAR(255),
  exotel_from_number VARCHAR(20),
  exotel_to_number VARCHAR(20),
  exotel_caller_id VARCHAR(20),
  exotel_status VARCHAR(50),
  exotel_duration INTEGER,
  exotel_recording_url TEXT,
  exotel_start_time TIMESTAMPTZ,
  exotel_end_time TIMESTAMPTZ,
  exotel_answered_by VARCHAR(50),
  exotel_direction VARCHAR(50),
  call_date TIMESTAMPTZ DEFAULT NOW(),
  outcome VARCHAR(50) DEFAULT 'follow_up',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  call_details JSONB,
  auto_call_followup BOOLEAN DEFAULT false
);

-- 12. call_outcomes (depends on employees, leads)
CREATE TABLE call_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID,
  employee_id UUID,
  call_date TIMESTAMPTZ DEFAULT NOW(),
  outcome VARCHAR(50) NOT NULL CHECK (outcome IN ('interested', 'not_interested', 'follow_up', 'converted', 'lost', 'completed')),
  notes TEXT,
  next_follow_up DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  company_id UUID,
  exotel_call_sid VARCHAR(255),
  exotel_from_number VARCHAR(20),
  exotel_to_number VARCHAR(20),
  exotel_caller_id VARCHAR(20),
  exotel_status VARCHAR(50),
  exotel_duration INTEGER,
  exotel_recording_url TEXT,
  exotel_start_time TIMESTAMPTZ,
  exotel_end_time TIMESTAMPTZ,
  call_in_progress BOOLEAN DEFAULT false
);

-- 13. lead_assignments (depends on leads, auth.users)
CREATE TABLE lead_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID,
  assigned_to UUID,
  assigned_by UUID,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'cancelled'))
);

-- 14. removed_leads (depends on leads, employees, companies)
CREATE TABLE removed_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID,
  employee_id UUID,
  company_id UUID,
  lead_name VARCHAR(255) NOT NULL,
  lead_email VARCHAR(255),
  lead_contact VARCHAR(20),
  lead_company VARCHAR(255),
  removal_reason TEXT NOT NULL,
  removal_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. company_settings (depends on companies)
CREATE TABLE company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID UNIQUE,
  caller_id VARCHAR(20) DEFAULT '09513886363',
  from_numbers JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  exotel_api_key VARCHAR(255),
  exotel_api_token VARCHAR(255),
  exotel_subdomain VARCHAR(255) DEFAULT 'api.exotel.com',
  exotel_account_sid VARCHAR(255),
  exotel_setup_completed BOOLEAN DEFAULT false
);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_call_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_company_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- For now, we'll return NULL to allow all operations
  -- In a production system, you'd implement proper user context here
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_user_email(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the user's email_confirmed_at timestamp
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = user_id
  AND email_confirmed_at IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_confirm_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Automatically confirm email for new users
  IF NEW.email_confirmed_at IS NULL THEN
    NEW.email_confirmed_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION check_email_unique_in_company(
    p_email TEXT,
    p_company_id UUID,
    p_exclude_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Check if email exists in auth.users and is linked to this company
    SELECT COUNT(*) INTO v_count
    FROM auth.users au
    JOIN user_roles ur ON ur.user_id = au.id
    WHERE au.email = p_email
    AND ur.company_id = p_company_id
    AND (p_exclude_user_id IS NULL OR au.id != p_exclude_user_id);
    
    RETURN v_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION validate_email_uniqueness()
RETURNS TRIGGER AS $$
DECLARE
    v_email TEXT;
    v_company_id UUID;
    v_employee_count INTEGER := 0;
    v_manager_count INTEGER := 0;
BEGIN
    -- Get email based on table
    IF TG_TABLE_NAME = 'employees' THEN
        v_email := NEW.email;
        v_company_id := NEW.company_id;
        
        -- Check in managers table (cross-check)
        SELECT COUNT(*) INTO v_manager_count
        FROM managers
        WHERE email = v_email
        AND company_id = v_company_id
        AND is_active = true;
        
        IF v_manager_count > 0 THEN
            RAISE EXCEPTION 'Email % is already registered as a manager in this company', v_email;
        END IF;
        
    ELSIF TG_TABLE_NAME = 'managers' THEN
        v_email := NEW.email;
        v_company_id := NEW.company_id;
        
        -- Check in employees table (cross-check)
        SELECT COUNT(*) INTO v_employee_count
        FROM employees
        WHERE email = v_email
        AND company_id = v_company_id
        AND is_active = true;
        
        IF v_employee_count > 0 THEN
            RAISE EXCEPTION 'Email % is already registered as an employee in this company', v_email;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_recording_and_analysis_for_call()
RETURNS TRIGGER AS $$
DECLARE
  new_recording_id UUID;
  new_analysis_id UUID;
  generated_file_name TEXT;
BEGIN
  -- Only create records if outcome is NOT 'failed' or 'not_answered'
  IF NEW.outcome NOT IN ('failed', 'not_answered') AND NEW.exotel_recording_url IS NOT NULL THEN
    
    -- Generate a file name based on call details
    generated_file_name := 'call_' || NEW.id || '_' || TO_CHAR(NEW.created_at, 'YYYY-MM-DD');
    
    -- Step 1: Create a recording record
    INSERT INTO recordings (
      user_id,
      company_id,
      stored_file_url,
      file_name,
      status,
      transcript,
      created_at
    )
    VALUES (
      NEW.employee_id,
      NEW.company_id,
      NEW.exotel_recording_url,
      generated_file_name,
      'pending',
      NEW.notes,
      NEW.created_at
    )
    RETURNING id INTO new_recording_id;
    
    -- Step 2: Create an analysis record linked to the recording and call
    INSERT INTO analyses (
      recording_id,
      call_id,
      user_id,
      company_id,
      status,
      sentiment_score,
      engagement_score,
      confidence_score_executive,
      confidence_score_person,
      objections_handled,
      next_steps,
      improvements,
      call_outcome,
      detailed_call_analysis,
      short_summary,
      created_at
    )
    VALUES (
      new_recording_id,
      NEW.id,
      NEW.employee_id,
      NEW.company_id,
      'pending',
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      NEW.created_at
    )
    RETURNING id INTO new_analysis_id;
    
    RAISE NOTICE 'Auto-created recording % and analysis % for call %', new_recording_id, new_analysis_id, NEW.id;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_recordings_updated_at 
  BEFORE UPDATE ON recordings
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lead_groups_updated_at 
  BEFORE UPDATE ON lead_groups
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at 
  BEFORE UPDATE ON leads
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_call_history_updated_at
  BEFORE UPDATE ON call_history
  FOR EACH ROW
  EXECUTE FUNCTION update_call_history_updated_at();

CREATE TRIGGER trigger_update_company_settings_updated_at
  BEFORE UPDATE ON company_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_company_settings_updated_at();

CREATE TRIGGER auto_confirm_email_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_new_user();

CREATE TRIGGER validate_employee_email_trigger
  BEFORE INSERT OR UPDATE OF email
  ON employees
  FOR EACH ROW
  EXECUTE FUNCTION validate_email_uniqueness();

CREATE TRIGGER validate_manager_email_trigger
  BEFORE INSERT OR UPDATE OF email
  ON managers
  FOR EACH ROW
  EXECUTE FUNCTION validate_email_uniqueness();

CREATE TRIGGER trigger_create_recording_and_analysis
  AFTER INSERT ON call_history
  FOR EACH ROW
  EXECUTE FUNCTION create_recording_and_analysis_for_call();

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Recordings indexes
CREATE INDEX idx_recordings_user_id ON recordings(user_id);
CREATE INDEX idx_recordings_status ON recordings(status);
CREATE INDEX idx_recordings_created_at ON recordings(created_at);

-- Analyses indexes
CREATE INDEX idx_analyses_recording_id ON analyses(recording_id);
CREATE INDEX idx_analyses_recording_id_new ON analyses(recording_id);
CREATE INDEX idx_analyses_user_id ON analyses(user_id);
CREATE INDEX idx_analyses_user_id_new ON analyses(user_id);
CREATE INDEX idx_analyses_created_at ON analyses(created_at);
CREATE INDEX idx_analyses_created_at_new ON analyses(created_at);
CREATE INDEX idx_analyses_sentiment_score ON analyses(sentiment_score);
CREATE INDEX idx_analyses_engagement_score ON analyses(engagement_score);
CREATE INDEX idx_analyses_call_id ON analyses(call_id);

-- Metrics aggregates indexes
CREATE INDEX idx_metrics_aggregates_user_id ON metrics_aggregates(user_id);
CREATE INDEX idx_metrics_aggregates_date ON metrics_aggregates(date);
CREATE UNIQUE INDEX idx_metrics_aggregates_user_date ON metrics_aggregates(user_id, date);

-- User profiles indexes
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_onboarding ON user_profiles(onboarding_completed);
-- Note: user_profiles.user_id unique constraint is added in UNIQUE CONSTRAINTS section

-- Lead groups indexes
CREATE INDEX idx_lead_groups_user_id ON lead_groups(user_id);
CREATE INDEX idx_lead_groups_assigned_to ON lead_groups(assigned_to);

-- Leads indexes
CREATE INDEX idx_leads_user_id ON leads(user_id);
CREATE INDEX idx_leads_group_id ON leads(group_id);
CREATE INDEX idx_leads_email ON leads(email);

-- Managers indexes
CREATE INDEX idx_managers_company_id ON managers(company_id);
CREATE INDEX idx_managers_user_id ON managers(user_id);
CREATE INDEX idx_managers_email ON managers(email);
-- Note: managers.user_id and managers.email+company_id unique constraints are added in UNIQUE CONSTRAINTS section

-- Employees indexes
CREATE INDEX idx_employees_company_id ON employees(company_id);
CREATE INDEX idx_employees_manager_id ON employees(manager_id);
CREATE INDEX idx_employees_user_id ON employees(user_id);
CREATE INDEX idx_employees_email ON employees(email);
-- Note: employees.user_id and employees.email+company_id unique constraints are added in UNIQUE CONSTRAINTS section

-- User roles indexes
-- Note: user_roles unique constraint is added in UNIQUE CONSTRAINTS section

-- Call history indexes
CREATE INDEX idx_call_history_lead_id ON call_history(lead_id);
CREATE INDEX idx_call_history_employee_id ON call_history(employee_id);
CREATE INDEX idx_call_history_company_id ON call_history(company_id);
CREATE INDEX idx_call_history_call_date ON call_history(call_date);
CREATE INDEX idx_call_history_exotel_sid ON call_history(exotel_call_sid);
CREATE INDEX idx_call_history_outcome ON call_history(outcome);
CREATE INDEX idx_call_history_auto_followup ON call_history(next_follow_up, auto_call_followup) WHERE (auto_call_followup = true AND next_follow_up IS NOT NULL);

-- Removed leads indexes
CREATE INDEX idx_removed_leads_lead_id ON removed_leads(lead_id);
CREATE INDEX idx_removed_leads_employee_id ON removed_leads(employee_id);
CREATE INDEX idx_removed_leads_company_id ON removed_leads(company_id);
CREATE INDEX idx_removed_leads_removal_date ON removed_leads(removal_date);

-- Company settings indexes
CREATE INDEX idx_company_settings_company_id ON company_settings(company_id);

-- ============================================================================
-- UNIQUE CONSTRAINTS
-- ============================================================================

ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);
ALTER TABLE managers ADD CONSTRAINT managers_user_id_unique UNIQUE (user_id);
ALTER TABLE managers ADD CONSTRAINT managers_email_company_unique UNIQUE (email, company_id);
ALTER TABLE employees ADD CONSTRAINT employees_user_id_unique UNIQUE (user_id);
ALTER TABLE employees ADD CONSTRAINT employees_email_company_unique UNIQUE (email, company_id);
ALTER TABLE user_roles ADD CONSTRAINT user_roles_user_company_unique UNIQUE (user_id, company_id);
-- Note: company_settings.company_id is already UNIQUE in the CREATE TABLE statement

-- ============================================================================
-- FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- User roles
ALTER TABLE user_roles 
ADD CONSTRAINT user_roles_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- Managers
ALTER TABLE managers 
ADD CONSTRAINT managers_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- Employees
ALTER TABLE employees 
ADD CONSTRAINT employees_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE employees 
ADD CONSTRAINT employees_manager_id_fkey 
FOREIGN KEY (manager_id) REFERENCES managers(id) ON DELETE SET NULL;

-- User profiles
-- Note: user_profiles.user_id references auth.users(id) - cannot create FK constraint

-- Lead groups
ALTER TABLE lead_groups 
ADD CONSTRAINT lead_groups_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES companies(id);

ALTER TABLE lead_groups 
ADD CONSTRAINT lead_groups_assigned_to_fkey 
FOREIGN KEY (assigned_to) REFERENCES managers(id) ON DELETE SET NULL;

-- Note: lead_groups.user_id references auth.users(id) - cannot create FK constraint

-- Leads
ALTER TABLE leads 
ADD CONSTRAINT leads_group_id_fkey 
FOREIGN KEY (group_id) REFERENCES lead_groups(id) ON DELETE SET NULL;

ALTER TABLE leads 
ADD CONSTRAINT leads_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES companies(id);

-- Note: leads.user_id and leads.assigned_to reference auth.users(id) - cannot create FK constraints

-- Recordings
ALTER TABLE recordings 
ADD CONSTRAINT recordings_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES companies(id);

ALTER TABLE recordings 
ADD CONSTRAINT recordings_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES employees(user_id);

ALTER TABLE recordings 
ADD CONSTRAINT recordings_assigned_to_fkey 
FOREIGN KEY (assigned_to) REFERENCES employees(user_id);

-- Analyses
ALTER TABLE analyses 
ADD CONSTRAINT analyses_recording_id_fkey 
FOREIGN KEY (recording_id) REFERENCES recordings(id) ON DELETE CASCADE;

ALTER TABLE analyses 
ADD CONSTRAINT analyses_call_id_fkey 
FOREIGN KEY (call_id) REFERENCES call_history(id) ON DELETE CASCADE;

ALTER TABLE analyses 
ADD CONSTRAINT analyses_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES companies(id);

-- Note: analyses.user_id and analyses.assigned_to reference auth.users(id) - cannot create FK constraints

-- Metrics aggregates
ALTER TABLE metrics_aggregates 
ADD CONSTRAINT metrics_aggregates_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES companies(id);

-- Note: metrics_aggregates.user_id references auth.users(id) - cannot create FK constraint

-- Call history
ALTER TABLE call_history 
ADD CONSTRAINT call_history_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE call_history 
ADD CONSTRAINT call_history_employee_id_fkey 
FOREIGN KEY (employee_id) REFERENCES employees(user_id) ON DELETE SET NULL;

ALTER TABLE call_history 
ADD CONSTRAINT call_history_lead_id_fkey 
FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL;

-- Call outcomes
ALTER TABLE call_outcomes 
ADD CONSTRAINT call_outcomes_lead_id_fkey 
FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;

ALTER TABLE call_outcomes 
ADD CONSTRAINT call_outcomes_employee_id_fkey 
FOREIGN KEY (employee_id) REFERENCES employees(id);

-- Lead assignments
-- Note: lead_assignments.lead_id, assigned_to, assigned_by reference auth.users(id) - cannot create FK constraints
ALTER TABLE lead_assignments 
ADD CONSTRAINT lead_assignments_lead_id_fkey 
FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;

-- Removed leads
ALTER TABLE removed_leads 
ADD CONSTRAINT removed_leads_lead_id_fkey 
FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;

ALTER TABLE removed_leads 
ADD CONSTRAINT removed_leads_employee_id_fkey 
FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;

ALTER TABLE removed_leads 
ADD CONSTRAINT removed_leads_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- Company settings
ALTER TABLE company_settings 
ADD CONSTRAINT company_settings_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN analyses.participants IS 'JSON object containing participant information (names, roles, etc.)';
COMMENT ON COLUMN analyses.objections_raised IS 'Number of objections raised during the call';
COMMENT ON COLUMN analyses.objections_tackled IS 'Number of objections successfully tackled/handled';
COMMENT ON COLUMN lead_groups.assigned_to IS 'Reference to the manager this lead group is assigned to';
COMMENT ON COLUMN leads.user_id IS 'Reference to the manager/admin who owns this lead. Can be null for unassigned leads.';
COMMENT ON CONSTRAINT analyses_call_id_fkey ON analyses IS 'Links analysis to call_history table';
COMMENT ON FUNCTION create_recording_and_analysis_for_call() IS 'Automatically creates recording and analysis records when a call is logged in call_history (excludes failed and not_answered calls)';

-- ============================================================================
-- END OF DATABASE SCHEMA DUMP
-- ============================================================================

-- ============================================================================
-- DATA INSERTS
-- ============================================================================

-- Temporarily disable email validation triggers to allow data insertion
ALTER TABLE employees DISABLE TRIGGER validate_employee_email_trigger;
ALTER TABLE managers DISABLE TRIGGER validate_manager_email_trigger;

-- Companies
INSERT INTO companies (id, name, email, industry, phone, address, website, created_at, updated_at)
VALUES ('78626c8f-108c-47f1-8d71-423305e3b3a4', 'Tasknova', 'contact.tasknova@gmail.com', 'Marketing', '9999999999', 'Pune Maharrashtra', 'https://tasknova.io', '2025-10-30 13:09:19.152598+00', '2025-10-30 13:09:19.152598+00');

-- User Roles
INSERT INTO user_roles (id, user_id, company_id, role, manager_id, is_active, created_at, updated_at)
VALUES 
('0881275d-7b86-4369-8727-f64c1901de3b', '510cf19e-123d-41e8-b58d-f1c99ee58296', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'admin', NULL, TRUE, '2025-10-30 13:09:19.289442+00', '2025-10-30 13:09:19.289442+00'),
('5b6fc896-7037-43a1-8466-a4d6ef3235ef', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'manager', NULL, TRUE, '2025-10-30 13:13:07.670161+00', '2025-10-30 13:13:07.670161+00'),
('054df347-a227-4df3-ae72-c3b94e08ce79', '93a34221-98be-4aec-b95f-ae69252e3cd8', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'employee', '002ee72e-af81-4675-8fcd-baa5c382f088', TRUE, '2025-10-30 13:29:24.320549+00', '2025-10-30 13:29:24.320549+00'),
('3f17e87f-263e-4bda-a2a5-d0f2bb788e0c', '034577ec-e7b7-4a67-9d7a-4ccd99857c6c', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'employee', '002ee72e-af81-4675-8fcd-baa5c382f088', TRUE, '2025-11-06 07:54:07.042162+00', '2025-11-06 07:54:07.042162+00'),
('52dff5b1-8e27-4bb0-80fd-39f6d20c9277', 'b2e41a5a-e02f-417f-b6a9-908c98a2fb80', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'manager', NULL, TRUE, '2025-11-06 07:54:39.671257+00', '2025-11-06 07:54:39.671257+00'),
('bc718718-be0b-4c26-8580-3cac6c5e0ee7', 'ef8fe2d6-34da-48b0-8d5b-d8ad74021a59', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'employee', 'bcf21618-00ef-43e8-b399-2f028bb5a866', TRUE, '2025-11-06 07:55:09.490192+00', '2025-11-06 07:55:09.490192+00');

-- Managers
INSERT INTO managers (id, user_id, company_id, full_name, email, department, password, is_active, created_at, updated_at, contact_number, phone)
VALUES 
('002ee72e-af81-4675-8fcd-baa5c382f088', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Mihir ', 'aarav2110@gmail.com', 'Marketing', 'Aarav@Manager', TRUE, '2025-10-30 13:13:07.433556+00', '2025-10-30 13:13:07.433556+00', NULL, '9999999999'),
('bcf21618-00ef-43e8-b399-2f028bb5a866', 'b2e41a5a-e02f-417f-b6a9-908c98a2fb80', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Arya Rai', 'arya101@gmail.com', 'Marketing', 'Arya@Manager', TRUE, '2025-11-06 07:54:39.572374+00', '2025-11-06 07:54:39.572374+00', NULL, '9175442260');

-- Employees
INSERT INTO employees (id, user_id, company_id, manager_id, full_name, email, password, is_active, created_at, updated_at, contact_number, phone)
VALUES 
('fef57cba-9996-4736-8ed6-8d71ee160f4a', '93a34221-98be-4aec-b95f-ae69252e3cd8', '78626c8f-108c-47f1-8d71-423305e3b3a4', '002ee72e-af81-4675-8fcd-baa5c382f088', 'Aarav Varma', 'aarav2110@gmail.com', 'Aarav@Employee', TRUE, '2025-10-30 13:24:56.339365+00', '2025-10-30 13:24:56.339365+00', NULL, '999999999'),
('bfe564ae-44eb-4fcf-87e3-05882609bd10', '034577ec-e7b7-4a67-9d7a-4ccd99857c6c', '78626c8f-108c-47f1-8d71-423305e3b3a4', '002ee72e-af81-4675-8fcd-baa5c382f088', 'Jason', 'jason101@gmail.com', 'Jason@Employee', TRUE, '2025-11-06 07:54:06.974385+00', '2025-11-06 07:54:06.974385+00', NULL, '9175442260'),
('04e0e4e6-41f7-4362-831c-8cb9564e6f31', 'ef8fe2d6-34da-48b0-8d5b-d8ad74021a59', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'bcf21618-00ef-43e8-b399-2f028bb5a866', 'Yash Padwal', 'yash101@gmail.com', 'Yash@Employee', TRUE, '2025-11-06 07:55:09.443992+00', '2025-11-06 07:55:09.443992+00', NULL, '9175442260');

-- User Profiles
INSERT INTO user_profiles (id, user_id, email, full_name, avatar_url, company_name, company_email, company_industry, position, use_cases, onboarding_completed, created_at, updated_at)
VALUES 
('649110b7-de28-490b-9472-8d910d9ccd8b', '510cf19e-123d-41e8-b58d-f1c99ee58296', 'aarav2110@gmail.com', 'Aarav Varma ', NULL, 'Tasknova', 'contact.tasknova@gmail.com', 'Marketing', NULL, NULL, TRUE, '2025-10-30 13:09:19.41391+00', '2025-10-30 13:09:19.41391+00'),
('664ec1ca-a830-4cad-8d10-02bd6878a656', 'da9f9588-aef8-4c8c-b3ac-465218b0eed7', 'contact.tasknova@gmail.com', 'TaskNova', 'https://lh3.googleusercontent.com/a/ACg8ocKINweqY-NRfzL_nWua6K6j6z6je-lWc_9_0vXtAPVW1iVpxM0=s96-c', 'Tasknova', 'contact.tasknova@gmail.com', 'Healthcare', 'COO / Chief Operating Officer', ARRAY['Sales Call Analysis', 'Recruitment Call Analysis'], TRUE, '2025-11-04 07:14:01.164+00', '2025-11-04 07:14:01.165+00');

-- Lead Groups
INSERT INTO lead_groups (id, user_id, group_name, created_at, updated_at, company_id, assigned_to)
VALUES ('a978f2e9-ced2-47fc-ad7b-3fc955c47c30', '510cf19e-123d-41e8-b58d-f1c99ee58296', 'Customers', '2025-11-06 07:58:00.281579+00', '2025-11-06 08:50:56.315256+00', '78626c8f-108c-47f1-8d71-423305e3b3a4', '002ee72e-af81-4675-8fcd-baa5c382f088');

-- Leads
INSERT INTO leads (id, user_id, name, email, contact, description, other, group_id, created_at, updated_at, company_id, assigned_to, status)
VALUES 
('101cc5c4-1403-4b42-aa2f-c32bfed1afac', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', 'Rajpal Singh ', 'rajpalrathore4455@gmail.com', '9175442260', 'gg''s', NULL, NULL, '2025-10-30 13:36:18.205744+00', '2025-11-11 14:22:10.404674+00', '78626c8f-108c-47f1-8d71-423305e3b3a4', '93a34221-98be-4aec-b95f-ae69252e3cd8', 'follow_up'),
('33997e69-5d02-4393-8c83-a6b251cd8b4b', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', 'Mihir', 'mihir1@gmail.com', '9511299275', 'gg', NULL, NULL, '2025-10-30 13:38:18.599114+00', '2025-10-31 10:12:00.827291+00', '78626c8f-108c-47f1-8d71-423305e3b3a4', '93a34221-98be-4aec-b95f-ae69252e3cd8', 'converted'),
('a7ad6cf5-76dd-4dc2-b0ac-8506840c8f6b', '93a34221-98be-4aec-b95f-ae69252e3cd8', 'Ayush Ajit', 'ayush101@gmail.com', '9175442260', 'gg''s', NULL, 'a978f2e9-ced2-47fc-ad7b-3fc955c47c30', '2025-11-06 07:59:15.653904+00', '2025-11-06 10:11:24.741274+00', '78626c8f-108c-47f1-8d71-423305e3b3a4', '93a34221-98be-4aec-b95f-ae69252e3cd8', 'assigned'),
('31acfbb8-5074-4b5f-b8c8-3e588b8a929a', '93a34221-98be-4aec-b95f-ae69252e3cd8', 'Nitin Kumar', 'nitin101@gmail.com', '9175442260', 'gg''s', NULL, 'a978f2e9-ced2-47fc-ad7b-3fc955c47c30', '2025-11-06 08:54:24.841592+00', '2025-11-06 10:11:24.741274+00', '78626c8f-108c-47f1-8d71-423305e3b3a4', '93a34221-98be-4aec-b95f-ae69252e3cd8', 'assigned'),
('e9abd86d-f5ac-492c-81df-2f397b8cb7fa', '93a34221-98be-4aec-b95f-ae69252e3cd8', 'Darayus', 'darayus101@gmail.com', '9175442260', 'gg''s', NULL, 'a978f2e9-ced2-47fc-ad7b-3fc955c47c30', '2025-11-06 10:18:25.928617+00', '2025-11-06 10:18:25.928617+00', '78626c8f-108c-47f1-8d71-423305e3b3a4', '93a34221-98be-4aec-b95f-ae69252e3cd8', 'assigned');

-- Recordings
INSERT INTO recordings (id, user_id, drive_file_id, file_name, file_size, stored_file_url, status, duration_seconds, created_at, updated_at, transcript, company_id, assigned_to)
VALUES ('23326422-56e7-401e-8d25-3f35b6e5c445', '93a34221-98be-4aec-b95f-ae69252e3cd8', NULL, 'call_4c3ec8b2-e550-4adc-a462-86e5079277aa_2025-10-31', NULL, 'https://drive.google.com/file/d/1AnQPwPQPw2K2HIvwRaLeeIHvlnACEChY/view?usp=drive_link', 'completed', NULL, '2025-10-31 10:11:40.062275', '2025-11-04 13:08:46.336861', 'Hello. Hello? Yeah, I''m speaking with Nikhil, right? Yeah, who is this? Nikhil, this is Saurav from KPMG Global, and I found your resume on Naukri. Okay. So I just wanted to check if you''re looking for a job? Yes, yes, yes, right now I''m looking for a job. Yeah. So, Nikhil, you know, I hope this is a good time to talk, right? Yeah. So, this role, it''s for a transaction monitoring. You know, the designation is analyst. Okay. And this role it''s in Bangalore, uh, location it''s for Lindor, right? which will be a work from office five days and as this is in clean room setup, and cab has been provided both ways. Apart from this, Okay. We are looking for someone. Yeah, so we are looking for someone with one to three years of experience into end-to-end transaction monitoring. You know, someone who has worked with corporate clients rather than for retail or individual. Okay. Apart from this, uh, you know, um, We want someone with an exposure or familiar with, you know, money laundering concepts and counter terrorist financing, that''s sanction screenings. If someone has experience into, uh, you know, investigation, apart from this would have good reporting skills, you know, with Excel or if you have any data analysis tool skills, that is a plus. And uh, should have handled any compliance or you know, suspicious activity or you know, alerts uh, in your previous company. That''s. Okay. Okay. Right now I''m having experience in transaction monitoring. Like with some, which right now I''m working for entities and individuals, the both. Okay? Uh, like here I was working like money in and out and cash transactions. So that that type of activities I''m doing here. Hmm. Yeah, I have experience in that. And uh, like I have somewhat about idea in sanctions screenings as well. And Okay. and CIP as well, like customer identification program as well. Right now I''m working for transaction mountain and supporting for CIP. Okay. So, uh, with you know, uh, money laundering, do you know like what are the three stages of uh, money laundering? Yeah, yes, yes, I know. Like placement, layering and integrity integration. Okay. And uh, So you know, have you faced any kind of compliance or you know, uh, any alert where you know, a team handled? In a good way? Okay. Oh, what about? Can can you say it again? Yeah. So I''m asking you, have you you know ever encountered any compliance and you know, uh, have handled it like you know, for suspicious activity or any kind of alert? Okay. See, right now like sometimes we''ll get bad alerts. Like bad alerts means bad transactions, like the person who do uh, suspicious activities like deposing the money within the area like three to four times in a per day of per week. So that type of we''ll get but when we don''t have the exact uh, um, exact uh, the person who did this, right? Now the money where the money is going out or coming in. So where we didn''t find that type of situation, then we''ll we have to escalate it. But not that many cases we''ll get, but we''ll get almost like closing case only. Because our bank is very small, it''s a community bank. So which I''m working for right now. So we are not getting that Okay. mean that much of cases right now. So we are getting very low volumes right now. Okay. So you have experience with corporate as well, right? You know, you mentioned you worked with banks. Yes. Yes. Yes, yes. So you must be working with you know some foundations, trust, right? Yes, yes, yes, obviously. Okay. And uh, can you tell me your CTC? Uh, right now my CTC is uh, 3.20. And uh, can you tell me your expectations? Expectations about like five, 5.5? No, you know that is way out of budget. So for this position, you know, we haven''t budget which is 4.2, which will be the max budget for this role. Because you know, you have like 1.1 year of experience into transaction monitoring. If you know it would be between 2.5 to three, then you know, the budget could go till 4.5. Okay. Yeah. So if you''re comfortable, you know, we can proceed. Plus you know, uh, with KPMG, let me tell you that, you know, there we have two appraisals cycles. One is an April, another one is October. And you know, based upon your performance, if you perform well, so you will be getting an you know, appraisal from 0% to 25 to 30%. But you know, as I mentioned, it totally depends upon your performance. Okay, I get it. Yeah. Yeah, so this is all about you know, KPMG and you know, once you will be working with KPMG, you know, uh, not just transaction monitoring, you know, you will also be having exposure to money laundering, you know, end to end KYC, you will be learning that as well. Okay, that''s good, that''s great actually. But I have the interest in only in transaction monitoring which I have like uh, uh, like I''m so enturism to work on the transaction monitoring because of basically. Yeah, yeah. I have just told that you know you will be having an exposure to you know other like money So this is a part of KYC only transaction monitoring and sanction screening. Yes, yes. So you will be in transaction monitoring, you you will be having exposure to sanction screening as well. So there are you know, multiple roles. There are roles into sanction screening, there are roles into transaction monitoring, there are roles into end to end KYC where you need to handle KYC operations, transaction monitoring and sanction screening. So you will be having exposure to everything, but initially you will be working for transaction monitoring only. Okay. That''s great actually. Okay. And uh, I have only one request. Can you please uh, provide me like some better package, you know? But some please. 4.2 is the max. Yeah, that''s what you know, cause you know, I I will not you know, uh, I will tell you, you know, we will be having like 4.5 or five and then you know, when the HR will be discussing this, you know, he she will be telling or he will be telling that you know, 4.2 is the max. So eventually, you know, you will not accept this. So that''s the reason you know, I''m I already told that 4.2 is the max for this role. We have already had an induction with KPMG, where they told if a candidate has 2.5 years of experience, 2.5 plus two three, then you know, we can consider about 4.5. Okay. Yeah. Okay, I get it. Okay. So if you''re comfortable, let me just proceed with your profile. Okay, let me, let me do it. Yeah. So just help me with this uh, your uh, profile. So your current location it''s Bangalore, right? You''re working with IBM? Yes, yes, yes. And can you tell me your notice period? My notice period is 90 days. That''s you know way too long, you know. You have mentioned two months on your uh, profile. Nobody would Yeah, yeah. consider 90 days of notice period. Okay. But I can I can reduce it for 60 days actually. So they said like they can, they can consider for 60 days. You you are confirm with this, right? Cause you know, if you get this offer and when you you know, tell them that you know it''s not possible, then you know, it will be an escalation or you know, you will be even blacklisted for one to years with KPMG. Yeah. Okay. Okay. I''ll I''ll I''ll I''ll come confirm uh, that uh, I''m sure but uh, my notice period is two months only. Okay. I have just mentioned, you know, 4.2 salary. Okay. You will also receive the mail you know regarding your details, but you know, this will be the max because you know, you will be having an HR round just for the offer. You know, confirmation of your salary and you know, releasing the offer. You know, some other details she will be asking about, you know, how will you commute, you know, that that details will be also be considered. So you know, because you know, I have seen many candidates, you know, agreeing with me with the same rate and then you know, they uh, betray when you know, they have involved with the HR saying that you know, they want 70, 80% hike, which is you know, we out of the budget. So Okay. Okay. That''s why you know. Yeah. And I don''t want any more escalations on my side. So I''m you know, I''m just you know being very concerned because you know, we do have our jobs. Yeah, I get it. I get it. Yeah. Yeah. Or else you know, if I just don''t want to go every week into the manager''s room discussing you know, what was the reason that you you know, without any good screening, you just submitted the candidates. So that''s the only reason I''m concerned. Rest. Okay, okay. I got it. Okay. And and one more thing, I have one question. Yeah. Like um, when was the interview and how how the interview will go? Yes. Okay, so coming to this, you know, you will be having two rounds. So initial will be a test. Uh, it''s written communication test where you need to write essay. So there will be two topics which will be very random. You know, once we having school, you know, the essay writing about hobbies, you know, favorite place Okay. or uh, you know, favorite subjects. So such will be the topics. Apart from this, once you clear, the next round will be an panel member round. It it''s a virtual round on MS teams and you know um, you know the members, you know, they are from the reporting team. So they will be like associate director, manager, senior managers or even team lead with you know experience of more than eight to nine plus years. Okay. They will be, you know, taking your interview, which will be the final round and once you get the offer, Okay. Yeah. You know uh, once you get selected, you know, it takes three to four weeks to you know, initiate the offer, uh, yeah, the BGC, the documents, you know the cap forms, the application forms, and then you know, yeah, you will get the offer. So basically this is an permanent payroll with KPMG Global itself. This is not an contract position or a third party payroll. Okay, fine. Okay fine. I''m, I''m ready to. Yeah. And coming to this uh, you know uh, interview test, you know, you will be getting this link today, somewhere around three to six. Okay. And yeah. So you just need to complete this test within 48 hours and in the next 30 Yes. Okay. 48 hours? Yeah. 48 hours window. Because like see Okay. Actually ma''am, my my work timings is 11:30 to 8:30. So once I complete my shift, I''ll come and I''ll I''ll do the test. Okay? Yeah, yeah, that''s what I told, you know, the window is open for 48 hours and it''s like first come first so. So on daily which is you know, we initiate somewhere around 200 to 250 tests. You know the candidates yeah who are selected. So the sooner he completes the test, you know, we have interviews from Monday to Friday. Okay. And we can line there line there, sorry line then up according to yours and the final members availability. Okay. Yeah. So this is how it works. Okay. And uh, your experience it''s 1.1 year, right? Um, Yes, yes. Okay. And you have experience with end-to-end transaction monitoring, correct? Yes, yes. End-to-end. And can you tell me the tools you have used? Uh, you have experience with Nexus or IBM internet tools? No IBM internet tools that will that will come on the fast people search and Google search which we use. Okay. Okay. And uh, any experience with Actimize? Uh, no uh, we are we''re not using any tools. Like in like we are just a small community bank. So we use only for Nexus, sorry like fast people search and Google and search checks we''ll use for net image. And uh, after that like the alerts will come into FCRM, that''s all. Okay. And do you know what is counter terrorist financing? What? Counter terrorist financing? Counter terrorist financing. Counter terrorist financing or you know, any experience with terrorist financing? Okay. Do you know the concepts? Concepts, huh? Uh counter counter terrorist financing? If no, you know, it''s fine, you know. No worries. No, actually I don''t know actually that. Yeah. So just you know, work on this CTF which is counter terrorist financing. And do you know what a red flag? What is a periodic review? Yeah, I know about the red rapid movements of cash. Yeah. And uh, lot of wire transfers like they are doing the structuring. Yes, that correct. So that all the red flags, right? And uh, any experience with like CDD? Do you know what is customer due diligence uh, Actually I don''t have any experience but I know about like how it works CDD and EDD. EDD okay. Customer due diligence and enhanced due diligence. I know some some what but I don''t have any experience. EDD okay. And you have data reporting experience with Excel? Data reporting in Excel actually that not that much, but by But basics of Excel, right? Yeah. Basics of Excel we we know. Okay then you uh, I have mentioned this. Okay. And the regions you have supported with IBM I think US, right? Okay. Uh, okay. US clients. Yes, yes. Okay. So you know, you will be getting the job description in the next five to 10 minutes. Okay. Apart from this, uh, the test will be initiated around three to six, you know, between this or possibly at 12 as well. So just complete the test as soon as possible. And Okay. And you know, we can align your interview I think from on Wednesday, like from Wednesday to Friday or Saturday also we can align your interview. Okay. Okay then. And I just wanted to know one last thing. Nikhil is your first name and Raigadurga is your last name, right? Yes, yes. Okay then. Thank you so much Nikhil. You know it was nice talking to you. Yeah. Yeah. Bye bye. You know I''m having some Bye bye. Thank you. About so you know my voice is not good. So That''s fine.', '78626c8f-108c-47f1-8d71-423305e3b3a4', NULL);

-- Call History (must come before Analyses since analyses.call_id references call_history.id)
INSERT INTO call_history (id, lead_id, employee_id, company_id, call_date, outcome, notes, next_follow_up, exotel_response, exotel_call_sid, exotel_from_number, exotel_to_number, exotel_caller_id, exotel_status, exotel_duration, exotel_recording_url, exotel_start_time, exotel_end_time, exotel_answered_by, exotel_direction, created_at, updated_at, auto_call_followup, call_details)
VALUES 
('b23171a2-2365-4252-98db-aa690cdefc37', '101cc5c4-1403-4b42-aa2f-c32bfed1afac', '93a34221-98be-4aec-b95f-ae69252e3cd8', '78626c8f-108c-47f1-8d71-423305e3b3a4', '2025-10-31 07:55:37.586778+00', 'not_answered', 'Call was not answered by the recipient', NULL, '{}', '', '9175442260', '9175442260', '09513886363', 'failed', NULL, '', NULL, NULL, NULL, NULL, '2025-10-31 07:55:37.586778+00', '2025-11-04 13:34:04.069484+00', FALSE, NULL),
('4c3ec8b2-e550-4adc-a462-86e5079277aa', '33997e69-5d02-4393-8c83-a6b251cd8b4b', '93a34221-98be-4aec-b95f-ae69252e3cd8', '78626c8f-108c-47f1-8d71-423305e3b3a4', '2025-10-31 10:11:40.062275+00', 'completed', 'Call completed via Exotel', NULL, '{"To": "09511299275", "Sid": "9f35ba019e7fa54dcb0fab868a7019av", "Uri": "/v1/Accounts/tasknova1/Calls/9f35ba019e7fa54dcb0fab868a7019av.json", "From": "09175442260", "Price": null, "Status": "completed", "EndTime": "1970-01-01 05:30:00", "Duration": null, "Direction": "outbound-api", "StartTime": "2025-10-31 15:40:18", "AccountSid": "tasknova1", "AnsweredBy": null, "CallerName": null, "DateCreated": "2025-10-31 15:40:18", "DateUpdated": "2025-10-31 15:41:39", "RecordingUrl": null, "ForwardedFrom": null, "ParentCallSid": null, "PhoneNumberSid": "09513886363"}', '9f35ba019e7fa54dcb0fab868a7019av', '09175442260', '09511299275', '09513886363', 'completed', NULL, 'https://drive.google.com/file/d/1AnQPwPQPw2K2HIvwRaLeeIHvlnACEChY/view?usp=drive_link', '2025-10-31 15:40:18+00', '1970-01-01 05:30:00+00', NULL, 'outbound-api', '2025-10-31 10:11:40.062275+00', '2025-11-04 10:00:14.677096+00', FALSE, NULL),
('8300823c-70fb-40c3-8f97-ba762ee961fa', '33997e69-5d02-4393-8c83-a6b251cd8b4b', '93a34221-98be-4aec-b95f-ae69252e3cd8', '78626c8f-108c-47f1-8d71-423305e3b3a4', '2025-10-31 10:17:32.083179+00', 'not_answered', 'Call was not answered by the recipient', NULL, '{}', '', '7887766008', '9511299275', '09513886363', 'no-answer', NULL, '', NULL, NULL, NULL, NULL, '2025-10-31 10:17:32.083179+00', '2025-11-04 13:34:15.932595+00', FALSE, NULL),
('c621ad58-cea6-4a1c-918e-b9de714e2470', '33997e69-5d02-4393-8c83-a6b251cd8b4b', '93a34221-98be-4aec-b95f-ae69252e3cd8', '78626c8f-108c-47f1-8d71-423305e3b3a4', '2025-11-05 09:53:19.832892+00', 'not_answered', 'Call was not answered by the recipient', NULL, '{}', '', '7887766008', '9511299275', '09513886363', 'failed', NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-05 09:53:19.832892+00', '2025-11-05 09:53:19.832892+00', FALSE, NULL),
('aaa57bc7-9ed6-408e-b5eb-20e6157546ee', '101cc5c4-1403-4b42-aa2f-c32bfed1afac', '93a34221-98be-4aec-b95f-ae69252e3cd8', '78626c8f-108c-47f1-8d71-423305e3b3a4', '2025-11-05 09:54:59.05028+00', 'follow_up', 'Call completed via Exotel', '2025-11-12', '{"To": "09175442260", "Sid": "2768b5514e0e31303149fc0481b419b5", "Uri": "/v1/Accounts/tasknova1/Calls/2768b5514e0e31303149fc0481b419b5.json", "From": "07887766008", "Price": null, "Status": "completed", "EndTime": "1970-01-01 05:30:00", "Duration": null, "Direction": "outbound-api", "StartTime": "2025-11-05 15:24:37", "AccountSid": "tasknova1", "AnsweredBy": null, "CallerName": null, "DateCreated": "2025-11-05 15:24:37", "DateUpdated": "2025-11-05 15:24:58", "RecordingUrl": null, "ForwardedFrom": null, "ParentCallSid": null, "PhoneNumberSid": "09513886363"}', '2768b5514e0e31303149fc0481b419b5', '07887766008', '09175442260', '09513886363', 'completed', NULL, NULL, '2025-11-05 15:24:37+00', '1970-01-01 05:30:00+00', NULL, 'outbound-api', '2025-11-05 09:54:59.05028+00', '2025-11-05 13:29:05.384147+00', FALSE, NULL),
('0449b616-d44b-468b-a224-28612ad715db', NULL, '93a34221-98be-4aec-b95f-ae69252e3cd8', '78626c8f-108c-47f1-8d71-423305e3b3a4', '2025-11-05 13:43:47.251811+00', 'not_answered', 'Call was not answered by the recipient. Dialed number: 8943078101', NULL, '{}', '', '9175442260', '8943078101', '09513886363', 'failed', NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-05 13:43:47.251811+00', '2025-11-05 13:43:47.251811+00', FALSE, NULL),
('417b1433-8a74-4ce4-aee5-2c455a3e5626', NULL, '93a34221-98be-4aec-b95f-ae69252e3cd8', '78626c8f-108c-47f1-8d71-423305e3b3a4', '2025-11-05 13:46:24.426057+00', 'not_answered', 'Call was not answered by the recipient. Dialed number: 7020264223', NULL, '{}', '', '7887766008', '7020264223', '09513886363', 'failed', NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-05 13:46:24.426057+00', '2025-11-05 13:46:24.426057+00', FALSE, NULL),
('22a071ff-706b-4667-bbfc-195a109b5690', '101cc5c4-1403-4b42-aa2f-c32bfed1afac', '93a34221-98be-4aec-b95f-ae69252e3cd8', '78626c8f-108c-47f1-8d71-423305e3b3a4', '2025-11-11 14:21:22.495336+00', 'completed', 'Call completed via Exotel', NULL, '{"To": "09175442260", "Sid": "151b8fbe4fe67d1c95430405e3bd19bb", "Uri": "/v1/Accounts/tasknova1/Calls/151b8fbe4fe67d1c95430405e3bd19bb.json", "From": "07887766008", "Price": null, "Status": "completed", "EndTime": "2025-11-11 19:51:21", "Duration": null, "Direction": "outbound-api", "StartTime": "2025-11-11 19:50:51", "AccountSid": "tasknova1", "AnsweredBy": null, "CallerName": null, "DateCreated": "2025-11-11 19:50:51", "DateUpdated": "2025-11-11 19:51:21", "RecordingUrl": null, "ForwardedFrom": null, "ParentCallSid": null, "PhoneNumberSid": "09513886363"}', '151b8fbe4fe67d1c95430405e3bd19bb', '07887766008', '09175442260', '09513886363', 'completed', NULL, NULL, '2025-11-11 19:50:51+00', '2025-11-11 19:51:21+00', NULL, 'outbound-api', '2025-11-11 14:21:22.495336+00', '2025-11-11 14:21:22.495336+00', FALSE, NULL);

-- Analyses (must come after Call History since analyses.call_id references call_history.id)
INSERT INTO analyses (id, recording_id, call_id, user_id, sentiment_score, engagement_score, confidence_score_executive, confidence_score_person, objections_handled, next_steps, improvements, call_outcome, created_at, detailed_call_analysis, short_summary, participants, objections_raised, objections_tackled, company_id, assigned_to, status)
VALUES ('c22f1d93-ace9-46b2-ade1-dd15cb540053', '23326422-56e7-401e-8d25-3f35b6e5c445', '4c3ec8b2-e550-4adc-a462-86e5079277aa', '93a34221-98be-4aec-b95f-ae69252e3cd8', '75', '65', '6', '5', 'Nikhil raised the objection about the salary expectations being higher than the budget for the position; the recruiter stated that 4.2 LPA is the maximum for the role, given his experience level, and that this is non-negotiable (unresolved). Nikhil also mentioned his notice period is 90 days, which is longer than the 60 days preferred by the company; the recruiter highlighted the need for Nikhil to confirm he can reduce it to 60 days (partially handled).', 'Saurav will send Nikhil the job description in the next 5-10 minutes; Nikhil will receive a test link between 3-6 PM today and needs to complete the test within 48 hours; If Nikhil clears the test, the interview will be scheduled from Wednesday to Friday or Saturday – owner: Saurav.', 'Provide recruiters with a script to address candidate salary expectations early in the call to avoid mismatches; train recruiters to confirm the notice period before proceeding to avoid later complications; prepare candidates for the written communication test by sharing example topics and expectations.', 'Needs Follow-up — Candidate seems interested but salary expectations and notice period need to be resolved.', '2025-10-31 10:11:40.062275', '{"evidence_quotes": "Recruiter: ''...we haven''t budget which is 4.2, which will be the max budget for this role.''\nCandidate: ''Expectations about like five, 5.5?''\nCandidate: ''My notice period is 90 days.''\nRecruiter: ''That''s you know way too long...Nobody would consider 90 days of notice period.''", "next_steps_detailed": "1) Email job description (Saurav, within 10 minutes). 2) Send written test link (Saurav, between 3-6 PM today). 3) Candidate completes test within 48 hours. 4) If candidate passes test, schedule panel interview (Saurav, Wednesday-Saturday).", "objections_detected": "1) Salary expectation mismatch (paraphrase, expectation 5-5.5 LPA vs. 4.2 LPA budget); 2) Notice period longer than preferred (90 days vs. 60 days).", "improvements_for_team": "1) Prioritize salary expectations discussion in the initial screening (Owner: HR, Priority: High, Script: ''Our typical band for this role is 4.2 LPA, is that in your expectations?''). 2) Add a notice period confirmation to the initial screening checklist (Owner: HR, Priority: High, Checklist Item: ''Verify candidate can meet the 60-day notice period requirement''). 3) Prepare candidates for the written communication test with sample topics (Owner: Training Team, Priority: Medium).", "call_outcome_rationale": "Nikhil is interested in the role but the salary is a potential deal-breaker. The recruiter needs to assess Nikhil''s flexibility on salary and notice period before proceeding. The candidate needs to pass the test.", "engagement_explanation": "Nikhil asked several questions about the interview process and the job role, showing active engagement. Saurav provided detailed information and clarified Nikhil''s doubts, indicating good engagement from both sides.", "sentiments_explanation": "The sentiment is moderately positive, with Nikhil showing interest in the job and Saurav being informative. However, salary expectations and notice period create some tension. Nikhil''s tone is generally agreeable but slightly hesitant during the salary discussion.", "objections_handling_details": "The recruiter stated the salary is fixed at 4.2 LPA due to Nikhil''s experience (unresolved); the recruiter emphasized the importance of Nikhil confirming his ability to reduce the notice period to 60 days to avoid future issues (partially resolved).", "confidence_explanation_person": "Nikhil''s confidence is moderate due to the salary offered being lower than his expectation. The candidate''s acceptance hinges on negotiation and willingness to accept the offered package.", "confidence_explanation_executive": "Executive confidence is moderate because while Nikhil has relevant experience, the salary expectation mismatch and long notice period may deter the executive."}', 'Saurav contacted Nikhil for a transaction monitoring analyst role at KPMG. Nikhil expressed interest but raised concerns about the salary being lower than his expectations and a longer notice period. Saurav outlined the next steps involving a written test and a panel interview.', '{"count": 2, "names": "Saurav (Recruiter), Nikhil"}', 2, 0, '78626c8f-108c-47f1-8d71-423305e3b3a4', NULL, 'Completed');

-- Call Outcomes
INSERT INTO call_outcomes (id, lead_id, employee_id, call_date, outcome, notes, next_follow_up, created_at, company_id, exotel_call_sid, exotel_from_number, exotel_to_number, exotel_caller_id, exotel_status, exotel_duration, exotel_recording_url, exotel_start_time, exotel_end_time, call_in_progress)
VALUES 
('c16174c6-5565-4d3d-a92a-a649d7ececa9', '33997e69-5d02-4393-8c83-a6b251cd8b4b', 'fef57cba-9996-4736-8ed6-8d71ee160f4a', '2025-10-31 10:03:09.745+00', 'completed', 'It was good', NULL, '2025-10-31 10:03:09.745+00', '78626c8f-108c-47f1-8d71-423305e3b3a4', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, FALSE),
('58d25ab2-a433-47cb-961d-b23ed797abcf', '33997e69-5d02-4393-8c83-a6b251cd8b4b', 'fef57cba-9996-4736-8ed6-8d71ee160f4a', '2025-10-31 10:11:59.462+00', 'completed', 'It was good', NULL, '2025-10-31 10:11:59.462+00', '78626c8f-108c-47f1-8d71-423305e3b3a4', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, FALSE),
('c06f1f0c-3035-46c3-a262-296e54dde9d2', '101cc5c4-1403-4b42-aa2f-c32bfed1afac', 'fef57cba-9996-4736-8ed6-8d71ee160f4a', '2025-11-05 09:55:24.455+00', 'follow_up', 'new', '2025-11-12', '2025-11-05 09:55:24.455+00', '78626c8f-108c-47f1-8d71-423305e3b3a4', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, FALSE),
('f45fffb1-e7e1-470f-b6fa-42eb4b558a69', '101cc5c4-1403-4b42-aa2f-c32bfed1afac', 'fef57cba-9996-4736-8ed6-8d71ee160f4a', '2025-11-11 14:22:09.885+00', 'follow_up', 'gg''s', '2025-11-12', '2025-11-11 14:22:09.885+00', '78626c8f-108c-47f1-8d71-423305e3b3a4', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, FALSE);

-- Company Settings
INSERT INTO company_settings (id, company_id, caller_id, from_numbers, created_at, updated_at, exotel_api_key, exotel_api_token, exotel_subdomain, exotel_account_sid, exotel_setup_completed)
VALUES ('1e36ef04-9e32-4789-84fc-e71316471bf4', '78626c8f-108c-47f1-8d71-423305e3b3a4', '09513886363', '["7887766008", "9175442260"]', '2025-10-30 13:41:24.37435+00', '2025-11-06 08:06:03.137023+00', NULL, NULL, 'api.exotel.com', NULL, FALSE);

-- Re-enable email validation triggers after data insertion
ALTER TABLE employees ENABLE TRIGGER validate_employee_email_trigger;
ALTER TABLE managers ENABLE TRIGGER validate_manager_email_trigger;

