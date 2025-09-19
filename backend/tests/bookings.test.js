const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');

// Test database
const TEST_DB_URI = 'mongodb://localhost:27017/fleetlink_test';

beforeAll(async () => {
  // Connect to test database
  await mongoose.connect(TEST_DB_URI);
});

afterAll(async () => {
  // Clean up and close connection
  await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();
});

beforeEach(async () => {
  // Clean up before each test
  await Vehicle.deleteMany({});
  await Booking.deleteMany({});
});

describe('POST /api/bookings', () => {
  let testVehicle;

  beforeEach(async () => {
    testVehicle = await Vehicle.create({
      name: 'Test Truck',
      capacityKg: 1000,
      tyres: 6
    });
  });

  test('should create a booking with valid data', async () => {
    const bookingData = {
      vehicleId: testVehicle._id.toString(),
      fromPincode: '110001',
      toPincode: '110002',
      startTime: '2023-10-27T10:00:00Z',
      customerId: 'customer123'
    };

    const response = await request(app)
      .post('/api/bookings')
      .send(bookingData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.vehicleId.toString()).toBe(testVehicle._id.toString());
    expect(response.body.data.fromPincode).toBe(bookingData.fromPincode);
    expect(response.body.data.toPincode).toBe(bookingData.toPincode);
    expect(response.body.data.customerId).toBe(bookingData.customerId);
    expect(response.body.data.status).toBe('active');
    expect(response.body.data.estimatedRideDurationHours).toBe(1);
  });

  test('should return 400 for missing required fields', async () => {
    const response = await request(app)
      .post('/api/bookings')
      .send({})
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Missing required fields');
  });

  test('should return 404 for non-existent vehicle', async () => {
    const bookingData = {
      vehicleId: new mongoose.Types.ObjectId().toString(),
      fromPincode: '110001',
      toPincode: '110002',
      startTime: '2023-10-27T10:00:00Z',
      customerId: 'customer123'
    };

    const response = await request(app)
      .post('/api/bookings')
      .send(bookingData)
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Vehicle not found');
  });

  test('should return 400 for inactive vehicle', async () => {
    testVehicle.isActive = false;
    await testVehicle.save();

    const bookingData = {
      vehicleId: testVehicle._id.toString(),
      fromPincode: '110001',
      toPincode: '110002',
      startTime: '2023-10-27T10:00:00Z',
      customerId: 'customer123'
    };

    const response = await request(app)
      .post('/api/bookings')
      .send(bookingData)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Vehicle is not available for booking');
  });

  test('should return 400 for invalid startTime', async () => {
    const bookingData = {
      vehicleId: testVehicle._id.toString(),
      fromPincode: '110001',
      toPincode: '110002',
      startTime: 'invalid-date',
      customerId: 'customer123'
    };

    const response = await request(app)
      .post('/api/bookings')
      .send(bookingData)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('startTime must be a valid ISO date string');
  });

  test('should return 409 for conflicting booking', async () => {
    // Create an existing booking
    await Booking.create({
      vehicleId: testVehicle._id,
      fromPincode: '110001',
      toPincode: '110002',
      startTime: new Date('2023-10-27T10:00:00Z'),
      endTime: new Date('2023-10-27T11:00:00Z'),
      customerId: 'customer1',
      estimatedRideDurationHours: 1
    });

    const bookingData = {
      vehicleId: testVehicle._id.toString(),
      fromPincode: '110001',
      toPincode: '110002',
      startTime: '2023-10-27T10:30:00Z', // Overlaps with existing booking
      customerId: 'customer2'
    };

    const response = await request(app)
      .post('/api/bookings')
      .send(bookingData)
      .expect(409);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Vehicle is already booked for an overlapping time slot');
    expect(response.body.conflictingBookings).toHaveLength(1);
  });

  test('should allow non-overlapping bookings for same vehicle', async () => {
    // Create an existing booking
    await Booking.create({
      vehicleId: testVehicle._id,
      fromPincode: '110001',
      toPincode: '110002',
      startTime: new Date('2023-10-27T10:00:00Z'),
      endTime: new Date('2023-10-27T11:00:00Z'),
      customerId: 'customer1',
      estimatedRideDurationHours: 1
    });

    const bookingData = {
      vehicleId: testVehicle._id.toString(),
      fromPincode: '110001',
      toPincode: '110002',
      startTime: '2023-10-27T12:00:00Z', // No overlap
      customerId: 'customer2'
    };

    const response = await request(app)
      .post('/api/bookings')
      .send(bookingData)
      .expect(201);

    expect(response.body.success).toBe(true);
  });
});

describe('GET /api/bookings', () => {
  let testVehicle;

  beforeEach(async () => {
    testVehicle = await Vehicle.create({
      name: 'Test Truck',
      capacityKg: 1000,
      tyres: 6
    });

    await Booking.create([
      {
        vehicleId: testVehicle._id,
        fromPincode: '110001',
        toPincode: '110002',
        startTime: new Date('2023-10-27T10:00:00Z'),
        endTime: new Date('2023-10-27T11:00:00Z'),
        customerId: 'customer1',
        estimatedRideDurationHours: 1
      },
      {
        vehicleId: testVehicle._id,
        fromPincode: '110003',
        toPincode: '110004',
        startTime: new Date('2023-10-27T12:00:00Z'),
        endTime: new Date('2023-10-27T13:00:00Z'),
        customerId: 'customer2',
        estimatedRideDurationHours: 1
      }
    ]);
  });

  test('should return all bookings', async () => {
    const response = await request(app)
      .get('/api/bookings')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(2);
  });

  test('should filter bookings by customerId', async () => {
    const response = await request(app)
      .get('/api/bookings')
      .query({ customerId: 'customer1' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].customerId).toBe('customer1');
  });

  test('should filter bookings by status', async () => {
    const response = await request(app)
      .get('/api/bookings')
      .query({ status: 'active' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data.every(booking => booking.status === 'active')).toBe(true);
  });
});

describe('GET /api/bookings/:id', () => {
  let testVehicle, testBooking;

  beforeEach(async () => {
    testVehicle = await Vehicle.create({
      name: 'Test Truck',
      capacityKg: 1000,
      tyres: 6
    });

    testBooking = await Booking.create({
      vehicleId: testVehicle._id,
      fromPincode: '110001',
      toPincode: '110002',
      startTime: new Date('2023-10-27T10:00:00Z'),
      endTime: new Date('2023-10-27T11:00:00Z'),
      customerId: 'customer1',
      estimatedRideDurationHours: 1
    });
  });

  test('should return specific booking', async () => {
    const response = await request(app)
      .get(`/api/bookings/${testBooking._id}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data._id).toBe(testBooking._id.toString());
    expect(response.body.data.vehicleId).toBeDefined();
  });

  test('should return 404 for non-existent booking', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .get(`/api/bookings/${nonExistentId}`)
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Booking not found');
  });
});

describe('DELETE /api/bookings/:id', () => {
  let testVehicle, testBooking;

  beforeEach(async () => {
    testVehicle = await Vehicle.create({
      name: 'Test Truck',
      capacityKg: 1000,
      tyres: 6
    });

    testBooking = await Booking.create({
      vehicleId: testVehicle._id,
      fromPincode: '110001',
      toPincode: '110002',
      startTime: new Date('2023-10-27T10:00:00Z'),
      endTime: new Date('2023-10-27T11:00:00Z'),
      customerId: 'customer1',
      estimatedRideDurationHours: 1
    });
  });

  test('should cancel an active booking', async () => {
    const response = await request(app)
      .delete(`/api/bookings/${testBooking._id}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('cancelled');

    // Verify in database
    const updatedBooking = await Booking.findById(testBooking._id);
    expect(updatedBooking.status).toBe('cancelled');
  });

  test('should return 404 for non-existent booking', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .delete(`/api/bookings/${nonExistentId}`)
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Booking not found');
  });

  test('should return 400 for already cancelled booking', async () => {
    testBooking.status = 'cancelled';
    await testBooking.save();

    const response = await request(app)
      .delete(`/api/bookings/${testBooking._id}`)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Booking is already cancelled');
  });

  test('should return 400 for completed booking', async () => {
    testBooking.status = 'completed';
    await testBooking.save();

    const response = await request(app)
      .delete(`/api/bookings/${testBooking._id}`)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Cannot cancel a completed booking');
  });
});

