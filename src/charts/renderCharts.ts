import Plotly from 'plotly.js-dist-min';
import type { ForecastResponse, HourlyVariable } from '../types';
import { hourlyKey } from '../types';
import { MODELS } from '../models';

export function renderCharts(forecast: ForecastResponse): void {
  renderLegend();

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
  const allModelValues: (number | null)[] = new Array(times.length).fill(null);
  const modelCounts: number[] = new Array(times.length).fill(0);

  for (const model of MODELS) {
    const key = hourlyKey(variable, model.id);
    const values = forecast.hourly[key];

    if (!values || !Array.isArray(values)) {
      continue;
    }

    // Create trace with corresponding time indices
    const traceValues: (number | null)[] = [];
    const traceTimes: string[] = [];

    for (let i = 0; i < values.length; i++) {
      if (values[i] !== null && values[i] !== undefined) {
        traceValues.push(values[i] as number);
        traceTimes.push(times[i]);

        // Accumulate for average calculation
        const val = values[i] as number;
        allModelValues[i] =
          (allModelValues[i] ?? 0) + val;
        modelCounts[i]++;
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

  // Add average trace
  const averageValues: number[] = [];
  const averageTimes: string[] = [];
  for (let i = 0; i < allModelValues.length; i++) {
    if (modelCounts[i] > 0) {
      averageValues.push(allModelValues[i] as number / modelCounts[i]);
      averageTimes.push(times[i]);
    }
  }

  if (averageValues.length > 0) {
    traces.push({
      x: averageTimes,
      y: averageValues,
      name: 'Average',
      type: 'scatter',
      mode: 'lines',
      line: {
        color: '#e74c3c',
        width: 3,
        dash: 'dash',
      },
    });
  }

  return traces;
}

function buildWindTraces(forecast: ForecastResponse): Plotly.Data[] {
  const traces: Plotly.Data[] = [];
  const times = forecast.hourly.time;
  const allSpeedValues: (number | null)[] = new Array(times.length).fill(null);
  const speedCounts: number[] = new Array(times.length).fill(0);
  const allGustValues: (number | null)[] = new Array(times.length).fill(null);
  const gustCounts: number[] = new Array(times.length).fill(0);

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

          // Accumulate for average calculation
          const val = speedValues[i] as number;
          allSpeedValues[i] = (allSpeedValues[i] ?? 0) + val;
          speedCounts[i]++;
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

          // Accumulate for average calculation
          const val = gustValues[i] as number;
          allGustValues[i] = (allGustValues[i] ?? 0) + val;
          gustCounts[i]++;
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

  // Add average speed trace
  const averageSpeedValues: number[] = [];
  const averageSpeedTimes: string[] = [];
  for (let i = 0; i < allSpeedValues.length; i++) {
    if (speedCounts[i] > 0) {
      averageSpeedValues.push(allSpeedValues[i] as number / speedCounts[i]);
      averageSpeedTimes.push(times[i]);
    }
  }

  if (averageSpeedValues.length > 0) {
    traces.push({
      x: averageSpeedTimes,
      y: averageSpeedValues,
      name: 'Average speed',
      type: 'scatter',
      mode: 'lines',
      line: {
        color: '#e74c3c',
        width: 3,
        dash: 'dash',
      },
    });
  }

  // Add average gust trace
  const averageGustValues: number[] = [];
  const averageGustTimes: string[] = [];
  for (let i = 0; i < allGustValues.length; i++) {
    if (gustCounts[i] > 0) {
      averageGustValues.push(allGustValues[i] as number / gustCounts[i]);
      averageGustTimes.push(times[i]);
    }
  }

  if (averageGustValues.length > 0) {
    traces.push({
      x: averageGustTimes,
      y: averageGustValues,
      name: 'Average gust',
      type: 'scatter',
      mode: 'lines',
      line: {
        color: '#e74c3c',
        width: 3,
        dash: 'dash',
      },
    });
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

  // Extract average trace if it exists
  let annotations: object[] = [];
  const averageTrace = data.find((trace) => (trace.name === 'Average' || trace.name?.includes('Average')));
  const isLongForecast = elementId.includes('long');

  if (averageTrace && Array.isArray(averageTrace.x) && Array.isArray(averageTrace.y)) {
    annotations = averageTrace.x.map((time, index) => {
      // For 7-day forecast, only show annotations every 6 hours
      if (isLongForecast && index % 6 !== 0) {
        return null;
      }

      const averageValue = averageTrace.y?.[index];
      if (averageValue === undefined || averageValue === null) return null;

      // Find the maximum y value at this x position across all traces
      let maxValue = averageValue as number;
      for (const trace of data) {
        if (Array.isArray(trace.x) && Array.isArray(trace.y)) {
          const xIndex = trace.x.indexOf(time);
          if (xIndex !== -1 && trace.y[xIndex] !== null && trace.y[xIndex] !== undefined) {
            maxValue = Math.max(maxValue, trace.y[xIndex] as number);
          }
        }
      }

      return {
        x: time,
        y: maxValue,
        text: Math.round(averageValue as number).toString(),
        showarrow: false,
        font: { size: 10, color: '#e74c3c' },
        yshift: 20,
      };
    }).filter((a) => a !== null) as object[];
  }

  // Responsive layout based on screen width
  const isMobile = window.innerWidth < 768;

  // For 7-day forecast, show x-axis labels only daily
  let xaxis: any = {
    title: 'Time',
    tickfont: { size: isMobile ? 10 : 12 },
  };

  if (isLongForecast && averageTrace && Array.isArray(averageTrace.x)) {
    const tickvals: string[] = [];
    const ticktext: string[] = [];
    let lastDay = '';

    averageTrace.x.forEach((time) => {
      const date = new Date(time as string);
      const dayKey = date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });

      if (dayKey !== lastDay) {
        tickvals.push(time as string);
        ticktext.push(dayKey);
        lastDay = dayKey;
      }
    });

    xaxis = {
      ...xaxis,
      tickvals,
      ticktext,
    };
  }

  const layout: Partial<Plotly.Layout> = {
    title: title,
    xaxis: xaxis,
    yaxis: {
      title: title,
      tickfont: { size: isMobile ? 10 : 12 },
    },
    hovermode: 'x unified',
    margin: isMobile
      ? { l: 45, r: 15, t: 45, b: isLongForecast ? 100 : 60 }
      : { l: 60, r: 20, t: 50, b: 40 },
    autosize: true,
    height: isMobile ? 420 : 380,
    plot_bgcolor: 'rgba(255, 255, 255, 0)',
    paper_bgcolor: 'rgba(0, 0, 0, 0)',
    annotations: annotations,
    showlegend: false,
  };

  Plotly.newPlot(div, data, layout, { responsive: true });
}

function renderLegend(): void {
  const legendContainer = document.getElementById('chart-legend');
  if (!legendContainer) return;

  legendContainer.innerHTML = '';

  const legendList = document.createElement('div');
  legendList.className = 'legend-items';

  for (const model of MODELS) {
    const item = document.createElement('div');
    item.className = 'legend-item';

    const colorBox = document.createElement('span');
    colorBox.className = 'legend-color';
    colorBox.style.backgroundColor = model.color;

    const label = document.createElement('span');
    label.className = 'legend-label';
    label.textContent = model.label;

    item.appendChild(colorBox);
    item.appendChild(label);
    legendList.appendChild(item);
  }

  // Add average line
  const avgItem = document.createElement('div');
  avgItem.className = 'legend-item';

  // Create SVG for dashed line
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '20');
  svg.setAttribute('height', '8');
  svg.setAttribute('viewBox', '0 0 20 8');
  svg.style.display = 'inline-block';
  svg.style.marginRight = '8px';
  svg.style.verticalAlign = 'middle';

  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', '0');
  line.setAttribute('y1', '4');
  line.setAttribute('x2', '20');
  line.setAttribute('y2', '4');
  line.setAttribute('stroke', '#e74c3c');
  line.setAttribute('stroke-width', '2');
  line.setAttribute('stroke-dasharray', '4,4');

  svg.appendChild(line);

  const avgLabel = document.createElement('span');
  avgLabel.className = 'legend-label';
  avgLabel.textContent = 'Average';

  avgItem.appendChild(svg);
  avgItem.appendChild(avgLabel);
  legendList.appendChild(avgItem);

  legendContainer.appendChild(legendList);
}
