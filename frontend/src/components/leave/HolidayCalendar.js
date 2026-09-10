'use client';

import React, {
  useState,
  useEffect,
  useMemo,
} from 'react';
import { useTheme } from 'next-themes';

import { 
  GiElephantHead,
  GiFireworkRocket,
  GiPineTree,
  GiMoon,
  GiWaterGun,
  GiLotus,
  GiWheat,
  GiTrident,
  GiFlowerPot,
  GiPartyPopper,
  GiSpectacles,
  GiFlamingArrow
} from 'react-icons/gi';
import { FaCross, FaStar } from 'react-icons/fa';

/* =========================================================
   HOLIDAY DATA
========================================================= */

const HOLIDAYS_2026 = [
  {
    date: '2026-01-01',
    name: "New Year's Day",
    type: 'Public Holiday',
    description:
      "New Year's Day marks the beginning of the new calendar year.",
    icon: '🎉',
    category: 'festival',
  },
  {
    date: '2026-01-13',
    name: 'Lohri',
    type: 'Public Holiday',
    description:
      'Lohri is a popular winter festival celebrated with bonfires, music and traditional festivities.',
    icon: '🔥',
    category: 'festival',
  },
  {
    date: '2026-01-14',
    name: 'Makar Sankranti / Pongal',
    type: 'Public Holiday',
    description:
      'Makar Sankranti and Pongal celebrate the harvest season and the movement of the sun into a new zodiac sign.',
    icon: '🌾',
    category: 'festival',
  },
  {
    date: '2026-01-15',
    name: 'Thiruvalluvar Day',
    type: 'Public Holiday',
    description:
      'Thiruvalluvar Day honours the celebrated Tamil poet and philosopher Thiruvalluvar.',
    icon: '📖',
    category: 'festival',
  },
  {
    date: '2026-01-23',
    name: 'Netaji Subhas Chandra Bose Jayanti',
    type: 'Public Holiday',
    description:
      'Birth anniversary of Netaji Subhas Chandra Bose.',
    icon: '🇮🇳',
    category: 'national',
  },
  {
    date: '2026-01-24',
    name: 'Basant Panchami / Vasant Panchami',
    type: 'Public Holiday',
    description:
      'Basant Panchami marks the arrival of spring and is associated with Goddess Saraswati.',
    icon: '🌼',
    category: 'festival',
  },
  {
    date: '2026-01-26',
    name: 'Republic Day',
    type: 'Public Holiday',
    description:
      'Republic Day of India.',
    icon: '🇮🇳',
    category: 'national',
  },

  {
    date: '2026-02-15',
    name: 'Mahashivratri',
    type: 'Public Holiday',
    description:
      'Mahashivratri is an important Hindu festival dedicated to Lord Shiva.',
    icon: '🔱',
    category: 'festival',
  },
  {
    date: '2026-02-19',
    name: 'Chhatrapati Shivaji Maharaj Jayanti',
    type: 'Public Holiday',
    description:
      'Birth anniversary of Chhatrapati Shivaji Maharaj.',
    icon: '⚔️',
    category: 'national',
  },

  {
    date: '2026-03-03',
    name: 'Holi / Dol Yatra',
    type: 'Public Holiday',
    description:
      'Holi is the festival of colours, celebrating joy, spring and togetherness.',
    icon: '🎨',
    category: 'festival',
  },
  {
    date: '2026-03-19',
    name: 'Chaitra Sukladi / Gudhi Padwa / Ugadi',
    type: 'Public Holiday',
    description:
      'These festivals mark the beginning of the traditional New Year in different parts of India.',
    icon: '🏵️',
    category: 'festival',
  },
  {
    date: '2026-03-20',
    name: 'Eid al-Fitr (Ramzan Id)',
    type: 'Public Holiday',
    description:
      'Eid al-Fitr marks the end of Ramadan and is celebrated with prayers, family gatherings and festive meals.',
    icon: '🌙',
    category: 'festival',
  },
  {
    date: '2026-03-21',
    name: 'Cheti Chand',
    type: 'Public Holiday',
    description:
      'Cheti Chand is celebrated as the New Year festival by the Sindhi community.',
    icon: '🌙',
    category: 'festival',
  },
  {
    date: '2026-03-28',
    name: 'Ram Navami',
    type: 'Public Holiday',
    description:
      'Ram Navami celebrates the birth of Lord Rama.',
    icon: '🏹',
    category: 'festival',
  },
  {
    date: '2026-03-30',
    name: 'Mahavir Jayanti',
    type: 'Public Holiday',
    description:
      'Mahavir Jayanti commemorates the birth of Lord Mahavira.',
    icon: '🪷',
    category: 'festival',
  },

  {
    date: '2026-04-03',
    name: 'Good Friday',
    type: 'Public Holiday',
    description:
      'Christian observance commemorating the crucifixion of Jesus Christ.',
    icon: '✝️',
    category: 'festival',
  },
  {
    date: '2026-04-05',
    name: 'Easter Sunday',
    type: 'Public Holiday',
    description:
      'Easter Sunday celebrates the resurrection of Jesus Christ.',
    icon: '🐣',
    category: 'festival',
  },
  {
    date: '2026-04-14',
    name: 'Ambedkar Jayanti / Vaishakhi / Vishu',
    type: 'Public Holiday',
    description:
      'A day associated with Ambedkar Jayanti and regional harvest and New Year celebrations.',
    icon: '🌸',
    category: 'festival',
  },

  {
    date: '2026-05-01',
    name: 'Labour Day / Maharashtra Day',
    type: 'Public Holiday',
    description:
      'Labour Day honours workers and the contribution of labour to society.',
    icon: '🛠️',
    category: 'national',
  },
  {
    date: '2026-05-01',
    name: 'Buddha Purnima',
    type: 'Public Holiday',
    description:
      'Buddha Purnima commemorates the birth of Gautama Buddha.',
    icon: '🪷',
    category: 'festival',
  },
  {
    date: '2026-05-27',
    name: 'Eid al-Adha (Bakrid)',
    type: 'Public Holiday',
    description:
      'Eid al-Adha is an important Islamic festival commemorating sacrifice and devotion.',
    icon: '🌙',
    category: 'festival',
  },
  {
    date: '2026-05-31',
    name: 'Buddha Purnima',
    type: 'Public Holiday',
    description:
      'Buddha Purnima commemorates the birth, enlightenment and passing of Gautama Buddha.',
    icon: '🪷',
    category: 'festival',
  },

  {
    date: '2026-06-26',
    name: 'Muharram (Ashura)',
    type: 'Public Holiday',
    description:
      'Muharram is an important occasion in the Islamic calendar.',
    icon: '🌙',
    category: 'festival',
  },

  {
    date: '2026-08-15',
    name: 'Independence Day',
    type: 'Public Holiday',
    description:
      'India celebrates its independence on August 15.',
    icon: '🇮🇳',
    category: 'national',
  },
  {
    date: '2026-08-15',
    name: 'Parsi New Year (Shahenshahi)',
    type: 'Public Holiday',
    description:
      'Parsi New Year according to the Shahenshahi calendar.',
    icon: '🌺',
    category: 'festival',
  },
  {
    date: '2026-08-26',
    name: 'Id-E-Milad',
    type: 'Public Holiday',
    description:
      'Id-E-Milad marks the birth anniversary of Prophet Muhammad.',
    icon: '🌙',
    category: 'festival',
  },

  {
    date: '2026-09-14',
    name: 'Ganesh Chaturthi',
    type: 'Public Holiday',
    description:
      'Ganesh Chaturthi celebrates the birth of Lord Ganesha.',
    icon: '🐘',
    category: 'festival',
  },

  {
    date: '2026-10-02',
    name: 'Mahatma Gandhi Jayanti',
    type: 'Public Holiday',
    description:
      'Birth anniversary of Mahatma Gandhi.',
    icon: '🕊️',
    category: 'national',
  },
  {
    date: '2026-10-20',
    name: 'Dasara / Vijayadashami',
    type: 'Public Holiday',
    description:
      'Dasara, also known as Vijayadashami, marks the victory of good over evil.',
    icon: '🏹',
    category: 'festival',
  },

  {
    date: '2026-11-08',
    name: 'Diwali Amavasya (Laxmi Pujan)',
    type: 'Public Holiday',
    description:
      'Diwali Amavasya and Laxmi Pujan celebrate light, prosperity and the triumph of good over evil.',
    icon: '🪔',
    category: 'festival',
  },
  {
    date: '2026-11-10',
    name: 'Diwali (Bali Pratipada)',
    type: 'Public Holiday',
    description:
      'Bali Pratipada is celebrated during the Diwali festival.',
    icon: '🪔',
    category: 'festival',
  },
  {
    date: '2026-11-24',
    name: 'Guru Nanak Jayanti',
    type: 'Public Holiday',
    description:
      'Birth anniversary of Guru Nanak Dev Ji.',
    icon: '☬',
    category: 'festival',
  },

  {
    date: '2026-12-25',
    name: 'Christmas',
    type: 'Public Holiday',
    description:
      'Christmas celebrates the birth of Jesus Christ.',
    icon: '🎄',
    category: 'festival',
  },
];

const WEEK_DAYS = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
];

/* =========================================================
   DATE HELPERS
========================================================= */

function formatDateKey(date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    date.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatLongDate(dateString) {
  const date = new Date(
    `${dateString}T00:00:00`
  );

  return date.toLocaleDateString(
    'en-IN',
    {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
  );
}

function getMonthStart(date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1
  );
}

function getCalendarDays(currentDate) {
  const firstDay =
    getMonthStart(currentDate);

  const startDay =
    firstDay.getDay();

  const calendarStart =
    new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1 - startDay
    );

  return Array.from(
    { length: 42 },
    (_, index) => {
      const day =
        new Date(calendarStart);

      day.setDate(
        calendarStart.getDate() +
          index
      );

      return day;
    }
  );
}

function getWeekDays(date) {
  const startOfWeek = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() - date.getDay()
  );
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + index);
    return day;
  });
}

/* =========================================================
   HOLIDAY THEME & ARTWORK
========================================================= */

const ArtworkIcon = ({ type, size = 24 }) => {
  switch(type) {
    case 'ganesh':
      return <GiElephantHead size={size} />;
    case 'diwali':
      return <GiFireworkRocket size={size} />;
    case 'christmas':
      return <GiPineTree size={size} />;
    case 'islamic':
      return <GiMoon size={size} />;
    case 'holi':
      return <GiWaterGun size={size} />;
    case 'gandhi':
      return <GiSpectacles size={size} />;
    case 'dussehra':
      return <GiFlamingArrow size={size} />;
    case 'christian':
      return <FaCross size={size} />;
    case 'buddha':
      return <GiLotus size={size} />;
    case 'harvest':
      return <GiWheat size={size} />;
    case 'hindu':
      return <GiTrident size={size} />;
    case 'sikh':
      return <FaStar size={size} />;
    case 'spring':
      return <GiFlowerPot size={size} />;
    default:
      return <GiPartyPopper size={size} />;
  }
};

function getHolidayTheme(holiday) {
  const name =
    holiday.name.toLowerCase();

  if (
    name.includes('ganesh')
  ) {
    return {
      accent: '#f97316',
      soft: '#fff7ed',
      darkSoft: '#431407',
      glow:
        'rgba(249,115,22,0.30)',
      background:
        'linear-gradient(135deg,#fff7ed 0%,#ffedd5 48%,#fed7aa 100%)',
      pattern: '🐘',
      iconType: 'ganesh',
      label: 'Ganesh Festival',
    };
  }

  if (
    name.includes('diwali') ||
    name.includes('laxmi')
  ) {
    return {
      accent: '#eab308',
      soft: '#fefce8',
      darkSoft: '#422006',
      glow:
        'rgba(234,179,8,0.32)',
      background:
        'linear-gradient(135deg,#fffdf0 0%,#fef3c7 50%,#fde68a 100%)',
      pattern: '🪔',
      iconType: 'diwali',
      label: 'Festival of Lights',
    };
  }

  if (
    name.includes('holi')
  ) {
    return {
      accent: '#ec4899',
      soft: '#fdf2f8',
      darkSoft: '#500724',
      glow:
        'rgba(236,72,153,0.30)',
      background:
        'linear-gradient(135deg,#fdf2f8,#fce7f3,#f5d0fe)',
      pattern: '🎨',
      iconType: 'holi',
      label: 'Festival of Colours',
    };
  }

  if (
    name.includes('eid') ||
    name.includes('milad') ||
    name.includes('muharram') ||
    name.includes('ramzan')
  ) {
    return {
      accent: '#10b981',
      soft: '#ecfdf5',
      darkSoft: '#022c22',
      glow:
        'rgba(16,185,129,0.30)',
      background:
        'linear-gradient(135deg,#ecfdf5,#d1fae5,#ccfbf1)',
      pattern: '🌙',
      iconType: 'islamic',
      label: 'Islamic Festival',
    };
  }

  if (
    name.includes('christmas')
  ) {
    return {
      accent: '#dc2626',
      soft: '#fef2f2',
      darkSoft: '#450a0a',
      glow:
        'rgba(220,38,38,0.30)',
      background:
        'linear-gradient(135deg,#fff7f7,#fee2e2,#dcfce7)',
      pattern: '🎄',
      iconType: 'christmas',
      label: 'Christmas',
    };
  }

  if (
    name.includes('good friday') ||
    name.includes('easter')
  ) {
    return {
      accent: '#3b82f6',
      soft: '#eff6ff',
      darkSoft: '#172554',
      glow:
        'rgba(59,130,246,0.30)',
      background:
        'linear-gradient(135deg,#eff6ff,#dbeafe,#e0e7ff)',
      pattern: '✝️',
      iconType: 'christian',
      label: 'Christian Festival',
    };
  }

  if (
    name.includes('shiv') ||
    name.includes('mahadev')
  ) {
    return {
      accent: '#8b5cf6',
      soft: '#f5f3ff',
      darkSoft: '#2e1065',
      glow:
        'rgba(139,92,246,0.30)',
      background:
        'linear-gradient(135deg,#f5f3ff,#ede9fe,#ddd6fe)',
      pattern: '🔱',
      iconType: 'hindu',
      label: 'Hindu Festival',
    };
  }

  if (
    name.includes('makar') ||
    name.includes('pongal') ||
    name.includes('lohri') ||
    name.includes('sankranti')
  ) {
    return {
      accent: '#d97706',
      soft: '#fffbeb',
      darkSoft: '#451a03',
      glow:
        'rgba(217,119,6,0.30)',
      background:
        'linear-gradient(135deg,#fffbeb,#fef3c7,#fed7aa)',
      pattern: '🌾',
      iconType: 'harvest',
      label: 'Harvest Festival',
    };
  }

  if (
    name.includes('buddha')
  ) {
    return {
      accent: '#14b8a6',
      soft: '#f0fdfa',
      darkSoft: '#042f2e',
      glow:
        'rgba(20,184,166,0.30)',
      background:
        'linear-gradient(135deg,#f0fdfa,#ccfbf1,#d1fae5)',
      pattern: '🪷',
      iconType: 'buddha',
      label: 'Buddha Purnima',
    };
  }

  if (
    name.includes('guru nanak')
  ) {
    return {
      accent: '#f59e0b',
      soft: '#fffbeb',
      darkSoft: '#451a03',
      glow:
        'rgba(245,158,11,0.30)',
      background:
        'linear-gradient(135deg,#fffbeb,#fef3c7,#fde68a)',
      pattern: '☬',
      iconType: 'sikh',
      label: 'Sikh Festival',
    };
  }

  if (
    name.includes('basant') ||
    name.includes('vasant')
  ) {
    return {
      accent: '#eab308',
      soft: '#fefce8',
      darkSoft: '#422006',
      glow:
        'rgba(234,179,8,0.30)',
      background:
        'linear-gradient(135deg,#fefce8,#fef9c3,#fef08a)',
      pattern: '🌼',
      iconType: 'spring',
      label: 'Spring Festival',
    };
  }

  if (
    name.includes('gandhi')
  ) {
    return {
      accent: '#2563eb',
      soft: '#eff6ff',
      darkSoft: '#172554',
      glow:
        'rgba(37,99,235,0.30)',
      background:
        'linear-gradient(135deg,#f8fafc,#f1f5f9,#e2e8f0)',
      pattern: '🕊️',
      iconType: 'gandhi',
      label: 'National Holiday',
    };
  }

  if (
    name.includes('dasara') ||
    name.includes('vijayadashami') ||
    name.includes('dussehra')
  ) {
    return {
      accent: '#ef4444',
      soft: '#fef2f2',
      darkSoft: '#450a0a',
      glow:
        'rgba(239,68,68,0.30)',
      background:
        'linear-gradient(135deg,#fef2f2,#fee2e2,#fecaca)',
      pattern: '🏹',
      iconType: 'dussehra',
      label: 'Festival',
    };
  }

  if (
    holiday.category === 'national'
  ) {
    return {
      accent: '#2563eb',
      soft: '#eff6ff',
      darkSoft: '#172554',
      glow:
        'rgba(37,99,235,0.30)',
      background:
        'linear-gradient(135deg,#f8fafc,#f1f5f9,#e2e8f0)',
      pattern: '🎉',
      iconType: 'default',
      label: 'Public Holiday',
    };
  }

  return {
    accent: '#22c55e',
    soft: '#ecfdf5',
    darkSoft: '#022c22',
    glow:
      'rgba(34,197,94,0.30)',
    background:
      'linear-gradient(135deg,#ecfdf5,#d1fae5,#ccfbf1)',
    pattern: holiday.icon,
    label: 'Public Holiday',
  };
}

/* =========================================================
   FESTIVAL ARTWORK
========================================================= */

function FestivalArtwork({
  holiday,
  theme,
  isDark,
}) {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '110px',
        overflow: 'hidden',
        borderRadius: '22px',
        background: isDark
          ? `linear-gradient(135deg,${theme.darkSoft},#0f172a)`
          : theme.background,
        border: `1px solid ${theme.accent}35`,
        boxShadow:
          `inset 0 1px 0 rgba(255,255,255,0.5),
           0 15px 40px ${theme.glow}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Decorative circles */}

      <div
        style={{
          position: 'absolute',
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          top: '-70px',
          left: '-45px',
          background:
            `${theme.accent}18`,
          filter: 'blur(5px)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          bottom: '-105px',
          right: '-55px',
          background:
            `${theme.accent}20`,
          filter: 'blur(5px)',
        }}
      />

      {/* Decorative dots */}

      <span
        style={{
          position: 'absolute',
          top: '22px',
          left: '28%',
          fontSize: '16px',
          opacity: 0.5,
        }}
      >
        ✦
      </span>

      <span
        style={{
          position: 'absolute',
          top: '45px',
          right: '22%',
          fontSize: '12px',
          opacity: 0.45,
        }}
      >
        ✧
      </span>

      <span
        style={{
          position: 'absolute',
          bottom: '25px',
          left: '20%',
          fontSize: '13px',
          opacity: 0.4,
        }}
      >
        •
      </span>

      {/* Large festival artwork */}

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            isDark
              ? 'rgba(255,255,255,0.08)'
              : 'rgba(255,255,255,0.62)',
          border:
            `1px solid ${theme.accent}45`,
          boxShadow:
            `0 15px 35px ${theme.glow}`,
          backdropFilter:
            'blur(8px)',
          WebkitBackdropFilter:
            'blur(8px)',
        }}
      >
        <div
          style={{
            color: theme.accent,
            filter: 'drop-shadow(0 5px 10px rgba(0,0,0,0.12))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ArtworkIcon 
            type={theme.iconType} 
            size={holiday.name.toLowerCase().includes('ganesh') ? 48 : 40} 
          />
        </div>
      </div>

      {/* Large faded artwork */}

      <div
        style={{
          position: 'absolute',
          right: '-15px',
          bottom: '-35px',
          opacity: 0.10,
          transform: 'rotate(-8deg)',
          pointerEvents: 'none',
          color: theme.accent,
        }}
      >
        <ArtworkIcon type={theme.iconType} size={115} />
      </div>

      {/* Festival label */}

      <div
        style={{
          position: 'absolute',
          left: '18px',
          bottom: '15px',
          padding:
            '6px 10px',
          borderRadius: '999px',
          background:
            isDark
              ? 'rgba(255,255,255,0.08)'
              : 'rgba(255,255,255,0.60)',
          border:
            `1px solid ${theme.accent}25`,
          color: isDark
            ? '#e2e8f0'
            : '#475569',
          fontSize: '10px',
          fontWeight: '800',
          letterSpacing: '0.4px',
        }}
      >
        {theme.label}
      </div>
    </div>
  );
}

/* =========================================================
   YEAR VIEW COMPONENTS
========================================================= */

const MiniMonth = ({ year, month, holidaysByDate, isDark, todayKey, openHoliday }) => {
  const date = new Date(year, month, 1);
  const days = getCalendarDays(date);
  const monthName = date.toLocaleDateString('en-IN', { month: 'long' });
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <h3 style={{ fontSize: '14px', fontWeight: '700', margin: '0 0 4px 8px' }}>{monthName}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '2px', padding: '0 8px' }}>
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <div key={i} style={{ fontSize: '10px', fontWeight: '700', textAlign: 'center', color: isDark ? '#64748b' : '#94a3b8' }}>{d}</div>
        ))}
        {days.map(day => {
          const key = formatDateKey(day);
          const isCurrentMonth = day.getMonth() === month;
          const isToday = key === todayKey;
          const dayHolidays = holidaysByDate[key] || [];
          
          return (
            <div
              key={key}
              onClick={() => {
                if (dayHolidays.length > 0) openHoliday(dayHolidays[0]);
              }}
              style={{
                aspectRatio: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: isToday ? '700' : '500',
                opacity: isCurrentMonth ? 1 : 0.25,
                position: 'relative',
                cursor: dayHolidays.length > 0 ? 'pointer' : 'default',
                background: isToday ? '#22c55e' : 'transparent',
                color: isToday ? '#ffffff' : 'inherit',
                borderRadius: '50%',
                border: 'none',
              }}
            >
              {day.getDate()}
              {dayHolidays.length > 0 && !isToday && (
                <div style={{
                  position: 'absolute',
                  bottom: '2px',
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: getHolidayTheme(dayHolidays[0]).accent
                }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  );
};

/* =========================================================
   COMPONENT
========================================================= */

export default function HolidayCalendar() {
  const { resolvedTheme } =
    useTheme();

  const isDark =
    resolvedTheme === 'dark';

  const [
    currentDate,
    setCurrentDate,
  ] = useState(new Date());

  const [
    mounted,
    setMounted,
  ] = useState(false);

  const [
    selectedHoliday,
    setSelectedHoliday,
  ] = useState(null);

  const [viewMode, setViewMode] = useState('month');

  useEffect(() => {
    setMounted(true);
  }, []);

  /* =======================================================
     ESC KEY
  ======================================================= */

  useEffect(() => {
    if (!selectedHoliday) {
      return;
    }

    const handleKeyDown =
      (event) => {
        if (event.key === 'Escape') {
          setSelectedHoliday(null);
        }
      };

    document.addEventListener(
      'keydown',
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        'keydown',
        handleKeyDown
      );
    };
  }, [selectedHoliday]);

  const calendarDays =
    useMemo(
      () =>
        getCalendarDays(
          currentDate
        ),
      [currentDate]
    );

  const weekDays =
    useMemo(
      () =>
        getWeekDays(
          currentDate
        ),
      [currentDate]
    );

  const headerTitle =
    useMemo(() => {
      if (viewMode === 'year') {
        return currentDate.getFullYear().toString();
      }
      return currentDate.toLocaleDateString(
        'en-IN',
        {
          month: 'long',
          year: 'numeric',
        }
      );
    }, [currentDate, viewMode]);

  const todayKey =
    formatDateKey(new Date());

  const holidaysByDate =
    useMemo(() => {
      const grouped = {};

      HOLIDAYS_2026.forEach(
        (holiday) => {
          if (
            !grouped[holiday.date]
          ) {
            grouped[holiday.date] =
              [];
          }

          grouped[
            holiday.date
          ].push(holiday);
        }
      );

      return grouped;
    }, []);

  /* =======================================================
     NAVIGATION
  ======================================================= */

  const goToPrevious = () => {
    setCurrentDate((prevDate) => {
      if (viewMode === 'month') {
        return new Date(prevDate.getFullYear(), prevDate.getMonth() - 1, 1);
      }
      if (viewMode === 'week') {
        const d = new Date(prevDate);
        d.setDate(d.getDate() - 7);
        return d;
      }
      if (viewMode === 'year') {
        return new Date(prevDate.getFullYear() - 1, prevDate.getMonth(), 1);
      }
      return prevDate;
    });
  };

  const goToNext = () => {
    setCurrentDate((prevDate) => {
      if (viewMode === 'month') {
        return new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 1);
      }
      if (viewMode === 'week') {
        const d = new Date(prevDate);
        d.setDate(d.getDate() + 7);
        return d;
      }
      if (viewMode === 'year') {
        return new Date(prevDate.getFullYear() + 1, prevDate.getMonth(), 1);
      }
      return prevDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  /* =======================================================
     MODAL
  ======================================================= */

  const openHoliday =
    (holiday) => {
      setSelectedHoliday(
        holiday
      );
    };

  const closeHoliday = () => {
    setSelectedHoliday(null);
  };

  /* =======================================================
     GOOGLE CALENDAR
  ======================================================= */

  const addToGoogleCalendar =
    (holiday) => {
      const startDate =
        holiday.date.replaceAll(
          '-',
          ''
        );

      const start = new Date(
        `${holiday.date}T00:00:00`
      );

      const nextDay =
        new Date(start);

      nextDay.setDate(
        nextDay.getDate() + 1
      );

      const endDate =
        formatDateKey(
          nextDay
        ).replaceAll(
          '-',
          ''
        );

      const title =
        encodeURIComponent(
          holiday.name
        );

      const details =
        encodeURIComponent(
          `${holiday.description}\n\nHoliday Type: ${holiday.type}\nLocation: India`
        );

      const location =
        encodeURIComponent(
          'India'
        );

      const googleCalendarUrl =
        `https://calendar.google.com/calendar/render?action=TEMPLATE` +
        `&text=${title}` +
        `&dates=${startDate}/${endDate}` +
        `&details=${details}` +
        `&location=${location}`;

      window.open(
        googleCalendarUrl,
        '_blank',
        'noopener,noreferrer'
      );
    };

  if (!mounted) {
    return null;
  }

  const modalTheme =
    selectedHoliday
      ? getHolidayTheme(
          selectedHoliday
        )
      : null;

  return (
    <>
      {/* ===================================================
          CALENDAR
      =================================================== */}

      <div
        style={{
          width: '100%',
          maxWidth: '1000px',
          margin: '0 auto',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: isDark
            ? '#020617'
            : '#ffffff',
          color: isDark
            ? '#f8fafc'
            : '#0f172a',
          borderRadius: '16px',
          border: isDark
            ? '1px solid #0f172a'
            : '1px solid #e2e8f0',
          padding: '8px',
          boxSizing: 'border-box',
        }}
      >
        {/* Calendar Header */}

        <div
          style={{
            minHeight: '68px',
            display: 'flex',
            alignItems: 'center',
            justifyContent:
              'space-between',
            padding:
              '0 0 16px 0',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexWrap: 'wrap',
            }}
          >
            {/* Previous */}

            <button
              onClick={
                goToPrevious
              }
              type="button"
              aria-label="Previous month"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '9px',
                border: isDark
                  ? '1px solid #334155'
                  : '1px solid #cbd5e1',
                background: isDark
                  ? '#1e293b'
                  : '#ffffff',
                color: isDark
                  ? '#f8fafc'
                  : '#334155',
                cursor: 'pointer',
                fontSize: '22px',
              }}
            >
              ‹
            </button>

            {/* Next */}

            <button
              onClick={
                goToNext
              }
              type="button"
              aria-label="Next month"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '9px',
                border: isDark
                  ? '1px solid #334155'
                  : '1px solid #cbd5e1',
                background: isDark
                  ? '#1e293b'
                  : '#ffffff',
                color: isDark
                  ? '#f8fafc'
                  : '#334155',
                cursor: 'pointer',
                fontSize: '22px',
              }}
            >
              ›
            </button>

            {/* Today */}

            <button
              onClick={goToToday}
              type="button"
              style={{
                height: '36px',
                padding: '0 14px',
                borderRadius: '9px',
                border: isDark
                  ? '1px solid #334155'
                  : '1px solid #cbd5e1',
                background: isDark
                  ? '#1e293b'
                  : '#ffffff',
                color: isDark
                  ? '#f8fafc'
                  : '#334155',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '700',
              }}
            >
              Today
            </button>

            <h2
              style={{
                margin:
                  '0 0 0 4px',
                fontSize: '21px',
                fontWeight: '800',
              }}
            >
              {headerTitle}
            </h2>
          </div>

          {/* View Switcher & Legend */}

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: isDark ? '#1e293b' : '#f1f5f9',
                borderRadius: '9px',
                padding: '4px',
                border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
              }}
            >
              {['month', 'week', 'year'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  type="button"
                  style={{
                    padding: '6px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    background: viewMode === mode 
                      ? (isDark ? '#334155' : '#ffffff') 
                      : 'transparent',
                    color: viewMode === mode 
                      ? (isDark ? '#f8fafc' : '#0f172a') 
                      : (isDark ? '#94a3b8' : '#64748b'),
                    fontSize: '13px',
                    fontWeight: viewMode === mode ? '700' : '600',
                    cursor: 'pointer',
                    boxShadow: viewMode === mode 
                      ? (isDark ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)') 
                      : 'none',
                    textTransform: 'capitalize',
                    transition: 'all 0.2s',
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: isDark
                  ? '#94a3b8'
                  : '#64748b',
              }}
            >
              <span
                style={{
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  background:
                    '#22c55e',
                }}
              />
              Public Holiday
            </div>
          </div>
        </div>

        {viewMode === 'year' ? (
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '10px 4px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '24px 16px' }}>
              {Array.from({ length: 12 }, (_, monthIndex) => (
                <MiniMonth
                  key={monthIndex}
                  year={currentDate.getFullYear()}
                  month={monthIndex}
                  holidaysByDate={holidaysByDate}
                  isDark={isDark}
                  todayKey={todayKey}
                  openHoliday={openHoliday}
                />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* =================================================
                WEEK HEADER
            ================================================= */}

            <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(7,minmax(0,1fr))',
            gap: '4px',
          }}
        >
          {WEEK_DAYS.map(
            (day) => (
              <div
                key={day}
                style={{
                  height: '38px',
                  display: 'flex',
                  alignItems:
                    'center',
                  justifyContent:
                    'center',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: isDark
                    ? '#94a3b8'
                    : '#64748b',
                }}
              >
                {day}
              </div>
            )
          )}
        </div>

        {/* =================================================
            CALENDAR GRID
        ================================================= */}

        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: 'grid',
            gridTemplateColumns:
              'repeat(7, minmax(0, 1fr))',
            gridTemplateRows:
              viewMode === 'week' ? 'repeat(1, minmax(0, 1fr))' : 'repeat(6, minmax(0, 1fr))',
            gap: '4px',
          }}
        >
          {(viewMode === 'week' ? weekDays : calendarDays).map(
            (day) => {
              const dateKey =
                formatDateKey(day);

              const holidays =
                holidaysByDate[
                  dateKey
                ] || [];

              const isCurrentMonth =
                day.getMonth() ===
                currentDate.getMonth();

              const isToday =
                dateKey ===
                todayKey;

              return (
                <div
                  key={dateKey}
                  style={{
                    position:
                      'relative',
                    minWidth: 0,
                    minHeight: 0,
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: '8px',
                    border: isDark
                      ? '1px solid #1e293b'
                      : '1px solid #e2e8f0',
                    background:
                      isToday
                        ? isDark
                          ? '#132e24'
                          : '#f0fdf4'
                        : !isCurrentMonth
                        ? 'transparent'
                        : isDark
                        ? '#0f172a'
                        : '#f8fafc',
                    opacity:
                      isCurrentMonth
                        ? 1
                        : 0.45,
                    overflow: 'hidden',
                    boxSizing:
                      'border-box',
                  }}
                >
                  {/* Date */}

                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems:
                        'center',
                      justifyContent:
                        'center',
                      fontSize: '13px',
                      fontWeight:
                        isToday
                          ? '800'
                          : '600',
                      background:
                        isToday
                          ? '#22c55e'
                          : 'transparent',
                      color: isToday
                        ? '#ffffff'
                        : isDark
                        ? '#e2e8f0'
                        : '#334155',
                      marginBottom:
                        '4px',
                    }}
                  >
                    {day.getDate()}
                  </div>

                  {/* Holidays */}

                  <div
                    style={{
                      display: 'flex',
                      flexDirection:
                        'column',
                      gap: '2px',
                      overflowY:
                        'hidden',
                      maxHeight:
                        'calc(100% - 32px)',
                    }}
                  >
                    {holidays.map(
                      (
                        holiday,
                        index
                      ) => {
                        const theme =
                          getHolidayTheme(
                            holiday
                          );

                        return (
                          <button
                            key={`${holiday.date}-${holiday.name}-${index}`}
                            type="button"
                            onClick={() =>
                              openHoliday(
                                holiday
                              )
                            }
                            title={`View ${holiday.name}`}
                            style={{
                              width:
                                '100%',
                              textAlign:
                                'left',
                              border:
                                'none',
                              borderRadius:
                                '4px',
                              padding:
                                '3px 5px',
                              background:
                                isDark
                                  ? `${theme.accent}20`
                                  : theme.soft,
                              color:
                                isDark
                                  ? '#ffffff'
                                  : '#166534',
                              cursor:
                                'pointer',
                              fontSize:
                                '10px',
                              fontWeight:
                                '700',
                              lineHeight:
                                '1.1',
                              overflow:
                                'hidden',
                              textOverflow:
                                'ellipsis',
                              whiteSpace:
                                'nowrap',
                              flexShrink: 0,
                              transition:
                                'all .2s ease',
                            }}
                            onMouseEnter={(
                              e
                            ) => {
                              e.currentTarget.style.transform =
                                'translateY(-1px)';

                              e.currentTarget.style.boxShadow =
                                `0 5px 15px ${theme.glow}`;
                            }}
                            onMouseLeave={(
                              e
                            ) => {
                              e.currentTarget.style.transform =
                                'translateY(0)';

                              e.currentTarget.style.boxShadow =
                                'none';
                            }}
                          >
                            <span
                              style={{
                                display:
                                  'inline-block',
                                width:
                                  '6px',
                                height:
                                  '6px',
                                borderRadius:
                                  '50%',
                                background:
                                  theme.accent,
                                marginRight:
                                  '5px',
                              }}
                            />

                            {
                              holiday.name
                            }
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              );
            }
          )}
        </div>
        </>
      )}
    </div>

      {/* =====================================================
          HOLIDAY MODAL
      ===================================================== */}

      {selectedHoliday && (
        <div
          onClick={
            closeHoliday
          }
          role="presentation"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background:
              'rgba(15,23,42,.58)',
            backdropFilter:
              'blur(9px)',
            WebkitBackdropFilter:
              'blur(9px)',
            display: 'flex',
            alignItems:
              'center',
            justifyContent:
              'center',
            padding: '20px',
            boxSizing:
              'border-box',
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="holiday-dialog-title"
            onClick={(event) =>
              event.stopPropagation()
            }
            style={{
              position:
                'relative',
              width: '100%',
              maxWidth:
                '450px',
              maxHeight:
                'calc(100vh - 40px)',
              overflowY:
                'auto',

              background:
                isDark
                  ? 'rgba(15,23,42,.92)'
                  : 'rgba(255,255,255,.88)',

              backdropFilter:
                'blur(25px)',
              WebkitBackdropFilter:
                'blur(25px)',

              border:
                '1px solid rgba(255,255,255,.48)',

              borderRadius:
                '26px',

              boxShadow:
                `0 30px 80px ${modalTheme.glow},
                 0 25px 70px rgba(15,23,42,.35)`,

              color:
                isDark
                  ? '#f8fafc'
                  : '#0f172a',

              padding: '18px',

              boxSizing:
                'border-box',
            }}
          >
            {/* =================================================
                FESTIVAL ARTWORK
            ================================================= */}

            <FestivalArtwork
              holiday={
                selectedHoliday
              }
              theme={
                modalTheme
              }
              isDark={
                isDark
              }
            />

            {/* =================================================
                TITLE
            ================================================= */}

            <div
              style={{
                padding:
                  '20px 4px 8px',
              }}
            >
              <div
                style={{
                  display:
                    'inline-flex',
                  alignItems:
                    'center',
                  gap: '7px',
                  padding:
                    '6px 11px',
                  borderRadius:
                    '999px',
                  background:
                    isDark
                      ? `${modalTheme.accent}20`
                      : `${modalTheme.accent}12`,
                  color:
                    modalTheme.accent,
                  fontSize:
                    '11px',
                  fontWeight:
                    '800',
                  textTransform:
                    'uppercase',
                  letterSpacing:
                    '.5px',
                }}
              >
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius:
                      '50%',
                    background:
                      modalTheme.accent,
                  }}
                />

                {selectedHoliday.type}
              </div>

              <h2
                id="holiday-dialog-title"
                style={{
                  margin:
                    '12px 0 0',
                  fontSize:
                    '28px',
                  lineHeight:
                    '1.15',
                  fontWeight:
                    '850',
                  letterSpacing:
                    '-.6px',
                }}
              >
                {selectedHoliday.name}
              </h2>

              <div
                style={{
                  marginTop:
                    '8px',
                  fontSize:
                    '14px',
                  color:
                    isDark
                      ? '#cbd5e1'
                      : '#64748b',
                  fontWeight:
                    '500',
                }}
              >
                {formatLongDate(
                  selectedHoliday.date
                )}
              </div>
            </div>

            {/* =================================================
                DETAILS
            ================================================= */}

            <div
              style={{
                marginTop:
                  '10px',
                borderRadius:
                  '18px',
                background:
                  isDark
                    ? 'rgba(255,255,255,.055)'
                    : 'rgba(255,255,255,.70)',
                border:
                  isDark
                    ? '1px solid rgba(255,255,255,.08)'
                    : '1px solid rgba(148,163,184,.18)',
                padding:
                  '5px 16px',
              }}
            >
              {/* All Day */}

              <div
                style={{
                  display:
                    'flex',
                  alignItems:
                    'center',
                  gap: '13px',
                  padding:
                    '14px 0',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius:
                      '12px',
                    display:
                      'flex',
                    alignItems:
                      'center',
                    justifyContent:
                      'center',
                    background:
                      isDark
                        ? 'rgba(59,130,246,.15)'
                        : '#eff6ff',
                    fontSize:
                      '19px',
                  }}
                >
                  📅
                </div>

                <div>
                  <div
                    style={{
                      fontSize:
                        '14px',
                      fontWeight:
                        '800',
                    }}
                  >
                    All day
                  </div>

                  <div
                    style={{
                      fontSize:
                        '12px',
                      marginTop:
                        '2px',
                      color:
                        isDark
                          ? '#94a3b8'
                          : '#64748b',
                    }}
                  >
                    Public holiday
                  </div>
                </div>
              </div>

              <div
                style={{
                  height: '1px',
                  background:
                    isDark
                      ? 'rgba(255,255,255,.08)'
                      : '#e2e8f0',
                }}
              />

              {/* Location */}

              <div
                style={{
                  display:
                    'flex',
                  alignItems:
                    'center',
                  gap: '13px',
                  padding:
                    '14px 0',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius:
                      '12px',
                    display:
                      'flex',
                    alignItems:
                      'center',
                    justifyContent:
                      'center',
                    background:
                      isDark
                        ? 'rgba(34,197,94,.15)'
                        : '#ecfdf5',
                    fontSize:
                      '19px',
                  }}
                >
                  📍
                </div>

                <div>
                  <div
                    style={{
                      fontSize:
                        '14px',
                      fontWeight:
                        '800',
                    }}
                  >
                    India
                  </div>

                  <div
                    style={{
                      fontSize:
                        '12px',
                      marginTop:
                        '2px',
                      color:
                        isDark
                          ? '#94a3b8'
                          : '#64748b',
                    }}
                  >
                    Holiday location
                  </div>
                </div>
              </div>
            </div>

            {/* =================================================
                DESCRIPTION
            ================================================= */}

            <div
              style={{
                marginTop:
                  '14px',
                padding:
                  '16px 17px',
                borderRadius:
                  '16px',
                background:
                  isDark
                    ? `${modalTheme.accent}12`
                    : modalTheme.soft,
                border:
                  `1px solid ${modalTheme.accent}20`,
                color:
                  isDark
                    ? '#cbd5e1'
                    : '#475569',
                fontSize:
                  '13px',
                lineHeight:
                  '1.6',
              }}
            >
              <div
                style={{
                  display:
                    'flex',
                  alignItems:
                    'center',
                  gap: '7px',
                  marginBottom:
                    '7px',
                  color:
                    isDark
                      ? '#f8fafc'
                      : '#0f172a',
                  fontWeight:
                    '800',
                  fontSize:
                    '12px',
                }}
              >
                <span>
                  ✨
                </span>

                About this holiday
              </div>

              {
                selectedHoliday.description
              }
            </div>

            {/* =================================================
                BUTTONS
            ================================================= */}

            <div
              style={{
                display:
                  'flex',
                gap: '10px',
                marginTop:
                  '18px',
              }}
            >
              {/* Google Calendar */}

              <button
                type="button"
                onClick={() =>
                  addToGoogleCalendar(
                    selectedHoliday
                  )
                }
                style={{
                  flex: 1,
                  height: '48px',
                  border:
                    'none',
                  borderRadius:
                    '13px',
                  background:
                    '#22c55e',
                  color:
                    '#ffffff',
                  cursor:
                    'pointer',
                  fontSize:
                    '13px',
                  fontWeight:
                    '800',
                  boxShadow:
                    '0 8px 20px rgba(34,197,94,.25)',
                  transition:
                    'all .2s ease',
                }}
                onMouseEnter={(
                  e
                ) => {
                  e.currentTarget.style.transform =
                    'translateY(-1px)';

                  e.currentTarget.style.boxShadow =
                    '0 12px 25px rgba(34,197,94,.35)';
                }}
                onMouseLeave={(
                  e
                ) => {
                  e.currentTarget.style.transform =
                    'translateY(0)';

                  e.currentTarget.style.boxShadow =
                    '0 8px 20px rgba(34,197,94,.25)';
                }}
              >
                📅&nbsp; Add to Google Calendar
              </button>

              {/* ONLY CLOSE BUTTON */}

              <button
                type="button"
                onClick={
                  closeHoliday
                }
                style={{
                  height: '48px',
                  padding:
                    '0 22px',
                  borderRadius:
                    '13px',
                  border:
                    isDark
                      ? '1px solid #475569'
                      : '1px solid #cbd5e1',
                  background:
                    isDark
                      ? 'rgba(255,255,255,.06)'
                      : '#ffffff',
                  color:
                    isDark
                      ? '#f8fafc'
                      : '#334155',
                  cursor:
                    'pointer',
                  fontSize:
                    '13px',
                  fontWeight:
                    '700',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}