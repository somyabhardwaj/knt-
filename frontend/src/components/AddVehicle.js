import React, { useState } from 'react';
import { vehicleAPI } from '../services/api';

const AddVehicle = () => {
  const [formData, setFormData] = useState({
    name: '',
    capacityKg: '',
    tyres: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Validate form data
      if (!formData.name.trim()) {
        throw new Error('Vehicle name is required');
      }
      if (!formData.capacityKg || formData.capacityKg <= 0) {
        throw new Error('Capacity must be a positive number');
      }
      if (!formData.tyres || formData.tyres < 2) {
        throw new Error('Number of tyres must be at least 2');
      }

      const vehicleData = {
        name: formData.name.trim(),
        capacityKg: parseInt(formData.capacityKg),
        tyres: parseInt(formData.tyres)
      };

      const response = await vehicleAPI.addVehicle(vehicleData);
      
      setMessage('Vehicle added successfully!');
      setMessageType('success');
      
      // Reset form
      setFormData({
        name: '',
        capacityKg: '',
        tyres: ''
      });
    } catch (error) {
      setMessage(error.message);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h2>Add New Vehicle</h2>
      <p>Add a new vehicle to the FleetLink fleet.</p>
      
      {message && (
        <div className={`alert alert-${messageType}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Vehicle Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Delivery Truck A"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="capacityKg">Capacity (KG) *</label>
          <input
            type="number"
            id="capacityKg"
            name="capacityKg"
            value={formData.capacityKg}
            onChange={handleChange}
            placeholder="e.g., 1000"
            min="1"
            max="10000"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="tyres">Number of Tyres *</label>
          <input
            type="number"
            id="tyres"
            name="tyres"
            value={formData.tyres}
            onChange={handleChange}
            placeholder="e.g., 6"
            min="2"
            max="20"
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
          {loading ? 'Adding Vehicle...' : 'Add Vehicle'}
        </button>
      </form>
    </div>
  );
};

export default AddVehicle;

