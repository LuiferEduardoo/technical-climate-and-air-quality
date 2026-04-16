const { getWeatherByCity }          = require('../services/openMeteo.service');
const { getAirQualityByCoordinates } = require('../services/openAQ.service');
const { getCityByIP }               = require('../services/ipInfo.service');
const { calculateComfortIndex }     = require('../utils/comfortIndex');
const { getAnalysis }               = require('../services/openai.service');

const getClimateAndAirQuality = async (req, res) => {
    let { city } = req.query;

    if (!city) {
        const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim()
            || req.socket.remoteAddress;

        try {
            city = await getCityByIP(clientIp);
        } catch {
            // IPinfo failure is non-fatal
        }

        if (!city) {
            return res.status(400).json({
                error: 'Debes proporcionar una ciudad en el query param ?city=',
            });
        }
    }

    let weather;
    try {
        weather = await getWeatherByCity(city);
    } catch (err) {
        const status = err.response?.status;
        if (status === 404) {
            return res.status(404).json({ error: `Ciudad no encontrada: "${city}"` });
        }
        if (status === 401) {
            console.log(status, err.response?.data);
            return res.status(502).json({ error: 'API key de OpenWeatherMap inválida.' });
        }
        return res.status(502).json({ error: 'Error al obtener datos del clima.' });
    }

    let airQuality = null;
    try {
        airQuality = await getAirQualityByCoordinates(
            weather.coordinates.lat,
            weather.coordinates.lon,
        );
    } catch {
        // Air quality is best-effort; proceed without it
    }

    const comfort = calculateComfortIndex(weather, airQuality);

    let analisis = null;
    let recomendaciones = null;
    try {
        const ai = await getAnalysis({ weather, airQuality, comfort });
        analisis        = ai.analisis;
        recomendaciones = ai.recomendaciones;
    } catch {
        // AI analysis is best-effort; proceed without it
    }

    return res.json({
        location: {
            city:        weather.city,
            state:       weather.state,
            country:     weather.country,
            coordinates: weather.coordinates,
            timezone:    weather.timezone,
        },
        comfort,
        weather: {
            description: weather.description,
            icon:        weather.icon,
            temperature: weather.temperature,
            humidity:    weather.humidity,
            pressure:    weather.pressure,
            uvi:         weather.uvi,
            visibility:  weather.visibility,
            cloudiness:  weather.cloudiness,
            wind:        weather.wind,
            sun:         weather.sun,
            ...(weather.alerts.length > 0 && { alerts: weather.alerts }),
        },
        airQuality: airQuality ?? { message: 'Sin datos de calidad del aire disponibles para esta ubicación.' },
        ...(analisis        && { analisis }),
        ...(recomendaciones && { recomendaciones }),
    });
};

module.exports = { getClimateAndAirQuality };
