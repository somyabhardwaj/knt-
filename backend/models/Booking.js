const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: [true, 'Vehicle ID is required']
  },
  fromPincode: {
    type: String,
    required: [true, 'From pincode is required'],
    trim: true,
    match: [/^\d{6}$/, 'Pincode must be exactly 6 digits']
  },
  toPincode: {
    type: String,
    required: [true, 'To pincode is required'],
    trim: true,
    match: [/^\d{6}$/, 'Pincode must be exactly 6 digits']
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: Date,
    required: [true, 'End time is required']
  },
  customerId: {
    type: String,
    required: [true, 'Customer ID is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  estimatedRideDurationHours: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
bookingSchema.index({ vehicleId: 1, startTime: 1, endTime: 1 });
bookingSchema.index({ customerId: 1 });
bookingSchema.index({ status: 1 });

// Compound index for availability checking
bookingSchema.index({ 
  vehicleId: 1, 
  startTime: 1, 
  endTime: 1, 
  status: 1 
});

module.exports = mongoose.model('Booking', bookingSchema);

