import React, { useState, useEffect } from 'react';
import { surahAPI } from '../services/api';

const SurahList = () => {
  const [surahs, setSurahs] = useState([]);
  const [memorizationStatus, setMemorizationStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showArabic, setShowArabic] = useState(true);
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [surahPages, setSurahPages] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [surahsResponse, statusResponse] = await Promise.allSettled([
        surahAPI.getAll(),
        surahAPI.getMemorizationStatus()
      ]);

      if (surahsResponse.status === 'fulfilled') {
        setSurahs(surahsResponse.value.data);
      }

      if (statusResponse.status === 'fulfilled') {
        setMemorizationStatus(statusResponse.value.data);
      }

    } catch (err) {
      setError('Failed to load surah data');
      console.error('SurahList error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSurahPages = async (surahNumber) => {
    try {
      const response = await surahAPI.getSurahPages(surahNumber);
      setSurahPages(prev => ({
        ...prev,
        [surahNumber]: response.data
      }));
    } catch (error) {
      console.error('Error loading surah pages:', error);
    }
  };

  const updatePageStatus = async (surahNumber, pageNumber, status) => {
    try {
      await surahAPI.updateMemorizationStatus({
        surahNumber,
        pageNumber,
        status
      });
      
      // Update local state
      setMemorizationStatus(prev => ({
        ...prev,
        [surahNumber]: {
          ...prev[surahNumber],
          [pageNumber]: status
        }
      }));

      // Update surah pages if loaded
      if (surahPages[surahNumber]) {
        setSurahPages(prev => ({
          ...prev,
          [surahNumber]: {
            ...prev[surahNumber],
            pages: prev[surahNumber].pages.map(page => 
              page.pageNumber === pageNumber 
                ? { ...page, status, lastUpdated: new Date() }
                : page
            )
          }
        }));
      }

    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'perfect': return '#28a745';
      case 'medium': return '#ffc107';
      case 'bad': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'perfect': return 'Perfect';
      case 'medium': return 'Medium';
      case 'bad': return 'Needs Review';
      default: return 'Not Memorized';
    }
  };

  const getSurahOverallStatus = (surahNumber) => {
    const surahStatus = memorizationStatus[surahNumber] || {};
    const statuses = Object.values(surahStatus);
    
    if (statuses.length === 0) return 'not_memorized';
    if (statuses.every(s => s === 'perfect')) return 'perfect';
    if (statuses.some(s => s === 'perfect' || s === 'medium')) return 'medium';
    if (statuses.some(s => s === 'bad')) return 'bad';
    return 'not_memorized';
  };

  const handleSurahClick = (surah) => {
    if (selectedSurah?.number === surah.number) {
      setSelectedSurah(null);
    } else {
      setSelectedSurah(surah);
      if (!surahPages[surah.number]) {
        loadSurahPages(surah.number);
      }
    }
  };

  if (loading) {
    return (
      <div className="surah-list">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Loading surahs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="surah-list">
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1>Surah Memorization Status</h1>
        <p>Track your memorization progress for each surah and page.</p>
        
        <div style={{ marginTop: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input 
              type="checkbox" 
              checked={showArabic}
              onChange={(e) => setShowArabic(e.target.checked)}
            />
            Show Arabic Names
          </label>
        </div>
      </div>

      {error && (
        <div className="card" style={{ background: '#f8d7da', color: '#721c24', marginBottom: '1rem' }}>
          <div className="card-body">
            <p>{error}</p>
            <button onClick={loadData} className="btn btn-sm btn-primary">
              Retry
            </button>
          </div>
        </div>
      )}

      <div className="surahs-grid">
        {surahs.map((surah) => {
          const overallStatus = getSurahOverallStatus(surah.number);
          const isExpanded = selectedSurah?.number === surah.number;
          
          return (
            <div key={surah.number} className="card" style={{ marginBottom: '0.5rem' }}>
              <div 
                className="card-header" 
                style={{ 
                  cursor: 'pointer',
                  background: getStatusColor(overallStatus),
                  color: 'white',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                onClick={() => handleSurahClick(surah)}
              >
                <div>
                  <strong>{surah.number}. </strong>
                  {showArabic ? (
                    <span className="arabic-text" style={{ fontSize: '1.1rem' }}>
                      {surah.nameArabic}
                    </span>
                  ) : (
                    <span>{surah.nameEnglish}</span>
                  )}
                  <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                    {surah.totalPages} page{surah.totalPages > 1 ? 's' : ''} • {getStatusText(overallStatus)}
                  </div>
                </div>
                <div style={{ fontSize: '1.2rem' }}>
                  {isExpanded ? '▼' : '▶'}
                </div>
              </div>

              {isExpanded && (
                <div className="card-body">
                  {surahPages[surah.number] ? (
                    <div>
                      <h4 style={{ marginBottom: '1rem' }}>Pages</h4>
                      <div className="pages-grid" style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                        gap: '0.5rem' 
                      }}>
                        {surahPages[surah.number].pages.map((page) => (
                          <div 
                            key={page.pageNumber}
                            className="page-item"
                            style={{
                              padding: '0.75rem',
                              border: '1px solid #dee2e6',
                              borderRadius: '4px',
                              background: 'white'
                            }}
                          >
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center',
                              marginBottom: '0.5rem'
                            }}>
                              <strong>Page {page.pageNumber}</strong>
                              <span 
                                className="status-badge"
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: '12px',
                                  fontSize: '0.8rem',
                                  background: getStatusColor(page.status),
                                  color: 'white'
                                }}
                              >
                                {getStatusText(page.status)}
                              </span>
                            </div>
                            <select 
                              value={page.status}
                              onChange={(e) => updatePageStatus(surah.number, page.pageNumber, e.target.value)}
                              className="form-control"
                              style={{ fontSize: '0.9rem' }}
                            >
                              <option value="not_memorized">Not Memorized</option>
                              <option value="bad">Needs Review</option>
                              <option value="medium">Medium</option>
                              <option value="perfect">Perfect</option>
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '1rem' }}>
                      <p>Loading pages...</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SurahList;