import type { GeocodingResult, GeocodingResponse } from '../types';

export class GeocodingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeocodingError';
  }
}

export async function geocodeCity(query: string): Promise<GeocodingResult[]> {
  const trimmed = query.trim();

  if (!trimmed) {
    throw new GeocodingError('Search query cannot be empty');
  }

  const params = new URLSearchParams({
    name: trimmed,
    count: '10',
    language: 'en',
    format: 'json',
  });

  const url = `https://geocoding-api.open-meteo.com/v1/search?${params}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new GeocodingError(
        `HTTP ${response.status}: Couldn't reach the geocoding service`
      );
    }

    const data: GeocodingResponse = await response.json();
    return data.results ?? [];
  } catch (error) {
    if (error instanceof GeocodingError) {
      throw error;
    }
    throw new GeocodingError('Network error: Couldn\'t reach the geocoding service');
  }
}
