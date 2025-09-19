const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Vehicle name is required'],
    trim: true,
    maxlength: [100, 'Vehicle name cannot exceed 100 characters']
  },
  capacityKg: {
    type: Number,
    required: [true, 'Capacity in KG is required'],
    min: [1, 'Capacity must be at least 1 KG'],
    max: [10000, 'Capacity cannot exceed 10,000 KG']
  },
  tyres: {
    type: Number,
    required: [true, 'Number of tyres is required'],
    min: [2, 'Vehicle must have at least 2 tyres'],
    max: [20, 'Vehicle cannot have more than 20 tyres']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
vehicleSchema.index({ capacityKg: 1 });
vehicleSchema.index({ isActive: 1 });

module.exports = mongoose.model('Vehicle', vehicleSchema);

