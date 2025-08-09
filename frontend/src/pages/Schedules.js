import React from 'react';
import { Link } from 'react-router-dom';

const Schedules = () => {
  return (
    <div className="schedules">
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1>My Schedules</h1>
        <p>View and manage your memorization schedules.</p>
        <Link to="/schedules/create" className="btn btn-primary">
          Create New Schedule
        </Link>
      </div>

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
    </div>
  );
};

export default Schedules;