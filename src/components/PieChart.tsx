import type { CategoryHours } from '../types';
import { formatHours } from '../timeUtils';

interface Props {
  data: CategoryHours[];
  size?: number;
}

export default function PieChart({ data, size = 200 }: Props) {
  const valid = data.filter(d => d.hours > 0);
  if (valid.length === 0) {
    return <div className="pie-empty">暂无数据</div>;
  }

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 10;
  const total = valid.reduce((s, d) => s + d.hours, 0);

  let currentAngle = -90;
  const slices = valid.map(d => {
    const angle = (d.hours / total) * 360;
    const start = currentAngle;
    const end = currentAngle + angle;
    currentAngle = end;

    const x1 = cx + r * Math.cos((start * Math.PI) / 180);
    const y1 = cy + r * Math.sin((start * Math.PI) / 180);
    const x2 = cx + r * Math.cos((end * Math.PI) / 180);
    const y2 = cy + r * Math.sin((end * Math.PI) / 180);

    const large = angle > 180 ? 1 : 0;

    return {
      path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`,
      color: d.category_color,
      label: d.category_name,
      hours: d.hours,
      percentage: d.percentage,
    };
  });

  return (
    <div className="pie-chart">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} stroke="white" strokeWidth="2" />
        ))}
      </svg>
      <div className="pie-legend">
        {slices.map((s, i) => (
          <div key={i} className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: s.color }} />
            <span>{s.label}</span>
            <span className="legend-hours">{formatHours(s.hours)} ({s.percentage}%)</span>
          </div>
        ))}
      </div>
      <div className="pie-total">总计: {formatHours(total)}</div>
    </div>
  );
}
