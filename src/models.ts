import type { WeatherModel } from './types';

export const MODELS: WeatherModel[] = [
  { id: 'ecmwf_ifs025', label: 'ECMWF', color: '#1f77b4' },
  { id: 'gfs_seamless', label: 'GFS (NOAA)', color: '#ff7f0e' },
  { id: 'icon_seamless', label: 'ICON (DWD)', color: '#2ca02c' },
  { id: 'meteofrance_seamless', label: 'Meteo-France', color: '#8B0000' },
  { id: 'ukmo_seamless', label: 'UK Met Office', color: '#9467bd' },
];
