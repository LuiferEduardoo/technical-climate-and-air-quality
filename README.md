# API de Clima y Calidad del Aire

Una API REST que, dada una ciudad, retorna las condiciones meteorológicas actuales y datos de calidad del aire. Además, usa IA para generar un **análisis** y **recomendaciones** en lenguaje sencillo que cualquier persona puede entender, sin necesidad de tener conocimientos en clima o meteorología.

---

## ¿Qué hace?

1. **Geocodifica** el nombre de la ciudad en coordenadas geográficas.
2. Obtiene datos de **clima actual** (temperatura, humedad, viento, índice UV, presión, visibilidad, etc.).
3. Obtiene mediciones de **calidad del aire** de estaciones de monitoreo cercanas (PM2.5, PM10, O₃, NO₂, SO₂, CO).
4. Calcula un **Índice de Confort** (0–100) basado en temperatura, humedad, calidad del aire y viento.
5. Envía todos los datos a **GPT-4.1**, que retorna un análisis breve y recomendaciones prácticas en lenguaje cotidiano.

### Ejemplo de respuesta

```json
{
  "location": { "city": "Bogota", "country": "CO", "timezone": "America/Bogota" },
  "comfort": { "index": 72, "rating": "Bueno" },
  "weather": {
    "description": "Parcialmente nublado",
    "temperature": { "current": 14.2, "feelsLike": 13.1 },
    "humidity": 78,
    "uvi": 5.2
  },
  "airQuality": {
    "pm25": { "value": 8.3, "unit": "µg/m³", "station": "Usme" }
  },
  "analisis": "Bogotá presenta condiciones climáticas moderadas con calidad del aire aceptable...",
  "recomendaciones": "Lleve un abrigo ligero y evite ejercicio físico prolongado al aire libre."
}
```

---

## Requisitos

- **Node.js** v18 o superior
- **npm** v9 o superior
- API keys de OpenAQ, IPinfo y OpenAI (ver [Variables de entorno](#variables-de-entorno))

---

## Ejecución en local

```bash
# 1. Clonar el repositorio
git clone https://github.com/LuiferEduardoo/technical-climate-and-air-quality.git
cd technical-climate-and-air-quality

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env y completar las API keys (ver siguiente sección)

# 4. Iniciar el servidor
npm run dev        # desarrollo — se reinicia automáticamente con cada cambio (Node 18+)
# o
npm start          # producción
```

La API estará disponible en `http://localhost:3000`.  
La documentación interactiva (Swagger UI) estará en `http://localhost:3000/docs`.

---

## Variables de entorno

Copia `.env.example` a `.env` y completa cada valor:

```env
PORT=3000

OPENAQ_API_KEY=tu_key_aqui
IPINFO_TOKEN=tu_token_aqui
OPENIA_API_KEY=tu_key_aqui
```

### Cómo generar cada API key

#### `OPENAQ_API_KEY` — OpenAQ
Se usa para consultar mediciones de calidad del aire. Es gratuita; la API key es opcional pero recomendada para evitar límites de velocidad.

1. Ir a [https://explore.openaq.org/register](https://explore.openaq.org/register) y crear una cuenta gratuita.
2. Una vez dentro, abrir el perfil y navegar a **API Keys**.
3. Hacer clic en **Generate key**, copiar la clave y pegarla en `.env`.

#### `IPINFO_TOKEN` — IPinfo
Se usa para detectar la ciudad del usuario a partir de su dirección IP cuando no se envía el parámetro `?city=`. El plan gratuito permite 50.000 solicitudes al mes.

1. Ir a [https://ipinfo.io/signup](https://ipinfo.io/signup) y crear una cuenta gratuita.
2. El token aparece en el dashboard inmediatamente después del registro.
3. Copiarlo y pegarlo en `.env`.

#### `OPENIA_API_KEY` — OpenAI
Se usa para generar el análisis y las recomendaciones en lenguaje natural mediante GPT-4.1. Requiere una cuenta de OpenAI con créditos disponibles.

1. Ir a [https://platform.openai.com/signup](https://platform.openai.com/signup) y crear una cuenta.
2. Navegar a **API keys** → **Create new secret key**.
3. Copiar la clave (solo se muestra una vez) y pegarla en `.env`.
4. Verificar que la cuenta tenga créditos en [https://platform.openai.com/settings/organization/billing](https://platform.openai.com/settings/organization/billing).

---

## Referencia del endpoint

### `GET /api/v1/climate`

| Parámetro | Tipo   | Requerido | Descripción                                                                                     |
|-----------|--------|-----------|-------------------------------------------------------------------------------------------------|
| `city`    | string | No        | Nombre de la ciudad (ej. `Bogota`, `Madrid`, `New York`). Si se omite, se detecta por la IP del cliente. |

La documentación interactiva completa está disponible en `/docs` (Swagger UI).

---

## APIs externas utilizadas

### Open-Meteo — Datos meteorológicos
**URL:** https://open-meteo.com  
**Para qué:** Proporciona pronósticos meteorológicos precisos y de alta resolución a nivel mundial. Retorna las condiciones actuales (temperatura, humedad, viento, índice UV, punto de rocío, visibilidad, nubosidad) y resúmenes diarios (temperatura mínima/máxima, amanecer/atardecer) en una sola petición.  
**Por qué:** Es completamente gratuita, no requiere API key ni cuenta, y no tiene restricciones de tasa imprevistas.

### Open-Meteo Geocoding — Ciudad → coordenadas
**URL:** https://geocoding-api.open-meteo.com  
**Para qué:** Convierte el nombre de una ciudad en coordenadas de latitud/longitud necesarias para los endpoints de clima y calidad del aire.  
**Por qué:** Es gratuita, sin API key, y retorna datos estructurados de ubicación (país, estado/región, zona horaria, elevación) junto con las coordenadas.

### OpenAQ — Calidad del aire
**URL:** https://openaq.org  
**Para qué:** Agrega mediciones en tiempo real de miles de estaciones de monitoreo gubernamentales y de investigación en todo el mundo. Provee lecturas individuales de contaminantes (PM2.5, PM10, O₃, NO₂, SO₂, CO) usadas tanto en la respuesta como en el cálculo del Índice de Confort.  
**Por qué:** Es la fuente de datos de calidad del aire abierta más completa disponible, con cobertura global y acceso gratuito.

### IPinfo — Geolocalización por IP
**URL:** https://ipinfo.io  
**Para qué:** Permite que la API funcione sin el parámetro `?city=`, detectando la ciudad del cliente a partir de su dirección IP. Se usa únicamente como alternativa de conveniencia; no se almacena ningún dato de ubicación.  
**Por qué:** Ofrece un plan gratuito generoso y una respuesta simple y directa.

### OpenAI (GPT-4.1) — Análisis con IA
**URL:** https://platform.openai.com  
**Para qué:** Traduce los datos meteorológicos y de calidad del aire en un análisis conciso y recomendaciones prácticas en lenguaje cotidiano, comprensibles para cualquier persona.  
**Por qué:** GPT-4.1 fue elegido por su precisión al seguir instrucciones y su bajo costo por token, lo que permite mantener las respuestas breves y enfocadas.

---

## Estructura del proyecto

```
src/
├── index.js                        # Punto de entrada de Express + Swagger UI
├── docs/
│   └── swagger.js                  # Especificación OpenAPI 3.0
├── routes/
│   └── climate.routes.js
├── controllers/
│   └── climate.controller.js
├── services/
│   ├── openMeteo.service.js        # Clima + geocodificación (Open-Meteo)
│   ├── openAQ.service.js           # Calidad del aire (OpenAQ v3)
│   ├── ipInfo.service.js           # Geolocalización por IP (IPinfo)
│   └── openai.service.js           # Análisis con IA (OpenAI GPT-4.1)
└── utils/
    └── comfortIndex.js             # Cálculo del Índice de Confort
```

---

## Licencia

ISC
