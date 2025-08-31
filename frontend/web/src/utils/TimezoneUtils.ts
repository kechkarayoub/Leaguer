/**
 * Timezone Utilities
 * 
 * Utilities for working with timezones in the frontend
 */

import moment from 'moment-timezone';

export interface TimezoneOption {
  value: string;
  label: string;
}

/**
 * Get all available timezones
 */
export const getAllTimezones = (): TimezoneOption[] => {
  const timezones = [
    // Major Africa timezones
    'Africa/Algiers',
    'Africa/Cairo',
    'Africa/Casablanca',
    'Africa/Johannesburg',
    'Africa/Lagos',
    'Africa/Nairobi',
    'Africa/Tunis',
    
    // Major Europe timezones
    'Europe/Amsterdam',
    'Europe/Berlin',
    'Europe/Brussels',
    'Europe/Budapest',
    'Europe/Dublin',
    'Europe/London',
    'Europe/Madrid',
    'Europe/Oslo',
    'Europe/Paris',
    'Europe/Prague',
    'Europe/Rome',
    'Europe/Stockholm',
    'Europe/Vienna',
    'Europe/Warsaw',
    'Europe/Zurich',
    
    // Major Asia timezones
    'Asia/Bangkok',
    'Asia/Shanghai',
    'Asia/Dhaka',
    'Asia/Dubai',
    'Asia/Hong_Kong',
    'Asia/Jakarta',
    'Asia/Karachi',
    'Asia/Kolkata',
    'Asia/Kuala_Lumpur',
    'Asia/Manila',
    'Asia/Riyadh',
    'Asia/Seoul',
    'Asia/Singapore',
    'Asia/Tehran',
    'Asia/Tokyo',
    
    // Major America timezones
    'America/Anchorage',
    'America/Argentina/Buenos_Aires',
    'America/Bogota',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Mexico_City',
    'America/New_York',
    'America/Phoenix',
    'America/Sao_Paulo',
    'America/Toronto',
    'America/Vancouver',
    
    // Major Australia/Pacific timezones
    'Australia/Adelaide',
    'Australia/Brisbane',
    'Australia/Melbourne',
    'Australia/Perth',
    'Australia/Sydney',
    'Pacific/Auckland',
    'Pacific/Fiji',
    'Pacific/Honolulu',
    
    // UTC
    'UTC',
  ];

  return timezones.map(timezone => ({
    value: timezone,
    label: `${timezone} (${getTimezoneOffset(timezone)})`
  })).sort((a, b) => a.label.localeCompare(b.label));
};

/**
 * Get timezone offset string
 */
const getTimezoneOffset = (timezone: string): string => {
  try {
    // Use moment-timezone to get accurate offset
    const now = moment().tz(timezone);
    const offsetMinutes = now.utcOffset();
    
    // Convert minutes to hours and minutes
    const hours = Math.floor(Math.abs(offsetMinutes) / 60);
    const minutes = Math.abs(offsetMinutes) % 60;
    const sign = offsetMinutes >= 0 ? '+' : '-';
    
    return `UTC${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  } catch (error) {
    return 'UTC+00:00';
  }
};

/**
 * Get language options for the language selector
 */
export const getLanguageOptions = () => [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'ar', label: 'العربية' },
];

/**
 * Get theme options
 */
export const getThemeOptions = () => [
  { value: 'default', label: 'Default' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];
