import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { scheduleAPI } from '../services/api';
import ScheduleDetails from '../components/ScheduleDetails';

const Schedules = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setLoading(true);
        const response = await scheduleAPI.getAll();
        setSchedules(response.data);
      } catch (err) {
        setError('Failed to load schedules');
      } finally {
        setLoading(false);
      }
    };
    fetchSchedules();
  }, []);

  const handleShowDetails = (schedule) => setSelectedSchedule(schedule);

  const handleSetDone = async (scheduleId, date, assignmentIndex) => {
    try {
      await scheduleAPI.updateAssignmentCompletion({
        scheduleId,
        dateString: new Date(date).toISOString().split('T')[0],
        assignmentIndex,
        completed: true,
      });
      const response = await scheduleAPI.getAll();
      setSchedules(response.data);
      if (selectedSchedule && selectedSchedule._id === scheduleId) {
        const updated = await scheduleAPI.getById(scheduleId);
        setSelectedSchedule(updated.data);
      }
    } catch {
      alert('Failed to update assignment');
    }
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString();
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#28a745';
      case 'active':
        return '#007bff';
      case 'paused':
        return '#ffc107';
      default:
        return '#6c757d';
    }
  };

  return (
    <div className="schedules">
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1>My Schedules</h1>
        <p>View and manage your memorization schedules.</p>
        <Link to="/schedules/create" className="btn btn-primary">
          Create New Schedule
        </Link>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Loading schedules...</p>
        </div>
      )}

      {error && (
        <div
          className="card"
          style={{ background: '#f8d7da', color: '#721c24', marginBottom: '1rem' }}
        >
          <div className="card-body">
            <p>{error}</p>
            <button onClick={() => window.location.reload()} className="btn btn-sm btn-primary">
              Retry
            </button>
          </div>
        </div>
      )}

      {!loading && schedules.length === 0 && !error && (
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
      )}

      {!loading && schedules.length > 0 && (
        <div className="schedules-grid" style={{ display: 'grid', gap: '1rem' }}>
          {schedules.map((schedule) => (
            <div key={schedule._id} className="card">
              <div
                className="card-header"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: getStatusColor(schedule.status),
                  color: 'white',
                }}
              >
                <div>
                  <h4 style={{ margin: 0 }}>{schedule.name}</h4>
                  <small style={{ opacity: 0.9 }}>
                    {schedule.status} • {schedule.completedDays || 0}/{schedule.totalDays} days
                    completed
                  </small>
                </div>
                <div>
                  <button
                    onClick={() =>
                      window.confirm('Are you sure you want to delete this schedule?') &&
                      scheduleAPI
                        .delete(schedule._id)
                        .then(() => setSchedules(schedules.filter((s) => s._id !== schedule._id)))
                        .catch(() => alert('Failed to delete schedule'))
                    }
                    className="btn btn-sm"
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.3)',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <strong>Duration:</strong>
                    <br />
                    {formatDate(schedule.startDate)} - {formatDate(schedule.endDate)}
                  </div>
                  <div>
                    <strong>Daily New Pages:</strong>
                    <br />
                    {schedule.dailyNewPages} pages
                  </div>
                  <div>
                    <strong>Direction:</strong>
                    <br />
                    {schedule.newDirection === 'reverse' ? 'An-Nas → Al-Baqarah' : 'Al-Baqarah → An-Nas'}
                  </div>
                  <div>
                    <strong>Total Days:</strong>
                    <br />
                    {schedule.totalDays} days
                  </div>
                  <div>
                    <strong>Progress:</strong>
                    <br />
                    {Math.round(((schedule.completedDays || 0) / schedule.totalDays) * 100)}%
                  </div>
                </div>
                <div style={{ marginTop: '1rem' }}>
                  <button
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => handleShowDetails(schedule)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedSchedule && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.3)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 8,
              padding: 24,
              maxHeight: '90vh',
              overflowY: 'auto',
              minWidth: 350,
              maxWidth: 600,
              boxShadow: '0 2px 16px rgba(0,0,0,0.2)',
            }}
          >
            <button
              style={{
                float: 'right',
                fontSize: 18,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
              }}
              onClick={() => setSelectedSchedule(null)}
            >
              &times;
            </button>
            <ScheduleDetails schedule={selectedSchedule} onSetDone={handleSetDone} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedules;
