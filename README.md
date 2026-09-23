# WeatherVue

Compare weather forecast predictions from multiple weather models in one place. They each tend to get it wrong, but maybe on average...?

## About

WeatherVue lets you enter a city or area name and instantly see forecast predictions from five major global weather models (ECMWF, GFS/NOAA, ICON/DWD, Météo-France, and UK Met Office) overlaid on interactive charts. Compare temperature, apparent temperature ("real feel"), precipitation, and wind forecasts side-by-side to get a better sense of forecast variability and reliability.

The app saves your last-searched location locally, so it's ready to go when you return.

### Features

- **Multiple forecast tabs**: 30-hour and 7-day forecasts in tabbed views
- **Mobile responsive**: Fully optimized for desktop and mobile devices with adaptive chart layouts
- **Interactive charts**: Zoom, pan, and hover to inspect detailed forecast data
- **Model comparison**: Side-by-side comparison of multiple weather prediction models with averaged forecast

## Live Demo

[weathervue on GitHub Pages](https://shacharres.github.io/weathervue/)

## Development

### Prerequisites
- Node.js 20+ and npm

### Setup
```bash
npm install
```

### Development server
```bash
npm run dev
```
Open the printed localhost URL in your browser.

### Build for production
```bash
npm run build
```
The production build is output to `dist/`.

### Preview production build locally
```bash
npm run preview
```

## Deployment

This app is designed to deploy as a static site on GitHub Pages.

### First-time setup
1. Push this repo to GitHub
2. In your repo's Settings → Pages, set Source to "GitHub Actions"
3. Push to `main` - the GitHub Actions workflow will build and deploy automatically

The site will be live at `https://<your-username>.github.io/weathervue/`

## Data Sources

- **Weather forecasts**: [Open-Meteo API](https://open-meteo.com/) - free, no API key required, multiple weather models
- **Geocoding**: Open-Meteo Geocoding API - converts city names to coordinates

## Architecture

- **Frontend**: Vite + vanilla TypeScript
- **Charts**: Plotly.js with responsive mobile layout adaptation
- **Storage**: Browser localStorage (last searched location)
- **Styling**: Plain CSS with mobile-first responsive design
- **Responsive Design**: Charts automatically adapt to viewport size with optimized margins, legend positioning, and font sizes for both desktop and mobile screens

## License

MIT
