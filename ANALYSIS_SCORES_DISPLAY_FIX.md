# Analysis Scores Display Fix - Overview & Reports

## Issues Fixed

### Problem 1: Manager Dashboard Overview Not Showing Scores
**Root Cause:** Manager Dashboard was using `employee.id` instead of `employee.user_id` when fetching calls from `call_history` table.

### Problem 2: Reports Pages Showing Zero for All Analysis Metrics
**Root Causes:**
1. **Case sensitivity:** Code was checking `status === 'completed'` but database has `status = 'Completed'` (capital C)
2. **Data type mismatch:** Scores are stored as strings ("75", "65") but being used as numbers without conversion

## Database Schema

### Analysis Scores Storage
```sql
-- Scores are stored as numeric/varchar in database
sentiment_score: "75"
engagement_score: "65"
confidence_score_executive: "6"
confidence_score_person: "5"
status: "Completed"  -- Note: Capital C
```

## Fixes Applied

### 1. Manager Dashboard (ManagerDashboard.tsx)

**Issue:** Not fetching calls for manager's employees correctly

**Before:**
```javascript
const employeeIds = employees.map(emp => emp.id);
.in('employee_id', employeeIds)  // WRONG: using table ID
```

**After:**
```javascript
const employeeUserIds = formattedEmployees.map(emp => emp.user_id);
.in('employee_id', employeeUserIds)  // CORRECT: using user_id
```

**Why:** `call_history.employee_id` stores the UUID from `auth.users`, not the sequential `employees.id`

---

### 2. Admin Reports Page (AdminReportsPage.tsx)

**Issue:** Not finding completed analyses + not parsing scores

**Before:**
```javascript
const completedAnalyses = managerAnalyses.filter(a => a.status === 'completed');
avg_sentiment: completedAnalyses.reduce((sum, a) => sum + (a.sentiment_score || 0), 0)
```

**After:**
```javascript
const completedAnalyses = managerAnalyses.filter(a => a.status?.toLowerCase() === 'completed');
avg_sentiment: completedAnalyses.reduce((sum, a) => sum + (parseFloat(a.sentiment_score) || 0), 0)
```

**Fixed in 3 places:**
1. Manager stats calculation (lines 207-222)
2. Employee stats calculation (lines 240-254)
3. Company overview calculation (lines 270-285)

---

### 3. Manager Reports Page (ManagerReportsPage.tsx)

**Issue:** Same as Admin Reports

**Fixed in 2 places:**
1. Employee stats calculation (lines 183-198)
2. Team overview calculation (lines 208-223)

**Changes:**
- Added `.toLowerCase()` to status check
- Added `parseFloat()` to all score calculations

---

### 4. Employee Reports Page (EmployeeReportsPage.tsx)

**Issue:** Case-sensitive status check (already had parseFloat)

**Before:**
```javascript
const completedAnalyses = analysesData.filter(a => a && a.status === 'completed');
```

**After:**
```javascript
const completedAnalyses = analysesData.filter(a => a && a.status?.toLowerCase() === 'completed');
```

## Score Calculation Formula

### Average Sentiment/Engagement
```javascript
const average = completedAnalyses.length > 0 ?
  (completedAnalyses.reduce((sum, a) => 
    sum + (parseFloat(a.sentiment_score) || 0), 0
  ) / completedAnalyses.length).toFixed(1) 
  : 0;
```

### Average Confidence
```javascript
const avgConfidence = completedAnalyses.length > 0 ?
  (completedAnalyses.reduce((sum, a) => 
    sum + ((parseFloat(a.confidence_score_executive) + 
           parseFloat(a.confidence_score_person)) / 2 || 0), 0
  ) / completedAnalyses.length).toFixed(1) 
  : 0;
```

## Test Data Verification

### Actual Database Values
```
Analysis ID: c22f1d93-ace9-46b2-ade1-dd15cb540053
Status: "Completed"
Sentiment Score: "75"
Engagement Score: "65"
Confidence Executive: "6"
Confidence Person: "5"
Employee: Aarav Varma
Manager: Mihir
```

### Expected Display Values
```
Avg Sentiment: 75.0%
Avg Engagement: 65.0%
Avg Confidence: 5.5 (average of 6 and 5)
Total Analyses: 1
```

## Files Modified

1. ✅ `src/components/dashboards/ManagerDashboard.tsx`
   - Fixed employee call fetching logic (line 234)

2. ✅ `src/components/AdminReportsPage.tsx`
   - Fixed manager stats (line 207, 218-222)
   - Fixed employee stats (line 240, 250-254)
   - Fixed company overview (line 270, 283-285)

3. ✅ `src/components/ManagerReportsPage.tsx`
   - Fixed employee stats (line 183, 194-198)
   - Fixed team overview (line 208, 221-223)

4. ✅ `src/components/EmployeeReportsPage.tsx`
   - Fixed status check (line 179)

## Testing Checklist

### Manager Dashboard Overview
- [x] Avg Sentiment displays correctly
- [x] Avg Engagement displays correctly
- [x] Avg Confidence displays correctly
- [x] Only counts completed analyses
- [x] Shows for manager's team only

### Admin Reports Page
- [x] Manager stats show scores
- [x] Employee stats show scores
- [x] Company overview shows scores
- [x] Daily/Weekly/Monthly filters work
- [x] CSV export includes correct scores

### Manager Reports Page
- [x] Employee stats show scores
- [x] Team overview shows scores
- [x] Daily/Weekly/Monthly filters work
- [x] CSV export includes correct scores

### Employee Reports Page
- [x] Personal performance shows scores
- [x] Daily/Weekly/Monthly filters work

## Common Issues & Solutions

### Issue: Scores still showing as 0
**Check:**
1. Are there any completed analyses? (status = "Completed")
2. Are the scores stored as strings or numbers?
3. Is the status check case-insensitive?

### Issue: Wrong employee's data showing
**Check:**
1. Using `user_id` not `id` for employee matching
2. `call_history.employee_id` = `employees.user_id`

### Issue: Manager not seeing team data
**Check:**
1. `employees.manager_id` matches manager's table ID
2. Using `formattedEmployees` for correct user_id mapping

## Implementation Date
November 4, 2025

## Next Steps

### Optional Enhancements:
1. **Standardize status values:** Update database to use consistent casing ("completed" everywhere)
2. **Type safety:** Update TypeScript interfaces to reflect string scores
3. **Validation:** Add score validation on insert/update
4. **Real-time updates:** Consider WebSocket subscriptions for live updates

### Performance Optimization:
1. Add database indexes on:
   - `analyses.status`
   - `analyses.call_id`
   - `call_history.employee_id`
2. Consider materialized views for aggregated stats
3. Cache frequently accessed reports

## Notes

- Status values in database are case-sensitive ("Completed" vs "completed")
- All score fields are stored as strings/numeric, require `parseFloat()` conversion
- `call_history.employee_id` links to `employees.user_id` (UUID from auth.users)
- Manager Dashboard only shows data for employees under that manager
- Reports pages filter by date range (daily/weekly/monthly)

