import React, { useState, useEffect, useCallback } from 'react';
import { api } from './services/api';
import TodoStats from './components/TodoStats';
import TodoForm from './components/TodoForm';
import TodoList from './components/TodoList';
import './App.css';

export default function App() {
  const [todos, setTodos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [backendStatus, setBackendStatus] = useState({ online: false, checked: false });
  const [feedback, setFeedback] = useState(null);

  const showNotification = (message, type = 'info') => {
    setFeedback({ message, type });
    setTimeout(() => {
      setFeedback((current) => (current?.message === message ? null : current));
    }, 4000);
  };

  // Check backend health & connectivity
  const checkBackendHealth = useCallback(async () => {
    const isUp = await api.checkHealth();
    setBackendStatus({ online: isUp, checked: true });
    return isUp;
  }, []);

  // Load all todos from backend
  const loadTodos = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.getTodos();
      if (res && res.data) {
        setTodos(res.data);
      }
      setBackendStatus({ online: true, checked: true });
    } catch (err) {
      console.error('Error fetching todos:', err);
      setBackendStatus({ online: false, checked: true });
      showNotification(
        'Cannot connect to backend server. Make sure the Node backend and MongoDB container are running.',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTodos();
    const interval = setInterval(checkBackendHealth, 15000);
    return () => clearInterval(interval);
  }, [loadTodos, checkBackendHealth]);

  // Create Todo
  const handleAddTodo = async (todoData) => {
    setIsSubmitting(true);
    try {
      const res = await api.createTodo(todoData);
      if (res && res.data) {
        setTodos((prev) => [res.data, ...prev]);
        showNotification('Task created successfully!', 'success');
      }
    } catch (err) {
      showNotification(err.message || 'Failed to create task.', 'error');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Todo completion
  const handleToggleComplete = async (todo) => {
    const updatedStatus = !todo.completed;
    // Optimistic UI update
    setTodos((prev) =>
      prev.map((t) => (t.id === todo.id ? { ...t, completed: updatedStatus } : t))
    );

    try {
      const res = await api.updateTodo(todo.id, { completed: updatedStatus });
      if (res && res.data) {
        setTodos((prev) =>
          prev.map((t) => (t.id === todo.id ? res.data : t))
        );
      }
    } catch (err) {
      // Revert on error
      setTodos((prev) =>
        prev.map((t) => (t.id === todo.id ? { ...t, completed: todo.completed } : t))
      );
      showNotification('Failed to update task status.', 'error');
    }
  };

  // Update Todo details
  const handleUpdateTodo = async (id, updateData) => {
    try {
      const res = await api.updateTodo(id, updateData);
      if (res && res.data) {
        setTodos((prev) => prev.map((t) => (t.id === id ? res.data : t)));
        showNotification('Task updated successfully!', 'success');
      }
    } catch (err) {
      showNotification(err.message || 'Failed to update task.', 'error');
      throw err;
    }
  };

  // Delete Todo
  const handleDeleteTodo = async (id) => {
    // Optimistic delete
    const previousTodos = todos;
    setTodos((prev) => prev.filter((t) => t.id !== id));

    try {
      await api.deleteTodo(id);
      showNotification('Task deleted successfully!', 'info');
    } catch (err) {
      // Revert if error
      setTodos(previousTodos);
      showNotification(err.message || 'Failed to delete task.', 'error');
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-brand">
          <div className="brand-icon">✓</div>
          <div>
            <h1>DevOps Task Manager</h1>
            <p className="subtitle">React Frontend + Express API + Dockerized MongoDB</p>
          </div>
        </div>

        <div className="backend-indicator">
          {backendStatus.checked && (
            <span className={`status-pill ${backendStatus.online ? 'status-online' : 'status-offline'}`}>
              <span className="status-dot"></span>
              {backendStatus.online ? 'Backend Connected' : 'Backend Offline'}
            </span>
          )}
          <span className="tech-badge">MongoDB / Node / React</span>
        </div>
      </header>

      {feedback && (
        <div className={`feedback-alert alert-${feedback.type}`} role="status">
          <span>{feedback.message}</span>
          <button
            type="button"
            className="alert-close"
            onClick={() => setFeedback(null)}
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      )}

      <main className="app-main">
        <TodoStats todos={todos} />
        <TodoForm onAddTodo={handleAddTodo} isSubmitting={isSubmitting} />
        <TodoList
          todos={todos}
          onToggleComplete={handleToggleComplete}
          onUpdate={handleUpdateTodo}
          onDelete={handleDeleteTodo}
          isLoading={isLoading}
        />
      </main>

      <footer className="app-footer">
        <p>CI/CD DevOps Project 1 • Fully decoupled Full-Stack Architecture</p>
      </footer>
    </div>
  );
}
