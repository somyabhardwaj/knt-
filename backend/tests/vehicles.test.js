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

describe('POST /api/vehicles', () => {
  test('should create a new vehicle with valid data', async () => {
    const vehicleData = {
      name: 'Test Truck',
      capacityKg: 1000,
      tyres: 6
    };

    const response = await request(app)
      .post('/api/vehicles')
      .send(vehicleData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe(vehicleData.name);
    expect(response.body.data.capacityKg).toBe(vehicleData.capacityKg);
    expect(response.body.data.tyres).toBe(vehicleData.tyres);
    expect(response.body.data.isActive).toBe(true);
  });

  test('should return 400 for missing required fields', async () => {
    const response = await request(app)
      .post('/api/vehicles')
      .send({})
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Missing required fields');
  });

  test('should return 400 for invalid capacityKg', async () => {
    const vehicleData = {
      name: 'Test Truck',
      capacityKg: -100,
      tyres: 6
    };

    const response = await request(app)
      .post('/api/vehicles')
      .send(vehicleData)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('capacityKg must be a positive number');
  });

  test('should return 400 for invalid tyres', async () => {
    const vehicleData = {
      name: 'Test Truck',
      capacityKg: 1000,
      tyres: 1
    };

    const response = await request(app)
      .post('/api/vehicles')
      .send(vehicleData)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('tyres must be a number greater than or equal to 2');
  });
});

describe('GET /api/vehicles/available', () => {
  beforeEach(async () => {
    // Create test vehicles
    await Vehicle.create([
      { name: 'Small Truck', capacityKg: 500, tyres: 4 },
      { name: 'Medium Truck', capacityKg: 1000, tyres: 6 },
      { name: 'Large Truck', capacityKg: 2000, tyres: 8 }
    ]);
  });

  test('should return available vehicles with sufficient capacity', async () => {
    const response = await request(app)
      .get('/api/vehicles/available')
      .query({
        capacityRequired: 800,
        fromPincode: '110001',
        toPincode: '110002',
        startTime: '2023-10-27T10:00:00Z'
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.vehicles).toHaveLength(2); // Medium and Large trucks
    expect(response.body.data.estimatedRideDurationHours).toBe(1);
  });

  test('should return 400 for missing query parameters', async () => {
    const response = await request(app)
      .get('/api/vehicles/available')
      .query({
        capacityRequired: 800,
        fromPincode: '110001'
        // Missing toPincode and startTime
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Missing required query parameters');
  });

  test('should return 400 for invalid capacityRequired', async () => {
    const response = await request(app)
      .get('/api/vehicles/available')
      .query({
        capacityRequired: 'invalid',
        fromPincode: '110001',
        toPincode: '110002',
        startTime: '2023-10-27T10:00:00Z'
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('capacityRequired must be a positive number');
  });

  test('should return 400 for invalid startTime', async () => {
    const response = await request(app)
      .get('/api/vehicles/available')
      .query({
        capacityRequired: 800,
        fromPincode: '110001',
        toPincode: '110002',
        startTime: 'invalid-date'
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('startTime must be a valid ISO date string');
  });

  test('should filter out vehicles with conflicting bookings', async () => {
    // Create a booking for Medium Truck
    const mediumTruck = await Vehicle.findOne({ name: 'Medium Truck' });
    await Booking.create({
      vehicleId: mediumTruck._id,
      fromPincode: '110001',
      toPincode: '110002',
      startTime: new Date('2023-10-27T10:00:00Z'),
      endTime: new Date('2023-10-27T11:00:00Z'),
      customerId: 'customer1',
      estimatedRideDurationHours: 1
    });

    const response = await request(app)
      .get('/api/vehicles/available')
      .query({
        capacityRequired: 800,
        fromPincode: '110001',
        toPincode: '110002',
        startTime: '2023-10-27T10:30:00Z' // Overlaps with existing booking
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.vehicles).toHaveLength(1); // Only Large Truck
    expect(response.body.data.vehicles[0].name).toBe('Large Truck');
  });
});

describe('GET /api/vehicles', () => {
  test('should return all active vehicles', async () => {
    await Vehicle.create([
      { name: 'Truck 1', capacityKg: 1000, tyres: 6 },
      { name: 'Truck 2', capacityKg: 1500, tyres: 8 }
    ]);

    const response = await request(app)
      .get('/api/vehicles')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(2);
  });
});

