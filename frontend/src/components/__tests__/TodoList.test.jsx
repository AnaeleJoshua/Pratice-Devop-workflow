import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi } from 'vitest';
import TodoList from '../TodoList';

describe('TodoList Component Edge Cases', () => {
  const sampleTodos = [
    {
      id: '1',
      title: 'Docker build backend',
      description: 'Create multi-stage Dockerfile',
      completed: false,
      priority: 'high',
    },
    {
      id: '2',
      title: 'Setup Nginx frontend',
      description: 'Configure reverse proxy pass',
      completed: true,
      priority: 'medium',
    },
    {
      id: '3',
      title: 'Mongo volume setup',
      description: 'Ensure data persistence',
      completed: false,
      priority: 'low',
    },
  ];

  test('should display loading spinner when isLoading is true', () => {
    render(
      <TodoList
        todos={[]}
        onToggleComplete={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        isLoading={true}
      />
    );

    expect(screen.getByText('Loading your tasks...')).toBeInTheDocument();
    expect(screen.queryByText('No tasks yet')).not.toBeInTheDocument();
  });

  test('should display initial empty state when todos is empty array and not loading', () => {
    render(
      <TodoList
        todos={[]}
        onToggleComplete={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        isLoading={false}
      />
    );

    expect(screen.getByText('No tasks yet')).toBeInTheDocument();
    expect(screen.getByText(/type a task in the box above to get organized/i)).toBeInTheDocument();
  });

  test('should render all items by default', () => {
    render(
      <TodoList
        todos={sampleTodos}
        onToggleComplete={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        isLoading={false}
      />
    );

    expect(screen.getByText('Docker build backend')).toBeInTheDocument();
    expect(screen.getByText('Setup Nginx frontend')).toBeInTheDocument();
    expect(screen.getByText('Mongo volume setup')).toBeInTheDocument();
  });

  test('should filter by active status tab', () => {
    render(
      <TodoList
        todos={sampleTodos}
        onToggleComplete={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        isLoading={false}
      />
    );

    const activeTab = screen.getByRole('tab', { name: 'Active' });
    fireEvent.click(activeTab);

    expect(screen.getByText('Docker build backend')).toBeInTheDocument();
    expect(screen.getByText('Mongo volume setup')).toBeInTheDocument();
    expect(screen.queryByText('Setup Nginx frontend')).not.toBeInTheDocument();
  });

  test('should filter by completed status tab', () => {
    render(
      <TodoList
        todos={sampleTodos}
        onToggleComplete={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        isLoading={false}
      />
    );

    const completedTab = screen.getByRole('tab', { name: 'Completed' });
    fireEvent.click(completedTab);

    expect(screen.getByText('Setup Nginx frontend')).toBeInTheDocument();
    expect(screen.queryByText('Docker build backend')).not.toBeInTheDocument();
    expect(screen.queryByText('Mongo volume setup')).not.toBeInTheDocument();
  });

  test('should filter by priority select dropdown', () => {
    render(
      <TodoList
        todos={sampleTodos}
        onToggleComplete={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        isLoading={false}
      />
    );

    const prioritySelect = screen.getByLabelText('Filter by priority');
    fireEvent.change(prioritySelect, { target: { value: 'low' } });

    expect(screen.getByText('Mongo volume setup')).toBeInTheDocument();
    expect(screen.queryByText('Docker build backend')).not.toBeInTheDocument();
    expect(screen.queryByText('Setup Nginx frontend')).not.toBeInTheDocument();
  });

  test('should filter by search query matching either title or description case-insensitively', async () => {
    render(
      <TodoList
        todos={sampleTodos}
        onToggleComplete={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        isLoading={false}
      />
    );

    const searchInput = screen.getByPlaceholderText('🔍 Search tasks...');

    // Match description "persistence" in lower/upper case
    await userEvent.type(searchInput, 'PERSISTENCE');

    expect(screen.getByText('Mongo volume setup')).toBeInTheDocument();
    expect(screen.queryByText('Docker build backend')).not.toBeInTheDocument();
    expect(screen.queryByText('Setup Nginx frontend')).not.toBeInTheDocument();
  });

  test('should show empty search state with Reset Filters button when no items match filters', async () => {
    render(
      <TodoList
        todos={sampleTodos}
        onToggleComplete={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        isLoading={false}
      />
    );

    const searchInput = screen.getByPlaceholderText('🔍 Search tasks...');
    await userEvent.type(searchInput, 'non-existent query keyword');

    expect(screen.getByText('No matching tasks found')).toBeInTheDocument();
    const resetBtn = screen.getByRole('button', { name: /reset filters/i });
    expect(resetBtn).toBeInTheDocument();

    // Clicking reset restores list and clears search
    fireEvent.click(resetBtn);

    expect(screen.queryByText('No matching tasks found')).not.toBeInTheDocument();
    expect(screen.getByText('Docker build backend')).toBeInTheDocument();
    expect(searchInput.value).toBe('');
  });
});
