import React from 'react';
import HolidayCalendar from '@/components/leave/HolidayCalendar';

export default function EmployeeHolidayCalendarPage() {
  return (
    <div className="w-full min-h-full px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">

      {/* Page Header */}
      <div className="mb-5 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
          Holiday Calendar
        </h1>

        <p className="mt-1 text-sm sm:text-base text-slate-500 dark:text-slate-400">
          View all upcoming Indian public holidays
        </p>
      </div>

      {/* Calendar */}
      <div className="w-full">
        <HolidayCalendar />
      </div>

    </div>
  );
}