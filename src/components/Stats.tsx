import { useState, useEffect } from 'react';
import type { RecordWithCategory } from '../types';
import { getRecordsByDateRange } from '../db';
import { formatHours, getSleepInPct } from '../timeUtils';

function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function Stats() {
  const [view, setView] = useState<'week' | 'month' | 'range'>('week');
  const [pickMonth, setPickMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [rangeStart, setRangeStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return localDateStr(d);
  });
  const [rangeEnd, setRangeEnd] = useState(() => localDateStr(new Date()));
  const [records, setRecords] = useState<RecordWithCategory[]>([]);

  const getDateRange = () => {
    const now = new Date();
    if (view === 'week') {
      const start = new Date(now);
      start.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      return { start: localDateStr(start), end: localDateStr(now), label: '本周' };
    }
    if (view === 'month') {
      const [y, m] = pickMonth.split('-').map(Number);
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0);
      return { start: localDateStr(start), end: localDateStr(end), label: `${y}年${m}月` };
    }
    // range
    return { start: rangeStart, end: rangeEnd, label: `${rangeStart} ~ ${rangeEnd}` };
  };

  useEffect(() => {
    const load = async () => {
      const { start, end } = getDateRange();
      const r = await getRecordsByDateRange(start, end);
      setRecords(r);
    };
    load();
  }, [view, pickMonth, rangeStart, rangeEnd]);


  const { label } = getDateRange();
  const trackedDays = new Set(records.map(r => r.date)).size || 1;

  const sleepInPct = getSleepInPct();
  const categoryTotals: Record<string, { color: string; hours: number }> = {};
  records.forEach(r => {
    if (!categoryTotals[r.category_name]) {
      categoryTotals[r.category_name] = { color: r.category_color, hours: 0 };
    }
    categoryTotals[r.category_name].hours += r.hours;
  });
  const statsTotal = Object.entries(categoryTotals)
    .filter(([name]) => sleepInPct || name !== '睡觉')
    .reduce((s, [, c]) => s + c.hours, 0);

  return (
    <div className="stats-view">
      <h2>统计 · {label}</h2>
      <div className="stats-tabs">
        <button className={`btn-tab ${view === 'week' ? 'active' : ''}`} onClick={() => setView('week')}>本周</button>
        <button className={`btn-tab ${view === 'month' ? 'active' : ''}`} onClick={() => setView('month')}>月份</button>
        <button className={`btn-tab ${view === 'range' ? 'active' : ''}`} onClick={() => setView('range')}>自定</button>
      </div>

      {view === 'month' && (
        <div className="stats-filter">
          <input type="month" value={pickMonth} onChange={e => setPickMonth(e.target.value)} className="date-picker" />
        </div>
      )}
      {view === 'range' && (
        <div className="stats-filter">
          <input type="date" value={rangeStart} onChange={e => setRangeStart(e.target.value)} className="date-picker" />
          <span className="stats-range-sep">→</span>
          <input type="date" value={rangeEnd} onChange={e => setRangeEnd(e.target.value)} className="date-picker" />
        </div>
      )}

      <div className="stats-category-breakdown">
        <h3>时间去向 <span className="stats-subtitle">（统计天数：{trackedDays}天）</span></h3>
        <table className="stats-table">
          <thead>
            <tr>
              <th>类别</th>
              <th>总时长</th>
              <th>日均</th>
              <th>占比</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(categoryTotals)
              .sort(([, a], [, b]) => b.hours - a.hours)
              .map(([name, data]) => {
                const avg = Math.round((data.hours / trackedDays) * 100) / 100;
                const showPct = sleepInPct || name !== '睡觉';
                return (
                  <tr key={name}>
                    <td><span className="legend-dot" style={{ backgroundColor: data.color }} />{name}</td>
                    <td>{formatHours(data.hours)}</td>
                    <td>{formatHours(avg)}</td>
                    <td>{showPct && statsTotal > 0 ? `${Math.round((data.hours / statsTotal) * 10000) / 100}%` : '—'}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
