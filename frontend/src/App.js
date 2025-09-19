import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import AddVehicle from './components/AddVehicle';
import SearchAndBook from './components/SearchAndBook';
import BookingConfirmation from './components/BookingConfirmation';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>FleetLink - Logistics Vehicle Booking System</h1>
          <nav>
            <Link to="/" className="nav-link">Add Vehicle</Link>
            <Link to="/search" className="nav-link">Search & Book</Link>
          </nav>
        </header>
        
        <main className="App-main">
          <Routes>
            <Route path="/" element={<AddVehicle />} />
            <Route path="/search" element={<SearchAndBook />} />
            <Route path="/booking/confirmation" element={<BookingConfirmation />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;