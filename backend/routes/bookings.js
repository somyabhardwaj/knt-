const express = require('express');
const router = express.Router();
const { createBooking, getBookings, getBookingById, cancelBooking } = require('../controllers/bookingsController');

// POST /api/bookings - Book a vehicle
router.post('/', createBooking);

// GET /api/bookings - Get all bookings (for admin purposes)
router.get('/', getBookings);

// GET /api/bookings/:id - Get specific booking
router.get('/:id', getBookingById);

// DELETE /api/bookings/:id - Cancel a booking (Bonus feature)
router.delete('/:id', cancelBooking);

module.exports = router;

