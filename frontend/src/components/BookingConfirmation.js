import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const BookingConfirmation = () => {
  const location = useLocation();
  const booking = location.state?.booking;

  if (!booking) {
    return (
      <div className="container">
        <div className="alert alert-error">No booking details found.</div>
        <Link to="/search" className="btn">Back to Search</Link>
      </div>
    );
  }

  return (
    <div className="container">
      <h2>Booking Confirmed</h2>
      <div className="alert alert-success">Your booking has been confirmed!</div>

      <div className="vehicle-card">
        <h3>{booking.vehicleId?.name || 'Vehicle'}</h3>
        <div className="vehicle-details">
          <div className="vehicle-detail">
            <strong>Booking ID</strong>
            <span>{booking._id}</span>
          </div>
          <div className="vehicle-detail">
            <strong>Capacity</strong>
            <span>{booking.vehicleId?.capacityKg} KG</span>
          </div>
          <div className="vehicle-detail">
            <strong>Tyres</strong>
            <span>{booking.vehicleId?.tyres}</span>
          </div>
          <div className="vehicle-detail">
            <strong>From</strong>
            <span>{booking.fromPincode}</span>
          </div>
          <div className="vehicle-detail">
            <strong>To</strong>
            <span>{booking.toPincode}</span>
          </div>
          <div className="vehicle-detail">
            <strong>Start</strong>
            <span>{new Date(booking.startTime).toLocaleString()}</span>
          </div>
          <div className="vehicle-detail">
            <strong>End</strong>
            <span>{new Date(booking.endTime).toLocaleString()}</span>
          </div>
          <div className="vehicle-detail">
            <strong>Duration</strong>
            <span>{booking.estimatedRideDurationHours} hours</span>
          </div>
          <div className="vehicle-detail">
            <strong>Status</strong>
            <span>{booking.status}</span>
          </div>
        </div>
      </div>

      <div>
        <Link to="/search" className="btn">Book Another</Link>
        <Link to="/" className="btn" style={{ marginLeft: 8 }}>Home</Link>
      </div>
    </div>
  );
};

export default BookingConfirmation;
