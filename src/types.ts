export interface Category {
  id?: number;
  name: string;
  color: string;
  sort_order: number;
}

export interface Record {
  id?: number;
  category_id: number;
  date: string;
  hours: number;
  start_time?: string | null;
  end_time?: string | null;
  note?: string | null;
  created_at?: string;
}

export interface RecordWithCategory extends Record {
  category_name: string;
  category_color: string;
}

export interface DailySummary {
  date: string;
  budget: number;
  total_hours: number;
  remaining: number;
  records: RecordWithCategory[];
}

export interface CategoryHours {
  category_id: number;
  category_name: string;
  category_color: string;
  hours: number;
  percentage: number;
}

export const DEFAULT_CATEGORIES = [
  { name: '睡觉', color: '#4A90D9' },
  { name: '工作', color: '#E74C3C' },
  { name: '学习', color: '#2ECC71' },
  { name: '通勤', color: '#F39C12' },
  { name: '吃饭', color: '#E67E22' },
  { name: '娱乐', color: '#9B59B6' },
  { name: '运动', color: '#1ABC9C' },
  { name: '社交', color: '#E91E63' },
  { name: '家务', color: '#795548' },
  { name: '其他', color: '#999999' },
];
