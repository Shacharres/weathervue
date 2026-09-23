import Plotly from 'plotly.js-dist-min';
import type { ForecastResponse, HourlyVariable } from '../types';
import { hourlyKey } from '../types';
import { MODELS } from '../models';

export function renderCharts(forecast: ForecastResponse): void {
  // Render short-term (30 hours)
  const shortTermForecast = sliceHours(forecast, 30);
  const temperatureShort = buildTraces(shortTermForecast, 'temperature_2m');
  renderChart('chart-temperature-short', temperatureShort, 'Temperature (°C)');

  const apparentShort = buildTraces(shortTermForecast, 'apparent_temperature');
  renderChart('chart-apparent-short', apparentShort, 'Apparent Temperature / Real Feel (°C)');

  const precipitationShort = buildTraces(shortTermForecast, 'precipitation');
  renderChart('chart-precipitation-short', precipitationShort, 'Precipitation (mm)');

  const windTracesShort = buildWindTraces(shortTermForecast);
  renderChart('chart-wind-short', windTracesShort, 'Wind Speed & Gusts (km/h)');

  // Render long-term (7 days)
  const temperatureLong = buildTraces(forecast, 'temperature_2m');
  renderChart('chart-temperature-long', temperatureLong, 'Temperature (°C)');

  const apparentLong = buildTraces(forecast, 'apparent_temperature');
  renderChart('chart-apparent-long', apparentLong, 'Apparent Temperature / Real Feel (°C)');

  const precipitationLong = buildTraces(forecast, 'precipitation');
  renderChart('chart-precipitation-long', precipitationLong, 'Precipitation (mm)');

  const windTracesLong = buildWindTraces(forecast);
  renderChart('chart-wind-long', windTracesLong, 'Wind Speed & Gusts (km/h)');
}

function sliceHours(forecast: ForecastResponse, hours: number): ForecastResponse {
  const times = forecast.hourly.time.slice(0, hours);
  const sliced: ForecastResponse = {
    latitude: forecast.latitude,
    longitude: forecast.longitude,
    timezone: forecast.timezone,
    hourly: { time: times },
  };

  // Slice all hourly variables to match the time range
  for (const [key, values] of Object.entries(forecast.hourly)) {
    if (key === 'time') continue;
    if (Array.isArray(values)) {
      sliced.hourly[key] = values.slice(0, hours);
    }
  }

  return sliced;
}

function buildTraces(
  forecast: ForecastResponse,
  variable: HourlyVariable
): Plotly.Data[] {
  const traces: Plotly.Data[] = [];
  const times = forecast.hourly.time;

  for (const model of MODELS) {
    const key = hourlyKey(variable, model.id);
    const values = forecast.hourly[key];

    if (!values || !Array.isArray(values)) {
      continue;
    }

    // Filter out null values for gaps in the chart
    const filteredValues = values.filter(
      (v) => v !== null && v !== undefined
    ) as number[];

    if (filteredValues.length === 0) {
      continue;
    }

    // Create trace with corresponding time indices
    const traceValues: (number | null)[] = [];
    const traceTimes: string[] = [];

    for (let i = 0; i < values.length; i++) {
      if (values[i] !== null && values[i] !== undefined) {
        traceValues.push(values[i] as number);
        traceTimes.push(times[i]);
      }
    }

    traces.push({
      x: traceTimes,
      y: traceValues,
      name: model.label,
      type: 'scatter',
      mode: 'lines',
      line: {
        color: model.color,
        width: 2,
      },
    });
  }

  return traces;
}

function buildWindTraces(forecast: ForecastResponse): Plotly.Data[] {
  const traces: Plotly.Data[] = [];
  const times = forecast.hourly.time;

  for (const model of MODELS) {
    const speedKey = hourlyKey('wind_speed_10m', model.id);
    const gustKey = hourlyKey('wind_gusts_10m', model.id);

    const speedValues = forecast.hourly[speedKey];
    const gustValues = forecast.hourly[gustKey];

    // Speed trace
    if (speedValues && Array.isArray(speedValues)) {
      const traceValues: (number | null)[] = [];
      const traceTimes: string[] = [];

      for (let i = 0; i < speedValues.length; i++) {
        if (speedValues[i] !== null && speedValues[i] !== undefined) {
          traceValues.push(speedValues[i] as number);
          traceTimes.push(times[i]);
        }
      }

      if (traceValues.length > 0) {
        traces.push({
          x: traceTimes,
          y: traceValues,
          name: model.label,
          type: 'scatter',
          mode: 'lines',
          line: {
            color: model.color,
            width: 2,
          },
        });
      }
    }

    // Gust trace
    if (gustValues && Array.isArray(gustValues)) {
      const traceValues: (number | null)[] = [];
      const traceTimes: string[] = [];

      for (let i = 0; i < gustValues.length; i++) {
        if (gustValues[i] !== null && gustValues[i] !== undefined) {
          traceValues.push(gustValues[i] as number);
          traceTimes.push(times[i]);
        }
      }

      if (traceValues.length > 0) {
        traces.push({
          x: traceTimes,
          y: traceValues,
          name: `${model.label} gust`,
          type: 'scatter',
          mode: 'lines',
          line: {
            color: model.color,
            width: 2,
            dash: 'dot',
          },
        });
      }
    }
  }

  return traces;
}

function renderChart(
  elementId: string,
  data: Plotly.Data[],
  title: string
): void {
  const div = document.getElementById(elementId);
  if (!div) return;

  const layout: Partial<Plotly.Layout> = {
    title: title,
    xaxis: { title: 'Time' },
    yaxis: { title: title },
    hovermode: 'x unified',
    margin: { l: 60, r: 20, t: 50, b: 40 },
    height: 380,
  };

  Plotly.newPlot(div, data, layout, { responsive: true });
}
