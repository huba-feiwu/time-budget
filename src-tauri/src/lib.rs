use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create initial tables",
            sql: "
                CREATE TABLE IF NOT EXISTS categories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL UNIQUE,
                    color TEXT NOT NULL DEFAULT '#999999',
                    sort_order INTEGER NOT NULL DEFAULT 0
                );

                CREATE TABLE IF NOT EXISTS records (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    category_id INTEGER NOT NULL,
                    date TEXT NOT NULL,
                    hours REAL NOT NULL,
                    start_time TEXT,
                    end_time TEXT,
                    note TEXT,
                    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
                    FOREIGN KEY (category_id) REFERENCES categories(id)
                );

                CREATE INDEX IF NOT EXISTS idx_records_date ON records(date);
                CREATE INDEX IF NOT EXISTS idx_records_category ON records(category_id);

                INSERT OR IGNORE INTO categories (name, color, sort_order) VALUES ('睡觉', '#5890cb', 1);
                INSERT OR IGNORE INTO categories (name, color, sort_order) VALUES ('工作', '#d65a4d', 2);
                INSERT OR IGNORE INTO categories (name, color, sort_order) VALUES ('学习', '#3ebc73', 3);
                INSERT OR IGNORE INTO categories (name, color, sort_order) VALUES ('通勤', '#dd9728', 4);
                INSERT OR IGNORE INTO categories (name, color, sort_order) VALUES ('吃饭', '#d27f36', 5);
                INSERT OR IGNORE INTO categories (name, color, sort_order) VALUES ('娱乐', '#9762ad', 6);
                INSERT OR IGNORE INTO categories (name, color, sort_order) VALUES ('运动', '#2aac92', 7);
                INSERT OR IGNORE INTO categories (name, color, sort_order) VALUES ('社交', '#d5326a', 8);
                INSERT OR IGNORE INTO categories (name, color, sort_order) VALUES ('家务', '#74574d', 9);
                INSERT OR IGNORE INTO categories (name, color, sort_order) VALUES ('其他', '#999999', 10);
            ",
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:time_budget.db", migrations)
                .build(),
        )
        .plugin(
            tauri_plugin_log::Builder::default()
                .level(log::LevelFilter::Info)
                .build(),
        )
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
