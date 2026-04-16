const OpenAI = require('openai');

const getAnalysis = async ({ weather, airQuality, comfort }) => {
    const client = new OpenAI({ apiKey: process.env.OPENIA_API_KEY });

    const datos = JSON.stringify({
        ciudad:          `${weather.city}, ${weather.country}`,
        temperatura:     `${weather.temperature.current}°C (sensacion ${weather.temperature.feelsLike}°C)`,
        humedad:         `${weather.humidity}%`,
        viento:          `${weather.wind.speed} m/s`,
        uvi:             weather.uvi,
        descripcion:     weather.description,
        indiceConfort:   `${comfort.index}/100 (${comfort.rating})`,
        ...(airQuality?.pm25  && { pm25:  `${airQuality.pm25.value} ${airQuality.pm25.unit}`  }),
        ...(airQuality?.pm10  && { pm10:  `${airQuality.pm10.value} ${airQuality.pm10.unit}`  }),
        ...(airQuality?.o3    && { o3:    `${airQuality.o3.value} ${airQuality.o3.unit}`      }),
        ...(airQuality?.no2   && { no2:   `${airQuality.no2.value} ${airQuality.no2.unit}`   }),
    });

    const response = await client.chat.completions.create({
        model: 'gpt-4.1',
        max_tokens: 300,
        response_format: { type: 'json_object' },
        messages: [
            {
                role: 'user',
                content: `Actúa como un metrólogo, meteorólogo y especialista en calidad del aire. Con los siguientes datos:
                <datos>
                ${datos}
                </datos>
                Regresa un análisis breve y recomendaciones para una persona del común. Sé breve y conciso.
                Responde ÚNICAMENTE con un JSON con esta estructura exacta:
                {"analisis": "...", "recomendaciones": "..."}`,
            },
        ],
    });

    return JSON.parse(response.choices[0].message.content);
};

module.exports = { getAnalysis };
