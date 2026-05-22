import { useState, useEffect, useCallback } from 'react';
import type { Category, RecordWithCategory, DailySummary } from './types';
import * as db from './db';
import Timer from './components/Timer';
import RecordForm from './components/RecordForm';
import RecordList from './components/RecordList';
import Stats from './components/Stats';
import Calendar from './components/Calendar';
import CategoryManage from './components/CategoryManage';
import { formatHours, todayStr, getDayStartHour, setDayStartHour as saveDayStartSetting, getSleepInPct, setSleepInPct as saveSleepInPct } from './timeUtils';
import './App.css';

type Tab = 'today' | 'stats' | 'categories';

export default function App() {
  const [tab, setTab] = useState<Tab>('today');
  const [categories, setCategories] = useState<Category[]>([]);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editRecord, setEditRecord] = useState<RecordWithCategory | null>(null);
  const [date, setDate] = useState(todayStr());
  const [calKey, setCalKey] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [editingCarryover, setEditingCarryover] = useState(false);
  const [carryoverInput, setCarryoverInput] = useState('0');
  const [dayStartHour, setDayStartHourState] = useState(getDayStartHour);
  const [sleepInPct, setSleepInPctState] = useState(getSleepInPct);
  const isFuture = date > todayStr();

  const loadData = useCallback(async () => {
    const cats = await db.getCategories();
    setCategories(cats);
    const sum = await db.getDailySum(date);
    setSummary(sum);
    setCalKey(k => k + 1);
  }, [date]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!showSettings) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.settings-wrap')) setShowSettings(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSettings]);

  const handleTimerSave = async (categoryId: number, startTime: string, endTime: string, hours: number) => {
    await db.addRecord(categoryId, todayStr(), hours, startTime, endTime, null);
    loadData();
  };

  const handleFormSave = async (
    categoryId: number, hours: number,
    startTime: string | null, endTime: string | null, note: string | null
  ) => {
    if (editRecord) {
      await db.updateRecord(editRecord.id!, categoryId, date, hours, startTime, endTime, note);
    } else {
      await db.addRecord(categoryId, date, hours, startTime, endTime, note);
    }
    setShowForm(false);
    setEditRecord(null);
    loadData();
  };

  const handleEdit = (r: RecordWithCategory) => {
    setEditRecord(r);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    await db.deleteRecord(id);
    loadData();
  };

  const handleCategoryAdd = async (name: string, color: string) => {
    await db.addCategory(name, color);
    loadData();
  };

  const handleCategoryUpdate = async (id: number, name: string, color: string, sort_order: number) => {
    await db.updateCategory(id, name, color, sort_order);
    loadData();
  };

  const handleCategoryDelete = async (id: number) => {
    await db.deleteCategory(id);
    loadData();
  };

  const handleExport = async () => {
    const data = await db.exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `time-budget-${todayStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCarryoverSave = async () => {
    const val = parseFloat(carryoverInput);
    if (!isNaN(val)) {
      await db.setCarryoverOverride(date, val);
    }
    setEditingCarryover(false);
    loadData();
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      await db.importAllData(text);
      loadData();
    };
    input.click();
  };

  const handleDayStartChange = (h: number) => {
    saveDayStartSetting(h);
    setDayStartHourState(h);
    setDate(todayStr());
    loadData();
  };

  const handleSleepInPctChange = (v: boolean) => {
    saveSleepInPct(v);
    setSleepInPctState(v);
    loadData();
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>时间预算器</h1>
        <nav className="tabs">
          <button className={`tab ${tab === 'today' ? 'active' : ''}`} onClick={() => setTab('today')}>今日</button>
          <button className={`tab ${tab === 'stats' ? 'active' : ''}`} onClick={() => setTab('stats')}>统计</button>
          <button className={`tab ${tab === 'categories' ? 'active' : ''}`} onClick={() => setTab('categories')}>类别</button>
        </nav>
        <div className="header-actions">
          <div className="settings-wrap">
            <button className="btn-small" onClick={() => setShowSettings(c => !c)}>设置</button>
            {showSettings && (
              <div className="settings-dropdown">
                <div className="settings-row">
                  <span className="settings-label">日起始</span>
                  <select value={dayStartHour} onChange={e => handleDayStartChange(Number(e.target.value))}>
                    {Array.from({length: 24}, (_, i) => (
                      <option key={i} value={i}>{String(i).padStart(2,'0')}:00</option>
                    ))}
                  </select>
                </div>
                <div className="settings-row">
                  <label className="settings-check-label">
                    <span>睡眠占比</span>
                    <input type="checkbox" checked={sleepInPct} onChange={e => handleSleepInPctChange(e.target.checked)} />
                  </label>
                </div>
                <div className="settings-divider" />
                <button onClick={() => { handleExport(); setShowSettings(false); }}>导出数据</button>
                <button onClick={() => { handleImport(); setShowSettings(false); }}>导入数据</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className={`tab-page ${tab === 'today' ? '' : 'tab-hidden'}`}>
          <div className="today-view">
            <div className="today-left">
              <div className="budget-card">
                <div className="budget-title-row">
                  <h2>今日预算</h2>
                  {summary && (
                    <span className="budget-base">
                      {formatHours(summary.budget)} = 24h
                      {editingCarryover ? (
                        <input
                          type="number"
                          className="carryover-input"
                          value={carryoverInput}
                          onChange={e => setCarryoverInput(e.target.value)}
                          onBlur={handleCarryoverSave}
                          onKeyDown={e => { if (e.key === 'Enter') handleCarryoverSave(); }}
                          autoFocus
                          step="0.5"
                        />
                      ) : (
                        <span className="carryover-wrap">
                          {summary.budget > 24 ? '+' : summary.budget < 24 ? '-' : ''}<span
                            className="carryover-val"
                            onClick={() => {
                              const co = Math.round((summary.budget - 24) * 100) / 100;
                              setCarryoverInput(String(co));
                              setEditingCarryover(true);
                            }}
                          >
                            <span className="carryover-label">旧账</span>
                            {summary.budget < 24 ? formatHours(Math.abs(summary.budget - 24)) : formatHours(summary.budget - 24)}
                          </span>
                        </span>
                      )}
                    </span>
                  )}
                </div>
                {summary && (
                  <>
                    <div className={`budget-remaining ${summary.remaining < 0 ? 'over' : ''}`}>
                      {summary.remaining >= 0
                        ? `剩余 ${formatHours(summary.remaining)}`
                        : `超支 ${formatHours(Math.abs(summary.remaining))}`}
                    </div>
                    <div className="budget-bar">
                      <div className="budget-bar-fill" style={{
                        width: `${Math.min(100, (summary.total_hours / summary.budget) * 100)}%`,
                        backgroundColor: summary.total_hours > summary.budget ? '#e74c3c' : '#4A90D9',
                      }} />
                    </div>
                    <div className="budget-used-label">
                      <span className="budget-used-text">已消费时间：</span>
                      <span className="budget-used-val">{formatHours(summary.total_hours)}</span>
                    </div>
                  </>
                )}
              </div>

              <Timer categories={categories} onSave={handleTimerSave} />
              {summary && (() => {
                const catMap = new Map<string, { color: string; hours: number }>();
                let totalForPct = 0;
                summary.records.forEach(r => {
                  const existing = catMap.get(r.category_name) || { color: r.category_color, hours: 0 };
                  existing.hours += r.hours;
                  catMap.set(r.category_name, existing);
                  if (sleepInPct || r.category_name !== '睡觉') totalForPct += r.hours;
                });
                const cats = Array.from(catMap.entries())
                  .filter(([name]) => sleepInPct || name !== '睡觉')
                  .sort(([, a], [, b]) => b.hours - a.hours);
                return (
                  <div className="cat-summary">
                    <h2 className="section-title" style={{ marginBottom: 8 }}>每日详情</h2>
                    {cats.map(([name, data]) => (
                      <div key={name} className="cat-sum-row">
                        <span className="cat-sum-name" style={{ color: data.color }}>{name}</span>
                        <div className="cat-sum-bar-wrap">
                          <div className="cat-sum-bar" style={{ width: `${totalForPct > 0 ? (data.hours / totalForPct) * 100 : 0}%`, backgroundColor: data.color }} />
                        </div>
                        <span className="cat-sum-pct">{totalForPct > 0 ? Math.round((data.hours / totalForPct) * 100) : 0}%</span>
                        <span className="cat-sum-hours">{formatHours(data.hours)}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div className="today-right">
              <Calendar selectedDate={date} onSelectDate={setDate} refreshKey={calKey} />
              <div className="records-header">
                <h2>记录</h2>
                <div className="records-actions">
                  <button className="btn btn-add" onClick={() => { setEditRecord(null); setShowForm(true); }} disabled={isFuture}>{isFuture ? '未来日期' : '+ 添加'}</button>
                </div>
              </div>
              <RecordList records={summary?.records ?? []} onEdit={handleEdit} onDelete={handleDelete} />
            </div>
          </div>
        </div>

        <div className={`tab-page ${tab === 'stats' ? '' : 'tab-hidden'}`}>
          <Stats />
        </div>
        <div className={`tab-page ${tab === 'categories' ? '' : 'tab-hidden'}`}>
          <CategoryManage
            categories={categories}
            onAdd={handleCategoryAdd}
            onUpdate={handleCategoryUpdate}
            onDelete={handleCategoryDelete}
          />
        </div>
      </main>

      {showForm && (
        <RecordForm
          categories={categories}
          date={date}
          editRecord={editRecord}
          onSave={handleFormSave}
          onCancel={() => { setShowForm(false); setEditRecord(null); }}
        />
      )}
    </div>
  );
}
