import { useState, useEffect } from 'react';
import type { Category, RecordWithCategory } from '../types';
import { toDecimal, fromDecimal } from '../timeUtils';

interface Props {
  categories: Category[];
  date: string;
  editRecord?: RecordWithCategory | null;
  onSave: (categoryId: number, hours: number, startTime: string | null, endTime: string | null, note: string | null) => void;
  onCancel: () => void;
  timeMode: 'start' | 'end' | 'estimated';
}

export default function RecordForm({ categories, date, editRecord, onSave, onCancel, timeMode }: Props) {
  const init = fromDecimal(editRecord?.hours ?? 0);
  const [categoryId, setCategoryId] = useState(editRecord?.category_id ?? categories[0]?.id ?? 0);
  const [hours, setHours] = useState(init.h > 0 ? init.h.toString() : '');
  const [minutes, setMinutes] = useState(init.m > 0 ? init.m.toString() : '');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [note, setNote] = useState(editRecord?.note ?? '');

  // Initialize time fields from editRecord
  useEffect(() => {
    if (!editRecord) return;
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    const durMins = h * 60 + m;

    if (timeMode === 'start') {
      if (editRecord.start_time) {
        setStartTime(editRecord.start_time);
      } else if (editRecord.end_time && durMins > 0) {
        const [eh, em] = editRecord.end_time.split(':').map(Number);
        const total = eh * 60 + em - durMins;
        const wrapped = ((total % 1440) + 1440) % 1440;
        const nh = Math.floor(wrapped / 60);
        const nm = wrapped % 60;
        setStartTime(`${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`);
      }
    } else if (timeMode === 'end') {
      if (editRecord.end_time) {
        setEndTime(editRecord.end_time);
      } else if (editRecord.start_time && durMins > 0) {
        const [sh, sm] = editRecord.start_time.split(':').map(Number);
        const total = sh * 60 + sm + durMins;
        const nh = Math.floor(total / 60) % 24;
        const nm = total % 60;
        setEndTime(`${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`);
      }
    } else {
      // estimated: populate both if available, derive missing one
      if (editRecord.start_time) setStartTime(editRecord.start_time);
      if (editRecord.end_time) setEndTime(editRecord.end_time);
      if (!editRecord.start_time && editRecord.end_time && durMins > 0) {
        const [eh, em] = editRecord.end_time.split(':').map(Number);
        const total = eh * 60 + em - durMins;
        const wrapped = ((total % 1440) + 1440) % 1440;
        const nh = Math.floor(wrapped / 60);
        const nm = wrapped % 60;
        setStartTime(`${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`);
      } else if (editRecord.start_time && !editRecord.end_time && durMins > 0) {
        const [sh, sm] = editRecord.start_time.split(':').map(Number);
        const total = sh * 60 + sm + durMins;
        const nh = Math.floor(total / 60) % 24;
        const nm = total % 60;
        setEndTime(`${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-fill end time from start time + duration
  useEffect(() => {
    if (timeMode === 'end') return;
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    const durMins = h * 60 + m;
    if (durMins <= 0 || !startTime) return;

    const [sh, sm] = startTime.split(':').map(Number);
    const total = sh * 60 + sm + durMins;
    const nh = Math.floor(total / 60) % 24;
    const nm = total % 60;
    setEndTime(`${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`);
  }, [hours, minutes, startTime, timeMode]);

  // Auto-fill start time from end time - duration (end mode only)
  useEffect(() => {
    if (timeMode !== 'end') return;
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    const durMins = h * 60 + m;
    if (durMins <= 0 || !endTime) return;

    const [eh, em] = endTime.split(':').map(Number);
    const total = eh * 60 + em - durMins;
    const wrapped = ((total % 1440) + 1440) % 1440;
    const nh = Math.floor(wrapped / 60);
    const nm = wrapped % 60;
    setStartTime(`${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`);
  }, [hours, minutes, endTime, timeMode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    const total = toDecimal(h, m);
    if (!categoryId || total <= 0) return;
    onSave(categoryId, total, startTime || null, endTime || null, note || null);
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <form className="record-form" onClick={e => e.stopPropagation()} onSubmit={handleSubmit}>
        <h3>{editRecord ? '编辑记录' : '添加记录'}</h3>
        <p className="form-date">{date}</p>

        <label>类别</label>
        <select value={categoryId} onChange={e => setCategoryId(Number(e.target.value))}>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <label>时长</label>
        <div className="form-row">
          <div>
            <input type="number" min="0" max="24" value={hours}
              placeholder="时" onChange={e => setHours(e.target.value)} />
            <span className="unit">小时</span>
          </div>
          <div>
            <input type="number" min="0" max="59" value={minutes}
              placeholder="分" onChange={e => setMinutes(e.target.value)} />
            <span className="unit">分钟</span>
          </div>
        </div>

        <label>{timeMode === 'start' ? '开始时间' : timeMode === 'end' ? '结束时间' : '开始时间'}（可选）</label>
        {timeMode === 'start' && (
          <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
        )}
        {timeMode === 'end' && (
          <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
        )}
        {timeMode === 'estimated' && (
          <div className="form-row">
            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
            <span className="unit" style={{ margin: '0 8px' }}>至</span>
            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
          </div>
        )}

        <label>备注（可选）</label>
        <input type="text" value={note} placeholder="备注" onChange={e => setNote(e.target.value)} />

        <div className="form-actions">
          <button type="button" className="btn btn-cancel" onClick={onCancel}>取消</button>
          <button type="submit" className="btn btn-save">{editRecord ? '保存' : '添加'}</button>
        </div>
      </form>
    </div>
  );
}
