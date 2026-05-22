import { useState, useEffect } from 'react';
import { getDatesWithRecords } from '../db';
import { todayStr } from '../timeUtils';

interface Props {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  refreshKey?: number;
}

function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(Number(dateStr.slice(0, 4)), Number(dateStr.slice(5, 7)) - 1, Number(dateStr.slice(8, 10)));
  d.setDate(d.getDate() + n);
  return localDateStr(d);
}

export default function Calendar({ selectedDate, onSelectDate, refreshKey }: Props) {
  const today = todayStr();
  const [collapsed, setCollapsed] = useState(true);
  const [viewYear, setViewYear] = useState(() => {
    const d = new Date();
    return d.getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    return d.getMonth();
  });
  const [recordedDates, setRecordedDates] = useState<Set<string>>(new Set());

  const firstDay = new Date(viewYear, viewMonth, 1);
  const lastDay = new Date(viewYear, viewMonth + 1, 0);
  const startPad = (firstDay.getDay() + 6) % 7;
  const totalDays = lastDay.getDate();

  useEffect(() => {
    const start = localDateStr(firstDay);
    const end = localDateStr(lastDay);
    getDatesWithRecords(start, end).then(dates => {
      setRecordedDates(new Set(dates));
    });
  }, [viewYear, viewMonth, refreshKey]);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(y => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(y => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const goPrevDay = () => onSelectDate(addDays(selectedDate, -1));
  const goNextDay = () => {
    const next = addDays(selectedDate, 1);
    if (next <= today) onSelectDate(next);
  };
  const canGoNext = addDays(selectedDate, 1) <= today;

  const cells: React.ReactNode[] = [];

  const dayLabels = ['一', '二', '三', '四', '五', '六', '日'];
  dayLabels.forEach((label, i) => {
    cells.push(
      <div key={`h-${i}`} className="cal-dow">{label}</div>
    );
  });

  for (let i = 0; i < startPad; i++) {
    cells.push(<div key={`e-${i}`} className="cal-cell cal-empty" />);
  }

  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isToday = dateStr === today;
    const isSelected = dateStr === selectedDate;
    const hasRecord = recordedDates.has(dateStr);
    const isFuture = dateStr > today;

    cells.push(
      <div
        key={dateStr}
        className={`cal-cell ${isToday ? 'cal-today' : ''} ${isSelected ? 'cal-selected' : ''} ${isFuture ? 'cal-future' : ''}`}
        onClick={() => !isFuture && onSelectDate(dateStr)}
      >
        <span className="cal-day">{d}</span>
        {hasRecord && <span className="cal-dot" />}
      </div>
    );
  }

  return (
    <div className="calendar">
      <div className="cal-header">
        <button className="cal-nav cal-toggle-nav" onClick={() => setCollapsed(c => !c)}>{collapsed ? '展开' : '收起'}</button>
        <input
          type="date"
          value={selectedDate}
          onChange={e => onSelectDate(e.target.value)}
          className="date-picker cal-date-input"
        />
        <span className="cal-day-nav-group">
          <button className="cal-nav cal-day-nav" onClick={goPrevDay}>▲</button>
          <button className="cal-nav cal-day-nav" onClick={goNextDay} disabled={!canGoNext}>▼</button>
        </span>
      </div>
      {!collapsed && (
        <>
          <div className="cal-nav-row">
            <button className="cal-nav" onClick={prevMonth}>&lt;</button>
            <span>{viewYear}年{viewMonth + 1}月</span>
            <button className="cal-nav" onClick={nextMonth}>&gt;</button>
          </div>
          <div className="cal-grid">
            {cells}
          </div>
        </>
      )}
    </div>
  );
}
