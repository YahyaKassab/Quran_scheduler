import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { scheduleAPI } from '../services/api';

const CreateSchedule = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    totalDays: 30,
    dailyNewPages: 1
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.startDate) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await scheduleAPI.generate(formData);
      
      if (response.data) {
        alert('Schedule created successfully!');
        navigate('/schedules');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="create-schedule">
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1>Create New Schedule</h1>
        <p>Generate a personalized memorization and revision schedule.</p>
      </div>

      <div className="row">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h3 style={{ margin: 0 }}>Schedule Configuration</h3>
            </div>
            <div className="card-body">
              {error && (
                <div style={{ 
                  background: '#f8d7da', 
                  color: '#721c24', 
                  padding: '0.75rem', 
                  borderRadius: '4px',
                  marginBottom: '1rem'
                }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Schedule Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="e.g., Ramadan 2024 Schedule"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Start Date *</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Schedule Duration (days)</label>
                  <input
                    type="number"
                    name="totalDays"
                    value={formData.totalDays}
                    onChange={handleChange}
                    className="form-control"
                    min="1"
                    max="365"
                  />
                  <small style={{ color: '#6c757d' }}>
                    How many days should this schedule run?
                  </small>
                </div>

                <div className="form-group">
                  <label className="form-label">Daily New Pages</label>
                  <input
                    type="number"
                    name="dailyNewPages"
                    value={formData.dailyNewPages}
                    onChange={handleChange}
                    className="form-control"
                    min="0.5"
                    max="5"
                    step="0.5"
                  />
                  <small style={{ color: '#6c757d' }}>
                    How many new pages to memorize each day?
                  </small>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading}
                    style={{ flex: 1 }}
                  >
                    {loading ? 'Creating...' : 'Create Schedule'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => navigate('/schedules')}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h3 style={{ margin: 0 }}>How it works</h3>
            </div>
            <div className="card-body">
              <div style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
                <h4 style={{ color: '#007bff', marginBottom: '1rem' }}>Schedule Algorithm</h4>
                <ul style={{ paddingLeft: '1.5rem', marginBottom: '1.5rem' }}>
                  <li><strong>60%</strong> - Revision of perfectly memorized pages</li>
                  <li><strong>15%</strong> - Revision of medium-level pages</li>
                  <li><strong>10-20%</strong> - New memorization material</li>
                  <li><strong>Special:</strong> Al-Kahf every Friday</li>
                </ul>

                <h4 style={{ color: '#007bff', marginBottom: '1rem' }}>Requirements</h4>
                <p style={{ marginBottom: '1rem' }}>
                  Before creating a schedule, make sure you have:
                </p>
                <ul style={{ paddingLeft: '1.5rem' }}>
                  <li>Set your current memorization status for surahs</li>
                  <li>Marked pages as Perfect, Medium, or Needs Review</li>
                </ul>
                
                <div style={{ 
                  background: '#e7f3ff', 
                  padding: '1rem', 
                  borderRadius: '4px',
                  marginTop: '1.5rem'
                }}>
                  <strong>Tip:</strong> Start by setting your memorization status in the 
                  <a href="/surahs" style={{ color: '#007bff', textDecoration: 'none' }}> Surahs page</a>.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateSchedule;