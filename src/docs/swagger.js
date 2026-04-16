const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Climate and Air Quality API',
            version: '1.0.0',
            description: 'API que retorna clima, calidad del aire, índice de confort y análisis generado por IA para cualquier ciudad.',
        },
        servers: [{ url: '/api/v1', description: 'Servidor principal' }],
        components: {
            schemas: {
                Coordinates: {
                    type: 'object',
                    properties: {
                        lat: { type: 'number', example: 4.6097 },
                        lon: { type: 'number', example: -74.0817 },
                    },
                },
                Temperature: {
                    type: 'object',
                    properties: {
                        current:   { type: 'number', example: 14.2 },
                        feelsLike: { type: 'number', example: 13.1 },
                        min:       { type: 'number', example: 11.0 },
                        max:       { type: 'number', example: 17.5 },
                        dewPoint:  { type: 'number', example: 10.3 },
                    },
                },
                Wind: {
                    type: 'object',
                    properties: {
                        speed:     { type: 'number', example: 2.1, description: 'm/s' },
                        gust:      { type: 'number', example: 4.5, nullable: true },
                        direction: { type: 'number', example: 270, description: 'Grados (0-360)' },
                    },
                },
                Sun: {
                    type: 'object',
                    properties: {
                        sunrise: { type: 'string', example: '2025-04-16T11:02' },
                        sunset:  { type: 'string', example: '2025-04-16T23:10' },
                    },
                },
                ComfortComponent: {
                    type: 'object',
                    properties: {
                        score: { type: 'integer', example: 85 },
                        value: { type: 'number',  example: 21.3 },
                        unit:  { type: 'string',  example: '°C' },
                    },
                },
                AirQualityCategory: {
                    type: 'object',
                    properties: {
                        label: { type: 'string', example: 'Buena' },
                        color: { type: 'string', example: 'green' },
                    },
                },
                AirQualityComponent: {
                    type: 'object',
                    properties: {
                        score:    { type: 'integer', example: 90 },
                        pm25:     { type: 'number',  example: 8.3 },
                        unit:     { type: 'string',  example: 'µg/m³' },
                        category: { $ref: '#/components/schemas/AirQualityCategory' },
                    },
                },
                Comfort: {
                    type: 'object',
                    properties: {
                        index:  { type: 'integer', example: 72, description: '0–100' },
                        rating: { type: 'string',  example: 'Bueno' },
                        components: {
                            type: 'object',
                            properties: {
                                temperature: { $ref: '#/components/schemas/ComfortComponent' },
                                humidity:    { $ref: '#/components/schemas/ComfortComponent' },
                                wind:        { $ref: '#/components/schemas/ComfortComponent' },
                                airQuality:  { $ref: '#/components/schemas/AirQualityComponent' },
                            },
                        },
                    },
                },
                Measurement: {
                    type: 'object',
                    properties: {
                        value:    { type: 'number', example: 12.5 },
                        unit:     { type: 'string', example: 'µg/m³' },
                        datetime: { type: 'string', format: 'date-time', nullable: true },
                        station:  { type: 'string', example: 'Usme' },
                    },
                },
                AirQuality: {
                    type: 'object',
                    properties: {
                        pm25: { $ref: '#/components/schemas/Measurement' },
                        pm10: { $ref: '#/components/schemas/Measurement' },
                        o3:   { $ref: '#/components/schemas/Measurement' },
                        no2:  { $ref: '#/components/schemas/Measurement' },
                        so2:  { $ref: '#/components/schemas/Measurement' },
                        co:   { $ref: '#/components/schemas/Measurement' },
                    },
                },
                AirQualityUnavailable: {
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'Sin datos de calidad del aire disponibles para esta ubicación.' },
                    },
                },
                Alert: {
                    type: 'object',
                    properties: {
                        event:       { type: 'string', example: 'Lluvia intensa' },
                        sender:      { type: 'string', example: 'IDEAM' },
                        start:       { type: 'integer', example: 1713254400 },
                        end:         { type: 'integer', example: 1713297600 },
                        description: { type: 'string' },
                        tags:        { type: 'array', items: { type: 'string' } },
                    },
                },
                ClimateResponse: {
                    type: 'object',
                    properties: {
                        location: {
                            type: 'object',
                            properties: {
                                city:        { type: 'string',  example: 'Bogotá' },
                                state:       { type: 'string',  example: 'Bogota D.C.', nullable: true },
                                country:     { type: 'string',  example: 'CO' },
                                coordinates: { $ref: '#/components/schemas/Coordinates' },
                                timezone:    { type: 'string',  example: 'America/Bogota' },
                            },
                        },
                        comfort: { $ref: '#/components/schemas/Comfort' },
                        weather: {
                            type: 'object',
                            properties: {
                                description: { type: 'string',  example: 'Parcialmente nublado' },
                                icon:        { type: 'string',  example: 'https://openweathermap.org/img/wn/02d@2x.png' },
                                temperature: { $ref: '#/components/schemas/Temperature' },
                                humidity:    { type: 'number',  example: 78, description: '%' },
                                pressure:    { type: 'number',  example: 1013, description: 'hPa' },
                                uvi:         { type: 'number',  example: 5.2 },
                                visibility:  { type: 'number',  example: 10000, description: 'metros' },
                                cloudiness:  { type: 'number',  example: 45, description: '%' },
                                wind:        { $ref: '#/components/schemas/Wind' },
                                sun:         { $ref: '#/components/schemas/Sun' },
                                alerts: {
                                    type: 'array',
                                    items: { $ref: '#/components/schemas/Alert' },
                                    description: 'Solo aparece si hay alertas meteorológicas activas',
                                },
                            },
                        },
                        airQuality: {
                            oneOf: [
                                { $ref: '#/components/schemas/AirQuality' },
                                { $ref: '#/components/schemas/AirQualityUnavailable' },
                            ],
                        },
                        analisis: {
                            type: 'string',
                            nullable: true,
                            description: 'Análisis generado por IA (solo si OpenAI está disponible)',
                            example: 'La ciudad presenta condiciones climáticas moderadas con calidad del aire aceptable.',
                        },
                        recomendaciones: {
                            type: 'string',
                            nullable: true,
                            description: 'Recomendaciones generadas por IA (solo si OpenAI está disponible)',
                            example: 'Lleve un abrigo ligero y evite actividad física intensa al aire libre.',
                        },
                    },
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: { type: 'string', example: 'Ciudad no encontrada: "xyz"' },
                    },
                },
            },
        },
        paths: {
            '/climate': {
                get: {
                    summary: 'Clima, calidad del aire e índice de confort de una ciudad',
                    description: `Retorna datos meteorológicos actuales (Open-Meteo), calidad del aire (OpenAQ),
un índice de confort ponderado y un análisis + recomendaciones generados por IA (GPT-4.1).

Si no se envía \`city\`, se intenta detectar la ciudad automáticamente por la IP del cliente.`,
                    operationId: 'getClimateAndAirQuality',
                    tags: ['Clima'],
                    parameters: [
                        {
                            name: 'city',
                            in: 'query',
                            required: false,
                            description: 'Nombre de la ciudad (ej. Bogota, Madrid, New York)',
                            schema: { type: 'string', example: 'Bogota' },
                        },
                    ],
                    responses: {
                        200: {
                            description: 'Datos obtenidos correctamente',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ClimateResponse' },
                                },
                            },
                        },
                        400: {
                            description: 'No se proporcionó ciudad y no se pudo detectar por IP',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/Error' },
                                },
                            },
                        },
                        404: {
                            description: 'Ciudad no encontrada',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/Error' },
                                },
                            },
                        },
                        502: {
                            description: 'Error al comunicarse con un servicio externo',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/Error' },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
    apis: [],
};

module.exports = swaggerJsdoc(options);
