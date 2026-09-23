// Open-Meteo API types
export interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
  timezone: string;
  population?: number;
}

export interface GeocodingResponse {
  results?: GeocodingResult[];
}

export type HourlyVariable =
  | 'temperature_2m'
  | 'apparent_temperature'
  | 'precipitation'
  | 'precipitation_probability'
  | 'wind_speed_10m'
  | 'wind_gusts_10m';

export interface ForecastResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  hourly: {
    time: string[];
  } & Record<string, (number | null)[] | string[]>;
}

export function hourlyKey(base: HourlyVariable, modelId: string): string {
  return `${base}_${modelId}`;
}

// Domain / persistence types
export interface WeatherModel {
  id: string;
  label: string;
  color: string;
}

export interface StoredLocation {
  name: string;
  admin1?: string;
  country?: string;
  latitude: number;
  longitude: number;
}
