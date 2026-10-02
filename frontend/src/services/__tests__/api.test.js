import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { api } from '../api';

const BASE_URL = import.meta.env.VITE_API_URL || '/api/todos';
const HEALTH_URL = BASE_URL.replace(/\/todos\/?$/, '/health');

describe('Frontend API Service Edge Cases', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getTodos', () => {
    test('should fetch todos with no parameters when filters are empty', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, count: 0, data: [] }),
      });

      const res = await api.getTodos();

      expect(fetch).toHaveBeenCalledWith(BASE_URL);
      expect(res.data).toEqual([]);
    });

    test('should construct query params correctly for completed, priority, and search', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, count: 1, data: [{ id: '1' }] }),
      });

      await api.getTodos({ completed: true, priority: 'high', search: 'ci pipeline' });

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}?completed=true&search=ci+pipeline&priority=high`
      );
    });

    test('should ignore "all" filter values for completed and priority', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });

      await api.getTodos({ completed: 'all', priority: 'all' });

      expect(fetch).toHaveBeenCalledWith(BASE_URL);
    });

    test('should throw meaningful error message when server responds with error status', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Database connection failed' }),
      });

      await expect(api.getTodos()).rejects.toThrow('Database connection failed');
    });

    test('should fall back to HTTP status message if error response is not JSON or has no message', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => {
          throw new Error('Not JSON');
        },
      });

      await expect(api.getTodos()).rejects.toThrow('Failed to fetch tasks (HTTP 503)');
    });
  });

  describe('getTodoById', () => {
    test('should return todo on 200 OK', async () => {
      const mockTodo = { id: '123', title: 'Task 1' };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockTodo }),
      });

      const res = await api.getTodoById('123');

      expect(fetch).toHaveBeenCalledWith(`${BASE_URL}/123`);
      expect(res.data).toEqual(mockTodo);
    });

    test('should throw error when todo not found (404)', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Todo not found' }),
      });

      await expect(api.getTodoById('999')).rejects.toThrow('Todo not found');
    });
  });

  describe('createTodo', () => {
    test('should send POST request with JSON stringified payload', async () => {
      const payload = { title: 'Dockerize App', priority: 'high' };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { id: '456', ...payload } }),
      });

      const res = await api.createTodo(payload);

      expect(fetch).toHaveBeenCalledWith(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      expect(res.data.title).toBe('Dockerize App');
    });

    test('should throw error when creation fails with 400', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Please provide a todo title' }),
      });

      await expect(api.createTodo({})).rejects.toThrow('Please provide a todo title');
    });
  });

  describe('updateTodo', () => {
    test('should send PUT request to the item ID with updated data', async () => {
      const updateData = { completed: true };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { id: '123', completed: true } }),
      });

      await api.updateTodo('123', updateData);

      expect(fetch).toHaveBeenCalledWith(`${BASE_URL}/123`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
    });

    test('should throw error when updating fails', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Invalid data' }),
      });

      await expect(api.updateTodo('123', { priority: 'invalid' })).rejects.toThrow(
        'Invalid data'
      );
    });
  });

  describe('deleteTodo', () => {
    test('should send DELETE request to endpoint', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { id: '123' } }),
      });

      const res = await api.deleteTodo('123');

      expect(fetch).toHaveBeenCalledWith(`${BASE_URL}/123`, { method: 'DELETE' });
      expect(res.data.id).toBe('123');
    });

    test('should throw error on delete failure', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Todo not found' }),
      });

      await expect(api.deleteTodo('123')).rejects.toThrow('Todo not found');
    });
  });

  describe('checkHealth', () => {
    test('should return true when healthcheck responds 200 OK', async () => {
      fetch.mockResolvedValueOnce({ ok: true });

      const isHealthy = await api.checkHealth();

      expect(fetch).toHaveBeenCalledWith(HEALTH_URL);
      expect(isHealthy).toBe(true);
    });

    test('should return false when healthcheck responds with error status', async () => {
      fetch.mockResolvedValueOnce({ ok: false, status: 503 });

      const isHealthy = await api.checkHealth();

      expect(isHealthy).toBe(false);
    });

    test('should return false when fetch throws network error', async () => {
      fetch.mockRejectedValueOnce(new Error('Network offline'));

      const isHealthy = await api.checkHealth();

      expect(isHealthy).toBe(false);
    });
  });
});
