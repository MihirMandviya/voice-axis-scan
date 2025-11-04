# Get Analysis Button Visibility Fix

## Issue
The "Get Analysis" button was not showing up for calls that had auto-created analysis records with 'pending' status.

## Root Cause
The button visibility logic was:
```javascript
{!hasAnalysis && ...}  // Only show if NO analysis exists
```

But now with the trigger auto-creating analyses with 'pending' status, `hasAnalysis` is always `true` for answered calls, so the button never showed.

## Solution
Updated the button visibility condition to show when:
1. No analysis record exists, OR
2. Analysis status is 'pending' (waiting for user to initiate), OR
3. Analysis status is 'failed' (allow retry)

```javascript
{!isProcessing && (!hasAnalysis || analysis?.status === 'pending' || analysis?.status === 'failed') && ...}
```

## Complete Button Logic Matrix

| Scenario | Analysis Status | Button Shown | Badge Shown |
|----------|----------------|--------------|-------------|
| No analysis record | N/A | ✅ "Get Analysis" | "No Analysis" (gray) |
| Auto-created by trigger | `pending` | ✅ "Get Analysis" | "Ready for Analysis" (outline) |
| User clicked button | `processing` | ❌ Hidden | "Analyzing..." with spinner |
| Analysis completed | `completed` | "View Analysis" | Shows scores |
| Analysis failed | `failed` | ✅ "Get Analysis" (retry) | "Analysis Failed" (red) |

## UI States Walkthrough

### State 1: Initial State (Pending)
```
Call: "Completed"
Badge: "Ready for Analysis"
Button: "Get Analysis" ← Now visible!
```

### State 2: User Clicks Button
```
Call: "Completed"
Badge: "Analyzing..." (spinner)
Button: Hidden (no button)
```

### State 3: Analysis Completes
```
Call: "Completed"
Badge: "Sentiment: 85% | Engagement: 92%"
Button: "View Analysis"
```

### State 4: If Analysis Fails
```
Call: "Completed"
Badge: "Analysis Failed"
Button: "Get Analysis" (retry) ← Visible again!
```

## Files Modified
1. `src/components/CallHistoryManager.tsx`
   - Line 885: Updated button condition

2. `src/components/dashboards/EmployeeDashboard.tsx`
   - Line 2010: Updated button condition

## Code Changes

### Before (BROKEN)
```javascript
{!hasAnalysis && call.outcome !== 'not_answered' && call.outcome !== 'failed' && (
  <Button onClick={() => handleGetAnalysis(call)}>
    Get Analysis
  </Button>
)}
```

### After (FIXED)
```javascript
{(!hasAnalysis || analysis?.status === 'pending' || analysis?.status === 'failed') 
  && !isProcessing 
  && call.outcome !== 'not_answered' 
  && call.outcome !== 'failed' && (
  <Button onClick={() => handleGetAnalysis(call)}>
    Get Analysis
  </Button>
)}
```

## Testing Checklist
- [x] Button shows for calls with no analysis
- [x] Button shows for calls with 'pending' analysis
- [x] Button shows for calls with 'failed' analysis (retry)
- [x] Button hides when actively processing
- [x] Button hides when analysis is completed (shows "View Analysis" instead)
- [x] Button never shows for 'not_answered' or 'failed' calls
- [x] Badge shows correct status without premature animation
- [x] Clicking button triggers analysis with accurate IDs

## Implementation Date
November 4, 2025

