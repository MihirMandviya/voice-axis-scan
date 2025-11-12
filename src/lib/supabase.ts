import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hueohfwgqzvwwimqakxn.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1ZW9oZndncXp2d3dpbXFha3huIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MzQ5NzgsImV4cCI6MjA3ODUxMDk3OH0.v_1TKhYFXDsWlw-Z3MeiFDco3zLQETIpAQhpqyTv1Ic'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Recording {
  id: string
  user_id: string
  drive_file_id?: string
  file_name?: string
  file_size?: number
  stored_file_url?: string
  status?: 'processing' | 'transcribing' | 'analyzing' | 'completed' | 'failed' | 'queued' | 'pending' | 'uploaded'
  duration_seconds?: number
  transcript?: string
  created_at: string
  updated_at: string
}

export interface Analysis {
  id: string
  recording_id?: string
  user_id: string
  sentiment_score?: number
  engagement_score?: number
  confidence_score_executive?: number
  confidence_score_person?: number
  objections_handled?: string
  next_steps?: string
  improvements?: string
  call_outcome?: string
  detailed_call_analysis?: any
  short_summary?: string
  participants?: any // JSON object containing participant information
  objections_raised?: number // Number of objections raised during the call
  objections_tackled?: number // Number of objections successfully tackled/handled
  created_at: string
}

export interface MetricsAggregate {
  id: string
  user_id: string
  date: string
  total_calls?: number
  avg_sentiment?: number
  avg_engagement?: number
  conversion_rate?: number
  objections_rate?: number
}

export interface UserProfile {
  id: string
  user_id: string
  email: string
  full_name?: string
  avatar_url?: string
  company_name?: string
  company_email?: string
  company_industry?: string
  position?: string
  use_cases?: string[]
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export interface LeadGroup {
  id: string
  user_id: string
  group_name: string
  created_at: string
  updated_at: string
}

export interface Lead {
  id: string
  user_id: string
  name: string
  email: string
  contact: string
  description?: string
  other?: any // JSON object for additional fields
  group_id?: string
  created_at: string
  updated_at: string
  lead_groups?: LeadGroup // Joined data
}