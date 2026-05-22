import { useState } from 'react';
import type { Category } from '../types';

interface Props {
  categories: Category[];
  onUpdate: (id: number, name: string, color: string, sort_order: number) => void;
  onDelete: (id: number) => void;
  onAdd: (name: string, color: string) => void;
}

const COLORS = ['#5890cb','#d65a4d','#3ebc73','#dd9728','#d27f36','#9762ad','#2aac92','#d5326a','#74574d','#999999','#4595ca','#f07a7a'];

export default function CategoryManage({ categories, onUpdate, onDelete, onAdd }: Props) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(COLORS[0]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  const handleAdd = () => {
    if (!newName.trim()) return;
    onAdd(newName.trim(), newColor);
    setNewName('');
    setNewColor(COLORS[0]);
    setAdding(false);
  };

  const startEdit = (c: Category) => {
    setEditingId(c.id!);
    setEditName(c.name);
    setEditColor(c.color);
  };

  const handleEdit = () => {
    if (!editName.trim() || editingId === null) return;
    onUpdate(editingId, editName.trim(), editColor, 0);
    setEditingId(null);
  };

  return (
    <div className="category-manage">
      <div className="cat-header">
        <h2>类别管理</h2>
        <button className="btn btn-add" onClick={() => setAdding(true)}>+ 新增</button>
      </div>

      {adding && (
        <div className="cat-add-form">
          <input value={newName} placeholder="类别名称" onChange={e => setNewName(e.target.value)} />
          <div className="color-picker">
            {COLORS.map(c => (
              <span key={c} className={`color-dot ${c === newColor ? 'selected' : ''}`}
                style={{ backgroundColor: c }} onClick={() => setNewColor(c)} />
            ))}
            <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)}
              className="color-custom" title="自定义颜色" />
          </div>
          <div className="form-actions">
            <button className="btn btn-cancel" onClick={() => setAdding(false)}>取消</button>
            <button className="btn btn-save" onClick={handleAdd}>添加</button>
          </div>
        </div>
      )}

      <div className="cat-list">
        {categories.map(c => (
          <div key={c.id} className="cat-item">
            {editingId === c.id ? (
              <div className="cat-edit-form">
                <input value={editName} onChange={e => setEditName(e.target.value)} />
                <div className="color-picker">
                  {COLORS.map(col => (
                    <span key={col} className={`color-dot ${col === editColor ? 'selected' : ''}`}
                      style={{ backgroundColor: col }} onClick={() => setEditColor(col)} />
                  ))}
                  <input type="color" value={editColor} onChange={e => setEditColor(e.target.value)}
                    className="color-custom" title="自定义颜色" />
                </div>
                <div className="form-actions">
                  <button className="btn btn-cancel" onClick={() => setEditingId(null)}>取消</button>
                  <button className="btn btn-save" onClick={handleEdit}>保存</button>
                </div>
              </div>
            ) : (
              <>
                <span className="legend-dot" style={{ backgroundColor: c.color }} />
                <span className="cat-name">{c.name}</span>
                <div className="cat-actions">
                  <button className="btn-small" onClick={() => startEdit(c)}>编辑</button>
                  <button className="btn-small btn-danger" onClick={() => onDelete(c.id!)}>删除</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
