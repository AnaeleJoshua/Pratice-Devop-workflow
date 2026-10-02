const mongoose = require('mongoose');
const Todo = require('../../src/models/Todo');

describe('Todo Model Edge Cases & Validation', () => {
  describe('Schema Validations', () => {
    test('should validate a valid todo with required fields and defaults', () => {
      const todo = new Todo({
        title: 'Learn DevOps',
      });

      const validationError = todo.validateSync();
      expect(validationError).toBeUndefined();
      expect(todo.title).toBe('Learn DevOps');
      expect(todo.description).toBe('');
      expect(todo.completed).toBe(false);
      expect(todo.priority).toBe('medium');
      expect(todo.dueDate).toBeNull();
    });

    test('should fail validation when title is missing', () => {
      const todo = new Todo({});
      const validationError = todo.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError.errors.title).toBeDefined();
      expect(validationError.errors.title.message).toBe('Title is required');
    });

    test('should fail validation when title is empty string', () => {
      const todo = new Todo({ title: '' });
      const validationError = todo.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError.errors.title).toBeDefined();
    });

    test('should trim whitespace from title and fail if resulting title is empty', () => {
      const todo = new Todo({ title: '     ' });
      const validationError = todo.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError.errors.title).toBeDefined();
    });

    test('should successfully trim surrounding whitespace from title', () => {
      const todo = new Todo({ title: '   Trimmed Title   ' });
      expect(todo.title).toBe('Trimmed Title');
      const validationError = todo.validateSync();
      expect(validationError).toBeUndefined();
    });

    test('should allow title at exact max length (150 chars)', () => {
      const maxTitle = 'a'.repeat(150);
      const todo = new Todo({ title: maxTitle });
      const validationError = todo.validateSync();
      expect(validationError).toBeUndefined();
      expect(todo.title.length).toBe(150);
    });

    test('should fail validation when title exceeds 150 chars (151 chars)', () => {
      const tooLongTitle = 'a'.repeat(151);
      const todo = new Todo({ title: tooLongTitle });
      const validationError = todo.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError.errors.title).toBeDefined();
      expect(validationError.errors.title.message).toBe('Title cannot exceed 150 characters');
    });

    test('should trim whitespace from description', () => {
      const todo = new Todo({
        title: 'Task',
        description: '   Some spaced description   ',
      });
      expect(todo.description).toBe('Some spaced description');
    });

    test('should allow description at exact max length (1000 chars)', () => {
      const maxDesc = 'b'.repeat(1000);
      const todo = new Todo({ title: 'Task', description: maxDesc });
      const validationError = todo.validateSync();
      expect(validationError).toBeUndefined();
    });

    test('should fail validation when description exceeds 1000 chars (1001 chars)', () => {
      const tooLongDesc = 'b'.repeat(1001);
      const todo = new Todo({ title: 'Task', description: tooLongDesc });
      const validationError = todo.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError.errors.description).toBeDefined();
      expect(validationError.errors.description.message).toBe('Description cannot exceed 1000 characters');
    });

    test('should accept valid priority enum values: low, medium, high', () => {
      ['low', 'medium', 'high'].forEach((priority) => {
        const todo = new Todo({ title: 'Task', priority });
        const validationError = todo.validateSync();
        expect(validationError).toBeUndefined();
        expect(todo.priority).toBe(priority);
      });
    });

    test('should reject invalid priority values', () => {
      const invalidPriorities = ['urgent', 'critical', 'LOW', 'High', 'none', '', 123];
      invalidPriorities.forEach((priority) => {
        const todo = new Todo({ title: 'Task', priority });
        const validationError = todo.validateSync();
        expect(validationError).toBeDefined();
        expect(validationError.errors.priority).toBeDefined();
      });
    });

    test('should accept valid Date objects or ISO strings for dueDate', () => {
      const validDate = new Date('2026-12-31T23:59:59.000Z');
      const todo = new Todo({ title: 'Task', dueDate: validDate });
      const validationError = todo.validateSync();
      expect(validationError).toBeUndefined();
      expect(todo.dueDate.toISOString()).toBe(validDate.toISOString());
    });

    test('should fail validation when dueDate is an invalid date string', () => {
      const todo = new Todo({ title: 'Task', dueDate: 'invalid-date-string' });
      const validationError = todo.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError.errors.dueDate).toBeDefined();
    });

    test('should accept boolean for completed and cast standard truthy/falsy values', () => {
      const todoTrue = new Todo({ title: 'Task', completed: true });
      expect(todoTrue.completed).toBe(true);

      const todoFalse = new Todo({ title: 'Task', completed: false });
      expect(todoFalse.completed).toBe(false);
    });
  });

  describe('toJSON Serialization Transformation', () => {
    test('should map _id to id and remove _id and __v on toJSON', () => {
      const rawId = new mongoose.Types.ObjectId();
      const todo = new Todo({
        _id: rawId,
        title: 'Serializing Task',
        priority: 'high',
      });

      const json = todo.toJSON();
      expect(json.id).toBeDefined();
      expect(json.id.toString()).toBe(rawId.toString());
      expect(json._id).toBeUndefined();
      expect(json.__v).toBeUndefined();
    });
  });
});
