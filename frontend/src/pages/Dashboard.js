import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { progressAPI, scheduleAPI } from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [todaysAssignments, setTodaysAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load progress stats and today's assignments in parallel
      const [statsResponse, assignmentsResponse] = await Promise.allSettled([
        progressAPI.getStats(),
        scheduleAPI.getTodaysAssignments()
      ]);

      if (statsResponse.status === 'fulfilled') {
        setStats(statsResponse.value.data);
      }

      if (assignmentsResponse.status === 'fulfilled') {
        setTodaysAssignments(assignmentsResponse.value.data);
      }
      
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
        </div>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Quran Memorization Dashboard</h1>
        <p>Welcome back! Track your memorization progress and today's assignments.</p>
      </div>

      {error && (
        <div className="card" style={{ background: '#f8d7da', color: '#721c24', marginBottom: '1rem' }}>
          <div className="card-body">
            <p>{error}</p>
            <button onClick={loadDashboardData} className="btn btn-sm btn-primary">
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="row">
        <div className="col-md-3">
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#28a745' }}>
                {stats?.memorization?.perfect || 0}
              </h3>
              <p style={{ margin: 0, color: '#6c757d' }}>Perfect Pages</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#ffc107' }}>
                {stats?.memorization?.medium || 0}
              </h3>
              <p style={{ margin: 0, color: '#6c757d' }}>Medium Pages</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#dc3545' }}>
                {stats?.memorization?.bad || 0}
              </h3>
              <p style={{ margin: 0, color: '#6c757d' }}>Needs Review</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#007bff' }}>
                {stats?.schedules?.active?.count || 0}
              </h3>
              <p style={{ margin: 0, color: '#6c757d' }}>Active Schedules</p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Assignments */}
      <div className="card">
        <div className="card-header">
          <h2 style={{ margin: 0 }}>Today's Assignments</h2>
        </div>
        <div className="card-body">
          {todaysAssignments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p style={{ color: '#6c757d', marginBottom: '1rem' }}>
                No assignments for today. Create a schedule to get started!
              </p>
              <Link to="/schedules/create" className="btn btn-primary">
                Create Schedule
              </Link>
            </div>
          ) : (
            todaysAssignments.map((schedule, scheduleIndex) => (
              <div key={scheduleIndex} style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ color: '#007bff', marginBottom: '1rem' }}>
                  {schedule.scheduleName}
                </h4>
                <div className="assignments-grid" style={{ display: 'grid', gap: '0.5rem' }}>
                  {schedule.assignments.map((assignment, assignmentIndex) => (
                    <div 
                      key={assignmentIndex}
                      className={`assignment-item ${assignment.completed ? 'completed' : ''}`}
                      style={{
                        padding: '0.75rem',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px',
                        background: assignment.completed ? '#d4edda' : 'white',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <span className={`status-badge status-${assignment.status}`} style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          marginRight: '0.5rem'
                        }}>
                          {assignment.type}
                        </span>
                        <span>Surah {assignment.surahNumber}, Page {assignment.pageNumber}</span>
                        {assignment.description && (
                          <div style={{ fontSize: '0.9rem', color: '#6c757d', marginTop: '0.25rem' }}>
                            {assignment.description}
                          </div>
                        )}
                      </div>
                      <input 
                        type="checkbox" 
                        checked={assignment.completed}
                        readOnly
                        style={{ transform: 'scale(1.2)' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h2 style={{ margin: 0 }}>Quick Actions</h2>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <Link to="/surahs" className="btn btn-primary" style={{ width: '100%', marginBottom: '0.5rem' }}>
                Manage Surah Status
              </Link>
            </div>
            <div className="col-md-6">
              <Link to="/schedules/create" className="btn btn-success" style={{ width: '100%', marginBottom: '0.5rem' }}>
                Create New Schedule
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;