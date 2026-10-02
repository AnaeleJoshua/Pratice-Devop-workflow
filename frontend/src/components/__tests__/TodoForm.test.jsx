import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi } from 'vitest';
import TodoForm from '../TodoForm';

describe('TodoForm Component Edge Cases', () => {
  test('should render collapsed form initially without extended fields', () => {
    render(<TodoForm onAddTodo={vi.fn()} isSubmitting={false} />);

    expect(screen.getByPlaceholderText('What needs to be done?')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Add extra notes or description (optional)...')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Priority:')).not.toBeInTheDocument();
  });

  test('should expand extended fields when title input is focused', async () => {
    render(<TodoForm onAddTodo={vi.fn()} isSubmitting={false} />);
    const titleInput = screen.getByPlaceholderText('What needs to be done?');

    fireEvent.focus(titleInput);

    expect(screen.getByPlaceholderText('Add extra notes or description (optional)...')).toBeInTheDocument();
    expect(screen.getByLabelText('Priority:')).toBeInTheDocument();
    expect(screen.getByLabelText('Due Date:')).toBeInTheDocument();
  });

  test('should prevent submission and show error message if title is empty', async () => {
    const onAddTodoMock = vi.fn();
    render(<TodoForm onAddTodo={onAddTodoMock} isSubmitting={false} />);

    const form = screen.getByPlaceholderText('What needs to be done?').closest('form');
    fireEvent.submit(form);

    expect(onAddTodoMock).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Task title cannot be empty.');
  });

  test('should prevent submission when title contains only whitespace characters', async () => {
    const onAddTodoMock = vi.fn();
    render(<TodoForm onAddTodo={onAddTodoMock} isSubmitting={false} />);

    const titleInput = screen.getByPlaceholderText('What needs to be done?');
    await userEvent.type(titleInput, '     ');

    const form = titleInput.closest('form');
    fireEvent.submit(form);

    expect(onAddTodoMock).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Task title cannot be empty.');
  });

  test('should clear validation error when user begins typing in title', async () => {
    render(<TodoForm onAddTodo={vi.fn()} isSubmitting={false} />);

    const titleInput = screen.getByPlaceholderText('What needs to be done?');
    const form = titleInput.closest('form');
    fireEvent.submit(form);

    expect(screen.getByRole('alert')).toBeInTheDocument();

    await userEvent.type(titleInput, 'A');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('should submit successfully with trimmed title, trimmed description, and null dueDate when omitted', async () => {
    const onAddTodoMock = vi.fn().mockResolvedValue({});
    render(<TodoForm onAddTodo={onAddTodoMock} isSubmitting={false} />);

    const titleInput = screen.getByPlaceholderText('What needs to be done?');
    fireEvent.focus(titleInput);

    await userEvent.type(titleInput, '  Deploy to Kubernetes  ');

    const descInput = screen.getByPlaceholderText('Add extra notes or description (optional)...');
    await userEvent.type(descInput, '  Using Helm charts  ');

    const submitBtn = screen.getByRole('button', { name: /add task/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onAddTodoMock).toHaveBeenCalledWith({
        title: 'Deploy to Kubernetes',
        description: 'Using Helm charts',
        priority: 'medium',
        dueDate: null,
      });
    });

    // Form resets
    expect(titleInput.value).toBe('');
  });

  test('should submit correctly with custom priority and dueDate', async () => {
    const onAddTodoMock = vi.fn().mockResolvedValue({});
    render(<TodoForm onAddTodo={onAddTodoMock} isSubmitting={false} />);

    const titleInput = screen.getByPlaceholderText('What needs to be done?');
    fireEvent.focus(titleInput);

    await userEvent.type(titleInput, 'Security Patch');

    const prioritySelect = screen.getByLabelText('Priority:');
    fireEvent.change(prioritySelect, { target: { value: 'high' } });

    const dateInput = screen.getByLabelText('Due Date:');
    fireEvent.change(dateInput, { target: { value: '2026-10-15' } });

    const submitBtn = screen.getByRole('button', { name: /add task/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onAddTodoMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Security Patch',
          priority: 'high',
          dueDate: new Date('2026-10-15').toISOString(),
        })
      );
    });
  });

  test('should disable button and display "Adding..." when isSubmitting is true', () => {
    render(<TodoForm onAddTodo={vi.fn()} isSubmitting={true} />);

    const submitBtn = screen.getByRole('button');
    expect(submitBtn).toBeDisabled();
    expect(submitBtn).toHaveTextContent('Adding...');
  });

  test('should allow collapsing extended fields via Collapse button', async () => {
    render(<TodoForm onAddTodo={vi.fn()} isSubmitting={false} />);

    const titleInput = screen.getByPlaceholderText('What needs to be done?');
    fireEvent.focus(titleInput);

    const collapseBtn = screen.getByRole('button', { name: /collapse/i });
    fireEvent.click(collapseBtn);

    expect(screen.queryByPlaceholderText('Add extra notes or description (optional)...')).not.toBeInTheDocument();
  });
});
