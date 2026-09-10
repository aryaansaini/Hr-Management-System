import React from 'react';
import HolidayCalendar from '@/components/leave/HolidayCalendar';

export default function EmployeeHolidayCalendarPage() {
  return (
    <div style={{ padding: '16px 24px', maxWidth: '100%', margin: '0', height: '100vh', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', overflow: 'hidden' }}>
      <div style={{ marginBottom: '16px', flexShrink: 0 }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 4px 0' }}>Holiday Calendar</h1>
        <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>View all upcoming Indian public holidays</p>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <HolidayCalendar />
      </div>
    </div>
  );
}