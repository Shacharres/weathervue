import type { ForecastResponse } from '../types';
import { MODELS } from '../models';

export class ForecastError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ForecastError';
  }
}

export async function fetchForecast(
  latitude: number,
  longitude: number
): Promise<ForecastResponse> {
  const modelIds = MODELS.map((m) => m.id).join(',');
  const hourlyVars = [
    'temperature_2m',
    'apparent_temperature',
    'precipitation',
    'precipitation_probability',
    'wind_speed_10m',
    'wind_gusts_10m',
  ].join(',');

  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    hourly: hourlyVars,
    models: modelIds,
    timezone: 'auto',
    forecast_days: '7',
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new ForecastError(
        `HTTP ${response.status}: Couldn't load forecast data`
      );
    }

    const data: ForecastResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof ForecastError) {
      throw error;
    }
    throw new ForecastError('Network error: Couldn\'t load forecast data');
  }
}
