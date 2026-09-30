import React, { useState, useMemo } from 'react';
import TodoItem from './TodoItem';

export default function TodoList({ todos, onToggleComplete, onUpdate, onDelete, isLoading }) {
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, completed
  const [filterPriority, setFilterPriority] = useState('all'); // all, low, medium, high
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTodos = useMemo(() => {
    return todos.filter((todo) => {
      // Status filter
      if (filterStatus === 'active' && todo.completed) return false;
      if (filterStatus === 'completed' && !todo.completed) return false;

      // Priority filter
      if (filterPriority !== 'all' && todo.priority !== filterPriority) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = todo.title.toLowerCase().includes(q);
        const descMatch = (todo.description || '').toLowerCase().includes(q);
        if (!titleMatch && !descMatch) return false;
      }

      return true;
    });
  }, [todos, filterStatus, filterPriority, searchQuery]);

  return (
    <div className="todo-list-wrapper">
      <div className="filter-controls card">
        <div className="search-box">
          <input
            type="search"
            className="form-input"
            placeholder="🔍 Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search tasks"
          />
        </div>

        <div className="filter-options">
          <div className="filter-tabs" role="tablist">
            {['all', 'active', 'completed'].map((status) => (
              <button
                key={status}
                type="button"
                className={`tab-btn ${filterStatus === status ? 'active' : ''}`}
                onClick={() => setFilterStatus(status)}
                role="tab"
                aria-selected={filterStatus === status}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          <div className="filter-priority">
            <select
              className="form-select form-select-sm"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              aria-label="Filter by priority"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="empty-state card">
          <div className="spinner"></div>
          <p>Loading your tasks...</p>
        </div>
      ) : filteredTodos.length === 0 ? (
        <div className="empty-state card">
          {searchQuery || filterStatus !== 'all' || filterPriority !== 'all' ? (
            <>
              <span className="empty-icon">🔍</span>
              <h3>No matching tasks found</h3>
              <p>Try clearing your filters or search keywords.</p>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setFilterStatus('all');
                  setFilterPriority('all');
                  setSearchQuery('');
                }}
              >
                Reset Filters
              </button>
            </>
          ) : (
            <>
              <span className="empty-icon">📝</span>
              <h3>No tasks yet</h3>
              <p>Type a task in the box above to get organized!</p>
            </>
          )}
        </div>
      ) : (
        <ul className="todo-items-list" aria-label="Tasks list">
          {filteredTodos.map((todo) => (
            <TodoItem
              key={todo.id || todo._id}
              todo={todo}
              onToggleComplete={onToggleComplete}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
