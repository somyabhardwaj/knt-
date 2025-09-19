const { calculateRideDuration, timeRangesOverlap } = require('../utils/rideDuration');

describe('Ride Duration Calculation', () => {
  describe('calculateRideDuration', () => {
    test('should calculate duration correctly for different pincodes', () => {
      expect(calculateRideDuration('110001', '110002')).toBe(1);
      expect(calculateRideDuration('110001', '110010')).toBe(9);
      expect(calculateRideDuration('110001', '110100')).toBe(3); // (110100 - 110001) % 24 = 3
    });

    test('should handle reverse pincode order', () => {
      expect(calculateRideDuration('110010', '110001')).toBe(9);
      expect(calculateRideDuration('400001', '100001')).toBe(1); // (400001 - 100001) % 24 = 1, but minimum is 1
    });

    test('should ensure minimum duration of 1 hour', () => {
      expect(calculateRideDuration('110001', '110001')).toBe(1);
    });

    test('should handle large pincode differences', () => {
      expect(calculateRideDuration('100001', '999999')).toBe(22); // (999999 - 100001) % 24 = 22
    });

    test('should throw error for invalid pincode format', () => {
      expect(() => calculateRideDuration('invalid', '110001')).toThrow('Invalid pincode format');
      expect(() => calculateRideDuration('110001', 'invalid')).toThrow('Invalid pincode format');
      expect(() => calculateRideDuration('', '110001')).toThrow('Invalid pincode format');
    });

    test('should handle non-numeric pincodes', () => {
      expect(() => calculateRideDuration('abc123', '110001')).toThrow('Invalid pincode format');
    });
  });

  describe('timeRangesOverlap', () => {
    const baseTime = new Date('2023-10-27T10:00:00Z');
    const oneHour = 60 * 60 * 1000;

    test('should detect overlapping time ranges', () => {
      const start1 = baseTime;
      const end1 = new Date(baseTime.getTime() + oneHour);
      const start2 = new Date(baseTime.getTime() + 30 * 60 * 1000); // 30 minutes later
      const end2 = new Date(baseTime.getTime() + 90 * 60 * 1000); // 90 minutes later

      expect(timeRangesOverlap(start1, end1, start2, end2)).toBe(true);
    });

    test('should detect non-overlapping time ranges', () => {
      const start1 = baseTime;
      const end1 = new Date(baseTime.getTime() + oneHour);
      const start2 = new Date(baseTime.getTime() + 2 * oneHour); // 2 hours later
      const end2 = new Date(baseTime.getTime() + 3 * oneHour); // 3 hours later

      expect(timeRangesOverlap(start1, end1, start2, end2)).toBe(false);
    });

    test('should detect adjacent time ranges as non-overlapping', () => {
      const start1 = baseTime;
      const end1 = new Date(baseTime.getTime() + oneHour);
      const start2 = new Date(baseTime.getTime() + oneHour); // Exactly at end1
      const end2 = new Date(baseTime.getTime() + 2 * oneHour);

      expect(timeRangesOverlap(start1, end1, start2, end2)).toBe(false);
    });

    test('should handle identical time ranges', () => {
      const start1 = baseTime;
      const end1 = new Date(baseTime.getTime() + oneHour);
      const start2 = baseTime;
      const end2 = new Date(baseTime.getTime() + oneHour);

      expect(timeRangesOverlap(start1, end1, start2, end2)).toBe(true);
    });
  });
});
