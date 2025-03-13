# Date Handling in the Application

## Overview

This application ensures all datetime values are properly formatted in UTC+0 ISO 8601 format before being transmitted to the backend API. This standardization ensures consistent date handling across different timezones and environments.

## Implementation

The implementation consists of:

1. **Date Utility Functions** (`dateUtils.js`):
   - `formatDateForApi`: Converts any date to UTC+0 ISO 8601 format
   - `parseDateFromApi`: Parses ISO date strings from API responses
   - `formatDateForDisplay`: Formats dates for UI display with localization support

2. **API Request Interceptor**:
   - Automatically formats all date objects and strings in request payloads
   - Recursively processes nested objects and arrays
   - Ensures consistent date format in all API calls

3. **Form Components**:
   - Use `formatDateForForm` helper to format dates for HTML date inputs
   - Let the API interceptor handle the conversion to ISO format on submission

## Usage Guidelines

### In Form Components

When handling dates in forms:

```javascript
// Import the utility functions
import { formatDateForDisplay, parseDateFromApi } from '../utils/dateUtils';

// Format date for HTML date input (YYYY-MM-DD format)
const formatDateForForm = (dateValue) => {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  return date.toISOString().split('T')[0];
};

// Use in initialValues
const initialValues = {
  // ...
  startDate: formatDateForForm(entity?.startDate) || '',
  // ...
};

// No need to manually format in handleSubmit - the interceptor does this
const handleSubmit = async (values) => {
  // The date will be automatically formatted by the API interceptor
  await apiService.create(values);
};
```

### In Display Components

When displaying dates from the API:

```javascript
import { formatDateForDisplay } from '../utils/dateUtils';

// In a component
<Typography>
  {formatDateForDisplay(entity.createdDate)}
</Typography>
```

## Best Practices

1. Never manually convert dates to ISO strings in form submission handlers
2. Always use the utility functions for consistency
3. Let the API interceptor handle date formatting for API calls
4. Use the date formatter for UI display to ensure proper localization 