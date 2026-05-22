import { useState, useEffect, useRef } from 'react';
import type { Category } from '../types';

interface Props {
  categories: Category[];
  onSave: (categoryId: number, startTime: string, endTime: string, hours: number) => void;
}

export default function Timer({ categories, onSave }: Props) {
  const [running, setRunning] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number>(categories[0]?.id ?? 0);
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef<string>('');
  const intervalRef = useRef<number>(0);

  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].id!);
    }
  }, [categories]);

  const start = () => {
    const now = new Date();
    startTimeRef.current = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setElapsed(0);
    setRunning(true);
    intervalRef.current = window.setInterval(() => {
      setElapsed(e => e + 1);
    }, 1000);
  };

  const stop = () => {
    setRunning(false);
    clearInterval(intervalRef.current);
    const now = new Date();
    const endTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const hours = Math.round((elapsed / 3600) * 100) / 100;

    if (selectedCategory && hours >= 0.01) {
      onSave(selectedCategory, startTimeRef.current, endTime, hours);
    }
    setElapsed(0);
  };

  const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="timer-card">
      <h2>计时器</h2>
      <div className="timer-display">{formatTime(elapsed)}</div>
      {!running ? (
        <>
          <div className="timer-select">
            <label>活动类别</label>
            <select value={selectedCategory} onChange={e => setSelectedCategory(Number(e.target.value))}>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <button className="btn btn-start" onClick={start}>开始</button>
        </>
      ) : (
        <div className="timer-running">
          <p>正在记录：{categories.find(c => c.id === selectedCategory)?.name}</p>
          <button className="btn btn-stop" onClick={stop}>结束</button>
        </div>
      )}
    </div>
  );
}
