const axios = require('axios');

const GEO_URL     = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';

// WMO Weather Interpretation Codes → Spanish description
const WMO_CODES = {
    0:  'Cielo despejado',
    1:  'Mayormente despejado',
    2:  'Parcialmente nublado',
    3:  'Nublado',
    45: 'Niebla',
    48: 'Niebla con escarcha',
    51: 'Llovizna ligera',
    53: 'Llovizna moderada',
    55: 'Llovizna densa',
    56: 'Llovizna engelante ligera',
    57: 'Llovizna engelante densa',
    61: 'Lluvia ligera',
    63: 'Lluvia moderada',
    65: 'Lluvia intensa',
    66: 'Lluvia engelante ligera',
    67: 'Lluvia engelante intensa',
    71: 'Nevada ligera',
    73: 'Nevada moderada',
    75: 'Nevada intensa',
    77: 'Granizo menudo',
    80: 'Chubascos ligeros',
    81: 'Chubascos moderados',
    82: 'Chubascos violentos',
    85: 'Chubascos de nieve ligeros',
    86: 'Chubascos de nieve intensos',
    95: 'Tormenta eléctrica',
    96: 'Tormenta con granizo ligero',
    99: 'Tormenta con granizo intenso',
};

const describeCode = (code) => WMO_CODES[code] ?? 'Sin descripción';

/**
 * Step 1 – Resolve city name → coordinates via Open-Meteo Geocoding API.
 */
const geocodeCity = async (city) => {
    const response = await axios.get(GEO_URL, {
        params: { name: city, count: 1, language: 'es', format: 'json' },
    });

    const results = response.data.results;
    if (!results || results.length === 0) {
        const err = new Error(`Ciudad no encontrada: "${city}"`);
        err.response = { status: 404 };
        throw err;
    }

    const { name, latitude, longitude, country_code, country, admin1, timezone, elevation } = results[0];
    return { name, lat: latitude, lon: longitude, country: country_code, countryName: country, state: admin1 ?? null, timezone, elevation };
};

/**
 * Step 2 – Fetch current + daily weather from Open-Meteo (no API key required).
 */
const fetchWeather = async (lat, lon, timezone) => {
    const response = await axios.get(WEATHER_URL, {
        params: {
            latitude:         lat,
            longitude:        lon,
            timezone:         timezone ?? 'auto',
            wind_speed_unit:  'ms',
            current: [
                'temperature_2m',
                'apparent_temperature',
                'relative_humidity_2m',
                'dew_point_2m',
                'precipitation',
                'weather_code',
                'cloud_cover',
                'pressure_msl',
                'wind_speed_10m',
                'wind_direction_10m',
                'wind_gusts_10m',
                'uv_index',
                'visibility',
                'is_day',
            ].join(','),
            daily: [
                'temperature_2m_max',
                'temperature_2m_min',
                'sunrise',
                'sunset',
                'uv_index_max',
                'precipitation_sum',
            ].join(','),
        },
    });
    return response.data;
};

/**
 * Main function – geocode city then fetch weather from Open-Meteo.
 */
const getWeatherByCity = async (city) => {
    const geo  = await geocodeCity(city);
    const data = await fetchWeather(geo.lat, geo.lon, geo.timezone);
    const c    = data.current;
    const d0   = data.daily;

    return {
        city:    geo.name,
        country: geo.country,
        state:   geo.state,
        coordinates: { lat: geo.lat, lon: geo.lon },
        timezone:    geo.timezone,
        elevation:   geo.elevation,

        temperature: {
            current:   c.temperature_2m,
            feelsLike: c.apparent_temperature,
            min:       d0.temperature_2m_min?.[0] ?? null,
            max:       d0.temperature_2m_max?.[0] ?? null,
            dewPoint:  c.dew_point_2m,
        },
        humidity:    c.relative_humidity_2m,
        pressure:    c.pressure_msl,
        uvi:         c.uv_index,
        visibility:  c.visibility,
        cloudiness:  c.cloud_cover,
        precipitation: c.precipitation,
        wind: {
            speed:     c.wind_speed_10m,
            gust:      c.wind_gusts_10m ?? null,
            direction: c.wind_direction_10m ?? null,
        },
        sun: {
            sunrise: d0.sunrise?.[0] ?? null,
            sunset:  d0.sunset?.[0]  ?? null,
        },
        weatherCode: c.weather_code,
        description: describeCode(c.weather_code),
        isDay:       c.is_day === 1,
        alerts: [],
    };
};

module.exports = { getWeatherByCity };