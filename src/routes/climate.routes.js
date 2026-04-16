const { Router } = require('express');
const { getClimateAndAirQuality } = require('../controllers/climate.controller');

const router = Router();

// GET /api/climate?city=Bogota
router.get('/', getClimateAndAirQuality);

module.exports = router;
