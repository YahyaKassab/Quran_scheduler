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
  
  // Bulk update state for surahs
  const [surahRangeFrom, setSurahRangeFrom] = useState('');
  const [surahRangeTo, setSurahRangeTo] = useState('');
  const [surahBulkStatus, setSurahBulkStatus] = useState('');
  const [bulkUpdateLoading, setBulkUpdateLoading] = useState(false);
  
  // Bulk update state for pages
  const [pageRangeFrom, setPageRangeFrom] = useState('');
  const [pageRangeTo, setPageRangeTo] = useState('');
  const [pageBulkStatus, setPageBulkStatus] = useState('');
  const [pageBulkSurah, setPageBulkSurah] = useState(null);

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
      setPageBulkSurah(surah);
      if (!surahPages[surah.number]) {
        loadSurahPages(surah.number);
      }
    }
  };

  const handleSurahBulkUpdate = async () => {
    if (!surahRangeFrom || !surahRangeTo || !surahBulkStatus) {
      alert('Please select both from/to surahs and a status');
      return;
    }

    if (surahRangeFrom > surahRangeTo) {
      alert('From surah must be less than or equal to To surah');
      return;
    }

    try {
      setBulkUpdateLoading(true);
      
      // Build updates array for all pages in the surah range
      const updates = [];
      
      for (let surahNum = surahRangeFrom; surahNum <= surahRangeTo; surahNum++) {
        const surah = surahs.find(s => s.number === surahNum);
        if (surah) {
          for (let page = surah.startPage; page <= surah.endPage; page++) {
            updates.push({
              surahNumber: surahNum,
              pageNumber: page,
              status: surahBulkStatus
            });
          }
        }
      }

      await surahAPI.batchUpdateMemorizationStatus(updates);
      
      // Update local state
      const newMemorizationStatus = { ...memorizationStatus };
      updates.forEach(update => {
        if (!newMemorizationStatus[update.surahNumber]) {
          newMemorizationStatus[update.surahNumber] = {};
        }
        newMemorizationStatus[update.surahNumber][update.pageNumber] = update.status;
      });
      setMemorizationStatus(newMemorizationStatus);

      // Update surah pages if any are currently loaded
      const newSurahPages = { ...surahPages };
      for (let surahNum = surahRangeFrom; surahNum <= surahRangeTo; surahNum++) {
        if (newSurahPages[surahNum]) {
          newSurahPages[surahNum] = {
            ...newSurahPages[surahNum],
            pages: newSurahPages[surahNum].pages.map(page => ({
              ...page,
              status: surahBulkStatus,
              lastUpdated: new Date()
            }))
          };
        }
      }
      setSurahPages(newSurahPages);

      // Reset form
      setSurahRangeFrom('');
      setSurahRangeTo('');
      setSurahBulkStatus('');
      
      alert(`Successfully updated ${updates.length} pages across ${surahRangeTo - surahRangeFrom + 1} surah(s)`);
      
    } catch (error) {
      console.error('Error updating surah range:', error);
      alert('Failed to update surah range. Please try again.');
    } finally {
      setBulkUpdateLoading(false);
    }
  };

  const handlePageBulkUpdate = async () => {
    if (!pageRangeFrom || !pageRangeTo || !pageBulkStatus || !pageBulkSurah) {
      alert('Please select page range, status, and ensure a surah is selected');
      return;
    }

    if (pageRangeFrom > pageRangeTo) {
      alert('From page must be less than or equal to To page');
      return;
    }

    try {
      setBulkUpdateLoading(true);
      
      const updates = [];
      for (let page = pageRangeFrom; page <= pageRangeTo; page++) {
        updates.push({
          surahNumber: pageBulkSurah.number,
          pageNumber: page,
          status: pageBulkStatus
        });
      }

      await surahAPI.batchUpdateMemorizationStatus(updates);
      
      // Update local state
      const newMemorizationStatus = { ...memorizationStatus };
      if (!newMemorizationStatus[pageBulkSurah.number]) {
        newMemorizationStatus[pageBulkSurah.number] = {};
      }
      updates.forEach(update => {
        newMemorizationStatus[pageBulkSurah.number][update.pageNumber] = update.status;
      });
      setMemorizationStatus(newMemorizationStatus);

      // Update surah pages if loaded
      if (surahPages[pageBulkSurah.number]) {
        setSurahPages(prev => ({
          ...prev,
          [pageBulkSurah.number]: {
            ...prev[pageBulkSurah.number],
            pages: prev[pageBulkSurah.number].pages.map(page => 
              page.pageNumber >= pageRangeFrom && page.pageNumber <= pageRangeTo
                ? { ...page, status: pageBulkStatus, lastUpdated: new Date() }
                : page
            )
          }
        }));
      }

      // Reset form
      setPageRangeFrom('');
      setPageRangeTo('');
      setPageBulkStatus('');
      
      alert(`Successfully updated pages ${pageRangeFrom} to ${pageRangeTo} in surah ${pageBulkSurah.number}`);
      
    } catch (error) {
      console.error('Error updating page range:', error);
      alert('Failed to update page range. Please try again.');
    } finally {
      setBulkUpdateLoading(false);
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

        {/* Bulk Update for Surahs */}
        <div style={{ 
          marginTop: '1.5rem', 
          padding: '1rem', 
          background: '#f8f9fa', 
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <h4 style={{ marginBottom: '1rem' }}>Bulk Update Surahs</h4>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '1rem',
            alignItems: 'end'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                From Surah:
              </label>
              <select 
                value={surahRangeFrom}
                onChange={(e) => setSurahRangeFrom(parseInt(e.target.value))}
                className="form-control"
              >
                <option value="">Select...</option>
                {surahs.map(surah => (
                  <option key={surah.number} value={surah.number}>
                    {surah.number}. {showArabic ? surah.nameArabic : surah.nameEnglish}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                To Surah:
              </label>
              <select 
                value={surahRangeTo}
                onChange={(e) => setSurahRangeTo(parseInt(e.target.value))}
                className="form-control"
              >
                <option value="">Select...</option>
                {surahs.map(surah => (
                  <option key={surah.number} value={surah.number}>
                    {surah.number}. {showArabic ? surah.nameArabic : surah.nameEnglish}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Status:
              </label>
              <select 
                value={surahBulkStatus}
                onChange={(e) => setSurahBulkStatus(e.target.value)}
                className="form-control"
              >
                <option value="">Select status...</option>
                <option value="perfect">Perfect</option>
                <option value="medium">Medium</option>
                <option value="bad">Needs Review</option>
                <option value="not_memorized">Not Memorized</option>
              </select>
            </div>
            <div>
              <button 
                onClick={handleSurahBulkUpdate}
                disabled={!surahRangeFrom || !surahRangeTo || !surahBulkStatus || bulkUpdateLoading}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                {bulkUpdateLoading ? 'Updating...' : 'Update Range'}
              </button>
            </div>
          </div>
          {surahRangeFrom && surahRangeTo && surahRangeFrom <= surahRangeTo && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#6c757d' }}>
              Will update {surahRangeTo - surahRangeFrom + 1} surah(s) and all their pages
            </div>
          )}
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
                      
                      {/* Bulk Update for Pages */}
                      <div style={{ 
                        marginBottom: '1.5rem', 
                        padding: '1rem', 
                        background: '#f1f3f4', 
                        borderRadius: '8px',
                        border: '1px solid #dee2e6'
                      }}>
                        <h5 style={{ marginBottom: '1rem' }}>Bulk Update Pages</h5>
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                          gap: '1rem',
                          alignItems: 'end'
                        }}>
                          <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                              From Page:
                            </label>
                            <select 
                              value={pageRangeFrom}
                              onChange={(e) => setPageRangeFrom(parseInt(e.target.value))}
                              className="form-control"
                            >
                              <option value="">Select...</option>
                              {surahPages[surah.number].pages.map(page => (
                                <option key={page.pageNumber} value={page.pageNumber}>
                                  {page.pageNumber}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                              To Page:
                            </label>
                            <select 
                              value={pageRangeTo}
                              onChange={(e) => setPageRangeTo(parseInt(e.target.value))}
                              className="form-control"
                            >
                              <option value="">Select...</option>
                              {surahPages[surah.number].pages.map(page => (
                                <option key={page.pageNumber} value={page.pageNumber}>
                                  {page.pageNumber}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                              Status:
                            </label>
                            <select 
                              value={pageBulkStatus}
                              onChange={(e) => setPageBulkStatus(e.target.value)}
                              className="form-control"
                            >
                              <option value="">Select status...</option>
                              <option value="perfect">Perfect</option>
                              <option value="medium">Medium</option>
                              <option value="bad">Needs Review</option>
                              <option value="not_memorized">Not Memorized</option>
                            </select>
                          </div>
                          <div>
                            <button 
                              onClick={handlePageBulkUpdate}
                              disabled={!pageRangeFrom || !pageRangeTo || !pageBulkStatus || bulkUpdateLoading}
                              className="btn btn-secondary"
                              style={{ width: '100%' }}
                            >
                              {bulkUpdateLoading ? 'Updating...' : 'Update Range'}
                            </button>
                          </div>
                        </div>
                        {pageRangeFrom && pageRangeTo && pageRangeFrom <= pageRangeTo && (
                          <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#6c757d' }}>
                            Will update {pageRangeTo - pageRangeFrom + 1} page(s)
                          </div>
                        )}
                      </div>

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