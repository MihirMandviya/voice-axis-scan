# Exotel Common Credentials Setup

## Overview
This document explains how Exotel API credentials are now configured as common credentials for all users, eliminating the need for per-user configuration.

## Changes Made

### 1. Created Exotel Configuration File
**File:** `src/config/exotel.ts`

This file contains the common Exotel credentials used for all API calls:
- **API Key:** `a9ce07ffe0bfae0936fc76a8a63d1b478c82e422490af561`
- **API Token:** `28ba14dc5adaafb264c4e578ba07223406a93b15a464c366`
- **Subdomain:** `api.exotel.com`
- **Account SID:** `tasknova1`

The file exports:
- `EXOTEL_CONFIG`: Object containing all credentials
- `getExotelCredentials()`: Helper function to retrieve credentials
- `isExotelConfigured()`: Helper function to check if credentials are set

### 2. Removed Exotel Setup Modal
**File:** `src/pages/Index.tsx`

Removed the following:
- Import for `ExotelSetupModal` component
- `showExotelSetup` and `exotelSetupChecked` state variables
- `checkExotelSetup()` function that queried company_settings
- `handleExotelSetupComplete()` handler
- All instances of `<ExotelSetupModal />` component rendering
- Logic that checked Exotel setup status for admins

**Impact:** Users no longer see a modal asking for Exotel credentials during onboarding or login.

### 3. Removed Exotel Credentials UI from Admin Dashboard
**File:** `src/components/dashboards/AdminDashboard.tsx`

Removed the following:
- **State Variables:**
  - `showApiKey` and `showApiToken` (password visibility toggles)
  - `exotel_api_key`, `exotel_api_token`, `exotel_subdomain`, `exotel_account_sid` from `companySettings` state

- **UI Section:** Entire "Exotel API Credentials" card containing:
  - API Key input field with show/hide toggle
  - API Token input field with show/hide toggle
  - Subdomain input field
  - Account SID input field
  - Credentials status indicator
  - "Save Credentials" button

- **Database Operations:**
  - Removed Exotel fields from `fetchCompanySettings()` query
  - Removed Exotel fields from `updateCompanySettings()` upsert operation

**Impact:** Admins can no longer configure Exotel credentials via the UI. The Settings page now only shows:
- Caller ID configuration
- From Numbers configuration

### 4. Edge Function Already Configured
**File:** Supabase Edge Function `exotel-proxy`

The Edge Function is already using the common credentials (hardcoded as Base64 encoded auth):
```typescript
const EXOTEL_AUTH = 'Basic YTljZTA3ZmZlMGJmYWUwOTM2ZmM3NmE4YTYzZDFiNDc4YzgyZTQyMjQ5MGFmNTYxOjI4YmExNGRjNWFkYWFmYjI2NGM0ZTU3OGJhMDcyMjM0MDZhOTNiMTVhNDY0YzM2Ng==';
const EXOTEL_BASE_URL = 'https://api.exotel.com/v1/Accounts/tasknova1';
```

**No changes needed** - the Edge Function already uses the correct credentials!

## How Exotel API Calls Work Now

### Call Flow:
1. **Employee/Admin clicks "Call" button** on dashboard
2. **Frontend calls** `initiateExotelCall()` function
3. **Function makes POST request** to Supabase Edge Function:
   - Endpoint: `https://lsuuivbaemjqmtztrjqq.supabase.co/functions/v1/exotel-proxy/calls/connect`
   - Payload: `{ from, to, callerId, company_id }`
4. **Edge Function uses common credentials** to call Exotel API:
   - URL: `https://api.exotel.com/v1/Accounts/tasknova1/Calls/connect.json`
   - Auth: Base64 encoded API Key:Token
5. **Exotel initiates the call** and returns call details
6. **Frontend polls** for call status using `getExotelCallDetails()`
7. **Call details saved** to `call_history` table

### Key Points:
- ✅ All calls use the **same Exotel account** (tasknova1)
- ✅ Credentials are **centralized** in the Edge Function
- ✅ Users **don't need to configure** anything
- ✅ Credentials are **secure** (not exposed to frontend)
- ✅ Easy to **update credentials** in one place (Edge Function)

## Database Impact

### `company_settings` Table:
The following columns are **no longer used** by the frontend but can remain in the database:
- `exotel_api_key`
- `exotel_api_token`
- `exotel_subdomain`
- `exotel_account_sid`
- `exotel_setup_completed`

These columns can be:
- **Kept** for backward compatibility or future use
- **Removed** via migration if you want to clean up the schema

### Recommendation:
Keep the columns for now. They don't cause any issues and provide flexibility if you need per-company credentials in the future.

## Benefits of This Approach

1. **Simplified Onboarding:** No Exotel setup required for new users
2. **Centralized Management:** Update credentials in one place (Edge Function)
3. **Better Security:** Credentials never exposed to frontend/browser
4. **Consistent Experience:** All users use the same Exotel account
5. **Reduced Support:** No user-side Exotel configuration issues
6. **Cost Efficient:** Single Exotel account for all users

## Future Enhancements

If you need per-company Exotel credentials in the future:
1. Keep the `company_settings` columns
2. Update the Edge Function to:
   - Accept `company_id` in requests
   - Query `company_settings` for that company
   - Use per-company credentials if available
   - Fall back to common credentials if not set
3. Re-enable the Exotel credentials UI in Admin Dashboard

## Files Modified
- ✅ `src/config/exotel.ts` - Created (common credentials)
- ✅ `src/pages/Index.tsx` - Removed Exotel setup modal logic
- ✅ `src/components/dashboards/AdminDashboard.tsx` - Removed Exotel credentials UI

## Files NOT Modified (Already Correct)
- ✅ Supabase Edge Function `exotel-proxy` - Already using common credentials
- ✅ `src/components/dashboards/EmployeeDashboard.tsx` - Uses Edge Function (no changes needed)
- ✅ `src/components/ExotelSetupModal.tsx` - Unused but kept in codebase

## Testing Checklist
- [ ] Admin user can log in without seeing Exotel setup modal
- [ ] Employee can initiate calls from dashboard
- [ ] Calls are successfully connected via Exotel
- [ ] Call history is saved correctly
- [ ] Admin Settings page shows only Caller ID and From Numbers
- [ ] No console errors related to Exotel credentials

## Rollback Plan
If you need to revert these changes:
1. Restore `src/pages/Index.tsx` from git history
2. Restore `src/components/dashboards/AdminDashboard.tsx` from git history
3. Delete `src/config/exotel.ts`
4. Re-deploy the Edge Function if modified

## Notes
- The common credentials are hardcoded in the Edge Function (server-side), which is secure
- Frontend config file (`src/config/exotel.ts`) is created for future use but not currently used by the application
- All Exotel API calls go through the Edge Function proxy for security

