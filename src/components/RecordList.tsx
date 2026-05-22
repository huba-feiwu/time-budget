import type { RecordWithCategory } from '../types';
import { formatHours, todayStr } from '../timeUtils';

interface Props {
  records: RecordWithCategory[];
  onEdit: (r: RecordWithCategory) => void;
  onDelete: (id: number) => void;
}

export default function RecordList({ records, onEdit, onDelete }: Props) {
  const today = todayStr();
  if (records.length === 0) {
    return <p className="empty-state">暂无记录</p>;
  }

  return (
    <div className="record-list">
      {records.map(r => (
        <div key={r.id} className="record-item" style={{ borderLeftColor: r.category_color }}>
          <div className="record-main">
            <span className="record-category" style={{ color: r.category_color }}>{r.category_name}</span>
            {(r.start_time && r.end_time) && (
              <div className="record-time">{r.start_time} → {r.end_time}</div>
            )}
            {r.note && <div className="record-note">{r.note}</div>}
            {r.date <= today && (
              <div className="record-actions">
                <button className="btn-small" onClick={() => onEdit(r)}>编辑</button>
                <button className="btn-small btn-danger" onClick={() => onDelete(r.id!)}>删除</button>
              </div>
            )}
          </div>
          <span className="record-hours">{formatHours(r.hours)}</span>
        </div>
      ))}
    </div>
  );
}
