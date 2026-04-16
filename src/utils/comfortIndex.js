/**
 * Comfort Index (0–100)
 *
 * Weighted components:
 *   - Temperature  35 %   comfort zone 18–24 °C
 *   - Humidity     25 %   comfort zone 40–60 %
 *   - Air quality  30 %   based on PM2.5 (µg/m³)
 *   - Wind         10 %   optimal breeze 1–5 m/s
 *
 * Rating bands:
 *   80–100  Excellent
 *   60–79   Good
 *   40–59   Moderate
 *   20–39   Poor
 *   0–19    Very poor
 */

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// --- individual component scorers (each returns 0–100) ---

const temperatureScore = (tempC) => {
    if (tempC >= 18 && tempC <= 24) return 100;
    if (tempC < 18) return clamp(100 - (18 - tempC) * 7, 0, 100);
    return clamp(100 - (tempC - 24) * 7, 0, 100);
};

const humidityScore = (percent) => {
    if (percent >= 40 && percent <= 60) return 100;
    if (percent < 40) return clamp(100 - (40 - percent) * 2, 0, 100);
    return clamp(100 - (percent - 60) * 2, 0, 100);
};

/**
 * PM2.5-based air quality score using WHO 2021 breakpoints:
 *   0–5      → 100
 *   5–15     → 100–70
 *   15–25    → 70–50
 *   25–50    → 50–25
 *   50+      → 0
 */
const pm25Score = (pm25) => {
    if (pm25 <= 5)  return 100;
    if (pm25 <= 15) return clamp(100 - ((pm25 - 5)  / 10) * 30, 0, 100);
    if (pm25 <= 25) return clamp(70  - ((pm25 - 15) / 10) * 20, 0, 100);
    if (pm25 <= 50) return clamp(50  - ((pm25 - 25) / 25) * 25, 0, 100);
    return 0;
};

const windScore = (speedMs) => {
    if (speedMs >= 1 && speedMs <= 5) return 100;
    if (speedMs < 1)  return clamp(60 + speedMs * 40, 0, 100);
    if (speedMs <= 10) return clamp(100 - ((speedMs - 5) / 5) * 40, 0, 100);
    return clamp(60 - ((speedMs - 10) / 5) * 60, 0, 100);
};

// --- AQI category label from PM2.5 ---

const pm25Category = (pm25) => {
    if (pm25 <= 5)   return { label: 'Buena',                        color: 'green'  };
    if (pm25 <= 15)  return { label: 'Aceptable',                    color: 'yellow' };
    if (pm25 <= 25)  return { label: 'Moderada',                     color: 'orange' };
    if (pm25 <= 50)  return { label: 'Mala para grupos sensibles',    color: 'red'    };
    if (pm25 <= 75)  return { label: 'Mala',                         color: 'purple' };
    return                  { label: 'Muy mala',                     color: 'maroon' };
};

// --- comfort rating label ---

const comfortRating = (index) => {
    if (index >= 80) return 'Excelente';
    if (index >= 60) return 'Bueno';
    if (index >= 40) return 'Moderado';
    if (index >= 20) return 'Malo';
    return 'Muy malo';
};

// --- main export ---

/**
 * @param {object} weather  - { temperature: { current }, humidity, wind: { speed } }
 * @param {object|null} airQuality - { pm25: { value } } or null
 * @returns {{ index: number, rating: string, components: object }}
 */
const calculateComfortIndex = (weather, airQuality) => {
    const tempC    = weather.temperature.current;
    const humidity = weather.humidity;
    const windMs   = weather.wind.speed;
    const pm25     = airQuality?.pm25?.value ?? null;

    const tScore = temperatureScore(tempC);
    const hScore = humidityScore(humidity);
    const wScore = windScore(windMs);
    const aScore = pm25 !== null ? pm25Score(pm25) : null;

    // If no air quality data, redistribute its weight to temperature
    const index = aScore !== null
        ? tScore * 0.35 + hScore * 0.25 + aScore * 0.30 + wScore * 0.10
        : tScore * 0.65 + hScore * 0.25 + wScore * 0.10;

    const rounded = Math.round(index);

    return {
        index: rounded,
        rating: comfortRating(rounded),
        components: {
            temperature: { score: Math.round(tScore), value: tempC, unit: '°C' },
            humidity:    { score: Math.round(hScore), value: humidity, unit: '%' },
            wind:        { score: Math.round(wScore), value: windMs, unit: 'm/s' },
            ...(aScore !== null && {
                airQuality: {
                    score: Math.round(aScore),
                    pm25: pm25,
                    unit: 'µg/m³',
                    category: pm25Category(pm25),
                },
            }),
        },
    };
};

module.exports = { calculateComfortIndex, pm25Category };
