const todoController = require('../../src/controllers/todoController');
const Todo = require('../../src/models/Todo');

jest.mock('../../src/models/Todo');

describe('Todo Controller Unit Tests & Edge Cases', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: {},
      params: {},
      query: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  describe('getTodos', () => {
    test('should fetch all todos without filters sorted by createdAt descending', async () => {
      const mockTodos = [
        { id: '1', title: 'Task 1', completed: false, priority: 'medium' },
        { id: '2', title: 'Task 2', completed: true, priority: 'high' },
      ];

      const sortMock = jest.fn().mockResolvedValue(mockTodos);
      Todo.find.mockReturnValue({ sort: sortMock });

      await todoController.getTodos(req, res, next);

      expect(Todo.find).toHaveBeenCalledWith({});
      expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        data: mockTodos,
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should apply completed=true boolean filter', async () => {
      req.query = { completed: 'true' };
      const sortMock = jest.fn().mockResolvedValue([]);
      Todo.find.mockReturnValue({ sort: sortMock });

      await todoController.getTodos(req, res, next);

      expect(Todo.find).toHaveBeenCalledWith({ completed: true });
    });

    test('should apply completed=false boolean filter', async () => {
      req.query = { completed: 'false' };
      const sortMock = jest.fn().mockResolvedValue([]);
      Todo.find.mockReturnValue({ sort: sortMock });

      await todoController.getTodos(req, res, next);

      expect(Todo.find).toHaveBeenCalledWith({ completed: false });
    });

    test('should apply priority filter', async () => {
      req.query = { priority: 'high' };
      const sortMock = jest.fn().mockResolvedValue([]);
      Todo.find.mockReturnValue({ sort: sortMock });

      await todoController.getTodos(req, res, next);

      expect(Todo.find).toHaveBeenCalledWith({ priority: 'high' });
    });

    test('should apply search filter across title and description using case-insensitive regex', async () => {
      req.query = { search: 'docker' };
      const sortMock = jest.fn().mockResolvedValue([]);
      Todo.find.mockReturnValue({ sort: sortMock });

      await todoController.getTodos(req, res, next);

      expect(Todo.find).toHaveBeenCalledWith({
        $or: [
          { title: { $regex: 'docker', $options: 'i' } },
          { description: { $regex: 'docker', $options: 'i' } },
        ],
      });
    });

    test('should combine multiple query filters simultaneously (completed + priority + search)', async () => {
      req.query = { completed: 'true', priority: 'low', search: 'audit' };
      const sortMock = jest.fn().mockResolvedValue([]);
      Todo.find.mockReturnValue({ sort: sortMock });

      await todoController.getTodos(req, res, next);

      expect(Todo.find).toHaveBeenCalledWith({
        completed: true,
        priority: 'low',
        $or: [
          { title: { $regex: 'audit', $options: 'i' } },
          { description: { $regex: 'audit', $options: 'i' } },
        ],
      });
    });

    test('should handle empty result set gracefully', async () => {
      const sortMock = jest.fn().mockResolvedValue([]);
      Todo.find.mockReturnValue({ sort: sortMock });

      await todoController.getTodos(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 0,
        data: [],
      });
    });

    test('should forward database errors to next middleware', async () => {
      const error = new Error('Database connection failure');
      Todo.find.mockImplementation(() => {
        throw error;
      });

      await todoController.getTodos(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getTodoById', () => {
    test('should return todo when found by id', async () => {
      const mockTodo = { id: '60d0fe4f5311236168a109ca', title: 'Existing Task' };
      req.params = { id: '60d0fe4f5311236168a109ca' };
      Todo.findById.mockResolvedValue(mockTodo);

      await todoController.getTodoById(req, res, next);

      expect(Todo.findById).toHaveBeenCalledWith('60d0fe4f5311236168a109ca');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockTodo,
      });
    });

    test('should return 404 when todo is not found', async () => {
      req.params = { id: '60d0fe4f5311236168a109cb' };
      Todo.findById.mockResolvedValue(null);

      await todoController.getTodoById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Todo not found with id of 60d0fe4f5311236168a109cb',
      });
    });

    test('should forward error to next if findById throws', async () => {
      const error = new Error('DB read error');
      req.params = { id: 'some-id' };
      Todo.findById.mockRejectedValue(error);

      await todoController.getTodoById(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('createTodo', () => {
    test('should create a new todo with trimmed fields and default values', async () => {
      req.body = {
        title: '   Deploy Service   ',
        description: '   Using Docker Compose   ',
        priority: 'high',
      };

      const mockCreatedTodo = {
        id: '123',
        title: 'Deploy Service',
        description: 'Using Docker Compose',
        completed: false,
        priority: 'high',
        dueDate: null,
      };

      Todo.create.mockResolvedValue(mockCreatedTodo);

      await todoController.createTodo(req, res, next);

      expect(Todo.create).toHaveBeenCalledWith({
        title: 'Deploy Service',
        description: 'Using Docker Compose',
        completed: false,
        priority: 'high',
        dueDate: null,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Todo created successfully',
        data: mockCreatedTodo,
      });
    });

    test('should reject creation when title is missing', async () => {
      req.body = { description: 'Missing title' };

      await todoController.createTodo(req, res, next);

      expect(Todo.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Please provide a todo title',
      });
    });

    test('should reject creation when title is only whitespace', async () => {
      req.body = { title: '     \t\n   ' };

      await todoController.createTodo(req, res, next);

      expect(Todo.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Please provide a todo title',
      });
    });

    test('should default description to empty string if undefined in request body', async () => {
      req.body = { title: 'Task without description' };
      Todo.create.mockResolvedValue({});

      await todoController.createTodo(req, res, next);

      expect(Todo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Task without description',
          description: '',
        })
      );
    });

    test('should forward error to next if Todo.create throws validation error', async () => {
      req.body = { title: 'Valid Title', priority: 'invalid-priority' };
      const validationError = new Error('Priority validation failed');
      Todo.create.mockRejectedValue(validationError);

      await todoController.createTodo(req, res, next);

      expect(next).toHaveBeenCalledWith(validationError);
    });
  });

  describe('updateTodo', () => {
    test('should update existing todo and run validators', async () => {
      req.params = { id: '60d0fe4f5311236168a109ca' };
      req.body = {
        title: '  Updated Title  ',
        completed: true,
      };

      const mockUpdatedTodo = {
        id: '60d0fe4f5311236168a109ca',
        title: 'Updated Title',
        completed: true,
      };

      Todo.findByIdAndUpdate.mockResolvedValue(mockUpdatedTodo);

      await todoController.updateTodo(req, res, next);

      expect(Todo.findByIdAndUpdate).toHaveBeenCalledWith(
        '60d0fe4f5311236168a109ca',
        { title: 'Updated Title', completed: true },
        { new: true, runValidators: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Todo updated successfully',
        data: mockUpdatedTodo,
      });
    });

    test('should return 404 if todo to update is not found', async () => {
      req.params = { id: '60d0fe4f5311236168a109cb' };
      req.body = { completed: true };
      Todo.findByIdAndUpdate.mockResolvedValue(null);

      await todoController.updateTodo(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Todo not found with id of 60d0fe4f5311236168a109cb',
      });
    });

    test('should only populate fields in updateFields that were explicitly provided', async () => {
      req.params = { id: '123' };
      req.body = { priority: 'low' }; // title, description, completed, dueDate omitted

      Todo.findByIdAndUpdate.mockResolvedValue({ id: '123', priority: 'low' });

      await todoController.updateTodo(req, res, next);

      expect(Todo.findByIdAndUpdate).toHaveBeenCalledWith(
        '123',
        { priority: 'low' },
        { new: true, runValidators: true }
      );
    });

    test('should forward error to next if update throws', async () => {
      req.params = { id: '123' };
      req.body = { title: 'Test' };
      const error = new Error('Database error during update');
      Todo.findByIdAndUpdate.mockRejectedValue(error);

      await todoController.updateTodo(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteTodo', () => {
    test('should delete todo when found', async () => {
      req.params = { id: '60d0fe4f5311236168a109ca' };
      Todo.findByIdAndDelete.mockResolvedValue({ id: '60d0fe4f5311236168a109ca' });

      await todoController.deleteTodo(req, res, next);

      expect(Todo.findByIdAndDelete).toHaveBeenCalledWith('60d0fe4f5311236168a109ca');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Todo deleted successfully',
        data: { id: '60d0fe4f5311236168a109ca' },
      });
    });

    test('should return 404 when deleting a non-existent todo', async () => {
      req.params = { id: '60d0fe4f5311236168a109cb' };
      Todo.findByIdAndDelete.mockResolvedValue(null);

      await todoController.deleteTodo(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Todo not found with id of 60d0fe4f5311236168a109cb',
      });
    });

    test('should forward error to next if findByIdAndDelete throws', async () => {
      req.params = { id: '60d0fe4f5311236168a109ca' };
      const error = new Error('Database error during delete');
      Todo.findByIdAndDelete.mockRejectedValue(error);

      await todoController.deleteTodo(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
