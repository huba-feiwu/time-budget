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
  { name: '睡觉', color: '#5890cb' },
  { name: '工作', color: '#d65a4d' },
  { name: '学习', color: '#3ebc73' },
  { name: '通勤', color: '#dd9728' },
  { name: '吃饭', color: '#d27f36' },
  { name: '娱乐', color: '#9762ad' },
  { name: '运动', color: '#2aac92' },
  { name: '社交', color: '#d5326a' },
  { name: '家务', color: '#74574d' },
  { name: '其他', color: '#999999' },
];
