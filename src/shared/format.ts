/**
 * Clamp a number between a minimum and maximum value.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Generate a human-readable relative time string (e.g. "3 minutes ago").
 * Returns "just now" for future dates or invalid inputs.
 */
export function relativeTime(date: Date, now = new Date()): string {
  const dateMs = date.getTime();
  const nowMs = now.getTime();

  // Guard against NaN (invalid dates) or future dates
  if (Number.isNaN(dateMs) || Number.isNaN(nowMs) || dateMs > nowMs) {
    return "just now";
  }

  const seconds = Math.floor((nowMs - dateMs) / 1000);

  if (seconds < 60) {
    return "just now";
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
