import React, { useEffect, useState } from 'react';
import { scheduleAPI } from '../services/api';

// Page to list all upcoming NEW memorization assignments across active schedules
const NewMaterial = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newAssignments, setNewAssignments] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const schedulesRes = await scheduleAPI.getAll();
        const schedules = schedulesRes.data || [];
        const today = new Date();
        today.setHours(0,0,0,0);

        const collected = [];
        schedules.forEach(s => {
          if (s.status === 'active') {
            (s.dailySchedule || []).forEach(day => {
              const dateObj = new Date(day.date);
              const dayMid = new Date(dateObj); dayMid.setHours(0,0,0,0);
              if (dayMid >= today) {
                day.assignments.filter(a => a.type === 'new').forEach(a => {
                  collected.push({
                    scheduleId: s._id,
                    scheduleName: s.name,
                    newDirection: s.newDirection,
                    date: dateObj,
                    dayOfWeek: day.dayOfWeek,
                    ...a,
                  });
                });
              }
            });
          }
        });

        collected.sort((a, b) => a.date - b.date || a.pageNumber - b.pageNumber);
        setNewAssignments(collected);
      } catch (e) {
        setError('Failed to load new material');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="new-material-page">
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h1>🆕 New Memorization Material</h1>
        <p style={{ maxWidth: 600 }}>
          Pages with "not_memorized" status plus complete context from surah beginning. 
          Short surahs (under 1 page) are grouped together to reach daily page target.
        </p>
      </div>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && newAssignments.length === 0 && <p>No upcoming new pages found.</p>}
      {!loading && newAssignments.length > 0 && (
        <div className="card" style={{ padding: '1rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={th}>Date</th>
                <th style={th}>Schedule</th>
                <th style={th}>Direction</th>
                <th style={th}>Type</th>
                <th style={th}>Surah#</th>
                <th style={th}>Page</th>
                <th style={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {newAssignments.map((a, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={td}>{a.date.toLocaleDateString()} ({a.dayOfWeek})</td>
                  <td style={td}>{a.scheduleName}</td>
                  <td style={td}>{a.newDirection === 'reverse' ? 'ناس → بقره' : 'بقره → ناس'}</td>
                  <td style={td}>{a.isContext ? 'Context' : 'New'}</td>
                  <td style={td}>{a.surahNumber}</td>
                  <td style={td}>{a.pageNumber}</td>
                  <td style={td}>{a.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const th = { textAlign: 'left', padding: '6px 8px', borderBottom: '2px solid #ddd' };
const td = { padding: '6px 8px' };

export default NewMaterial;
