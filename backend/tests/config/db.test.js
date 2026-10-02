const mongoose = require('mongoose');
const connectDB = require('../../src/config/db');

jest.mock('mongoose', () => ({
  connect: jest.fn(),
}));

describe('Database Connection (connectDB) Edge Cases', () => {
  let originalEnv;
  let consoleLogSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    originalEnv = process.env.MONGODB_URI;
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.MONGODB_URI = originalEnv;
    jest.useRealTimers();
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  test('should connect successfully using default URI when MONGODB_URI is not set', async () => {
    delete process.env.MONGODB_URI;
    mongoose.connect.mockResolvedValueOnce({
      connection: { host: '127.0.0.1' },
    });

    await connectDB();

    expect(mongoose.connect).toHaveBeenCalledWith('mongodb://localhost:27017/todos_db', {
      serverSelectionTimeoutMS: 5000,
    });
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('[MongoDB] Connected successfully: 127.0.0.1')
    );
  });

  test('should connect successfully using custom MONGODB_URI when provided in environment', async () => {
    process.env.MONGODB_URI = 'mongodb://user:pass@mongo-host:27017/prod_db';
    mongoose.connect.mockResolvedValueOnce({
      connection: { host: 'mongo-host' },
    });

    await connectDB();

    expect(mongoose.connect).toHaveBeenCalledWith(
      'mongodb://user:pass@mongo-host:27017/prod_db',
      { serverSelectionTimeoutMS: 5000 }
    );
  });

  test('should handle connection error and schedule a retry in 5 seconds', async () => {
    delete process.env.MONGODB_URI;
    const dbError = new Error('Connection refused to mongo:27017');
    mongoose.connect.mockRejectedValueOnce(dbError);

    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

    await connectDB();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[MongoDB] Error: Connection refused to mongo:27017')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('[MongoDB] Retrying connection in 5 seconds...')
    );
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 5000);
  });
});
