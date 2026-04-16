require('dotenv').config();
const express = require('express');
const climateRoutes = require('./routes/climate.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Climate and Air Quality API, view documentation at /docs' });
});

app.use('/api/v1/climate', climateRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
