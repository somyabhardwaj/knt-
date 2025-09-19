const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');
const { calculateRideDuration } = require('../utils/rideDuration');

// POST /api/bookings - Book a vehicle
async function createBooking(req, res) {
  try {
    const { vehicleId, fromPincode, toPincode, startTime, customerId } = req.body;

    if (!vehicleId || !fromPincode || !toPincode || !startTime || !customerId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: vehicleId, fromPincode, toPincode, startTime, and customerId are required'
      });
    }

    const startTimeDate = new Date(startTime);
    if (isNaN(startTimeDate.getTime())) {
      return res.status(400).json({ success: false, message: 'startTime must be a valid ISO date string' });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    if (!vehicle.isActive) {
      return res.status(400).json({ success: false, message: 'Vehicle is not available for booking' });
    }

    const estimatedRideDurationHours = calculateRideDuration(fromPincode, toPincode);
    const bookingEndTime = new Date(startTimeDate.getTime() + estimatedRideDurationHours * 60 * 60 * 1000);

    const conflictingBookings = await Booking.find({
      vehicleId: vehicleId,
      status: 'active',
      $or: [
        {
          startTime: { $lt: bookingEndTime },
          endTime: { $gt: startTimeDate }
        }
      ]
    });

    if (conflictingBookings.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Vehicle is already booked for an overlapping time slot',
        conflictingBookings: conflictingBookings.map(booking => ({ id: booking._id, startTime: booking.startTime, endTime: booking.endTime }))
      });
    }

    const booking = new Booking({
      vehicleId,
      fromPincode,
      toPincode,
      startTime: startTimeDate,
      endTime: bookingEndTime,
      customerId,
      estimatedRideDurationHours
    });

    await booking.save();
    await booking.populate('vehicleId', 'name capacityKg tyres');

    return res.status(201).json({ success: true, message: 'Vehicle booked successfully', data: booking });
  } catch (error) {
    console.error('Error creating booking:', error);
    return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
}

// GET /api/bookings - Get all bookings
async function getBookings(req, res) {
  try {
    const { customerId, status } = req.query;

    let query = {};
    if (customerId) {
      query.customerId = customerId;
    }
    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query).populate('vehicleId', 'name capacityKg tyres').sort({ createdAt: -1 });

    return res.status(200).json({ success: true, message: 'Bookings retrieved successfully', data: bookings });
  } catch (error) {
    console.error('Error retrieving bookings:', error);
    return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
}

// GET /api/bookings/:id - Get specific booking
async function getBookingById(req, res) {
  try {
    const booking = await Booking.findById(req.params.id).populate('vehicleId', 'name capacityKg tyres');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    return res.status(200).json({ success: true, message: 'Booking retrieved successfully', data: booking });
  } catch (error) {
    console.error('Error retrieving booking:', error);
    return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
}

// DELETE /api/bookings/:id - Cancel a booking
async function cancelBooking(req, res) {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Booking is already cancelled' });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Cannot cancel a completed booking' });
    }

    booking.status = 'cancelled';
    await booking.save();

    return res.status(200).json({ success: true, message: 'Booking cancelled successfully', data: booking });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
}

module.exports = { createBooking, getBookings, getBookingById, cancelBooking };
