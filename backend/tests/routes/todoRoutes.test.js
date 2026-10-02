const request = require('supertest');
const app = require('../../src/app');
const Todo = require('../../src/models/Todo');

jest.mock('../../src/models/Todo');

describe('Todo Routes & Middleware Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Health Check Endpoint (GET /api/health)', () => {
    test('should return 200 with status UP and uptime', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('UP');
      expect(typeof res.body.uptime).toBe('number');
      expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);
    });
  });

  describe('404 Route Handler', () => {
    test('should return 404 for undefined routes', async () => {
      const res = await request(app).get('/api/does-not-exist');

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        success: false,
        message: 'Not Found - /api/does-not-exist',
      });
    });

    test('should return 404 for unsupported HTTP methods on valid endpoints', async () => {
      const res = await request(app).patch('/api/todos');
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/todos', () => {
    test('should return 200 with todos list', async () => {
      const mockList = [
        { id: '1', title: 'Task 1', completed: false },
        { id: '2', title: 'Task 2', completed: true },
      ];
      Todo.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockList),
      });

      const res = await request(app).get('/api/todos');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.data).toEqual(mockList);
    });
  });

  describe('POST /api/todos Edge Cases', () => {
    test('should return 400 when title is missing in request body', async () => {
      const res = await request(app)
        .post('/api/todos')
        .send({ description: 'No title provided' });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        success: false,
        message: 'Please provide a todo title',
      });
    });

    test('should return 400 when title consists only of spaces', async () => {
      const res = await request(app)
        .post('/api/todos')
        .send({ title: '    ' });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        success: false,
        message: 'Please provide a todo title',
      });
    });

    test('should return 400 when request body is empty object', async () => {
      const res = await request(app).post('/api/todos').send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('should create todo and return 201 on valid body', async () => {
      const newTodo = {
        id: '60d0fe4f5311236168a109ca',
        title: 'New Integration Todo',
        description: '',
        completed: false,
        priority: 'medium',
        dueDate: null,
      };
      Todo.create.mockResolvedValue(newTodo);

      const res = await request(app)
        .post('/api/todos')
        .send({ title: 'New Integration Todo' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('New Integration Todo');
    });
  });

  describe('Mongoose Error Handling Middleware Edge Cases', () => {
    test('should handle CastError (invalid ObjectId) and return 400', async () => {
      const castError = new Error('Cast to ObjectId failed');
      castError.name = 'CastError';
      castError.value = 'invalid-mongo-id-123';

      Todo.findById.mockRejectedValue(castError);

      const res = await request(app).get('/api/todos/invalid-mongo-id-123');

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        success: false,
        message: 'Invalid Resource ID: invalid-mongo-id-123',
      });
    });

    test('should handle ValidationError and return 400 with formatted messages', async () => {
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      validationError.errors = {
        priority: { message: '`urgent` is not a valid enum value for path `priority`.' },
        title: { message: 'Title cannot exceed 150 characters' },
      };

      Todo.create.mockRejectedValue(validationError);

      const res = await request(app)
        .post('/api/todos')
        .send({ title: 'Valid Title Here', priority: 'urgent' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('`urgent` is not a valid enum value');
      expect(res.body.message).toContain('Title cannot exceed 150 characters');
    });

    test('should handle unexpected server errors with 500 status', async () => {
      const unexpectedError = new Error('Something went catastrophically wrong');
      Todo.find.mockImplementation(() => {
        throw unexpectedError;
      });

      const res = await request(app).get('/api/todos');

      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        success: false,
        message: 'Something went catastrophically wrong',
      });
    });
  });
});
