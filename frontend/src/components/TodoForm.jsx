import React, { useState } from 'react';

export default function TodoForm({ onAddTodo, isSubmitting }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setValidationError('Task title cannot be empty.');
      return;
    }

    setValidationError('');
    try {
      await onAddTodo({
        title: title.trim(),
        description: description.trim(),
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      });

      // Reset form
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate('');
      setIsExpanded(false);
    } catch {
      // Error handled by parent
    }
  };

  return (
    <form className="todo-form card" onSubmit={handleSubmit} noValidate>
      <div className="form-primary-row">
        <input
          type="text"
          className="form-input"
          placeholder="What needs to be done?"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (validationError) setValidationError('');
          }}
          onFocus={() => setIsExpanded(true)}
          required
          aria-label="New task title"
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting || !title.trim()}
        >
          {isSubmitting ? 'Adding...' : 'Add Task'}
        </button>
      </div>

      {validationError && (
        <div className="form-error" role="alert">
          {validationError}
        </div>
      )}

      {isExpanded && (
        <div className="form-extended-fields">
          <textarea
            className="form-textarea"
            placeholder="Add extra notes or description (optional)..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            aria-label="Task description"
          />

          <div className="form-row-meta">
            <div className="form-group">
              <label htmlFor="priority-select">Priority:</label>
              <select
                id="priority-select"
                className="form-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="due-date-input">Due Date:</label>
              <input
                id="due-date-input"
                type="date"
                className="form-input form-input-date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setIsExpanded(false)}
            >
              Collapse
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
