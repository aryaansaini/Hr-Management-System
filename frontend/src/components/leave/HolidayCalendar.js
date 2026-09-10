'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  PartyPopper,
  X,
  MapPin,
  Sparkles,
  CalendarPlus,
} from 'lucide-react';

/* =====================================================
   HOLIDAYS
===================================================== */

const getHolidaysForYear = (year) => {
  const holidays = [
    {
      date: `${year}-01-01`,
      name: "New Year's Day",
      type: 'Public Holiday',
      description: 'New Year marks the beginning of a new calendar year.',
      location: 'India',
    },
    {
      date: `${year}-01-26`,
      name: 'Republic Day',
      type: 'Public Holiday',
      description:
        'Republic Day celebrates the adoption of the Constitution of India.',
      location: 'India',
    },
    {
      date: `${year}-08-15`,
      name: 'Independence Day',
      type: 'Public Holiday',
      description:
        'Independence Day commemorates the independence of India.',
      location: 'India',
    },
    {
      date: `${year}-10-02`,
      name: 'Gandhi Jayanti',
      type: 'Public Holiday',
      description:
        'Gandhi Jayanti commemorates the birth anniversary of Mahatma Gandhi.',
      location: 'India',
    },
    {
      date: `${year}-12-25`,
      name: 'Christmas Day',
      type: 'Public Holiday',
      description:
        'Christmas celebrates the birth of Jesus Christ.',
      location: 'India',
    },
  ];

  if (year === 2026) {
    holidays.push(
      {
        date: '2026-01-14',
        name: 'Makar Sankranti / Pongal',
        type: 'Festival Holiday',
        description:
          'Makar Sankranti and Pongal celebrate the harvest season in India.',
        location: 'India',
      },
      {
        date: '2026-02-14',
        name: 'Maha Shivaratri',
        type: 'Festival Holiday',
        description:
          'Maha Shivaratri is dedicated to Lord Shiva.',
        location: 'India',
      },
      {
        date: '2026-03-03',
        name: 'Holi',
        type: 'Festival Holiday',
        description:
          'Holi is the festival of colours and celebrates the arrival of spring.',
        location: 'India',
      },
      {
        date: '2026-03-20',
        name: 'Eid al-Fitr',
        type: 'Festival Holiday',
        description:
          'Eid al-Fitr marks the end of the holy month of Ramadan.',
        location: 'India',
      },
      {
        date: '2026-03-28',
        name: 'Ram Navami',
        type: 'Festival Holiday',
        description:
          'Ram Navami celebrates the birth of Lord Rama.',
        location: 'India',
      },
      {
        date: '2026-03-30',
        name: 'Mahavir Jayanti',
        type: 'Public Holiday',
        description:
          'Mahavir Jayanti celebrates the birth of Lord Mahavir.',
        location: 'India',
      },
      {
        date: '2026-04-03',
        name: 'Good Friday',
        type: 'Public Holiday',
        description:
          'Good Friday commemorates the crucifixion of Jesus Christ.',
        location: 'India',
      },
      {
        date: '2026-05-01',
        name: 'Labour Day',
        type: 'Public Holiday',
        description:
          'Labour Day recognizes the contribution of workers.',
        location: 'India',
      },
      {
        date: '2026-08-28',
        name: 'Raksha Bandhan',
        type: 'Festival Holiday',
        description:
          'Raksha Bandhan celebrates the bond between brothers and sisters.',
        location: 'India',
      },
      {
        date: '2026-09-04',
        name: 'Janmashtami',
        type: 'Festival Holiday',
        description:
          'Janmashtami celebrates the birth of Lord Krishna.',
        location: 'India',
      },
      {
        date: '2026-09-14',
        name: 'Ganesh Chaturthi',
        type: 'Festival Holiday',
        description:
          'Ganesh Chaturthi celebrates the birth of Lord Ganesha.',
        location: 'India',
      },
      {
        date: '2026-10-18',
        name: 'Dussehra',
        type: 'Festival Holiday',
        description:
          'Dussehra celebrates the victory of good over evil.',
        location: 'India',
      },
      {
        date: '2026-11-08',
        name: 'Diwali',
        type: 'Festival Holiday',
        description:
          'Diwali is the festival of lights and celebrates prosperity and happiness.',
        location: 'India',
      },
      {
        date: '2026-11-10',
        name: 'Bhai Dooj',
        type: 'Festival Holiday',
        description:
          'Bhai Dooj celebrates the special bond between brothers and sisters.',
        location: 'India',
      },
      {
        date: '2026-11-15',
        name: 'Chhath Puja',
        type: 'Festival Holiday',
        description:
          'Chhath Puja is dedicated to the worship of the Sun God.',
        location: 'India',
      },
      {
        date: '2026-11-24',
        name: 'Guru Nanak Jayanti',
        type: 'Public Holiday',
        description:
          'Guru Nanak Jayanti celebrates the birth of Guru Nanak Dev Ji.',
        location: 'India',
      }
    );
  }

  return holidays;
};

/* =====================================================
   CONSTANTS
===================================================== */

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const dayNames = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
];

/* =====================================================
   DATE FORMAT
===================================================== */

const formatDate = (date) => {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    date.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

/* =====================================================
   FORMAT FULL DATE
===================================================== */

const formatFullDate = (dateString) => {
  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString(
    'en-IN',
    {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
  );
};

/* =====================================================
   MAIN COMPONENT
===================================================== */

export default function HolidayCalendar() {
  const { resolvedTheme } = useTheme();

  const [mounted, setMounted] = useState(false);

  const [currentDate, setCurrentDate] =
    useState(new Date());

  const [selectedHoliday, setSelectedHoliday] =
    useState(null);

  /* =====================================================
     MOUNT
  ===================================================== */

  useEffect(() => {
    setMounted(true);
  }, []);

  /* =====================================================
     THEME
  ===================================================== */

  const isDark =
    mounted &&
    resolvedTheme === 'dark';

  /* =====================================================
     CURRENT MONTH / YEAR
  ===================================================== */

  const currentYear =
    currentDate.getFullYear();

  const currentMonth =
    currentDate.getMonth();

  /* =====================================================
     MONTH DETAILS
  ===================================================== */

  const daysInMonth =
    new Date(
      currentYear,
      currentMonth + 1,
      0
    ).getDate();

  const firstDay =
    new Date(
      currentYear,
      currentMonth,
      1
    ).getDay();

  const previousMonthDays =
    new Date(
      currentYear,
      currentMonth,
      0
    ).getDate();

  /* =====================================================
     CALENDAR DAYS
  ===================================================== */

  const calendarDays = [];

  /* PREVIOUS MONTH DAYS */

  for (
    let i = firstDay - 1;
    i >= 0;
    i--
  ) {
    calendarDays.push({
      day:
        previousMonthDays - i,

      currentMonth: false,

      monthOffset: -1,
    });
  }

  /* CURRENT MONTH DAYS */

  for (
    let i = 1;
    i <= daysInMonth;
    i++
  ) {
    calendarDays.push({
      day: i,

      currentMonth: true,

      monthOffset: 0,
    });
  }

  /* NEXT MONTH DAYS */

  while (
    calendarDays.length < 42
  ) {
    const day =
      calendarDays.length -
      (
        firstDay +
        daysInMonth
      ) +
      1;

    calendarDays.push({
      day,

      currentMonth: false,

      monthOffset: 1,
    });
  }

  /* =====================================================
     GET CELL DATE
  ===================================================== */

  const getCellDate = (
    day,
    monthOffset
  ) => {
    return new Date(
      currentYear,
      currentMonth + monthOffset,
      day
    );
  };

  /* =====================================================
     GET HOLIDAY
  ===================================================== */

  const getHoliday = (
    day,
    monthOffset
  ) => {
    const date =
      getCellDate(
        day,
        monthOffset
      );

    const year =
      date.getFullYear();

    const yearHolidays =
      getHolidaysForYear(year);

    return yearHolidays.find(
      (holiday) =>
        holiday.date ===
        formatDate(date)
    );
  };

  /* =====================================================
     TODAY CHECK
  ===================================================== */

  const isToday = (
    day,
    monthOffset
  ) => {
    const today =
      new Date();

    const cellDate =
      getCellDate(
        day,
        monthOffset
      );

    return (
      today.getDate() ===
        cellDate.getDate() &&
      today.getMonth() ===
        cellDate.getMonth() &&
      today.getFullYear() ===
        cellDate.getFullYear()
    );
  };

  /* =====================================================
     NAVIGATION
  ===================================================== */

  const previousMonth = () => {
    setCurrentDate(
      new Date(
        currentYear,
        currentMonth - 1,
        1
      )
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(
        currentYear,
        currentMonth + 1,
        1
      )
    );
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  /* =====================================================
     GOOGLE CALENDAR
  ===================================================== */

  const addToGoogleCalendar = () => {
    if (!selectedHoliday) return;

    const startDate =
      selectedHoliday.date.replaceAll(
        '-',
        ''
      );

    const googleUrl =
      `https://calendar.google.com/calendar/render?action=TEMPLATE` +
      `&text=${encodeURIComponent(
        selectedHoliday.name
      )}` +
      `&dates=${startDate}/${startDate}` +
      `&details=${encodeURIComponent(
        selectedHoliday.description
      )}` +
      `&location=${encodeURIComponent(
        selectedHoliday.location || 'India'
      )}`;

    window.open(
      googleUrl,
      '_blank'
    );
  };

  /* =====================================================
     THEME COLORS
  ===================================================== */

  const theme = {
    card:
      isDark
        ? '#111827'
        : '#ffffff',

    calendarCard:
      isDark
        ? '#111827'
        : '#ffffff',

    secondaryCard:
      isDark
        ? '#182235'
        : '#ffffff',

    muted:
      isDark
        ? '#1e293b'
        : '#f8fafc',

    border:
      isDark
        ? '#334155'
        : '#e2e8f0',

    text:
      isDark
        ? '#f8fafc'
        : '#0f172a',

    secondaryText:
      isDark
        ? '#94a3b8'
        : '#64748b',

    accent:
      '#2563eb',

    accentLight:
      isDark
        ? 'rgba(37, 99, 235, 0.18)'
        : '#eff6ff',

    holiday:
      '#10b981',

    holidayLight:
      isDark
        ? 'rgba(16, 185, 129, 0.16)'
        : '#ecfdf5',

    today:
      '#2563eb',

    otherMonth:
      isDark
        ? '#0b1220'
        : '#f8fafc',
  };

  if (!mounted) {
    return null;
  }

  /* =====================================================
     RETURN
  ===================================================== */

  return (
    <>
      <div className="holiday-calendar-container">

        {/* CALENDAR */}

        <div
          className="calendar-card"
          style={{
            background:
              theme.calendarCard,

            border:
              `1px solid ${theme.border}`,

            boxShadow:
              isDark
                ? '0 10px 30px rgba(0,0,0,0.20)'
                : '0 10px 30px rgba(15,23,42,0.05)',
          }}
        >

          {/* HEADER */}

          <div className="calendar-header">

            {/* TITLE */}

            <div className="calendar-title-section">

              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background:
                    theme.accentLight,
                  color:
                    theme.accent,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <CalendarDays size={21} />
              </div>

              <div>
                <h2
                  style={{
                    margin: 0,
                    color:
                      theme.text,
                    fontSize:
                      '21px',
                    fontWeight:
                      '800',
                  }}
                >
                  Holiday Calendar
                </h2>

                <p
                  style={{
                    margin:
                      '3px 0 0',
                    color:
                      theme.secondaryText,
                    fontSize:
                      '12px',
                  }}
                >
                  View company holidays and important dates
                </p>
              </div>
            </div>

            {/* CONTROLS */}

            <div className="calendar-controls">

              <button
                onClick={goToToday}
                className="calendar-button"
                style={{
                  border:
                    `1px solid ${theme.border}`,
                  background:
                    theme.muted,
                  color:
                    theme.text,
                }}
              >
                Today
              </button>

              <button
                onClick={previousMonth}
                className="calendar-icon-button"
                style={{
                  border:
                    `1px solid ${theme.border}`,
                  background:
                    theme.muted,
                  color:
                    theme.text,
                }}
              >
                <ChevronLeft size={18} />
              </button>

              <button
                onClick={nextMonth}
                className="calendar-icon-button"
                style={{
                  border:
                    `1px solid ${theme.border}`,
                  background:
                    theme.muted,
                  color:
                    theme.text,
                }}
              >
                <ChevronRight size={18} />
              </button>

            </div>
          </div>

          {/* MONTH TITLE */}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent:
                'space-between',
              gap: '10px',
              marginBottom:
                '12px',
              paddingBottom:
                '10px',
              borderBottom:
                `1px solid ${theme.border}`,
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize:
                  '19px',
                fontWeight:
                  '800',
                color:
                  theme.text,
              }}
            >
              {monthNames[currentMonth]}{' '}
              {currentYear}
            </h3>

            <div
              style={{
                display: 'flex',
                alignItems:
                  'center',
                gap: '6px',
                color:
                  theme.secondaryText,
                fontSize:
                  '11px',
                fontWeight:
                  '600',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius:
                    '50%',
                  background:
                    theme.holiday,
                  display:
                    'inline-block',
                }}
              />

              Holiday
            </div>
          </div>

          {/* CALENDAR */}

          <div className="calendar-scroll">
            <div className="calendar-min-width">

              {/* DAYS HEADER */}

              <div
                style={{
                  display:
                    'grid',
                  gridTemplateColumns:
                    'repeat(7, minmax(0, 1fr))',
                  marginBottom:
                    '5px',
                }}
              >
                {dayNames.map(
                  (day) => (
                    <div
                      key={day}
                      style={{
                        textAlign:
                          'center',
                        padding:
                          '6px 2px',
                        fontSize:
                          '10px',
                        fontWeight:
                          '800',
                        color:
                          theme.secondaryText,
                        textTransform:
                          'uppercase',
                      }}
                    >
                      {day}
                    </div>
                  )
                )}
              </div>

              {/* CALENDAR GRID */}

              <div
                style={{
                  display:
                    'grid',
                  gridTemplateColumns:
                    'repeat(7, minmax(0, 1fr))',
                  gap: '4px',
                }}
              >
                {calendarDays.map(
                  (
                    cell,
                    index
                  ) => {
                    const holiday =
                      getHoliday(
                        cell.day,
                        cell.monthOffset
                      );

                    const today =
                      isToday(
                        cell.day,
                        cell.monthOffset
                      );

                    return (
                      <div
                        key={index}

                        onClick={() => {
                          if (holiday) {
                            setSelectedHoliday(
                              holiday
                            );
                          }
                        }}

                        style={{
                          minHeight:
                            '70px',

                          padding:
                            '6px',

                          borderRadius:
                            '9px',

                          border:
                            today
                              ? `2px solid ${theme.today}`
                              : `1px solid ${theme.border}`,

                          background:
                            !cell.currentMonth
                              ? theme.otherMonth
                              : theme.card,

                          opacity:
                            cell.currentMonth
                              ? 1
                              : 0.55,

                          boxSizing:
                            'border-box',

                          display:
                            'flex',

                          flexDirection:
                            'column',

                          transition:
                            'all 0.2s ease',

                          cursor:
                            holiday
                              ? 'pointer'
                              : 'default',
                        }}

                        onMouseEnter={(e) => {
                          if (holiday) {
                            e.currentTarget.style.transform =
                              'translateY(-2px)';

                            e.currentTarget.style.boxShadow =
                              isDark
                                ? '0 8px 20px rgba(0,0,0,0.30)'
                                : '0 8px 20px rgba(15,23,42,0.10)';
                          }
                        }}

                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform =
                            'translateY(0)';

                          e.currentTarget.style.boxShadow =
                            'none';
                        }}
                      >

                        {/* DAY NUMBER */}

                        <div
                          style={{
                            display:
                              'flex',

                            justifyContent:
                              'space-between',

                            alignItems:
                              'center',
                          }}
                        >
                          <span
                            style={{
                              width:
                                '24px',

                              height:
                                '24px',

                              borderRadius:
                                today
                                  ? '50%'
                                  : '7px',

                              background:
                                today
                                  ? theme.today
                                  : 'transparent',

                              color:
                                today
                                  ? '#ffffff'
                                  : theme.text,

                              display:
                                'flex',

                              alignItems:
                                'center',

                              justifyContent:
                                'center',

                              fontSize:
                                '11px',

                              fontWeight:
                                '800',
                            }}
                          >
                            {cell.day}
                          </span>

                          {today && (
                            <span
                              className="today-text"
                              style={{
                                fontSize:
                                  '7px',

                                fontWeight:
                                  '800',

                                color:
                                  theme.today,
                              }}
                            >
                              TODAY
                            </span>
                          )}
                        </div>

                        {/* HOLIDAY */}

                        {holiday && (
                          <div
                            title={holiday.name}
                            style={{
                              marginTop:
                                'auto',

                              padding:
                                '4px 5px',

                              borderRadius:
                                '6px',

                              background:
                                theme.holidayLight,

                              borderLeft:
                                `2px solid ${theme.holiday}`,

                              color:
                                isDark
                                  ? '#d1fae5'
                                  : '#047857',

                              fontSize:
                                '8px',

                              fontWeight:
                                '700',

                              lineHeight:
                                '1.25',

                              overflow:
                                'hidden',

                              display:
                                '-webkit-box',

                              WebkitLineClamp:
                                2,

                              WebkitBoxOrient:
                                'vertical',
                            }}
                          >
                            {holiday.name}
                          </div>
                        )}

                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        </div>

        {/* LEGEND */}

        <div
          style={{
            display:
              'flex',

            alignItems:
              'center',

            gap:
              '18px',

            flexWrap:
              'wrap',

            marginTop:
              '12px',

            padding:
              '10px 14px',

            background:
              theme.secondaryCard,

            border:
              `1px solid ${theme.border}`,

            borderRadius:
              '12px',
          }}
        >

          <div
            style={{
              display:
                'flex',

              alignItems:
                'center',

              gap:
                '7px',

              color:
                theme.secondaryText,

              fontSize:
                '11px',

              fontWeight:
                '600',
            }}
          >
            <span
              style={{
                width: '9px',
                height: '9px',
                borderRadius:
                  '50%',
                background:
                  theme.today,
              }}
            />

            Current Day
          </div>

          <div
            style={{
              display:
                'flex',

              alignItems:
                'center',

              gap:
                '7px',

              color:
                theme.secondaryText,

              fontSize:
                '11px',

              fontWeight:
                '600',
            }}
          >
            <span
              style={{
                width: '9px',
                height: '9px',
                borderRadius:
                  '3px',
                background:
                  theme.holiday,
              }}
            />

            Holiday
          </div>

        </div>
      </div>

      {/* HOLIDAY MODAL */}

      {selectedHoliday && (
        <div
          className="holiday-modal-overlay"

          onClick={() => {
            setSelectedHoliday(null);
          }}
        >
          <div
            className="holiday-modal"

            style={{
              background:
                isDark
                  ? '#111827'
                  : '#ffffff',

              border:
                `1px solid ${theme.border}`,

              boxShadow:
                isDark
                  ? '0 30px 80px rgba(0,0,0,0.55)'
                  : '0 30px 80px rgba(15,23,42,0.25)',
            }}

            onClick={(e) => {
              e.stopPropagation();
            }}
          >

            {/* CLOSE */}

            <button
              onClick={() => {
                setSelectedHoliday(null);
              }}

              className="modal-close-button"

              style={{
                color:
                  theme.secondaryText,
              }}
            >
              <X size={20} />
            </button>

            {/* TOP BANNER */}

            <div
              style={{
                height:
                  '110px',

                borderRadius:
                  '20px',

                background:
                  isDark
                    ? 'linear-gradient(135deg, #5a2108, #27121a)'
                    : 'linear-gradient(135deg, #fff1e8, #fff7ed)',

                display:
                  'flex',

                alignItems:
                  'center',

                justifyContent:
                  'center',

                marginBottom:
                  '18px',

                position:
                  'relative',

                overflow:
                  'hidden',
              }}
            >
              <Sparkles
                size={18}
                style={{
                  position:
                    'absolute',

                  top:
                    '20px',

                  left:
                    '28%',

                  color:
                    '#f97316',
                }}
              />

              <Sparkles
                size={14}
                style={{
                  position:
                    'absolute',

                  bottom:
                    '18px',

                  right:
                    '25%',

                  color:
                    '#f97316',
                }}
              />

              <div
                style={{
                  width:
                    '70px',

                  height:
                    '70px',

                  borderRadius:
                    '50%',

                  background:
                    isDark
                      ? 'rgba(249,115,22,0.15)'
                      : '#ffffff',

                  border:
                    '1px solid rgba(249,115,22,0.35)',

                  display:
                    'flex',

                  alignItems:
                    'center',

                  justifyContent:
                    'center',

                  color:
                    '#f97316',

                  boxShadow:
                    '0 10px 25px rgba(249,115,22,0.20)',
                }}
              >
                <PartyPopper size={32} />
              </div>
            </div>

            {/* TYPE */}

            <div
              style={{
                display:
                  'inline-flex',

                alignItems:
                  'center',

                gap:
                  '6px',

                padding:
                  '7px 11px',

                borderRadius:
                  '999px',

                background:
                  'rgba(249,115,22,0.12)',

                color:
                  '#f97316',

                fontSize:
                  '11px',

                fontWeight:
                  '800',

                textTransform:
                  'uppercase',
              }}
            >
              <span
                style={{
                  width:
                    '6px',

                  height:
                    '6px',

                  borderRadius:
                    '50%',

                  background:
                    '#f97316',
                }}
              />

              {selectedHoliday.type}
            </div>

            {/* NAME */}

            <h2
              style={{
                margin:
                  '14px 0 5px',

                color:
                  theme.text,

                fontSize:
                  '28px',

                fontWeight:
                  '900',

                lineHeight:
                  '1.2',
              }}
            >
              {selectedHoliday.name}
            </h2>

            <p
              style={{
                margin: 0,

                color:
                  theme.secondaryText,

                fontSize:
                  '14px',

                fontWeight:
                  '600',
              }}
            >
              {formatFullDate(
                selectedHoliday.date
              )}
            </p>

            {/* INFORMATION BOX */}

            <div
              style={{
                marginTop:
                  '20px',

                border:
                  `1px solid ${theme.border}`,

                borderRadius:
                  '16px',

                overflow:
                  'hidden',
              }}
            >

              {/* ALL DAY */}

              <div
                style={{
                  display:
                    'flex',

                  alignItems:
                    'center',

                  gap:
                    '13px',

                  padding:
                    '15px',

                  borderBottom:
                    `1px solid ${theme.border}`,
                }}
              >
                <div
                  style={{
                    width:
                      '42px',

                    height:
                      '42px',

                    borderRadius:
                      '12px',

                    background:
                      theme.accentLight,

                    color:
                      theme.accent,

                    display:
                      'flex',

                    alignItems:
                      'center',

                    justifyContent:
                      'center',
                  }}
                >
                  <CalendarDays size={20} />
                </div>

                <div>
                  <div
                    style={{
                      color:
                        theme.text,

                      fontWeight:
                        '800',

                      fontSize:
                        '14px',
                    }}
                  >
                    All day
                  </div>

                  <div
                    style={{
                      color:
                        theme.secondaryText,

                      fontSize:
                        '12px',

                      marginTop:
                        '3px',
                    }}
                  >
                    {selectedHoliday.type}
                  </div>
                </div>
              </div>

              {/* LOCATION */}

              <div
                style={{
                  display:
                    'flex',

                  alignItems:
                    'center',

                  gap:
                    '13px',

                  padding:
                    '15px',
                }}
              >
                <div
                  style={{
                    width:
                      '42px',

                    height:
                      '42px',

                    borderRadius:
                      '12px',

                    background:
                      'rgba(16,185,129,0.14)',

                    color:
                      '#10b981',

                    display:
                      'flex',

                    alignItems:
                      'center',

                    justifyContent:
                      'center',
                  }}
                >
                  <MapPin size={20} />
                </div>

                <div>
                  <div
                    style={{
                      color:
                        theme.text,

                      fontWeight:
                        '800',

                      fontSize:
                        '14px',
                    }}
                  >
                    {selectedHoliday.location || 'India'}
                  </div>

                  <div
                    style={{
                      color:
                        theme.secondaryText,

                      fontSize:
                        '12px',

                      marginTop:
                        '3px',
                    }}
                  >
                    Holiday location
                  </div>
                </div>
              </div>
            </div>

            {/* ABOUT */}

            <div
              style={{
                marginTop:
                  '14px',

                padding:
                  '16px',

                borderRadius:
                  '16px',

                background:
                  isDark
                    ? 'rgba(249,115,22,0.06)'
                    : '#fffaf5',

                border:
                  '1px solid rgba(249,115,22,0.18)',
              }}
            >
              <div
                style={{
                  display:
                    'flex',

                  alignItems:
                    'center',

                  gap:
                    '8px',

                  color:
                    theme.text,

                  fontWeight:
                    '800',

                  fontSize:
                    '13px',

                  marginBottom:
                    '8px',
                }}
              >
                <Sparkles
                  size={15}
                  color="#f97316"
                />

                About this holiday
              </div>

              <p
                style={{
                  margin: 0,

                  color:
                    theme.secondaryText,

                  fontSize:
                    '13px',

                  lineHeight:
                    '1.6',
                }}
              >
                {selectedHoliday.description}
              </p>
            </div>

            {/* BUTTONS */}

            <div className="modal-actions">

              <button
                onClick={addToGoogleCalendar}

                style={{
                  flex: 1,

                  height:
                    '50px',

                  border:
                    'none',

                  borderRadius:
                    '12px',

                  background:
                    '#22c55e',

                  color:
                    '#ffffff',

                  fontSize:
                    '14px',

                  fontWeight:
                    '800',

                  cursor:
                    'pointer',

                  display:
                    'flex',

                  alignItems:
                    'center',

                  justifyContent:
                    'center',

                  gap:
                    '8px',
                }}
              >
                <CalendarPlus size={18} />

                Add to Google Calendar
              </button>

              <button
                onClick={() => {
                  setSelectedHoliday(null);
                }}

                style={{
                  height:
                    '50px',

                  padding:
                    '0 22px',

                  borderRadius:
                    '12px',

                  border:
                    `1px solid ${theme.border}`,

                  background:
                    theme.muted,

                  color:
                    theme.text,

                  fontSize:
                    '14px',

                  fontWeight:
                    '800',

                  cursor:
                    'pointer',
                }}
              >
                Close
              </button>

            </div>
          </div>
        </div>
      )}

      {/* RESPONSIVE CSS */}

      <style jsx>{`

        .holiday-calendar-container {
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          overflow: hidden;
        }

        .calendar-card {
          width: 100%;
          max-width: 100%;
          border-radius: 16px;
          padding: 14px;
          min-width: 0;
          box-sizing: border-box;
        }

        .calendar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 14px;
        }

        .calendar-title-section {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .calendar-controls {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .calendar-button {
          height: 34px;
          padding: 0 11px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 700;
        }

        .calendar-icon-button {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .calendar-scroll {
          width: 100%;
          overflow-x: hidden;
        }

        .calendar-min-width {
          width: 100%;
          min-width: 0;
        }

        .holiday-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(2, 6, 23, 0.72);
          backdrop-filter: blur(8px);
          animation: fadeIn 0.2s ease;
        }

        .holiday-modal {
          position: relative;
          width: 100%;
          max-width: 450px;
          max-height: 92vh;
          overflow-y: auto;
          border-radius: 24px;
          padding: 20px;
          box-sizing: border-box;
          animation: modalIn 0.25s ease;
        }

        .modal-close-button {
          position: absolute;
          top: 14px;
          right: 14px;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: none;
          background: rgba(15,23,42,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 2;
        }

        .modal-actions {
          display: flex;
          gap: 10px;
          margin-top: 18px;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        @keyframes modalIn {
          from {
            opacity: 0;
            transform:
              translateY(20px)
              scale(0.98);
          }

          to {
            opacity: 1;
            transform:
              translateY(0)
              scale(1);
          }
        }

        @media (max-width: 1100px) {
          .calendar-card {
            padding: 12px;
          }
        }

        @media (max-width: 700px) {

          .calendar-card {
            padding: 10px;
          }

          .calendar-header {
            align-items: flex-start;
          }

          .calendar-title-section {
            width: 100%;
          }

          .calendar-title-section h2 {
            font-size: 18px !important;
          }

          .calendar-title-section p {
            font-size: 10px !important;
          }

          .calendar-controls {
            width: 100%;
          }

          .calendar-button {
            flex: 1;
          }

          .today-text {
            display: none;
          }

          .holiday-modal {
            padding: 16px;
            border-radius: 20px;
          }

          .modal-actions {
            flex-direction: column;
          }

          .modal-actions button {
            width: 100%;
          }
        }

        @media (max-width: 480px) {

          .holiday-modal-overlay {
            padding: 10px;
          }

          .holiday-modal {
            max-height: 95vh;
          }

          .calendar-card {
            padding: 8px;
          }
        }

      `}</style>
    </>
  );
}