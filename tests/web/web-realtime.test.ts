import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { WebORM } from '../../src/web';

// Mock Appwrite client
const mockClient = {
  subscribe: jest.fn(),
  setEndpoint: jest.fn().mockReturnThis(),
  setProject: jest.fn().mockReturnThis()
};

const mockDatabases = {
  getDocument: jest.fn() as jest.MockedFunction<any>,
  listDocuments: jest.fn() as jest.MockedFunction<any>,
  createDocument: jest.fn() as jest.MockedFunction<any>,
  updateDocument: jest.fn() as jest.MockedFunction<any>,
  deleteDocument: jest.fn() as jest.MockedFunction<any>,
  getCollection: jest.fn() as jest.MockedFunction<any>
};

// Mock Appwrite modules
jest.mock('appwrite', () => ({
  Client: jest.fn(() => mockClient),
  Databases: jest.fn(() => mockDatabases),
  ID: {
    unique: () => 'test-id'
  },
  Query: {
    equal: (key: string, value: any) => `equal(${key}, ${JSON.stringify(value)})`,
    limit: (limit: number) => `limit(${limit})`,
    offset: (offset: number) => `offset(${offset})`,
    orderAsc: (field: string) => `orderAsc(${field})`,
    orderDesc: (field: string) => `orderDesc(${field})`,
    select: (fields: string[]) => `select(${JSON.stringify(fields)})`
  }
}));

describe('Web Realtime Functionality', () => {
  let orm: WebORM;
  let unsubscribeFn: ReturnType<typeof jest.fn>;

  const testSchema = {
    name: { type: 'string' as const, required: true },
    email: { type: 'string' as const, required: true },
    age: { type: 'number' as const, required: false }
  };

  const tables = [
    {
      name: 'users',
      schema: testSchema
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    unsubscribeFn = jest.fn();
    mockClient.subscribe.mockReturnValue(unsubscribeFn);
    
    // Mock collection existence for validation
    mockDatabases.getCollection.mockResolvedValue({ 
      $id: 'users',
      attributes: [],
      indexes: []
    });
    
    orm = new WebORM({
      endpoint: 'https://test.appwrite.io/v1',
      projectId: 'test-project',
      databaseId: 'test-db',
      autoValidate: false
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Realtime Listening', () => {
    it('should listen to document events', async () => {
      const db = await orm.init(tables);
      const usersTable = db.table('users');
      
      const eventHandler = jest.fn();
      const unsubscribe = (usersTable as any).listenToDocuments(eventHandler);

      expect(mockClient.subscribe).toHaveBeenCalledWith(
        'databases.test-db.collections.users.documents',
        eventHandler
      );
      expect(typeof unsubscribe).toBe('function');
    });

    it('should listen to specific document events', async () => {
      const db = await orm.init(tables);
      const usersTable = db.table('users');
      
      const eventHandler = jest.fn();
      const documentId = 'user123';
      const unsubscribe = (usersTable as any).listenToDocument(documentId, eventHandler);

      expect(mockClient.subscribe).toHaveBeenCalledWith(
        `databases.test-db.collections.users.documents.${documentId}`,
        eventHandler
      );
      expect(typeof unsubscribe).toBe('function');
    });

    it('should listen to collection events', async () => {
      const db = await orm.init(tables);
      const usersTable = db.table('users');
      
      const eventHandler = jest.fn();
      const unsubscribe = (usersTable as any).listenToCollection(eventHandler);

      expect(mockClient.subscribe).toHaveBeenCalledWith(
        'databases.test-db.collections.users',
        eventHandler
      );
      expect(typeof unsubscribe).toBe('function');
    });

    it('should listen to database events', async () => {
      const db = await orm.init(tables);
      const usersTable = db.table('users');
      
      const eventHandler = jest.fn();
      const unsubscribe = (usersTable as any).listenToDatabase(eventHandler);

      expect(mockClient.subscribe).toHaveBeenCalledWith(
        'databases.test-db',
        eventHandler
      );
      expect(typeof unsubscribe).toBe('function');
    });

    it('should listen to custom channels', async () => {
      const db = await orm.init(tables);
      const usersTable = db.table('users');
      
      const eventHandler = jest.fn();
      const customChannel = 'documents.*.update';
      const unsubscribe = (usersTable as any).listen(customChannel, eventHandler);

      expect(mockClient.subscribe).toHaveBeenCalledWith(
        `databases.test-db.collections.users.${customChannel}`,
        eventHandler
      );
      expect(typeof unsubscribe).toBe('function');
    });

    it('should handle realtime in development mode with FakeTable', async () => {
      // Create ORM in development mode
      const devOrm = new WebORM({
        endpoint: 'https://test.appwrite.io/v1',
        projectId: 'test-project',
        databaseId: 'test-db',
        development: true
      });

      const db = await devOrm.init(tables);
      const usersTable = db.table('users');
      
      const eventHandler = jest.fn();
      
      // FakeTable should handle realtime functionality without throwing
      const unsubscribe = (usersTable as any).listenToDocuments(eventHandler);
      expect(typeof unsubscribe).toBe('function');
      
      // Clean up
      unsubscribe();
      db.closeListeners();
    });
  });

  describe('Cache Management with Realtime', () => {
    it('should invalidate cache when realtime event is received', async () => {
      const db = await orm.init(tables);
      const usersTable = db.table('users');

      // Mock initial data
      mockDatabases.listDocuments.mockResolvedValueOnce({
        documents: [{ $id: '1', name: 'John', email: 'john@test.com', age: 30 }],
        total: 1
      });

      // First call should hit the database
      const result1 = await usersTable.all();
      expect(mockDatabases.listDocuments).toHaveBeenCalledTimes(1);
      expect((usersTable as any).isUpdated()).toBe(true);

      // Second call should use cache
      const result2 = await usersTable.all();
      expect(mockDatabases.listDocuments).toHaveBeenCalledTimes(1); // Still 1, used cache
      expect(result1).toEqual(result2);

      // Simulate realtime event that affects this collection
      const realtimeHandler = mockClient.subscribe.mock.calls.find((call: any) => 
        Array.isArray(call[0]) && call[0].some((channel: string) => 
          channel.includes('collections.users')
        )
      )?.[1] as ((event: any) => void) | undefined;

      if (realtimeHandler) {
        realtimeHandler({
          events: ['databases.test-db.collections.users.documents.create'],
          payload: { $id: '2', name: 'Jane', email: 'jane@test.com' }
        });
      }

      // Cache should be invalidated
      expect((usersTable as any).isUpdated()).toBe(false);

      // Mock new data for next call
      mockDatabases.listDocuments.mockResolvedValueOnce({
        documents: [
          { $id: '1', name: 'John', email: 'john@test.com', age: 30 },
          { $id: '2', name: 'Jane', email: 'jane@test.com', age: 25 }
        ],
        total: 2
      });

      // Next call should hit database again
      const result3 = await usersTable.all();
      expect(mockDatabases.listDocuments).toHaveBeenCalledTimes(2);
      expect(result3).toHaveLength(2);
      expect((usersTable as any).isUpdated()).toBe(true);
    });

    it('should not invalidate cache for unrelated events', async () => {
      const db = await orm.init(tables);
      const usersTable = db.table('users');

      // Mock initial data
      mockDatabases.listDocuments.mockResolvedValueOnce({
        documents: [{ $id: '1', name: 'John', email: 'john@test.com', age: 30 }],
        total: 1
      });

      // First call
      await usersTable.all();
      expect((usersTable as any).isUpdated()).toBe(true);

      // Simulate realtime event for different collection (not affecting users collection)
      const realtimeHandler = mockClient.subscribe.mock.calls.find((call: any) => 
        Array.isArray(call[0])
      )?.[1] as ((event: any) => void) | undefined;

      if (realtimeHandler) {
        realtimeHandler({
          events: ['databases.other-db.collections.posts.documents.create'],
          payload: { $id: '1', title: 'Test Post' }
        });
      }

      // Cache should still be valid (no invalidation for unrelated events)
      expect((usersTable as any).isUpdated()).toBe(true);

      // Second call should use cache
      await usersTable.all();
      expect(mockDatabases.listDocuments).toHaveBeenCalledTimes(1); // Still 1, used cache
    });

    it('should invalidate cache on mutations', async () => {
      const db = await orm.init(tables);
      const usersTable = db.table('users');

      // Mock initial data
      mockDatabases.listDocuments.mockResolvedValueOnce({
        documents: [{ $id: '1', name: 'John', email: 'john@test.com', age: 30 }],
        total: 1
      });

      // First call
      await usersTable.all();
      expect((usersTable as any).isUpdated()).toBe(true);

      // Mock create operation
      mockDatabases.createDocument.mockResolvedValueOnce({
        $id: '2',
        name: 'Jane',
        email: 'jane@test.com',
        age: 25
      });

      // Create operation should invalidate cache
      await usersTable.create({
        name: 'Jane',
        email: 'jane@test.com',
        age: 25
      } as any);

      expect((usersTable as any).isUpdated()).toBe(false);
    });
  });

  describe('Manual Cache Control', () => {
    it('should allow manual cache invalidation', async () => {
      const db = await orm.init(tables);
      const usersTable = db.table('users');

      // Mock data
      mockDatabases.listDocuments.mockResolvedValue({
        documents: [{ $id: '1', name: 'John', email: 'john@test.com', age: 30 }],
        total: 1
      });

      // First call
      await usersTable.all();
      expect((usersTable as any).isUpdated()).toBe(true);

      // Manually invalidate cache
      (usersTable as any).setUpdated(false);
      expect((usersTable as any).isUpdated()).toBe(false);

      // Next call should hit database
      await usersTable.all();
      expect(mockDatabases.listDocuments).toHaveBeenCalledTimes(2);
    });

    it('should allow checking updated status', async () => {
      const db = await orm.init(tables);
      const usersTable = db.table('users');

      // Initially should be true (no data cached yet)
      expect((usersTable as any).isUpdated()).toBe(true);

      // After query, should still be true
      mockDatabases.listDocuments.mockResolvedValue({
        documents: [],
        total: 0
      });
      await usersTable.all();
      expect((usersTable as any).isUpdated()).toBe(true);

      // After manual invalidation, should be false
      (usersTable as any).setUpdated(false);
      expect((usersTable as any).isUpdated()).toBe(false);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup subscriptions on destroy', async () => {
      const db = await orm.init(tables);
      const usersTable = db.table('users');

      // Destroy should call unsubscribe
      (usersTable as any).destroy();
      
      // Should have called unsubscribe for automatic realtime tracking
      expect(unsubscribeFn).toHaveBeenCalled();
      
      // Clean up the db instance as well
      db.closeListeners();
    });
  });
});