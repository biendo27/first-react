/**
 * Formats a date to UTC+0 ISO 8601 format for API requests
 * @param {Date|string} date - The date to format (can be Date object or string)
 * @returns {string} The date formatted in ISO 8601 UTC+0 format
 */
export const formatDateForApi = (date) => {
  if (!date) return null;
  
  // Convert to Date object if it's a string
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check if valid date
  if (isNaN(dateObj.getTime())) return null;
  
  // Format as ISO string (always in UTC)
  return dateObj.toISOString();
};

/**
 * Parses an ISO date string from API to a localized Date object
 * @param {string} isoString - ISO date string from the API
 * @returns {Date} Date object representing the date
 */
export const parseDateFromApi = (isoString) => {
  if (!isoString) return null;
  return new Date(isoString);
};

/**
 * Formats a date for display in the UI
 * @param {Date|string} date - The date to format
 * @param {string} locale - The locale to use (defaults to browser locale)
 * @returns {string} Formatted date string for display
 */
export const formatDateForDisplay = (date, locale = navigator.language) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return '';
  
  return dateObj.toLocaleDateString(locale);
}; 