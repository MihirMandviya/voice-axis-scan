# Database Schema - Voice Axis Scan

## Overview
This document describes the complete database schema for the Voice Axis Scan application, including all tables, columns, data types, constraints, and relationships.

---

## Tables

### 1. **companies**
Root organization entity that owns all other entities.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| name | varchar | NO | - | Company name |
| email | varchar | NO | - | Company email |
| industry | varchar | YES | - | Industry type |
| phone | varchar | YES | - | Contact phone |
| address | text | YES | - | Physical address |
| website | varchar | YES | - | Company website |
| created_at | timestamptz | YES | now() | Creation timestamp |
| updated_at | timestamptz | YES | now() | Last update timestamp |

**Primary Key:** `id`

---

### 2. **user_roles**
Maps users to their roles within companies.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| user_id | uuid | YES | - | Reference to auth.users |
| company_id | uuid | YES | - | Foreign key to companies |
| role | varchar | NO | - | Role: 'admin', 'manager', 'employee' |
| manager_id | uuid | YES | - | Reference to managing manager (for employees) |
| is_active | boolean | YES | true | Active status |
| created_at | timestamptz | YES | now() | Creation timestamp |
| updated_at | timestamptz | YES | now() | Last update timestamp |

**Primary Key:** `id`  
**Foreign Keys:**
- `company_id` → `companies(id)`

**Unique Constraints:**
- `(user_id, company_id)` - One role per user per company

---

### 3. **managers**
Manager-specific profile information.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| user_id | uuid | NO | - | Unique user identifier |
| company_id | uuid | NO | - | Foreign key to companies |
| full_name | varchar | NO | - | Manager's full name |
| email | varchar | NO | - | Manager's email |
| department | varchar | NO | - | Department name |
| password | varchar | NO | - | Login password |
| phone | varchar | YES | - | Phone number |
| contact_number | varchar | YES | - | Alternative contact |
| is_active | boolean | YES | true | Active status |
| created_at | timestamptz | YES | now() | Creation timestamp |
| updated_at | timestamptz | YES | now() | Last update timestamp |

**Primary Key:** `id`  
**Foreign Keys:**
- `company_id` → `companies(id)`

**Unique Constraints:**
- `user_id` - One manager profile per user
- `(email, company_id)` - Unique email per company

---

### 4. **employees**
Employee-specific profile information.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| user_id | uuid | NO | - | Unique user identifier |
| company_id | uuid | NO | - | Foreign key to companies |
| manager_id | uuid | NO | - | Foreign key to managers |
| full_name | varchar | NO | - | Employee's full name |
| email | varchar | NO | - | Employee's email |
| password | varchar | NO | - | Login password |
| phone | varchar | YES | - | Phone number |
| contact_number | varchar | YES | - | Alternative contact |
| is_active | boolean | YES | true | Active status |
| created_at | timestamptz | YES | now() | Creation timestamp |
| updated_at | timestamptz | YES | now() | Last update timestamp |

**Primary Key:** `id`  
**Foreign Keys:**
- `company_id` → `companies(id)`
- `manager_id` → `managers(id)`

**Unique Constraints:**
- `user_id` - One employee profile per user
- `(email, company_id)` - Unique email per company

---

### 5. **clients**
External client organizations that jobs are created for.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| company_id | uuid | YES | - | Foreign key to companies |
| name | varchar | NO | - | Client name |
| industry | varchar | YES | - | Client industry |
| contact_person | varchar | YES | - | Primary contact name |
| email | varchar | YES | - | Client email |
| phone | varchar | YES | - | Client phone |
| address | text | YES | - | Client address |
| website | varchar | YES | - | Client website |
| is_active | boolean | YES | true | Active status |
| created_at | timestamptz | YES | now() | Creation timestamp |
| updated_at | timestamptz | YES | now() | Last update timestamp |

**Primary Key:** `id`  
**Foreign Keys:**
- `company_id` → `companies(id)`

---

### 6. **jobs**
Job positions/openings for clients.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| company_id | uuid | YES | - | Foreign key to companies |
| client_id | uuid | YES | - | Foreign key to clients |
| title | varchar | NO | - | Job title |
| description | text | YES | - | Job description |
| location | varchar | YES | - | Job location |
| employment_type | varchar | YES | - | 'full-time', 'part-time', 'contract', etc. |
| experience_level | varchar | YES | - | 'entry', 'mid', 'senior', 'executive' |
| salary_range | varchar | YES | - | Salary range |
| requirements | text | YES | - | Job requirements |
| responsibilities | text | YES | - | Job responsibilities |
| benefits | text | YES | - | Job benefits |
| status | varchar | YES | 'open' | 'open', 'closed', 'on-hold', 'filled' |
| positions_available | integer | YES | 1 | Number of openings |
| posted_by | uuid | YES | - | User who posted |
| is_active | boolean | YES | true | Active status |
| created_at | timestamptz | YES | now() | Creation timestamp |
| updated_at | timestamptz | YES | now() | Last update timestamp |

**Primary Key:** `id`  
**Foreign Keys:**
- `company_id` → `companies(id)`
- `client_id` → `clients(id)`

---

### 7. **leads**
Candidate/lead information.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| user_id | uuid | YES | - | Manager who created lead |
| company_id | uuid | YES | - | Foreign key to companies |
| name | varchar | NO | - | Lead's name |
| email | varchar | NO | - | Lead's email |
| contact | varchar | NO | - | Lead's contact number |
| description | text | YES | - | Lead description |
| other | jsonb | YES | - | Additional custom fields |
| group_id | uuid | YES | - | Foreign key to lead_groups |
| client_id | uuid | YES | - | Foreign key to clients |
| job_id | uuid | YES | - | Foreign key to jobs |
| assigned_to | uuid | YES | - | Employee assigned to this lead |
| status | varchar | YES | 'unassigned' | 'contacted', 'follow_up', 'converted', etc. |
| created_at | timestamptz | YES | now() | Creation timestamp |
| updated_at | timestamptz | YES | now() | Last update timestamp |

**Primary Key:** `id`  
**Foreign Keys:**
- `company_id` → `companies(id)`
- `group_id` → `lead_groups(id)`
- `client_id` → `clients(id)`
- `job_id` → `jobs(id)`

---

### 8. **lead_groups**
Grouping/categorization of leads.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| user_id | uuid | NO | - | User who created group |
| company_id | uuid | YES | - | Foreign key to companies |
| group_name | varchar | NO | - | Name of the group |
| assigned_to | uuid | YES | - | Manager assigned to group |
| created_at | timestamptz | YES | now() | Creation timestamp |
| updated_at | timestamptz | YES | now() | Last update timestamp |

**Primary Key:** `id`  
**Foreign Keys:**
- `company_id` → `companies(id)`
- `assigned_to` → `managers(id)`

---

### 9. **call_history**
Complete history of all calls made.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| lead_id | uuid | YES | - | Foreign key to leads |
| employee_id | uuid | YES | - | Foreign key to employees.user_id |
| company_id | uuid | YES | - | Foreign key to companies |
| call_date | timestamptz | YES | now() | When call was made |
| outcome | text | YES | 'follow_up' | 'converted', 'follow_up', 'not_answered' |
| notes | text | YES | - | Call notes |
| next_follow_up | date | YES | - | Next follow-up date |
| next_follow_up_time | time | YES | - | Next follow-up time |
| auto_call_followup | boolean | YES | false | Auto-schedule follow-up |
| call_details | jsonb | YES | - | Additional call metadata |
| exotel_response | jsonb | NO | - | Raw Exotel API response |
| exotel_call_sid | varchar | YES | - | Exotel call SID |
| exotel_from_number | varchar | YES | - | Caller number |
| exotel_to_number | varchar | YES | - | Recipient number |
| exotel_caller_id | varchar | YES | - | Caller ID used |
| exotel_status | varchar | YES | - | Call status |
| exotel_duration | integer | YES | - | Call duration (seconds) |
| exotel_recording_url | text | YES | - | Recording URL |
| exotel_start_time | timestamptz | YES | - | Call start time |
| exotel_end_time | timestamptz | YES | - | Call end time |
| exotel_answered_by | varchar | YES | - | Who answered |
| exotel_direction | varchar | YES | - | Call direction |
| created_at | timestamptz | YES | now() | Creation timestamp |
| updated_at | timestamptz | YES | now() | Last update timestamp |

**Primary Key:** `id`  
**Foreign Keys:**
- `lead_id` → `leads(id)`
- `employee_id` → `employees(user_id)`
- `company_id` → `companies(id)`

---

### 10. **recordings**
Call recording files and metadata.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| user_id | uuid | NO | - | Foreign key to employees.user_id |
| company_id | uuid | YES | - | Foreign key to companies |
| lead_id | uuid | YES | - | Foreign key to leads |
| call_history_id | uuid | YES | - | Foreign key to call_history |
| assigned_to | uuid | YES | - | Foreign key to employees.user_id |
| drive_file_id | text | YES | - | Google Drive file ID |
| file_name | text | YES | - | Recording filename |
| file_size | bigint | YES | - | File size in bytes |
| stored_file_url | text | YES | - | Storage URL |
| status | text | YES | - | 'processing', 'completed', 'failed', etc. |
| duration_seconds | integer | YES | - | Recording duration |
| transcript | text | YES | - | Call transcript |
| created_at | timestamp | NO | now() | Creation timestamp |
| updated_at | timestamp | NO | now() | Last update timestamp |

**Primary Key:** `id`  
**Foreign Keys:**
- `user_id` → `employees(user_id)`
- `company_id` → `companies(id)`
- `lead_id` → `leads(id)`
- `call_history_id` → `call_history(id)`
- `assigned_to` → `employees(user_id)`

---

### 11. **analyses**
AI-powered call analysis results.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| recording_id | uuid | YES | - | Foreign key to recordings |
| user_id | uuid | NO | - | User who owns analysis |
| participants_count | integer | YES | - | Number of participants |
| participants_names | text | YES | - | Comma-separated names |
| closure_probability | numeric | YES | - | Probability of closure (0-100) |
| closure_probability_reasoning | text | YES | - | Reasoning for probability |
| recruiter_process_score | numeric | YES | - | Recruiter performance score |
| candidate_acceptance_risk | text | YES | - | Risk level assessment |
| candidate_acceptance_risk_reasoning | text | YES | - | Risk reasoning |
| recruiter_confidence_score | numeric | YES | - | Confidence score |
| purpose_of_call | text | YES | - | Call purpose |
| exec_summary | text | YES | - | Executive summary |
| next_steps | text | YES | - | Recommended next steps |
| ai_feedback_for_recruiter | text | YES | - | AI feedback |
| outcome | text | YES | - | Call outcome |
| objections_detected | text | YES | - | Detected objections |
| objections_handeled | text | YES | - | How objections were handled (typo in DB) |
| objections_raised | text | YES | - | Objections raised |
| objections_handled | text | YES | - | Objections handled (correct spelling) |
| additional_details | jsonb | YES | - | Additional structured data |
| follow_up_details | text | YES | - | Follow-up information |
| created_at | timestamp | NO | now() | Creation timestamp |

**Primary Key:** `id`  
**Foreign Keys:**
- `recording_id` → `recordings(id)`

---

### 12. **employee_daily_productivity**
Daily productivity metrics per employee.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| employee_id | uuid | NO | - | Foreign key to employees |
| company_id | uuid | NO | - | Foreign key to companies |
| manager_id | uuid | YES | - | Foreign key to managers |
| date | date | NO | - | Date of metrics |
| profiles_downloaded | integer | YES | 0 | Number of profiles downloaded |
| calls_made | integer | YES | 0 | Number of calls made |
| calls_converted | integer | YES | 0 | Number of conversions |
| calls_follow_up | integer | YES | 0 | Number of follow-ups |
| productivity_score | numeric | YES | 0.00 | Calculated productivity score |
| login_time | time | YES | - | Login time |
| logout_time | time | YES | - | Logout time |
| work_hours | numeric | YES | - | Total work hours |
| created_at | timestamptz | YES | now() | Creation timestamp |
| updated_at | timestamptz | YES | now() | Last update timestamp |

**Primary Key:** `id`  
**Foreign Keys:**
- `employee_id` → `employees(id)`
- `company_id` → `companies(id)`
- `manager_id` → `managers(id)`

**Unique Constraints:**
- `(employee_id, date)` - One record per employee per day

---

### 13. **manager_client_assignments**
Maps managers to clients they're responsible for.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| manager_id | uuid | YES | - | Foreign key to managers |
| client_id | uuid | YES | - | Foreign key to clients |
| assigned_by | uuid | YES | - | Who made the assignment |
| assigned_at | timestamptz | YES | now() | Assignment timestamp |
| is_active | boolean | YES | true | Active status |
| created_at | timestamptz | YES | now() | Creation timestamp |

**Primary Key:** `id`  
**Foreign Keys:**
- `manager_id` → `managers(id)`
- `client_id` → `clients(id)`

**Unique Constraints:**
- `(manager_id, client_id)` - One assignment per manager-client pair

---

### 14. **lead_assignments**
Tracks lead assignment history.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| lead_id | uuid | YES | - | Foreign key to leads |
| assigned_to | uuid | YES | - | Employee assigned |
| assigned_by | uuid | YES | - | Who made assignment |
| assigned_at | timestamptz | YES | now() | Assignment timestamp |
| status | varchar | YES | 'assigned' | Assignment status |

**Primary Key:** `id`  
**Foreign Keys:**
- `lead_id` → `leads(id)`

---

### 15. **call_outcomes**
Alternative call outcome tracking (legacy/duplicate of call_history).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| lead_id | uuid | YES | - | Foreign key to leads |
| employee_id | uuid | YES | - | Foreign key to employees |
| company_id | uuid | YES | - | Foreign key to companies |
| call_date | timestamptz | YES | now() | Call date |
| outcome | varchar | NO | - | Call outcome |
| notes | text | YES | - | Call notes |
| next_follow_up | date | YES | - | Next follow-up date |
| call_in_progress | boolean | YES | false | Is call ongoing |
| exotel_call_sid | varchar | YES | - | Exotel call SID |
| exotel_from_number | varchar | YES | - | From number |
| exotel_to_number | varchar | YES | - | To number |
| exotel_caller_id | varchar | YES | - | Caller ID |
| exotel_status | varchar | YES | - | Call status |
| exotel_duration | integer | YES | - | Duration |
| exotel_recording_url | text | YES | - | Recording URL |
| exotel_start_time | timestamptz | YES | - | Start time |
| exotel_end_time | timestamptz | YES | - | End time |
| created_at | timestamptz | YES | now() | Creation timestamp |

**Primary Key:** `id`  
**Foreign Keys:**
- `lead_id` → `leads(id)`
- `employee_id` → `employees(id)`

---

### 16. **removed_leads**
Archive of removed/deleted leads.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| lead_id | uuid | YES | - | Original lead ID |
| employee_id | uuid | YES | - | Foreign key to employees |
| company_id | uuid | YES | - | Foreign key to companies |
| lead_name | varchar | NO | - | Lead name |
| lead_email | varchar | YES | - | Lead email |
| lead_contact | varchar | YES | - | Lead contact |
| lead_company | varchar | YES | - | Lead company |
| removal_reason | text | NO | - | Why lead was removed |
| removal_date | timestamptz | YES | now() | When removed |
| created_at | timestamptz | YES | now() | Creation timestamp |

**Primary Key:** `id`  
**Foreign Keys:**
- `lead_id` → `leads(id)`
- `employee_id` → `employees(id)`
- `company_id` → `companies(id)`

---

### 17. **company_settings**
Company-specific configuration.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| company_id | uuid | YES | - | Foreign key to companies |
| caller_id | varchar | YES | '09513886363' | Default caller ID |
| from_numbers | jsonb | YES | [] | Available phone numbers |
| exotel_api_key | varchar | YES | - | Exotel API key |
| exotel_api_token | varchar | YES | - | Exotel API token |
| exotel_subdomain | varchar | YES | 'api.exotel.com' | Exotel subdomain |
| exotel_account_sid | varchar | YES | - | Exotel account SID |
| exotel_setup_completed | boolean | YES | false | Setup completion flag |
| created_at | timestamptz | YES | now() | Creation timestamp |
| updated_at | timestamptz | YES | now() | Last update timestamp |

**Primary Key:** `id`  
**Foreign Keys:**
- `company_id` → `companies(id)`

**Unique Constraints:**
- `company_id` - One settings record per company

---

### 18. **user_profiles**
User profile information (for Google Auth users).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| user_id | uuid | NO | - | Reference to auth.users |
| email | text | NO | - | User email |
| full_name | text | YES | - | Full name |
| avatar_url | text | YES | - | Avatar image URL |
| company_name | text | YES | - | Company name |
| company_email | text | YES | - | Company email |
| company_industry | text | YES | - | Company industry |
| position | text | YES | - | Job position |
| use_cases | ARRAY | YES | - | Use cases array |
| onboarding_completed | boolean | YES | false | Onboarding status |
| created_at | timestamptz | YES | now() | Creation timestamp |
| updated_at | timestamptz | YES | now() | Last update timestamp |

**Primary Key:** `id`  
**Unique Constraints:**
- `user_id` - One profile per user

---

### 19. **metrics_aggregates**
Aggregated metrics for analytics.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | uuid_generate_v4() | Primary key |
| user_id | uuid | NO | - | User reference |
| company_id | uuid | YES | - | Foreign key to companies |
| date | date | NO | - | Metric date |
| total_calls | integer | YES | - | Total calls |
| avg_sentiment | numeric | YES | - | Average sentiment |
| avg_engagement | numeric | YES | - | Average engagement |
| conversion_rate | numeric | YES | - | Conversion rate |
| objections_rate | numeric | YES | - | Objections rate |

**Primary Key:** `id`  
**Foreign Keys:**
- `company_id` → `companies(id)`

---

## Entity Relationship Summary

### Core Hierarchy
```
companies
  ├── user_roles
  ├── managers
  │   └── employees
  │       └── employee_daily_productivity
  ├── clients
  │   ├── jobs
  │   └── manager_client_assignments
  └── company_settings
```

### Lead Management Flow
```
leads
  ├── lead_groups
  ├── clients (optional)
  ├── jobs (optional)
  └── assigned to employees
      └── call_history
          └── recordings
              └── analyses
```

### Key Relationships

1. **Company → Managers → Employees**
   - Companies have multiple managers
   - Managers supervise multiple employees
   - Employees belong to one manager and one company

2. **Lead Assignment Chain**
   - Leads created by managers
   - Leads assigned to employees
   - Employees make calls tracked in call_history
   - Calls generate recordings
   - Recordings analyzed in analyses table

3. **Client Management**
   - Clients belong to companies
   - Managers assigned to clients via manager_client_assignments
   - Jobs created for clients
   - Leads linked to clients and jobs

4. **Productivity Tracking**
   - employee_daily_productivity tracks daily metrics
   - One unique record per employee per day
   - Includes calls made, converted, follow-ups, work hours

---

## Important Notes

1. **Authentication**: User authentication handled by Supabase Auth (`auth.users` table), linked via `user_id` in various tables

2. **Soft Deletes**: Most tables use `is_active` boolean flag instead of hard deletes

3. **Timestamps**: All tables include `created_at` and `updated_at` for audit trail

4. **JSONB Fields**: Used for flexible/extensible data:
   - `leads.other` - Custom lead fields
   - `analyses.additional_details` - Extra analysis data
   - `call_history.exotel_response` - Raw API response
   - `company_settings.from_numbers` - Phone number array

5. **Exotel Integration**: Multiple Exotel-specific fields in `call_history` and `call_outcomes` for telephony integration

6. **Typos**: `objections_handeled` in analyses table (kept for backward compatibility)

---

Generated: November 24, 2025
