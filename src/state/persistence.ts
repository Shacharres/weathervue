import type { StoredLocation } from '../types';

const STORAGE_KEY = 'weathervue.lastLocation.v1';

export function saveLastLocation(location: StoredLocation): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
  } catch {
    // Silently fail in private mode or when storage is disabled
  }
}

export function loadLastLocation(): StoredLocation | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    // Silently fail if storage is unavailable
    return null;
  }
}
