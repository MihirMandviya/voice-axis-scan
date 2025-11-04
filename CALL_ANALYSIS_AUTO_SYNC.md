# Call History Auto-Sync with Recordings & Analyses

## Overview
This document describes the automatic synchronization system between `call_history`, `recordings`, and `analyses` tables.

## Problem Solved
Previously, when a call was logged in `call_history`, the corresponding `recordings` and `analyses` records had to be manually created. This led to:
- Inconsistent data
- Missing analysis opportunities
- Manual button clicks required to initiate analysis

## Solution Implemented

### 1. Database Schema Fix
**Migration:** `fix_analyses_call_id_foreign_key`

- Removed the old foreign key constraint linking `analyses.call_id` to `call_outcomes.id`
- Added new foreign key constraint linking `analyses.call_id` to `call_history.id` with CASCADE delete
- Added performance indexes:
  - `idx_analyses_call_id` on `analyses(call_id)`
  - `idx_call_history_outcome` on `call_history(outcome)`
  - `idx_call_history_employee_id` on `call_history(employee_id)`

### 2. Automatic Record Creation Trigger
**Migration:** `auto_create_recordings_and_analyses_for_call_history`

Created a PostgreSQL trigger that automatically:
- Fires AFTER each INSERT into `call_history`
- Checks if the call outcome is NOT 'failed' or 'not_answered'
- Checks if `exotel_recording_url` is present
- Creates a `recordings` record with:
  - Linked to the employee (`user_id`)
  - Linked to the company
  - Contains the recording URL
  - Auto-generated file name: `call_{call_id}_{date}`
  - Status set to 'pending'
- Creates an `analyses` record with:
  - Linked to the recording
  - Linked to the call
  - Linked to the employee and company
  - Status set to 'pending'
  - All analysis fields initialized to NULL

**Trigger Logic:**
```sql
-- Only creates records if:
1. outcome NOT IN ('failed', 'not_answered')
2. exotel_recording_url IS NOT NULL
```

### 3. Existing Data Sync
Created records for the existing completed call:
- **Call ID:** `4c3ec8b2-e550-4adc-a462-86e5079277aa`
- **Recording ID:** `23326422-56e7-401e-8d25-3f35b6e5c445`
- **Analysis ID:** `c22f1d93-ace9-46b2-ade1-dd15cb540053`
- **Status:** Both set to 'pending', ready for analysis

### 4. Frontend Smart Logic
Updated `CallHistoryManager.tsx` and `EmployeeDashboard.tsx` with intelligent handling:

**Before (Old Behavior):**
- Always created NEW recording and analysis records when "Get Analysis" clicked
- Led to duplicate records
- Inaccurate IDs sent to webhook

**After (New Behavior):**
1. **Check for existing records** (auto-created by trigger)
2. **Use existing IDs** if found
3. **Update status to 'processing'** if needed
4. **Create records only if missing** (backward compatibility)
5. **Send accurate IDs** to webhook:
   ```javascript
   {
     recording_id: recording.id,  // Actual DB ID
     analysis_id: analysis.id,    // Actual DB ID
     call_id: call.id,
     url: recordingUrl,
     // ... other fields
   }
   ```

### 5. UI/UX Improvements
- **Instant Feedback:** "Analyzing..." appears immediately when "Get Analysis" clicked
- **Processing State:** Spinning loader with blue badge
- **Auto-refresh:** Checks status every 5 seconds during processing
- **Smart Button State:** 
  - Shows "Get Analysis" only if no analysis exists
  - Hides button during processing
  - Shows "View Analysis" when completed

## Data Flow

### New Call Created
```
1. Call logged in call_history
   ↓
2. Trigger fires (if outcome != failed/not_answered && has recording_url)
   ↓
3. Recording record created automatically
   ↓
4. Analysis record created automatically (linked to recording & call)
   ↓
5. UI displays "Get Analysis" button
   ↓
6. User clicks "Get Analysis"
   ↓
7. Frontend finds existing records
   ↓
8. Status updated to 'processing'
   ↓
9. Webhook called with accurate IDs
   ↓
10. Analysis completes → Status 'completed'
   ↓
11. UI shows "View Analysis" button
```

### Existing Call (Before Fix)
```
1. Call exists in call_history (no recording/analysis)
   ↓
2. User clicks "Get Analysis"
   ↓
3. Frontend checks for existing records (none found)
   ↓
4. Creates recording & analysis records
   ↓
5. Webhook called with accurate IDs
   ↓
6. Analysis proceeds normally
```

## Testing

### Verify Existing Data
```sql
SELECT 
  ch.id as call_id,
  ch.outcome,
  r.id as recording_id,
  r.status as recording_status,
  a.id as analysis_id,
  a.status as analysis_status
FROM call_history ch
LEFT JOIN analyses a ON a.call_id = ch.id
LEFT JOIN recordings r ON r.id = a.recording_id
WHERE ch.outcome NOT IN ('failed', 'not_answered');
```

### Verify Trigger Active
```sql
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE event_object_table = 'call_history'
  AND trigger_name = 'trigger_create_recording_and_analysis';
```

## Benefits

1. **Automatic Sync:** No manual record creation needed
2. **Data Consistency:** All answered calls have corresponding records
3. **Accurate IDs:** Webhook receives correct database IDs
4. **No Duplicates:** Prevents creating multiple records for same call
5. **Better UX:** Clear visual feedback during analysis processing
6. **Backward Compatible:** Handles old calls without auto-created records

## Implementation Date
November 4, 2025

## Files Modified
- `src/components/CallHistoryManager.tsx`
- `src/components/dashboards/EmployeeDashboard.tsx`

## Database Migrations
1. `fix_analyses_call_id_foreign_key`
2. `auto_create_recordings_and_analyses_for_call_history`


