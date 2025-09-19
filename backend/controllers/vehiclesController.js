const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');
const { calculateRideDuration } = require('../utils/rideDuration');

// POST /api/vehicles - Add a new vehicle
async function addVehicle(req, res) {
  try {
    const { name, capacityKg, tyres } = req.body;

    if (!name || !capacityKg || !tyres) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, capacityKg, and tyres are required'
      });
    }

    if (typeof capacityKg !== 'number' || capacityKg <= 0) {
      return res.status(400).json({ success: false, message: 'capacityKg must be a positive number' });
    }

    if (typeof tyres !== 'number' || tyres < 2) {
      return res.status(400).json({ success: false, message: 'tyres must be a number greater than or equal to 2' });
    }

    const vehicle = new Vehicle({ name: name.trim(), capacityKg, tyres });
    await vehicle.save();

    return res.status(201).json({ success: true, message: 'Vehicle added successfully', data: vehicle });
  } catch (error) {
    console.error('Error adding vehicle:', error);
    return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
}

// GET /api/vehicles/available - Find available vehicles
async function getAvailableVehicles(req, res) {
  try {
    const { capacityRequired, fromPincode, toPincode, startTime } = req.query;

    if (!capacityRequired || !fromPincode || !toPincode || !startTime) {
      return res.status(400).json({
        success: false,
        message: 'Missing required query parameters: capacityRequired, fromPincode, toPincode, and startTime are required'
      });
    }

    const capacity = parseInt(capacityRequired);
    if (isNaN(capacity) || capacity <= 0) {
      return res.status(400).json({ success: false, message: 'capacityRequired must be a positive number' });
    }

    const startTimeDate = new Date(startTime);
    if (isNaN(startTimeDate.getTime())) {
      return res.status(400).json({ success: false, message: 'startTime must be a valid ISO date string' });
    }

    const estimatedRideDurationHours = calculateRideDuration(fromPincode, toPincode);
    const endTime = new Date(startTimeDate.getTime() + estimatedRideDurationHours * 60 * 60 * 1000);

    const vehicles = await Vehicle.find({ capacityKg: { $gte: capacity }, isActive: true });

    const availableVehicles = [];
    for (const vehicle of vehicles) {
      const conflictingBookings = await Booking.find({
        vehicleId: vehicle._id,
        status: 'active',
        $or: [
          {
            startTime: { $lt: endTime },
            endTime: { $gt: startTimeDate }
          }
        ]
      });

      if (conflictingBookings.length === 0) {
        availableVehicles.push(vehicle);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Available vehicles retrieved successfully',
      data: {
        vehicles: availableVehicles,
        estimatedRideDurationHours,
        searchCriteria: { capacityRequired: capacity, fromPincode, toPincode, startTime: startTimeDate, endTime }
      }
    });
  } catch (error) {
    console.error('Error finding available vehicles:', error);
    return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
}

// GET /api/vehicles - Get all vehicles
async function getVehicles(req, res) {
  try {
    const vehicles = await Vehicle.find({ isActive: true }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, message: 'Vehicles retrieved successfully', data: vehicles });
  } catch (error) {
    console.error('Error retrieving vehicles:', error);
    return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
}

module.exports = { addVehicle, getAvailableVehicles, getVehicles };
