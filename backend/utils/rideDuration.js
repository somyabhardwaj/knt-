/**
 * Calculate estimated ride duration based on pincodes
 * This is a simplified placeholder logic for demonstration purposes
 * In a real application, this would use actual distance calculations
 * or integration with mapping services like Google Maps API
 * 
 * @param {string} fromPincode - Source pincode
 * @param {string} toPincode - Destination pincode
 * @returns {number} Estimated duration in hours
 */
const calculateRideDuration = (fromPincode, toPincode) => {
  try {
    const fromNum = parseInt(fromPincode);
    const toNum = parseInt(toPincode);
    
    if (isNaN(fromNum) || isNaN(toNum)) {
      throw new Error('Invalid pincode format');
    }
    
    // Simplified logic: absolute difference modulo 24
    const duration = Math.abs(toNum - fromNum) % 24;
    
    // Ensure minimum duration of 1 hour
    return Math.max(duration, 1);
  } catch (error) {
    throw new Error(`Error calculating ride duration: ${error.message}`);
  }
};

/**
 * Check if two time ranges overlap
 * @param {Date} start1 - Start time of first range
 * @param {Date} end1 - End time of first range
 * @param {Date} start2 - Start time of second range
 * @param {Date} end2 - End time of second range
 * @returns {boolean} True if ranges overlap
 */
const timeRangesOverlap = (start1, end1, start2, end2) => {
  return start1 < end2 && start2 < end1;
};

module.exports = {
  calculateRideDuration,
  timeRangesOverlap
};

