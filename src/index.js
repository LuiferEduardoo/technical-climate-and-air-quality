require('dotenv').config();
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./docs/swagger');
const climateRoutes = require('./routes/climate.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/', (req, res) => {
    res.json({ message: 'Climate and Air Quality API — documentación en /docs' });
});

app.use('/api/v1/climate', climateRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
