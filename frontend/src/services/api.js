const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/todos';

export const api = {
  // Get all todos with optional filters
  async getTodos(filters = {}) {
    const params = new URLSearchParams();
    if (filters.completed !== undefined && filters.completed !== 'all') {
      params.append('completed', filters.completed);
    }
    if (filters.search) {
      params.append('search', filters.search);
    }
    if (filters.priority && filters.priority !== 'all') {
      params.append('priority', filters.priority);
    }

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE_URL}${queryString}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to fetch tasks (HTTP ${res.status})`);
    }
    return res.json();
  },

  // Get a single todo
  async getTodoById(id) {
    const res = await fetch(`${API_BASE_URL}/${id}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to fetch task (HTTP ${res.status})`);
    }
    return res.json();
  },

  // Create a new todo
  async createTodo(todoData) {
    const res = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(todoData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to create task (HTTP ${res.status})`);
    }
    return res.json();
  },

  // Update a todo
  async updateTodo(id, updateData) {
    const res = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to update task (HTTP ${res.status})`);
    }
    return res.json();
  },

  // Delete a todo
  async deleteTodo(id) {
    const res = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to delete task (HTTP ${res.status})`);
    }
    return res.json();
  },

  // Backend healthcheck
  async checkHealth() {
    try {
      const healthUrl = API_BASE_URL.replace(/\/todos\/?$/, '/health');
      const res = await fetch(healthUrl);
      return res.ok;
    } catch {
      return false;
    }
  },
};
