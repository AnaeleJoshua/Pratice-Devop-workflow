import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import App from '../App';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    getTodos: vi.fn(),
    checkHealth: vi.fn(),
    createTodo: vi.fn(),
    updateTodo: vi.fn(),
    deleteTodo: vi.fn(),
  },
}));

describe('App Root Component Integration & Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should load todos on mount and display connected status when backend is healthy', async () => {
    api.getTodos.mockResolvedValueOnce({
      success: true,
      data: [
        {
          id: '1',
          title: 'Initial App Task',
          completed: false,
          priority: 'medium',
        },
      ],
    });
    api.checkHealth.mockResolvedValueOnce(true);

    render(<App />);

    expect(screen.getByText('Loading your tasks...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Initial App Task')).toBeInTheDocument();
      expect(screen.getByText('Backend Connected')).toBeInTheDocument();
    });
  });

  test('should display backend offline indicator and notification when loadTodos fails', async () => {
    api.getTodos.mockRejectedValueOnce(new Error('Connection refused'));
    api.checkHealth.mockResolvedValueOnce(false);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Backend Offline')).toBeInTheDocument();
      expect(
        screen.getByText(/Cannot connect to backend server/i)
      ).toBeInTheDocument();
    });
  });

  test('should add new task and show success notification banner', async () => {
    api.getTodos.mockResolvedValueOnce({ success: true, data: [] });
    api.checkHealth.mockResolvedValueOnce(true);

    const createdItem = {
      id: '99',
      title: 'New App Level Task',
      completed: false,
      priority: 'high',
    };
    api.createTodo.mockResolvedValueOnce({
      success: true,
      data: createdItem,
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('DevOps Task Manager')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('What needs to be done?');
    await userEvent.type(input, 'New App Level Task');

    const addBtn = screen.getByRole('button', { name: /add task/i });
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(api.createTodo).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'New App Level Task' })
      );
      expect(screen.getByText('Task created successfully!')).toBeInTheDocument();
      expect(screen.getByText('New App Level Task')).toBeInTheDocument();
    });
  });

  test('should handle optimistic toggle and revert state when updateTodo fails', async () => {
    const existingTodo = {
      id: 'task-1',
      title: 'Rollback Task Test',
      completed: false,
      priority: 'medium',
    };

    api.getTodos.mockResolvedValueOnce({ success: true, data: [existingTodo] });
    api.checkHealth.mockResolvedValueOnce(true);
    api.updateTodo.mockRejectedValueOnce(new Error('Network error on update'));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Rollback Task Test')).toBeInTheDocument();
    });

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();

    // Click checkbox to toggle
    fireEvent.click(checkbox);

    // After failure, state reverts and error alert shows
    await waitFor(() => {
      expect(screen.getByText('Failed to update task status.')).toBeInTheDocument();
      expect(checkbox).not.toBeChecked();
    });
  });

  test('should handle optimistic delete and revert state when deleteTodo fails', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const existingTodo = {
      id: 'task-del-1',
      title: 'Task To Delete',
      completed: false,
      priority: 'low',
    };

    api.getTodos.mockResolvedValueOnce({ success: true, data: [existingTodo] });
    api.checkHealth.mockResolvedValueOnce(true);
    api.deleteTodo.mockRejectedValueOnce(new Error('Deletion failed on server'));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Task To Delete')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByRole('button', { name: /delete "Task To Delete"/i });
    fireEvent.click(deleteBtn);

    // After failure, error notification shows and item is restored
    await waitFor(() => {
      expect(screen.getByText('Deletion failed on server')).toBeInTheDocument();
      expect(screen.getByText('Task To Delete')).toBeInTheDocument();
    });
  });

  test('should allow manually dismissing feedback notification banner', async () => {
    api.getTodos.mockRejectedValueOnce(new Error('Connection error'));
    api.checkHealth.mockResolvedValueOnce(false);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    const closeBtn = screen.getByRole('button', { name: /dismiss notification/i });
    fireEvent.click(closeBtn);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
