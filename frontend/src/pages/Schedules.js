import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { scheduleAPI } from '../services/api';

const Schedules = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const response = await scheduleAPI.getAll();
      setSchedules(response.data);
    } catch (err) {
      setError('Failed to load schedules');
      console.error('Error loading schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteSchedule = async (scheduleId) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) {
      return;
    }
    
    try {
      await scheduleAPI.delete(scheduleId);
      setSchedules(schedules.filter(s => s._id !== scheduleId));
    } catch (err) {
      alert('Failed to delete schedule');
      console.error('Error deleting schedule:', err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#28a745';
      case 'active': return '#007bff';
      case 'paused': return '#ffc107';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return (
      <div className="schedules">
        <div className="page-header" style={{ marginBottom: '2rem' }}>
          <h1>My Schedules</h1>
          <p>View and manage your memorization schedules.</p>
          <Link to="/schedules/create" className="btn btn-primary">
            Create New Schedule
          </Link>
        </div>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Loading schedules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="schedules">
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1>My Schedules</h1>
        <p>View and manage your memorization schedules.</p>
        <Link to="/schedules/create" className="btn btn-primary">
          Create New Schedule
        </Link>
      </div>

      {error && (
        <div className="card" style={{ background: '#f8d7da', color: '#721c24', marginBottom: '1rem' }}>
          <div className="card-body">
            <p>{error}</p>
            <button onClick={loadSchedules} className="btn btn-sm btn-primary">
              Retry
            </button>
          </div>
        </div>
      )}

      {schedules.length === 0 ? (
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', padding: '3rem' }}>
            <h3 style={{ color: '#6c757d', marginBottom: '1rem' }}>No schedules yet</h3>
            <p style={{ color: '#6c757d', marginBottom: '2rem' }}>
              Create your first memorization schedule to get started.
            </p>
            <Link to="/schedules/create" className="btn btn-primary">
              Create Schedule
            </Link>
          </div>
        </div>
      ) : (
        <div className="schedules-grid" style={{ display: 'grid', gap: '1rem' }}>
          {schedules.map((schedule) => (
            <div key={schedule._id} className="card">
              <div className="card-header" style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                background: getStatusColor(schedule.status),
                color: 'white'
              }}>
                <div>
                  <h4 style={{ margin: 0 }}>{schedule.name}</h4>
                  <small style={{ opacity: 0.9 }}>
                    {schedule.status} • {schedule.completedDays || 0}/{schedule.totalDays} days completed
                  </small>
                </div>
                <div>
                  <button 
                    onClick={() => deleteSchedule(schedule._id)}
                    className="btn btn-sm"
                    style={{ 
                      background: 'rgba(255,255,255,0.2)', 
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.3)'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <strong>Duration:</strong><br />
                    {formatDate(schedule.startDate)} - {formatDate(schedule.endDate)}
                  </div>
                  <div>
                    <strong>Daily New Pages:</strong><br />
                    {schedule.dailyNewPages} pages
                  </div>
                  <div>
                    <strong>Total Days:</strong><br />
                    {schedule.totalDays} days
                  </div>
                  <div>
                    <strong>Progress:</strong><br />
                    {Math.round(((schedule.completedDays || 0) / schedule.totalDays) * 100)}%
                  </div>
                </div>
                
                {schedule.dailySchedule && schedule.dailySchedule.length > 0 && (
                  <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8f9fa', borderRadius: '4px' }}>
                    <strong>Recent Assignments:</strong>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                      {schedule.dailySchedule.slice(0, 3).map((day, index) => (
                        <div key={index} style={{ marginBottom: '0.25rem' }}>
                          <strong>{formatDate(day.date)}:</strong> {day.assignments.length} assignments
                        </div>
                      ))}
                      {schedule.dailySchedule.length > 3 && (
                        <div style={{ color: '#6c757d' }}>
                          ... and {schedule.dailySchedule.length - 3} more days
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Schedules;