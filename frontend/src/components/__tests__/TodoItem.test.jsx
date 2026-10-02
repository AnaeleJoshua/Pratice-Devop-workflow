import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import TodoItem from '../TodoItem';

describe('TodoItem Component Edge Cases', () => {
  const sampleTodo = {
    id: 'todo-123',
    title: 'Configure Prometheus',
    description: 'Setup metrics scrape target',
    completed: false,
    priority: 'high',
    dueDate: '2026-11-20T00:00:00.000Z',
    createdAt: '2026-10-01T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('should render todo details, badges, and initial state accurately', () => {
    render(
      <TodoItem
        todo={sampleTodo}
        onToggleComplete={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText('Configure Prometheus')).toBeInTheDocument();
    expect(screen.getByText('Setup metrics scrape target')).toBeInTheDocument();
    expect(screen.getByText('high')).toHaveClass('badge-high');
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  test('should render completed state with checkbox checked and parent card class', () => {
    const completedTodo = { ...sampleTodo, completed: true };
    render(
      <TodoItem
        todo={completedTodo}
        onToggleComplete={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByRole('checkbox')).toBeChecked();
    const listItem = screen.getByRole('listitem');
    expect(listItem).toHaveClass('completed');
  });

  test('should trigger onToggleComplete with current todo object when checkbox is clicked', () => {
    const onToggleMock = vi.fn();
    render(
      <TodoItem
        todo={sampleTodo}
        onToggleComplete={onToggleMock}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(onToggleMock).toHaveBeenCalledWith(sampleTodo);
  });

  test('should handle null description and null dueDate gracefully without crashing or rendering empty badges', () => {
    const minimalTodo = {
      id: 'minimal-1',
      title: 'Minimal Task',
      description: null,
      completed: false,
      priority: 'low',
      dueDate: null,
      createdAt: '2026-10-01T00:00:00.000Z',
    };

    render(
      <TodoItem
        todo={minimalTodo}
        onToggleComplete={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText('Minimal Task')).toBeInTheDocument();
    expect(screen.queryByText(/📅/)).not.toBeInTheDocument();
  });

  test('should enter edit mode when edit button is clicked and allow canceling', async () => {
    render(
      <TodoItem
        todo={sampleTodo}
        onToggleComplete={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const editBtn = screen.getByRole('button', { name: /edit "Configure Prometheus"/i });
    fireEvent.click(editBtn);

    const editTitleInput = screen.getByLabelText('Edit title');
    expect(editTitleInput).toBeInTheDocument();
    expect(editTitleInput.value).toBe('Configure Prometheus');

    // Change title and click Cancel
    await userEvent.clear(editTitleInput);
    await userEvent.type(editTitleInput, 'Something else');

    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);

    // Should return to normal view with original title
    expect(screen.queryByLabelText('Edit title')).not.toBeInTheDocument();
    expect(screen.getByText('Configure Prometheus')).toBeInTheDocument();
  });

  test('should prevent saving edit when title is empty', async () => {
    const onUpdateMock = vi.fn();
    render(
      <TodoItem
        todo={sampleTodo}
        onToggleComplete={vi.fn()}
        onUpdate={onUpdateMock}
        onDelete={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));

    const editTitleInput = screen.getByLabelText('Edit title');
    await userEvent.clear(editTitleInput);

    const saveBtn = screen.getByRole('button', { name: /save/i });
    expect(saveBtn).toBeDisabled();

    fireEvent.submit(editTitleInput.closest('form'));
    expect(onUpdateMock).not.toHaveBeenCalled();
  });

  test('should save edited todo and call onUpdate with trimmed values', async () => {
    const onUpdateMock = vi.fn().mockResolvedValue({});
    render(
      <TodoItem
        todo={sampleTodo}
        onToggleComplete={vi.fn()}
        onUpdate={onUpdateMock}
        onDelete={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));

    const editTitleInput = screen.getByLabelText('Edit title');
    await userEvent.clear(editTitleInput);
    await userEvent.type(editTitleInput, '  Updated Prometheus Config  ');

    const saveBtn = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(onUpdateMock).toHaveBeenCalledWith('todo-123', {
        title: 'Updated Prometheus Config',
        description: 'Setup metrics scrape target',
        priority: 'high',
        dueDate: new Date(sampleTodo.dueDate).toISOString(),
      });
    });
  });

  test('should trigger delete only when user confirms prompt', async () => {
    const onDeleteMock = vi.fn().mockResolvedValue({});
    const confirmSpy = vi.spyOn(window, 'confirm');

    // Case 1: user rejects confirm
    confirmSpy.mockReturnValueOnce(false);

    render(
      <TodoItem
        todo={sampleTodo}
        onToggleComplete={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={onDeleteMock}
      />
    );

    const deleteBtn = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteBtn);

    expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete "Configure Prometheus"?');
    expect(onDeleteMock).not.toHaveBeenCalled();

    // Case 2: user confirms
    confirmSpy.mockReturnValueOnce(true);
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(onDeleteMock).toHaveBeenCalledWith('todo-123');
    });
  });
});
