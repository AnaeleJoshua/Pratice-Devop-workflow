import React, { useState } from 'react';

export default function TodoItem({ todo, onToggleComplete, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [editDescription, setEditDescription] = useState(todo.description || '');
  const [editPriority, setEditPriority] = useState(todo.priority || 'medium');
  const [editDueDate, setEditDueDate] = useState(
    todo.dueDate ? new Date(todo.dueDate).toISOString().split('T')[0] : ''
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editTitle.trim()) return;

    setIsSaving(true);
    try {
      await onUpdate(todo.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        priority: editPriority,
        dueDate: editDueDate ? new Date(editDueDate).toISOString() : null,
      });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditTitle(todo.title);
    setEditDescription(todo.description || '');
    setEditPriority(todo.priority || 'medium');
    setEditDueDate(todo.dueDate ? new Date(todo.dueDate).toISOString().split('T')[0] : '');
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${todo.title}"?`)) {
      setIsDeleting(true);
      try {
        await onDelete(todo.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const priorityColors = {
    low: 'badge-low',
    medium: 'badge-medium',
    high: 'badge-high',
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isEditing) {
    return (
      <li className="todo-item card editing-card">
        <form onSubmit={handleSave} className="edit-form">
          <input
            type="text"
            className="form-input"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            required
            autoFocus
            aria-label="Edit title"
          />
          <textarea
            className="form-textarea"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="Description..."
            rows={2}
            aria-label="Edit description"
          />
          <div className="edit-form-meta">
            <div className="form-group">
              <label>Priority:</label>
              <select
                className="form-select"
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="form-group">
              <label>Due Date:</label>
              <input
                type="date"
                className="form-input form-input-date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
              />
            </div>
          </div>
          <div className="edit-actions">
            <button type="submit" className="btn btn-primary btn-sm" disabled={isSaving || !editTitle.trim()}>
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleCancel} disabled={isSaving}>
              Cancel
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className={`todo-item card ${todo.completed ? 'completed' : ''}`}>
      <div className="todo-main-content">
        <label className="checkbox-label" title={todo.completed ? 'Mark as incomplete' : 'Mark as complete'}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => onToggleComplete(todo)}
            className="todo-checkbox"
            aria-label={`Mark "${todo.title}" as ${todo.completed ? 'incomplete' : 'complete'}`}
          />
          <span className="custom-checkbox"></span>
        </label>

        <div className="todo-text-block">
          <h3 className="todo-title">{todo.title}</h3>
          {todo.description && <p className="todo-description">{todo.description}</p>}
          <div className="todo-badges">
            <span className={`badge ${priorityColors[todo.priority] || 'badge-medium'}`}>
              {todo.priority || 'medium'}
            </span>
            {todo.dueDate && (
              <span className="badge badge-date">
                📅 {formatDate(todo.dueDate)}
              </span>
            )}
            <span className="badge badge-timestamp">
              Created {formatDate(todo.createdAt)}
            </span>
          </div>
        </div>
      </div>

      <div className="todo-actions">
        <button
          type="button"
          className="btn-icon"
          title="Edit Task"
          onClick={() => setIsEditing(true)}
          aria-label={`Edit "${todo.title}"`}
        >
          ✏️
        </button>
        <button
          type="button"
          className="btn-icon btn-icon-danger"
          title="Delete Task"
          onClick={handleDelete}
          disabled={isDeleting}
          aria-label={`Delete "${todo.title}"`}
        >
          {isDeleting ? '⏳' : '🗑️'}
        </button>
      </div>
    </li>
  );
}
