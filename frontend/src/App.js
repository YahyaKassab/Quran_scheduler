import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Import components
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import SurahList from './pages/SurahList';
import Schedules from './pages/Schedules';
import CreateSchedule from './pages/CreateSchedule';
import NewMaterial from './pages/NewMaterial';

// Import API
import { surahAPI } from './services/api';

function App() {
  const [sysStatus, setSysStatus] = useState({
    apiConnected: false,
    surahsInitialized: false,
    loading: true
  });

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Test API connection
      const testResponse = await fetch('http://localhost:5000/api/test');
      if (testResponse.ok) {
        setSysStatus(prev => ({ ...prev, apiConnected: true }));
        
        // Initialize surahs in database
        try {
          await surahAPI.initialize();
          setSysStatus(prev => ({ ...prev, surahsInitialized: true }));
        } catch (error) {
          console.log('Surahs might already be initialized:', error.response?.data?.message);
          setSysStatus(prev => ({ ...prev, surahsInitialized: true }));
        }
      }
    } catch (error) {
      console.error('Failed to connect to API:', error);
    } finally {
      setSysStatus(prev => ({ ...prev, loading: false }));
    }
  };

  if (sysStatus.loading) {
    return (
      <div className="app-loading">
        <div className="loading-content">
          <h2>Loading Quran Memorization Scheduler...</h2>
          <div className="loading-status">
            <p>✓ Connecting to API... {sysStatus.apiConnected ? 'Connected' : 'Connecting...'}</p>
            <p>✓ Initializing Quran data... {sysStatus.surahsInitialized ? 'Ready' : 'Loading...'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!sysStatus.apiConnected) {
    return (
      <div className="app-error">
        <div className="error-content">
          <h2>Connection Error</h2>
          <p>Cannot connect to the API server. Please make sure the backend server is running on port 5000.</p>
          <button onClick={initializeApp} className="retry-button">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/surahs" element={<SurahList />} />
            <Route path="/schedules" element={<Schedules />} />
            <Route path="/schedules/create" element={<CreateSchedule />} />
            <Route path="/new" element={<NewMaterial />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
