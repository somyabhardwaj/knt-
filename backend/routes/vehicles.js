const express = require('express');
const router = express.Router();
const { addVehicle, getAvailableVehicles, getVehicles } = require('../controllers/vehiclesController');

// POST /api/vehicles - Add a new vehicle
router.post('/', addVehicle);

// GET /api/vehicles/available - Find available vehicles
router.get('/available', getAvailableVehicles);

// GET /api/vehicles - Get all vehicles (for admin purposes)
router.get('/', getVehicles);

module.exports = router;

