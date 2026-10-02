import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import TodoStats from '../TodoStats';

describe('TodoStats Edge Cases', () => {
  test('should safely handle empty todos list without NaN or division by zero errors', () => {
    render(<TodoStats todos={[]} />);

    expect(screen.getByText('Total Tasks').nextElementSibling.textContent).toBe('0');
    expect(screen.getByText('In Progress').nextElementSibling.textContent).toBe('0');
    expect(screen.getByText('Completed').nextElementSibling.textContent).toBe('0');
    expect(screen.getByText('0%')).toBeInTheDocument();

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '0');
    expect(progressBar.style.width).toBe('0%');
  });

  test('should display 100% completion when all tasks are completed', () => {
    const todos = [
      { id: '1', completed: true },
      { id: '2', completed: true },
      { id: '3', completed: true },
    ];

    render(<TodoStats todos={todos} />);

    expect(screen.getByText('Total Tasks').nextElementSibling.textContent).toBe('3');
    expect(screen.getByText('In Progress').nextElementSibling.textContent).toBe('0');
    expect(screen.getByText('Completed').nextElementSibling.textContent).toBe('3');
    expect(screen.getByText('100%')).toBeInTheDocument();

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar.style.width).toBe('100%');
  });

  test('should display 0% completion when tasks exist but none are completed', () => {
    const todos = [
      { id: '1', completed: false },
      { id: '2', completed: false },
    ];

    render(<TodoStats todos={todos} />);

    expect(screen.getByText('Total Tasks').nextElementSibling.textContent).toBe('2');
    expect(screen.getByText('In Progress').nextElementSibling.textContent).toBe('2');
    expect(screen.getByText('Completed').nextElementSibling.textContent).toBe('0');
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  test('should accurately round completion percentage for repeating fractions', () => {
    // 1 / 3 = 33.333% -> 33%
    const todos = [
      { id: '1', completed: true },
      { id: '2', completed: false },
      { id: '3', completed: false },
    ];

    const { rerender } = render(<TodoStats todos={todos} />);
    expect(screen.getByText('33%')).toBeInTheDocument();

    // 2 / 3 = 66.666% -> 67%
    const todos2 = [
      { id: '1', completed: true },
      { id: '2', completed: true },
      { id: '3', completed: false },
    ];

    rerender(<TodoStats todos={todos2} />);
    expect(screen.getByText('67%')).toBeInTheDocument();
  });
});
