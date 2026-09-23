import './style.css';
import { geocodeCity, GeocodingError } from './api/geocoding';
import { fetchForecast, ForecastError } from './api/forecast';
import { renderCharts } from './charts/renderCharts';
import { loadLastLocation, saveLastLocation } from './state/persistence';
import type { GeocodingResult } from './types';

const searchForm = document.getElementById('search-form') as HTMLFormElement;
const searchInput = document.getElementById('search-input') as HTMLInputElement;
const candidatesList = document.getElementById('candidates') as HTMLUListElement;
const locationHeader = document.getElementById(
  'resolved-location'
) as HTMLParagraphElement;
const statusMessage = document.getElementById('status') as HTMLParagraphElement;

let currentCandidates: GeocodingResult[] = [];

// Load and display last location if available
function initializeLastLocation(): void {
  const lastLocation = loadLastLocation();
  if (lastLocation) {
    searchInput.value = lastLocation.name;
    loadLocationForecast(lastLocation);
  }
}

// Format location display string
function formatLocationLabel(result: GeocodingResult): string {
  const parts = [result.name];
  if (result.admin1) parts.push(result.admin1);
  if (result.country) parts.push(result.country);
  return parts.join(', ');
}

// Load and display forecast for a resolved location
async function loadLocationForecast(location: {
  name: string;
  admin1?: string;
  country?: string;
  latitude: number;
  longitude: number;
}): Promise<void> {
  try {
    statusMessage.textContent = 'Loading forecast...';
    statusMessage.className = 'status-message loading';

    const forecast = await fetchForecast(location.latitude, location.longitude);

    const label = formatLocationLabel(location as GeocodingResult);
    locationHeader.textContent = `📍 ${label}`;

    // Save to persistence
    saveLastLocation({
      name: location.name,
      admin1: location.admin1,
      country: location.country,
      latitude: location.latitude,
      longitude: location.longitude,
    });

    // Render charts
    renderCharts(forecast);

    statusMessage.textContent = '';
    statusMessage.className = 'status-message';

    // Hide candidates list
    candidatesList.innerHTML = '';
    candidatesList.style.display = 'none';
  } catch (error) {
    const message =
      error instanceof ForecastError
        ? 'Couldn\'t load forecast data right now.'
        : 'An unexpected error occurred.';
    statusMessage.textContent = message;
    statusMessage.className = 'status-message error';
  }
}

// Handle form submission
searchForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const query = searchInput.value.trim();

  if (!query) {
    statusMessage.textContent = 'Please enter a city or area name.';
    statusMessage.className = 'status-message error';
    return;
  }

  try {
    statusMessage.textContent = 'Searching...';
    statusMessage.className = 'status-message loading';

    currentCandidates = await geocodeCity(query);

    if (currentCandidates.length === 0) {
      statusMessage.textContent =
        'No matching place found. Try a different spelling or add a country.';
      statusMessage.className = 'status-message error';
      candidatesList.innerHTML = '';
      candidatesList.style.display = 'none';
      return;
    }

    if (currentCandidates.length === 1) {
      // Auto-select single result
      await loadLocationForecast(currentCandidates[0]);
      return;
    }

    // Show disambiguation list for 2+ results
    statusMessage.textContent = '';
    statusMessage.className = 'status-message';
    showCandidates(currentCandidates);
  } catch (error) {
    const message =
      error instanceof GeocodingError
        ? 'Couldn\'t look up that place right now.'
        : 'An unexpected error occurred.';
    statusMessage.textContent = message;
    statusMessage.className = 'status-message error';
    candidatesList.innerHTML = '';
    candidatesList.style.display = 'none';
  }
}); // Handle candidate selection
function showCandidates(candidates: GeocodingResult[]): void {
  candidatesList.innerHTML = '';

  for (const candidate of candidates) {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = formatLocationLabel(candidate);

    button.addEventListener('click', async () => {
      await loadLocationForecast(candidate);
    });

    li.appendChild(button);
    candidatesList.appendChild(li);
  }

  candidatesList.style.display = 'block';
}

// Initialize on page load
initializeLastLocation();
