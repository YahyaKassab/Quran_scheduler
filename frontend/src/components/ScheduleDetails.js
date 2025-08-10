import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import './ScheduleDetails.css';

const ScheduleDetails = ({ schedule, onSetDone }) => {
  const [expandedDay, setExpandedDay] = useState(null);
  const [selecting, setSelecting] = useState({ dayIdx: null, assignmentIdx: null });
  const [selectedPages, setSelectedPages] = useState([]);
  const [surahs, setSurahs] = useState([]);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'list'
  const tableRef = useRef(null);

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
        // Sort pages numerically within each group to create proper ranges
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

  // PDF Export Functions
  const exportToPDF = async () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      let isFirstPage = true;
      
      // Split schedule into pages to avoid cutting rows
      const itemsPerPage = 20; // Smaller chunks for better control
      const totalDataPages = Math.ceil(schedule.dailySchedule.length / itemsPerPage);
      
      for (let pageNum = 0; pageNum < totalDataPages; pageNum++) {
        const startIdx = pageNum * itemsPerPage;
        const endIdx = Math.min(startIdx + itemsPerPage, schedule.dailySchedule.length);
        const pageData = schedule.dailySchedule.slice(startIdx, endIdx);
        
        // Create a temporary div for this page only
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.width = '800px';
        tempDiv.style.fontFamily = 'Arial, sans-serif';
        tempDiv.style.fontSize = '14px';
        tempDiv.style.direction = 'rtl';
        tempDiv.style.backgroundColor = 'white';
        tempDiv.style.padding = '20px';
        
        // Build HTML content for this page
        let htmlContent = '';
        
        // Add header only on first page
        if (pageNum === 0) {
          htmlContent += `
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2980b9; margin-bottom: 10px;">جدول حفظ القرآن الكريم</h1>
              <h2 style="color: #34495e;">${schedule.name}</h2>
              <p><strong>الاتجاه:</strong> ${schedule.newDirection === 'reverse' ? 'من سورة الناس إلى البقرة' : 'من سورة البقرة إلى الناس'}</p>
              <p><strong>تاريخ البداية:</strong> ${new Date(schedule.startDate).toLocaleDateString('en-GB')}</p>
              <p><strong>تاريخ النهاية:</strong> ${new Date(schedule.endDate).toLocaleDateString('en-GB')}</p>
              <p><strong>عدد الأيام:</strong> ${schedule.totalDays}</p>
            </div>
          `;
        }
        
        // Add table for this page
        htmlContent += `
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px;">
            <thead>
              <tr style="background-color: #2980b9; color: white;">
                <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">التاريخ</th>
                <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">اليوم</th>
                <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">السور والصفحات</th>
              </tr>
            </thead>
            <tbody>
        `;
        
        // Add table rows for this page
        pageData.forEach((day, index) => {
          const groupedAssignments = groupAssignmentsBySurah(day.assignments);
          
          // Combine all surahs for this day
          const surahsText = groupedAssignments.map((surahGroup) => {
            return `${surahGroup.surahName} ${surahGroup.pageRange}`;
          }).join('، ');
          
          // Convert day name to Arabic
          let dayInArabic = day.dayOfWeek;
          if (dayInArabic === 'Sunday') dayInArabic = 'الأحد';
          else if (dayInArabic === 'Monday') dayInArabic = 'الاثنين';
          else if (dayInArabic === 'Tuesday') dayInArabic = 'الثلاثاء';
          else if (dayInArabic === 'Wednesday') dayInArabic = 'الأربعاء';
          else if (dayInArabic === 'Thursday') dayInArabic = 'الخميس';
          else if (dayInArabic === 'Friday') dayInArabic = 'الجمعة';
          else if (dayInArabic === 'Saturday') dayInArabic = 'السبت';
          
          const globalIndex = startIdx + index;
          const rowColor = globalIndex % 2 === 0 ? '#f8f9fa' : 'white';
          
          htmlContent += `
            <tr style="background-color: ${rowColor};">
              <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${new Date(day.date).toLocaleDateString('en-GB')}</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${dayInArabic}</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${surahsText}</td>
            </tr>
          `;
        });
        
        htmlContent += `
            </tbody>
          </table>
        `;
        
        // Add footer on last page
        if (pageNum === totalDataPages - 1) {
          htmlContent += `
            <div style="margin-top: 30px; text-align: center; font-size: 10px; color: #7f8c8d;">
              <p>تم إنشاؤه بواسطة تطبيق جدولة حفظ القرآن - ${new Date().toLocaleDateString('en-GB')}</p>
            </div>
          `;
        }
        
        tempDiv.innerHTML = htmlContent;
        document.body.appendChild(tempDiv);
        
        // Render this page as image
        const canvas = await html2canvas(tempDiv, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: 800,
          height: tempDiv.scrollHeight + 40
        });
        
        // Remove temporary div
        document.body.removeChild(tempDiv);
        
        // Add new page to PDF if not first
        if (!isFirstPage) {
          pdf.addPage();
        }
        isFirstPage = false;
        
        // Add this image to PDF
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 190; // A4 width minus margins
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Fit image to page, scaling down if necessary
        const maxHeight = 250; // Max height to fit on page
        const finalHeight = Math.min(imgHeight, maxHeight);
        const finalWidth = (finalHeight / imgHeight) * imgWidth;
        
        pdf.addImage(imgData, 'PNG', 10, 10, finalWidth, finalHeight);
        
        // Add page number
        pdf.setFontSize(8);
        pdf.text(`صفحة ${pageNum + 1} من ${totalDataPages}`, pdf.internal.pageSize.getWidth() - 40, pdf.internal.pageSize.getHeight() - 10);
        pdf.text('تم إنشاؤه بواسطة تطبيق جدولة حفظ القرآن', 15, pdf.internal.pageSize.getHeight() - 10);
      }
      
      // Save the PDF
      pdf.save(`${schedule.name.replace(/[^a-zA-Z0-9]/g, '_')}_schedule.pdf`);
      
      // Show success message
      alert('تم تصدير الجدول كـ PDF بنجاح!');
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(`خطأ في إنشاء ملف PDF: ${error.message}. يرجى المحاولة مرة أخرى.`);
    }
  };

  const exportTableAsImage = async () => {
    try {
      if (tableRef.current) {
        // Show loading indicator
        const originalButton = document.querySelector('.btn-success');
        const originalText = originalButton.textContent;
        originalButton.textContent = '⏳ جاري التصدير...';
        originalButton.disabled = true;

        const canvas = await html2canvas(tableRef.current, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          scrollX: 0,
          scrollY: 0,
          width: tableRef.current.scrollWidth,
          height: tableRef.current.scrollHeight
        });
        
        // Create download link
        const link = document.createElement('a');
        link.download = `${schedule.name.replace(/[^a-zA-Z0-9]/g, '_')}_schedule.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
        
        // Restore button
        originalButton.textContent = originalText;
        originalButton.disabled = false;
        
        // Show success message
        alert('تم تصدير الجدول كصورة بنجاح!');
      } else {
        alert('الرجاء التأكد من عرض الجدول أولاً');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      alert(`خطأ في تصدير الصورة: ${error.message}`);
      
      // Restore button in case of error
      const originalButton = document.querySelector('.btn-success');
      if (originalButton) {
        originalButton.textContent = '🖼️ تصدير صورة';
        originalButton.disabled = false;
      }
    }
  };

  return (
    <div className="schedule-details">
      <div className="schedule-header">
        <h2>📅 {schedule.name}</h2>
        <div className="schedule-info">
          <span>📖 الاتجاه: {schedule.newDirection === 'reverse' ? 'من الناس إلى البقرة' : 'من البقرة إلى الناس'}</span>
          <span>📅 من: {new Date(schedule.startDate).toLocaleDateString()}</span>
          <span>📅 إلى: {new Date(schedule.endDate).toLocaleDateString()}</span>
          <span>📊 إجمالي الأيام: {schedule.totalDays}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button 
          onClick={() => setViewMode(viewMode === 'table' ? 'list' : 'table')}
          className="btn btn-primary"
        >
          {viewMode === 'table' ? '📋 عرض القائمة' : '📊 عرض الجدول'}
        </button>
        
        <button 
          onClick={exportToPDF}
          className="btn btn-danger"
        >
          📄 تصدير PDF
        </button>
        
        <button 
          onClick={exportTableAsImage}
          className="btn btn-success"
        >
          🖼️ تصدير صورة
        </button>
      </div>

      {viewMode === 'table' ? (
        /* Table View */
        <div ref={tableRef} className="schedule-table">
          <table>
            <thead>
              <tr>
                <th>التاريخ</th>
                <th>اليوم</th>
                <th>النوع</th>
                <th>السورة</th>
                <th>الصفحات</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {schedule.dailySchedule.map((day, dayIdx) => {
                const groupedAssignments = groupAssignmentsBySurah(day.assignments);
                return groupedAssignments.map((surahGroup, i) => (
                  <tr key={`${dayIdx}-${i}`}>
                    <td>
                      {new Date(day.date).toLocaleDateString('ar-SA')}
                    </td>
                    <td>
                      {day.dayOfWeek === 'Friday' ? '🕌' : ''} {day.dayOfWeek}
                    </td>
                    <td>
                      <span className={`type-badge type-${surahGroup.type}`}>
                        {surahGroup.type === 'revision' ? '🔁 مراجعة' : surahGroup.type === 'new' ? '🆕 جديد' : '⭐ خاص'}
                      </span>
                    </td>
                    <td style={{ fontWeight: '500' }}>
                      {surahGroup.surahName}
                    </td>
                    <td>
                      {surahGroup.pageRange}
                    </td>
                    <td>
                      <span className={`status-badge status-${surahGroup.status.replace('_', '-')}`}>
                        {surahGroup.status === 'perfect' ? '⭐ ممتاز' : surahGroup.status === 'medium' ? '📖 متوسط' : surahGroup.status === 'not_memorized' ? '🆕 جديد' : surahGroup.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons-cell">
                        <button
                          className={`btn-sm ${surahGroup.assignments.every((a) => a.completed) ? 'btn-secondary' : 'btn-success'}`}
                          disabled={surahGroup.assignments.every((a) => a.completed)}
                          onClick={() => handleSetSurahDone(day.date, surahGroup)}
                          style={{ 
                            backgroundColor: surahGroup.assignments.every((a) => a.completed) ? '#6c757d' : '#28a745',
                            color: 'white'
                          }}
                        >
                          {surahGroup.assignments.every((a) => a.completed) ? '✅ تم' : '✅ إنجاز'}
                        </button>
                        <button
                          className="btn-sm btn-primary"
                          disabled={surahGroup.assignments.every((a) => a.completed)}
                          onClick={() => handleSelectPages(dayIdx, i, surahGroup)}
                          style={{ 
                            backgroundColor: '#007bff',
                            color: 'white'
                          }}
                        >
                          📄 تحديد
                        </button>
                      </div>
                      
                      {/* Page selection UI */}
                      {selecting.dayIdx === dayIdx &&
                        selecting.assignmentIdx === i &&
                        !surahGroup.assignments.every((a) => a.completed) && (
                          <div className="page-selector">
                            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', color: '#2c3e50' }}>
                              اختر الصفحات:
                            </label>
                            <div className="page-selector-grid">
                              {surahGroup.pages.map((pageNum) => (
                                <label key={pageNum} className="page-checkbox">
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
                            <div className="page-selector-actions">
                              <button
                                onClick={() => handleConfirmPages(day, surahGroup, i)}
                                className="btn-sm btn-success"
                                style={{
                                  background: '#28a745',
                                  color: 'white',
                                }}
                              >
                                ✅ تأكيد ({selectedPages.length})
                              </button>
                              <button
                                onClick={() => setSelecting({ dayIdx: null, assignmentIdx: null })}
                                className="btn-sm"
                                style={{
                                  background: '#6c757d',
                                  color: 'white',
                                }}
                              >
                                ❌ إلغاء
                              </button>
                            </div>
                          </div>
                        )}
                    </td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Original List View */
        <div className="list-view">
          {schedule.dailySchedule.map((day, dayIdx) => (
            <div key={dayIdx} className="day-card">
              <div className="day-header">
                <strong>
                  {new Date(day.date).toLocaleDateString()} ({day.dayOfWeek})
                </strong>
                <button 
                  className="btn btn-primary"
                  onClick={() => setExpandedDay(expandedDay === dayIdx ? null : dayIdx)}
                >
                  {expandedDay === dayIdx ? 'إخفاء' : 'عرض'} المهام
                </button>
              </div>
              {expandedDay === dayIdx && (
                <ul className="assignments-list">
                  {groupAssignmentsBySurah(day.assignments).map((surahGroup, i) => (
                    <li key={i} className="assignment-item">
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
                        className="btn btn-success btn-sm"
                        disabled={surahGroup.assignments.every((a) => a.completed)}
                        onClick={() => handleSetSurahDone(day.date, surahGroup)}
                      >
                        {surahGroup.assignments.every((a) => a.completed) ? 'تم' : 'تم الإنجاز'}
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        disabled={surahGroup.assignments.every((a) => a.completed)}
                        onClick={() => handleSelectPages(dayIdx, i, surahGroup)}
                      >
                        تحديد الصفحات
                      </button>
                      {/* Page selection UI with checkboxes */}
                      {selecting.dayIdx === dayIdx &&
                        selecting.assignmentIdx === i &&
                        !surahGroup.assignments.every((a) => a.completed) && (
                          <div className="page-selector">
                            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
                              اختر الصفحات:
                            </label>
                            <div className="page-selector-grid">
                              {surahGroup.pages.map((pageNum) => (
                                <label key={pageNum} className="page-checkbox">
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
                            <div className="page-selector-actions">
                              <button
                                onClick={() => handleConfirmPages(day, surahGroup, i)}
                                className="btn btn-primary btn-sm"
                              >
                                تأكيد ({selectedPages.length} صفحة)
                              </button>
                              <button
                                onClick={() => setSelecting({ dayIdx: null, assignmentIdx: null })}
                                className="btn btn-sm"
                                style={{
                                  background: '#6c757d',
                                  color: 'white',
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
      )}
    </div>
  );
};

export default ScheduleDetails;
