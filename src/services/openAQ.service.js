const axios = require('axios');

const BASE_URL   = 'https://api.openaq.org/v3';
const PARAMETERS = ['pm25', 'pm10', 'o3', 'no2', 'so2', 'co'];

const buildHeaders = () => {
    const headers = {};
    if (process.env.OPENAQ_API_KEY) {
        headers['X-API-Key'] = process.env.OPENAQ_API_KEY;
    }
    return headers;
};

/**
 * Step 1 – Get nearby monitoring stations (max radius: 25 000 m).
 */
const getNearbyLocations = async (lat, lon) => {
    const res = await axios.get(`${BASE_URL}/locations`, {
        headers: buildHeaders(),
        params: {
            coordinates: `${lat},${lon}`,
            radius: 25000,
            limit: 5,
        },
    });
    return res.data.results ?? [];
};

/**
 * Step 2 – Fetch sensors (with latest values) for a single location.
 */
const getSensors = async (locationId) => {
    const res = await axios.get(`${BASE_URL}/locations/${locationId}/sensors`, {
        headers: buildHeaders(),
    });
    return res.data.results ?? [];
};

/**
 * Main – Find the nearest stations and aggregate the latest reading
 * per parameter. Stations are queried in parallel; first valid value wins.
 */
const getAirQualityByCoordinates = async (lat, lon) => {
    const locations = await getNearbyLocations(lat, lon);
    if (locations.length === 0) return null;

    // Fetch all sensor lists in parallel
    const sensorGroups = await Promise.all(
        locations.map((loc) =>
            getSensors(loc.id)
                .then((sensors) => ({ station: loc.name, sensors }))
                .catch(() => null),
        ),
    );

    const measurements = {};

    for (const group of sensorGroups) {
        if (!group) continue;

        for (const sensor of group.sensors) {
            const paramName = sensor.parameter?.name?.toLowerCase();
            if (!PARAMETERS.includes(paramName)) continue;
            if (measurements[paramName]) continue;

            const value = sensor.latest?.value;
            if (value == null) continue;

            measurements[paramName] = {
                value,
                unit:     sensor.parameter.units,
                datetime: sensor.latest.datetime?.utc ?? null,
                station:  group.station,
            };
        }

        if (Object.keys(measurements).length === PARAMETERS.length) break;
    }

    return Object.keys(measurements).length > 0 ? measurements : null;
};

module.exports = { getAirQualityByCoordinates };
