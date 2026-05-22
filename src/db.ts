import Database from '@tauri-apps/plugin-sql';
import type { Category, RecordWithCategory, DailySummary, CategoryHours } from './types';
import { todayStr } from './timeUtils';

let db: Database | null = null;

function dateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load('sqlite:time_budget.db');
  }
  return db;
}

// ---- Categories ----

export async function getCategories(): Promise<Category[]> {
  const d = await getDb();
  return d.select<Category[]>('SELECT id, name, color, sort_order FROM categories ORDER BY sort_order');
}

export async function addCategory(name: string, color: string): Promise<number> {
  const d = await getDb();
  const result = await d.execute(
    'INSERT INTO categories (name, color, sort_order) VALUES ($1, $2, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM categories))',
    [name, color]
  );
  return result.lastInsertId!;
}

export async function updateCategory(id: number, name: string, color: string, sort_order: number): Promise<void> {
  const d = await getDb();
  await d.execute(
    'UPDATE categories SET name = $1, color = $2, sort_order = $3 WHERE id = $4',
    [name, color, sort_order, id]
  );
}

export async function deleteCategory(id: number): Promise<void> {
  const d = await getDb();
  await d.execute('DELETE FROM records WHERE category_id = $1', [id]);
  await d.execute('DELETE FROM categories WHERE id = $1', [id]);
}

// ---- Records ----

export async function getRecordsByDate(date: string): Promise<RecordWithCategory[]> {
  const d = await getDb();
  return d.select<RecordWithCategory[]>(
    `SELECT r.id, r.category_id, c.name as category_name, c.color as category_color,
            r.date, r.hours, r.start_time, r.end_time, r.note, r.created_at
     FROM records r
     JOIN categories c ON r.category_id = c.id
     WHERE r.date = $1
     ORDER BY r.created_at DESC`,
    [date]
  );
}

export async function getRecordsByDateRange(startDate: string, endDate: string): Promise<RecordWithCategory[]> {
  const d = await getDb();
  return d.select<RecordWithCategory[]>(
    `SELECT r.id, r.category_id, c.name as category_name, c.color as category_color,
            r.date, r.hours, r.start_time, r.end_time, r.note, r.created_at
     FROM records r
     JOIN categories c ON r.category_id = c.id
     WHERE r.date >= $1 AND r.date <= $2
     ORDER BY r.date DESC, r.created_at DESC`,
    [startDate, endDate]
  );
}

export async function addRecord(
  category_id: number, date: string, hours: number,
  start_time?: string | null, end_time?: string | null, note?: string | null
): Promise<number> {
  const d = await getDb();
  const result = await d.execute(
    'INSERT INTO records (category_id, date, hours, start_time, end_time, note) VALUES ($1, $2, $3, $4, $5, $6)',
    [category_id, date, hours, start_time ?? null, end_time ?? null, note ?? null]
  );
  return result.lastInsertId!;
}

export async function updateRecord(
  id: number, category_id: number, date: string, hours: number,
  start_time?: string | null, end_time?: string | null, note?: string | null
): Promise<void> {
  const d = await getDb();
  await d.execute(
    'UPDATE records SET category_id=$1, date=$2, hours=$3, start_time=$4, end_time=$5, note=$6 WHERE id=$7',
    [category_id, date, hours, start_time ?? null, end_time ?? null, note ?? null, id]
  );
}

export async function deleteRecord(id: number): Promise<void> {
  const d = await getDb();
  await d.execute('DELETE FROM records WHERE id = $1', [id]);
}

// ---- Budget ----

async function ensureBudgetTable() {
  const d = await getDb();
  await d.execute('CREATE TABLE IF NOT EXISTS budget_overrides (date TEXT PRIMARY KEY, carryover REAL)');
}

export async function getCarryoverOverride(date: string): Promise<number | null> {
  await ensureBudgetTable();
  const d = await getDb();
  const rows = await d.select<{carryover: number}[]>(
    'SELECT carryover FROM budget_overrides WHERE date = $1', [date]
  );
  return rows.length > 0 ? rows[0].carryover : null;
}

export async function setCarryoverOverride(date: string, carryover: number | null): Promise<void> {
  await ensureBudgetTable();
  const d = await getDb();
  if (carryover === null) {
    await d.execute('DELETE FROM budget_overrides WHERE date = $1', [date]);
  } else {
    await d.execute(
      'INSERT INTO budget_overrides (date, carryover) VALUES ($1, $2) ON CONFLICT(date) DO UPDATE SET carryover = $2',
      [date, carryover]
    );
  }
}

export async function getAvailableBudget(date: string): Promise<number> {
  // Future dates always show base 24h budget
  if (date > todayStr()) return 24;

  const d = await getDb();
  // Check override first
  await ensureBudgetTable();
  const override = await d.select<{carryover: number}[]>(
    'SELECT carryover FROM budget_overrides WHERE date = $1', [date]
  );
  if (override.length > 0) {
    return Math.max(0, Math.round((24 + override[0].carryover) * 100) / 100);
  }

  // 逐日历日迭代：budget[t] = 24 + (budget[t-1] - total[t-1])
  const rows = await d.select<{date: string, total: number}[]>(
    'SELECT date, SUM(hours) as total FROM records WHERE date < $1 GROUP BY date ORDER BY date',
    [date]
  );
  if (rows.length === 0) return 24;

  const totalByDate = new Map(rows.map(r => [r.date, r.total]));
  let budget = 24;
  const cur = new Date(rows[0].date + 'T00:00:00');

  while (true) {
    const key = dateStr(cur);
    if (!totalByDate.has(key)) {
      budget = 24; // 无记录日不产生旧账，重置
    } else {
      budget = Math.max(0, 24 + budget - totalByDate.get(key)!);
    }

    cur.setDate(cur.getDate() + 1);
    if (dateStr(cur) >= date) break;
  }

  return Math.round(budget * 100) / 100;
}

export async function getDailySum(date: string): Promise<DailySummary> {
  const records = await getRecordsByDate(date);
  const total_hours = Math.round(records.reduce((s, r) => s + r.hours, 0) * 100) / 100;
  const budget = await getAvailableBudget(date);
  const remaining = Math.round((budget - total_hours) * 100) / 100;
  return { date, budget, total_hours, remaining, records };
}

export async function getCategoryHoursByDate(date: string): Promise<CategoryHours[]> {
  const d = await getDb();
  const rows = await d.select<any[]>(
    `SELECT c.id as category_id, c.name as category_name, c.color as category_color,
            COALESCE(SUM(r.hours), 0) as hours
     FROM categories c
     LEFT JOIN records r ON r.category_id = c.id AND r.date = $1
     GROUP BY c.id
     ORDER BY c.sort_order`,
    [date]
  );
  const total = rows.reduce((s: number, r: any) => s + r.hours, 0);
  return rows.map((r: any) => ({
    category_id: r.category_id,
    category_name: r.category_name,
    category_color: r.category_color,
    hours: r.hours,
    percentage: total > 0 ? Math.round((r.hours / total) * 10000) / 100 : 0,
  }));
}

export async function getDatesWithRecords(startDate: string, endDate: string): Promise<string[]> {
  const d = await getDb();
  const rows = await d.select<{date: string}[]>(
    'SELECT DISTINCT date FROM records WHERE date >= $1 AND date <= $2 ORDER BY date',
    [startDate, endDate]
  );
  return rows.map(r => r.date);
}

// ---- Export / Import ----

export async function exportAllData(): Promise<string> {
  const d = await getDb();
  const categories = await getCategories();
  const records = await d.select('SELECT * FROM records ORDER BY date DESC');
  const data = {
    version: 1,
    exported_at: new Date().toLocaleString('zh-CN'),
    categories,
    records,
  };
  return JSON.stringify(data, null, 2);
}

export async function importAllData(jsonStr: string): Promise<void> {
  const d = await getDb();
  const data = JSON.parse(jsonStr);

  if (data.categories) {
    for (const cat of data.categories) {
      const existing = await d.select<{id: number}[]>(
        'SELECT id FROM categories WHERE name = $1', [cat.name]
      );
      if (existing.length === 0) {
        await d.execute(
          'INSERT INTO categories (name, color, sort_order) VALUES ($1, $2, $3)',
          [cat.name, cat.color, cat.sort_order]
        );
      }
    }
  }

  if (data.records) {
    for (const rec of data.records) {
      await d.execute(
        'INSERT INTO records (category_id, date, hours, start_time, end_time, note) VALUES ($1, $2, $3, $4, $5, $6)',
        [rec.category_id, rec.date, rec.hours, rec.start_time, rec.end_time, rec.note]
      );
    }
  }
}
