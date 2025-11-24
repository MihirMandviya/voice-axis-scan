# Employee Dashboard Follow-up & Completed Leads Fix

## Issue Summary
The Employee Dashboard was showing **Follow-up (0)** and **Completed (0)** despite having leads with those statuses because:

1. The `leads` table's `status` field was not being set when leads were created
2. Existing leads in the database had `NULL` status values
3. The Employee Dashboard filters leads by status to categorize them

## Root Cause Analysis

### Database Schema
The `leads` table has (or should have) a `status` column with these possible values:
- `'contacted'` - Initial contact made
- `'follow_up'` - Needs follow-up
- `'converted'` - Successfully converted
- `'completed'` - Completed/closed
- `'not_interested'` - Lead not interested
- `'removed'` - Soft deleted

### Code Issues Found

#### 1. **useCreateLead Hook** (`src/hooks/useSupabaseData.ts`)
**Problem:** When creating individual leads, no `status` field was set.
```typescript
// BEFORE (Lines ~396)
.insert([{ ...leadData, user_id: user.id }])

// AFTER (Fixed)
.insert([{ ...leadData, user_id: user.id, status: 'contacted' }])
```

#### 2. **useBulkCreateLeads Hook** (`src/hooks/useSupabaseData.ts`)
**Problem:** When uploading CSV leads, no `status` field was set.
```typescript
// BEFORE (Lines ~481)
const leadsWithUserId = leadsData.map(lead => ({ ...lead, user_id: user.id }))

// AFTER (Fixed)
const leadsWithUserId = leadsData.map(lead => ({ ...lead, user_id: user.id, status: 'contacted' }))
```

#### 3. **Lead TypeScript Interface** (`src/lib/supabase.ts`)
**Problem:** TypeScript interface didn't include `status` field, causing type confusion.
```typescript
// BEFORE
export interface Lead {
  id: string
  user_id: string
  name: string
  email: string
  contact: string
  // ... other fields
}

// AFTER (Fixed)
export interface Lead {
  id: string
  user_id: string
  name: string
  email: string
  contact: string
  // ... other fields
  status?: 'contacted' | 'follow_up' | 'converted' | 'completed' | 'not_interested' | 'removed'
}
```

### How Status is Supposed to Work

1. **Lead Creation**: When a lead is created (via AddLeadModal or CSV upload), status defaults to `'contacted'`

2. **Call Recording**: When an employee records a call outcome in `handleSubmitCall`:
   ```typescript
   // Lines 1145-1152 in EmployeeDashboard.tsx
   let newLeadStatus = 'contacted';
   if (callOutcomeStatus === 'completed') {
     newLeadStatus = 'converted';
   } else if (callOutcomeStatus === 'not_interested') {
     newLeadStatus = 'not_interested';
   } else if (callOutcomeStatus === 'follow_up') {
     newLeadStatus = 'follow_up';
   }
   // Then updates: .update({ status: newLeadStatus })
   ```

3. **Lead Categorization**: Employee Dashboard filters leads by status:
   ```typescript
   // Lines 289-292
   const followUpLeadsArray = activeLeadsArray.filter(lead => 
     lead.status === 'contacted' || lead.status === 'follow_up'
   );
   const completedLeadsArray = activeLeadsArray.filter(lead => 
     lead.status === 'converted' || lead.status === 'completed'
   );
   ```

## Fixes Applied

### Code Changes

1. ✅ Updated `useCreateLead` to set `status: 'contacted'` by default
2. ✅ Updated `useBulkCreateLeads` to set `status: 'contacted'` by default
3. ✅ Added `status` field to TypeScript `Lead` interface
4. ✅ Added debug logging to Employee Dashboard to show status distribution

### Database Migration Required

**File:** `migration_fix_lead_status.sql`

This SQL script will:
1. Add the `status` column if it doesn't exist
2. Update existing leads with NULL status based on their call outcomes:
   - If they have a 'completed' outcome → status = 'converted'
   - If they have a 'follow_up' outcome → status = 'follow_up'
   - If they have a 'not_interested' outcome → status = 'not_interested'
   - If they have any call outcome → status = 'contacted'
   - Otherwise → status = 'contacted'

**How to Run:**
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Create a new query
4. Copy and paste the contents of `migration_fix_lead_status.sql`
5. Click "Run"
6. Verify the results show proper status distribution

## Testing Steps

1. **Run the Migration:**
   - Execute `migration_fix_lead_status.sql` in Supabase SQL Editor
   - Verify output shows leads distributed across statuses

2. **Test Employee Dashboard:**
   - Log in as an employee
   - Open browser console (F12)
   - Navigate to Employee Dashboard
   - Check console logs for "Lead status distribution"
   - Verify follow-up and completed counts are now > 0

3. **Test New Lead Creation:**
   - Create a new lead via AddLeadModal
   - Check database - should have `status = 'contacted'`
   - Record a call outcome with "follow_up"
   - Check database - status should update to `'follow_up'`
   - Verify lead appears in Follow-up section

4. **Test CSV Upload:**
   - Upload a CSV with test leads
   - Check database - all should have `status = 'contacted'`

## Console Debugging

The Employee Dashboard now logs detailed status information:

```javascript
// Check browser console when loading Employee Dashboard
console.log('EmployeeDashboard - Fetched leads:', leadsDataArray.length, leadsDataArray);
console.log('EmployeeDashboard - Lead status distribution:', statusCounts);
console.log('EmployeeDashboard - Categorized leads:', {
  all: allLeadsArray.length,
  followUp: followUpLeadsArray.length,
  completed: completedLeadsArray.length
});
```

If you still see 0 counts, check the console to see:
- How many leads were fetched
- What status values they have (should not be 'null')
- How many were categorized into each section

## Additional Notes

### PhoneDialer Already Correct
The `PhoneDialer.tsx` component was already setting `status: 'contacted'` when creating leads (line 314), so leads created through phone calls were working correctly.

### Manager Dashboard Not Affected
The Manager Dashboard doesn't filter by lead status in the same way, so this issue only affected the Employee Dashboard.

### Future Improvements
Consider:
1. Making `status` a required field (NOT NULL) in database schema
2. Adding a database-level default value
3. Creating indexes on `status` field for better query performance
4. Adding status validation at database level (CHECK constraint)

## Files Modified

1. `src/hooks/useSupabaseData.ts` - Added `status: 'contacted'` to lead creation hooks
2. `src/lib/supabase.ts` - Added `status` field to Lead interface
3. `src/components/dashboards/EmployeeDashboard.tsx` - Added debug logging
4. `migration_fix_lead_status.sql` - NEW: Database migration script

## Summary

The issue was that the `status` field wasn't being set when leads were created, causing them to have `NULL` values. The Employee Dashboard filters leads by status, so leads with NULL status didn't appear in any category.

**Solution:** 
1. Update code to set `status = 'contacted'` by default for new leads
2. Run migration script to fix existing leads in database

After applying these fixes and running the migration, the Follow-up and Completed sections should show the correct counts based on actual lead statuses.
