import React, { useState, useEffect } from 'react';

const ScheduleDetails = ({ schedule, onSetDone }) => {
  const [expandedDay, setExpandedDay] = useState(null);
  const [selecting, setSelecting] = useState({ dayIdx: null, assignmentIdx: null });
  const [selectedPages, setSelectedPages] = useState([]);
  const [surahs, setSurahs] = useState([]);

  // Fetch surahs when component mounts
  useEffect(() => {
    const fetchSurahs = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/surahs');
        const data = await response.json();
        setSurahs(data);
      } catch (error) {
        console.error('Failed to fetch surahs:', error);
      }
    };
    fetchSurahs();
  }, []);

  if (!schedule) return <div>No schedule selected.</div>;

  // Helper to get page range for an assignment (if available)
  const getPageRange = (a) => {
    if (a.pageStart && a.pageEnd) {
      return `الصفحات ${a.pageStart}-${a.pageEnd}`;
    } else if (a.pageNumber) {
      return `الصفحة ${a.pageNumber}`;
    } else {
      return '';
    }
  };

  // Group assignments by surah and combine page ranges
  const groupAssignmentsBySurah = (assignments) => {
    console.log('Grouping assignments:', assignments);
    const grouped = {};

    assignments.forEach((a, index) => {
      const surahKey = a.surahNumber;

      // Find the surah from the fetched surahs list
      const surahData = surahs.find((s) => s.number === a.surahNumber);
      const surahName =
        surahData?.nameArabic ||
        a.surahNameArabic ||
        a.surahNameEnglish ||
        a.surahName ||
        `سورة ${a.surahNumber}`;

      console.log('Assignment:', a); // Debug log
      console.log('Surah data found:', surahData); // Debug log
      console.log('Surah name chosen:', surahName); // Debug log

      if (!grouped[surahKey]) {
        grouped[surahKey] = {
          surahName,
          surahNumber: a.surahNumber,
          type: a.type,
          status: a.status,
          pages: [],
          originalIndex: index,
          completed: a.completed,
          assignments: [],
        };
      }

      if (a.pageNumber) {
        grouped[surahKey].pages.push(a.pageNumber);
      }
      grouped[surahKey].assignments.push({ ...a, originalIndex: index });
    });

    // Convert to array and format page ranges
    return Object.values(grouped).map((group) => {
      if (group.pages.length > 0) {
        group.pages.sort((a, b) => a - b);
        const ranges = [];
        let start = group.pages[0];
        let end = group.pages[0];

        for (let i = 1; i < group.pages.length; i++) {
          if (group.pages[i] === end + 1) {
            end = group.pages[i];
          } else {
            ranges.push(start === end ? `${start}` : `${start}-${end}`);
            start = end = group.pages[i];
          }
        }
        ranges.push(start === end ? `${start}` : `${start}-${end}`);

        group.pageRange = `الصفحات ${ranges.join(', ')}`;
      } else {
        group.pageRange = '';
      }

      // Check if this is a complete surah
      const surahData = surahs.find((s) => s.number === group.surahNumber);
      console.log('Checking complete surah for:', group.surahName, 'Pages:', group.pages, 'Surah data:', surahData);
      
      if (surahData) {
        // For Al-Kahf (surah 18), check if we have all pages from 293 to 304
        if (group.surahNumber === 18) {
          const expectedPages = [];
          for (let i = surahData.startPage; i <= surahData.endPage; i++) {
            expectedPages.push(i);
          }
          console.log('Al-Kahf expected pages:', expectedPages, 'Actual pages:', group.pages);
          
          // Check if we have all expected pages
          const hasAllPages = expectedPages.every(page => group.pages.includes(page));
          if (hasAllPages && group.pages.length === expectedPages.length) {
            group.pageRange = 'كاملة';
            console.log('Al-Kahf detected as complete!');
          }
        } else if (group.pages.length === surahData.totalPages) {
          group.pageRange = 'كاملة';
        }
      }

      return group;
    });
  };

  // Default: mark all pages in assignment as done
  const handleSetDone = (date, assignmentIndex) => {
    if (onSetDone) {
      onSetDone(schedule._id, date, assignmentIndex);
    }
  };

  // Handle marking a surah group as done (marks all assignments in that surah)
  const handleSetSurahDone = (date, surahGroup) => {
    surahGroup.assignments.forEach((assignment) => {
      if (!assignment.completed && onSetDone) {
        onSetDone(schedule._id, date, assignment.originalIndex);
      }
    });
  };

  // For selecting specific pages (UI is basic for now)
  const handleSelectPages = (dayIdx, assignmentIdx, surahGroup) => {
    setSelecting({ dayIdx, assignmentIdx });
    setSelectedPages([]);
  };

  const handleConfirmPages = (day, surahGroup, assignmentIdx) => {
    // TODO: Implement API call to mark only selected pages as done
    // For now, just close the selector
    setSelecting({ dayIdx: null, assignmentIdx: null });
    alert('تم تحديد الصفحات: ' + selectedPages.join(', '));
  };

  const togglePageSelection = (pageNumber) => {
    setSelectedPages((prev) =>
      prev.includes(pageNumber) ? prev.filter((p) => p !== pageNumber) : [...prev, pageNumber]
    );
  };

  return (
    <div className="schedule-details">
      <h2>تفاصيل الجدول: {schedule.name}</h2>
      <div>
        {schedule.dailySchedule.map((day, dayIdx) => (
          <div
            key={dayIdx}
            style={{ marginBottom: '1rem', border: '1px solid #eee', borderRadius: 6, padding: 12 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>
                {new Date(day.date).toLocaleDateString()} ({day.dayOfWeek})
              </strong>
              <button onClick={() => setExpandedDay(expandedDay === dayIdx ? null : dayIdx)}>
                {expandedDay === dayIdx ? 'إخفاء' : 'عرض'} المهام
              </button>
            </div>
            {expandedDay === dayIdx && (
              <ul style={{ marginTop: 8 }}>
                {groupAssignmentsBySurah(day.assignments).map((surahGroup, i) => (
                  <li
                    key={i}
                    style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <span>
                      {surahGroup.type === 'revision'
                        ? '🔁'
                        : surahGroup.type === 'new'
                        ? '🆕'
                        : '⭐'}{' '}
                    </span>
                    <span>
                      {surahGroup.surahName} {surahGroup.pageRange} ({surahGroup.status})
                    </span>
                    <button
                      style={{ marginLeft: 8 }}
                      disabled={surahGroup.assignments.every((a) => a.completed)}
                      onClick={() => handleSetSurahDone(day.date, surahGroup)}
                    >
                      {surahGroup.assignments.every((a) => a.completed) ? 'تم' : 'تم الإنجاز'}
                    </button>
                    <button
                      style={{ marginLeft: 8 }}
                      disabled={surahGroup.assignments.every((a) => a.completed)}
                      onClick={() => handleSelectPages(dayIdx, i, surahGroup)}
                    >
                      تحديد الصفحات
                    </button>
                    {/* Page selection UI with checkboxes */}
                    {selecting.dayIdx === dayIdx &&
                      selecting.assignmentIdx === i &&
                      !surahGroup.assignments.every((a) => a.completed) && (
                        <div
                          style={{
                            marginLeft: 12,
                            padding: '10px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            background: '#f9f9f9',
                          }}
                        >
                          <label
                            style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}
                          >
                            اختر الصفحات:
                          </label>
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
                              gap: '5px',
                              maxHeight: '150px',
                              overflowY: 'auto',
                              marginBottom: '10px',
                            }}
                          >
                            {surahGroup.pages.map((pageNum) => (
                              <label
                                key={pageNum}
                                style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedPages.includes(pageNum)}
                                  onChange={() => togglePageSelection(pageNum)}
                                  style={{ marginRight: '4px' }}
                                />
                                {pageNum}
                              </label>
                            ))}
                          </div>
                          <div>
                            <button
                              onClick={() => handleConfirmPages(day, surahGroup, i)}
                              style={{
                                marginRight: '8px',
                                padding: '4px 8px',
                                background: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                              }}
                            >
                              تأكيد ({selectedPages.length} صفحة)
                            </button>
                            <button
                              onClick={() => setSelecting({ dayIdx: null, assignmentIdx: null })}
                              style={{
                                padding: '4px 8px',
                                background: '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                              }}
                            >
                              إلغاء
                            </button>
                          </div>
                        </div>
                      )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScheduleDetails;
