import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { vehicleAPI, bookingAPI } from '../services/api';

const SearchAndBook = () => {
  const navigate = useNavigate();
  const [searchForm, setSearchForm] = useState({
    capacityRequired: '',
    fromPincode: '',
    toPincode: '',
    startTime: ''
  });
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState({});
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [confirmModal, setConfirmModal] = useState({ open: false, vehicle: null });

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setSearchResults(null);

    try {
      if (!searchForm.capacityRequired || searchForm.capacityRequired <= 0) {
        throw new Error('Capacity required must be a positive number');
      }
      if (!searchForm.fromPincode || !/^\d{6}$/.test(searchForm.fromPincode)) {
        throw new Error('From pincode must be exactly 6 digits');
      }
      if (!searchForm.toPincode || !/^\d{6}$/.test(searchForm.toPincode)) {
        throw new Error('To pincode must be exactly 6 digits');
      }
      if (!searchForm.startTime) {
        throw new Error('Start time is required');
      }

      const searchParams = {
        capacityRequired: parseInt(searchForm.capacityRequired),
        fromPincode: searchForm.fromPincode,
        toPincode: searchForm.toPincode,
        startTime: new Date(searchForm.startTime).toISOString()
      };

      const response = await vehicleAPI.searchAvailableVehicles(searchParams);
      setSearchResults(response.data);
      
      if (response.data.vehicles.length === 0) {
        setMessage('No vehicles available for the specified criteria.');
        setMessageType('info');
      }
    } catch (error) {
      setMessage(error.message);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const openConfirmModal = (vehicle) => {
    setConfirmModal({ open: true, vehicle });
  };

  const closeConfirmModal = () => {
    setConfirmModal({ open: false, vehicle: null });
  };

  const confirmBooking = async () => {
    if (!confirmModal.vehicle) return;
    const vehicleId = confirmModal.vehicle._id;
    setBookingLoading(prev => ({ ...prev, [vehicleId]: true }));

    try {
      const bookingData = {
        vehicleId: vehicleId,
        fromPincode: searchForm.fromPincode,
        toPincode: searchForm.toPincode,
        startTime: new Date(searchForm.startTime).toISOString(),
        customerId: 'customer_' + Date.now()
      };

      const response = await bookingAPI.createBooking(bookingData);

      navigate('/booking/confirmation', { state: { booking: response.data } });

      const updatedResults = {
        ...searchResults,
        vehicles: searchResults.vehicles.filter(v => v._id !== vehicleId)
      };
      setSearchResults(updatedResults);
      closeConfirmModal();
    } catch (error) {
      setMessage(`Booking failed: ${error.message}`);
      setMessageType('error');
    } finally {
      setBookingLoading(prev => ({ ...prev, [vehicleId]: false }));
    }
  };

  const formatDateTime = (dateTimeString) => {
    return new Date(dateTimeString).toLocaleString();
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="container">
      <h2>Search & Book Vehicles</h2>
      <p>Search for available vehicles based on your requirements and book them instantly.</p>
      
      {message && (
        <div className={`alert alert-${messageType}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSearch}>
        <div className="form-group">
          <label htmlFor="capacityRequired">Capacity Required (KG) *</label>
          <input
            type="number"
            id="capacityRequired"
            name="capacityRequired"
            value={searchForm.capacityRequired}
            onChange={handleSearchChange}
            placeholder="e.g., 500"
            min="1"
            max="10000"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="fromPincode">From Pincode *</label>
          <input
            type="text"
            id="fromPincode"
            name="fromPincode"
            value={searchForm.fromPincode}
            onChange={handleSearchChange}
            placeholder="e.g., 110001"
            pattern="[0-9]{6}"
            maxLength="6"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="toPincode">To Pincode *</label>
          <input
            type="text"
            id="toPincode"
            name="toPincode"
            value={searchForm.toPincode}
            onChange={handleSearchChange}
            placeholder="e.g., 110002"
            pattern="[0-9]{6}"
            maxLength="6"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="startTime">Start Date & Time *</label>
          <input
            type="datetime-local"
            id="startTime"
            name="startTime"
            value={searchForm.startTime}
            onChange={handleSearchChange}
            min={getCurrentDateTime()}
            required
            disabled={loading}
          />
        </div>

        <button 
          type="submit" 
          className="btn"
          disabled={loading}
        >
          {loading && <span className="loading"></span>}
          {loading ? 'Searching...' : 'Search Availability'}
        </button>
      </form>

      {searchResults && (
        <div className="search-results">
          <h2>Available Vehicles</h2>
          
          <div className="results-info">
            <strong>Search Criteria:</strong> {searchForm.capacityRequired} KG capacity from {searchForm.fromPincode} to {searchForm.toPincode}<br/>
            <strong>Start Time:</strong> {formatDateTime(searchForm.startTime)}<br/>
            <strong>Estimated Ride Duration:</strong> {searchResults.estimatedRideDurationHours} hours<br/>
            <strong>Found:</strong> {searchResults.vehicles.length} available vehicle(s)
          </div>

          {searchResults.vehicles.length === 0 ? (
            <div className="no-results">
              No vehicles available for the specified criteria. Try adjusting your search parameters.
            </div>
          ) : (
            <div>
              {searchResults.vehicles.map(vehicle => (
                <div key={vehicle._id} className="vehicle-card">
                  <h3>{vehicle.name}</h3>
                  <div className="vehicle-details">
                    <div className="vehicle-detail">
                      <strong>Capacity</strong>
                      <span>{vehicle.capacityKg} KG</span>
                    </div>
                    <div className="vehicle-detail">
                      <strong>Tyres</strong>
                      <span>{vehicle.tyres}</span>
                    </div>
                    <div className="vehicle-detail">
                      <strong>Ride Duration</strong>
                      <span>{searchResults.estimatedRideDurationHours} hours</span>
                    </div>
                    <div className="vehicle-detail">
                      <strong>Status</strong>
                      <span>Available</span>
                    </div>
                  </div>
                  <button
                    className="btn btn-success"
                    onClick={() => openConfirmModal(vehicle)}
                    disabled={bookingLoading[vehicle._id]}
                  >
                    {bookingLoading[vehicle._id] && <span className="loading"></span>}
                    {bookingLoading[vehicle._id] ? 'Booking...' : 'Book Now'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {confirmModal.open && confirmModal.vehicle && (
        <>
          <div className="modal-overlay" onClick={closeConfirmModal} />
          <div className="modal">
            <div className="modal-header">
              <h3>Confirm Booking</h3>
              <button className="modal-close" onClick={closeConfirmModal} aria-label="Close">×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to book <strong>{confirmModal.vehicle.name}</strong>?</p>
              <div className="modal-grid">
                <div className="modal-item">
                  <span className="label">Capacity</span>
                  <span className="value">{confirmModal.vehicle.capacityKg} KG</span>
                </div>
                <div className="modal-item">
                  <span className="label">Tyres</span>
                  <span className="value">{confirmModal.vehicle.tyres}</span>
                </div>
                <div className="modal-item">
                  <span className="label">From</span>
                  <span className="value">{searchForm.fromPincode}</span>
                </div>
                <div className="modal-item">
                  <span className="label">To</span>
                  <span className="value">{searchForm.toPincode}</span>
                </div>
                <div className="modal-item">
                  <span className="label">Start</span>
                  <span className="value">{formatDateTime(searchForm.startTime)}</span>
                </div>
                <div className="modal-item">
                  <span className="label">Duration</span>
                  <span className="value">{searchResults?.estimatedRideDurationHours} hours</span>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-success" onClick={confirmBooking}>Confirm Booking</button>
              <button className="btn btn-danger" onClick={closeConfirmModal}>Cancel</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SearchAndBook;

