import Plotly from 'plotly.js-dist-min';
import type { ForecastResponse, HourlyVariable } from '../types';
import { hourlyKey } from '../types';
import { MODELS } from '../models';

const CHART_KINDS: { id: string; title: string; variable?: HourlyVariable }[] = [
  { id: 'temperature', title: 'Temperature (°C)', variable: 'temperature_2m' },
  { id: 'apparent', title: 'Apparent Temperature / Real Feel (°C)', variable: 'apparent_temperature' },
  { id: 'precipitation', title: 'Precipitation (mm)', variable: 'precipitation' },
  { id: 'wind', title: 'Wind Speed & Gusts (km/h)' },
];

export function renderCharts(forecast: ForecastResponse): void {
  renderLegend();

  const twoHourForecast = sliceFromNow(forecast, 2);
  renderTwoHourSummary(twoHourForecast);

  const ranges: [string, ForecastResponse][] = [
    ['2h', twoHourForecast],
    ['short', sliceHours(forecast, 30)],
    ['long', forecast],
  ];

  for (const [suffix, data] of ranges) {
    for (const kind of CHART_KINDS) {
      const traces = kind.variable ? buildTraces(data, kind.variable) : buildWindTraces(data);
      renderChart(`chart-${kind.id}-${suffix}`, traces, kind.title);
    }
  }
}

/** Re-render/resize every chart (used when a hidden tab becomes visible). */
export function resizeCharts(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('.chart-container').forEach((el) => {
    if ((el as any).data) Plotly.Plots.resize(el);
  });
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

function sliceFromNow(forecast: ForecastResponse, hours: number): ForecastResponse {
  const times = forecast.hourly.time;
  const now = new Date();

  // Create a simple time string for comparison (YYYY-MM-DDTHH)
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const currentTimePrefix = `${year}-${month}-${day}T${hour}`;

  // Find the index where forecast time >= current time
  let startIndex = 0;
  for (let i = 0; i < times.length; i++) {
    if (times[i] >= currentTimePrefix) {
      startIndex = i;
      break;
    }
  }

  // Get approximately 'hours' worth of data points (hourly data = 1 point per hour)
  const endIndex = Math.min(startIndex + Math.ceil(hours) + 1, times.length);

  const slicedTimes = times.slice(startIndex, endIndex);
  const sliced: ForecastResponse = {
    latitude: forecast.latitude,
    longitude: forecast.longitude,
    timezone: forecast.timezone,
    hourly: { time: slicedTimes },
  };

  // Slice all hourly variables to match the time range
  for (const [key, values] of Object.entries(forecast.hourly)) {
    if (key === 'time') continue;
    if (Array.isArray(values)) {
      sliced.hourly[key] = values.slice(startIndex, endIndex);
    }
  }

  return sliced;
}

function renderTwoHourSummary(forecast: ForecastResponse): void {
  const container = document.getElementById('forecast-summary');
  if (!container) return;

  const times = forecast.hourly.time;

  if (times.length < 1) {
    container.innerHTML = '<p style="text-align: center; color: #7f8c8d;">Not enough data for 2-hour forecast</p>';
    return;
  }

  const tempKey = hourlyKey('temperature_2m', MODELS[0].id);
  const precipKey = hourlyKey('precipitation_probability', MODELS[0].id);
  const windKey = hourlyKey('wind_speed_10m', MODELS[0].id);

  const temps = forecast.hourly[tempKey] as (number | null)[];
  const precips = forecast.hourly[precipKey] as (number | null)[];
  const winds = forecast.hourly[windKey] as (number | null)[];

  const startTemp = temps?.[0];
  const endTemp = temps?.[temps.length - 1];
  const maxPrecip = precips?.reduce((max, val) => {
    return val && val > (max ?? 0) ? val : max;
  }, 0 as number | null) ?? 0;
  const avgWind = winds && winds.filter((w) => w !== null).length > 0
    ? winds.reduce((sum: number, val) => sum + (val ?? 0), 0) / winds.filter((w) => w !== null).length
    : 0;

  // Calculate additional metrics
  const maxTemp = Math.max(...temps.filter((t) => t !== null) as number[]);
  const minTemp = Math.min(...temps.filter((t) => t !== null) as number[]);
  const totalPrecipitation = precips
    ? precips.reduce((sum: number, val) => sum + (val ?? 0), 0)
    : 0;
  const maxWind = Math.max(...winds.filter((w) => w !== null) as number[]);

  let prediction = '';
  let icon = '⛅';
  const predictions: string[] = [];

  if (maxPrecip > 50) {
    predictions.push('rain expected');
    icon = '🌧️';
  } else if (maxPrecip > 20) {
    predictions.push('might rain soon');
  }

  if (startTemp !== null && endTemp !== null) {
    const tempChange = endTemp - startTemp;
    if (tempChange > 1.5) {
      predictions.push('getting warmer');
      icon = '☀️';
    } else if (tempChange < -1.5) {
      predictions.push('getting cooler');
      icon = '❄️';
    } else {
      if (!predictions.length) predictions.push('steady temperature');
    }
  }

  if (avgWind > 20) {
    predictions.push('windy conditions');
  } else if (avgWind > 10) {
    predictions.push('moderate winds');
  }

  prediction = predictions.join(', ');
  if (!prediction) prediction = 'mostly stable conditions';

  container.innerHTML = `
    <div class="forecast-summary-icon">${icon}</div>
    <div class="forecast-summary-text">${prediction}</div>
    <div class="forecast-summary-details">
      <div class="forecast-detail-item">
        <div class="forecast-detail-label">Current Temp</div>
        <div class="forecast-detail-value">${startTemp !== null ? Math.round(startTemp) : '—'}°C</div>
      </div>
      <div class="forecast-detail-item">
        <div class="forecast-detail-label">Rain Prob.</div>
        <div class="forecast-detail-value">${Math.round(maxPrecip)}%</div>
      </div>
      <div class="forecast-detail-item">
        <div class="forecast-detail-label">Avg Wind</div>
        <div class="forecast-detail-value">${Math.round(avgWind)} km/h</div>
      </div>
    </div>

    <div class="forecast-metrics-grid">
      <div class="metric-box">
        <div class="metric-label">Temperature Range</div>
        <div class="metric-value">${Math.round(minTemp)}°C — ${Math.round(maxTemp)}°C</div>
      </div>
      <div class="metric-box">
        <div class="metric-label">Temperature Change</div>
        <div class="metric-value">${startTemp !== null && endTemp !== null ? (endTemp > startTemp ? '+' : '') + Math.round((endTemp - startTemp) * 10) / 10 : '—'}°C</div>
      </div>
      <div class="metric-box">
        <div class="metric-label">Precipitation Amount</div>
        <div class="metric-value">${Math.round(totalPrecipitation * 10) / 10} mm</div>
      </div>
      <div class="metric-box">
        <div class="metric-label">Max Wind Speed</div>
        <div class="metric-value">${Math.round(maxWind)} km/h</div>
      </div>
    </div>
  `;
}

interface SeriesSpec {
  variable: HourlyVariable;
  suffix: string; // appended to model label / "Average"
  dash?: 'dot';
}

function buildTraces(forecast: ForecastResponse, variable: HourlyVariable): Plotly.Data[] {
  return buildSeries(forecast, [{ variable, suffix: '' }]);
}

function buildWindTraces(forecast: ForecastResponse): Plotly.Data[] {
  return buildSeries(forecast, [
    { variable: 'wind_speed_10m', suffix: ' speed' },
    { variable: 'wind_gusts_10m', suffix: ' gust', dash: 'dot' },
  ]);
}

/** One line per model per spec, followed by one dashed average line per spec. */
function buildSeries(forecast: ForecastResponse, specs: SeriesSpec[]): Plotly.Data[] {
  const traces: Plotly.Data[] = [];
  const averages: Plotly.Data[] = [];
  const times = forecast.hourly.time;
  const multi = specs.length > 1;

  for (const spec of specs) {
    const sums: number[] = new Array(times.length).fill(0);
    const counts: number[] = new Array(times.length).fill(0);

    for (const model of MODELS) {
      const values = forecast.hourly[hourlyKey(spec.variable, model.id)];
      if (!values || !Array.isArray(values)) continue;

      const x: string[] = [];
      const y: number[] = [];
      for (let i = 0; i < values.length; i++) {
        const v = values[i];
        if (v === null || v === undefined) continue;
        x.push(times[i]);
        y.push(v as number);
        sums[i] += v as number;
        counts[i]++;
      }

      if (y.length > 0) {
        traces.push({
          x,
          y,
          // Speed lines keep the plain model label; gusts get a suffix
          name: spec.dash ? `${model.label}${spec.suffix}` : model.label,
          type: 'scatter',
          mode: 'lines',
          line: { color: model.color, width: 2, ...(spec.dash && { dash: spec.dash }) },
        });
      }
    }

    const x: string[] = [];
    const y: number[] = [];
    for (let i = 0; i < times.length; i++) {
      if (counts[i] > 0) {
        x.push(times[i]);
        y.push(sums[i] / counts[i]);
      }
    }
    if (y.length > 0) {
      averages.push({
        x,
        y,
        name: multi ? `Average${spec.suffix}` : 'Average',
        type: 'scatter',
        mode: 'lines',
        line: { color: '#e74c3c', width: 3, dash: 'dash' },
      });
    }
  }

  return [...traces, ...averages];
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
  const tickSize = isMobile ? 10 : 12;

  let xaxis: any = {
    tickfont: { size: tickSize },
    automargin: true,
    ...(isMobile ? { nticks: 5, tickangle: 0 } : { title: 'Time' }),
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

    xaxis = { ...xaxis, tickvals, ticktext, nticks: undefined };
  }

  const layout: Partial<Plotly.Layout> = {
    title: isMobile ? { text: title, font: { size: 14 }, x: 0.02, xanchor: 'left' } : title,
    xaxis,
    yaxis: {
      // On mobile the title already names the unit; drop the duplicate to reclaim width
      ...(isMobile ? {} : { title }),
      tickfont: { size: tickSize },
      automargin: true,
    },
    hovermode: 'x unified',
    margin: isMobile
      ? { l: 36, r: 10, t: 40, b: 30 }
      : { l: 60, r: 20, t: 50, b: 40 },
    autosize: true,
    height: isMobile ? 320 : 380,
    plot_bgcolor: 'rgba(255, 255, 255, 0)',
    paper_bgcolor: 'rgba(0, 0, 0, 0)',
    annotations,
    showlegend: false,
  };

  Plotly.newPlot(div, data, layout, { responsive: true, displayModeBar: false });
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
