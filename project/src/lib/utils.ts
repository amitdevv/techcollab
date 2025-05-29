import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names with Tailwind's class merger
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats currency to USD format
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Truncates text to a specified length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Formats a date to a human-readable relative time string
 * e.g. "3 minutes ago", "2 days ago", etc.
 */
export function formatDistanceToNow(date: Date | string): string {
  const now = new Date();
  const parsedDate = typeof date === 'string' ? new Date(date) : date;
  const seconds = Math.floor((now.getTime() - parsedDate.getTime()) / 1000);

  let interval = Math.floor(seconds / 31536000); // years

  if (interval >= 1) {
    return interval === 1 ? '1 year ago' : `${interval} years ago`;
  }

  interval = Math.floor(seconds / 2592000); // months
  if (interval >= 1) {
    return interval === 1 ? '1 month ago' : `${interval} months ago`;
  }

  interval = Math.floor(seconds / 86400); // days
  if (interval >= 1) {
    return interval === 1 ? '1 day ago' : `${interval} days ago`;
  }

  interval = Math.floor(seconds / 3600); // hours
  if (interval >= 1) {
    return interval === 1 ? '1 hour ago' : `${interval} hours ago`;
  }

  interval = Math.floor(seconds / 60); // minutes
  if (interval >= 1) {
    return interval === 1 ? '1 minute ago' : `${interval} minutes ago`;
  }

  return seconds < 5 ? 'just now' : `${Math.floor(seconds)} seconds ago`;
}

/**
 * Generates a random avatar URL for testing
 */
export function getRandomAvatar(seed: string): string {
  return `https://i.pravatar.cc/150?u=${seed}`;
}

/**
 * Generates an initial for avatar fallback
 */
export function getInitials(name: string): string {
  if (!name) return '?';

  const parts = name.split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Generates a relative time string (e.g., "2 hours ago")
 */
export function getRelativeTime(date: Date | string): string {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;

  return past.toLocaleDateString();
}

/**
 * Creates a debounced function that delays invoking the provided function
 * until after 'delay' milliseconds have elapsed since the last time it was invoked.
 * 
 * @param func The function to debounce
 * @param delay The number of milliseconds to delay
 * @returns A debounced version of the function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (...args: Parameters<T>): void {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Validates an image file based on type and size.
 * @param file The file to validate.
 * @param maxSizeInMB The maximum allowed file size in megabytes.
 * @param allowedTypes An array of allowed MIME types.
 * @returns An error message if validation fails, otherwise null.
 */
export function validateImageFile(
  file: File,
  maxSizeInMB: number = 3,
  allowedTypes: string[] = ["image/jpeg", "image/png", "image/gif", "image/jpg"]
): string | null {
  if (!file) {
    return "No file selected.";
  }

  // Validate file size
  if (file.size > maxSizeInMB * 1024 * 1024) {
    return `File size should be less than ${maxSizeInMB}MB.`;
  }

  // Validate file type
  if (!allowedTypes.includes(file.type)) {
    return "Invalid file type. Please upload an image (JPEG, PNG, GIF).";
  }

  return null; // Validation passed
}
