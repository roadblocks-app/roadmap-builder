# Updates Applied - Roadblocks.app

## Changes Made

### 1. Removed Maintenance Phase
- ✅ Removed "Maintenance" from categories array
- ✅ Removed maintenance from phase checkboxes initialization
- ✅ Removed maintenance from progress calculation
- ✅ Removed maintenance from dashboard display
- ✅ Removed maintenance CSS styling
- ✅ Updated parser to exclude maintenance keywords

### 2. Renamed "Complete" to "Completed"
- ✅ Updated milestone HTML template
- ✅ Changed checkbox label from "Complete" to "Completed"

### 3. Improved PDF Text Wrapping & Safe Margins
- ✅ **Reduced content column**: 50% (was 55%)
- ✅ **Increased notes column**: 40% (was 35%)
- ✅ **Increased text margins**: 15pt (was 10pt)
- ✅ **Increased column gaps**: 10pt and 15pt (was 8pt and 12pt)
- ✅ **Updated print CSS**: matches new 50/10/40 ratio
- ✅ **Updated canvas export**: matches new column ratios

## PDF Layout Now
```
┌─────────────────────────────────────────────────────────┐
│ Content Column (50%) │ ✓ │ Notes Column (40%)          │
│                      │   │                             │
│ 1. Long milestone    │   │ Write deadlines here        │
│    title that wraps  │   │ ________________            │
│    to next line      │   │ ________________            │
│                      │   │ ________________            │
│ Category: Planning   │   │                             │
└─────────────────────────────────────────────────────────┘
```

## Benefits
- **No text overlap**: Content stays within 50% width
- **Better readability**: More space for deadlines column
- **Safer margins**: 15pt buffer prevents overflow
- **Cleaner phases**: Only Planning, Development, Testing, Launch
- **Clearer labels**: "Completed" is more descriptive

## Testing
Try exporting a PDF with long milestone titles - they should now wrap properly and stay within the content column without overlapping the deadlines area.

The app is ready at http://localhost:8000!
