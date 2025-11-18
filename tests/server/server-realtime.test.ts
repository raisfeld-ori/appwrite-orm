import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ServerORM } from '../../src/server';

// Mock node-appwrite client
const mockClient = {
  subscribe: jest.fn(),
  setEndpoint: jest.fn().mockReturnThis(),
  setProject: jest.fn().mockReturnThis(),
  setKey: jest.fn().mockReturnThis()
};

const mockDatabases = {
  getDocument: jest.fn() as jest.MockedFunction<any>,
  listDocuments: jest.fn() as jest.MockedFunction<any>,
  createDocument: jest.fn() as jest.MockedFunction<any>,
  updateDocument: jest.fn() as jest.MockedFunction<any>,
  deleteDocument: jest.fn() as jest.MockedFunction<any>,
  getDatabase: jest.fn() as jest.MockedFunction<any>,
  listDatabases: jest.fn() as jest.MockedFunction<any>,
  createDatabase: jest.fn() as jest.MockedFunction<any>,
  getCollection: jest.fn() as jest.MockedFunction<any>,
  listCollections: jest.fn() as jest.MockedFunction<any>,
  createCollection: jest.fn() as jest.MockedFunction<any>,
  createStringAttribute: jest.fn() as jest.MockedFunction<any>,
  createIntegerAttribute: jest.fn() as jest.MockedFunction<any>,
  createFloatAttribute: jest.fn() as jest.MockedFunction<any>,
  createBooleanAttribute: jest.fn() as jest.MockedFunction<any>,
  createDatetimeAttribute: jest.fn() as jest.MockedFunction<any>,
  createEmailAttribute: jest.fn() as jest.MockedFunction<any>,
  createIpAttribute: jest.fn() as jest.MockedFunction<any>,
  createUrlAttribute: jest.fn() as jest.MockedFunction<any>,
  createEnumAttribute: jest.fn() as jest.MockedFunction<any>,
  createIndex: jest.fn() as jest.MockedFunction<any>
};

// Mock node-appwrite modules
jest.mock('node-appwrite', () => ({
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

describe('Server Realtime Functionality', () => {
  let orm: ServerORM;
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
    
    // Mock database and collection existence
    mockDatabases.getDatabase.mockResolvedValue({ $id: 'test-db' });
    mockDatabases.getCollection.mockResolvedValue({ 
      $id: 'users',
      attributes: [],
      indexes: []
    });
    
    orm = new ServerORM({
      endpoint: 'https://test.appwrite.io/v1',
      projectId: 'test-project',
      databaseId: 'test-db',
      apiKey: 'test-api-key',
      autoMigrate: false,
      autoValidate: false
    });
  });

  afterEach(async () => {
    if (orm) {
      const db = await orm.init(tables);
      db.closeListeners();
    }
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

    it('should handle cache invalidation on mutations', async () => {
      const db = await orm.init(tables);
      const usersTable = db.table('users');

      // Mock initial data
      mockDatabases.listDocuments.mockResolvedValue({
        documents: [{ $id: '1', name: 'John', email: 'john@test.com', age: 30 }],
        total: 1
      });

      // First call
      await usersTable.all();
      expect((usersTable as any).isUpdated()).toBe(true);

      // Mock create operation
      mockDatabases.createDocument.mockResolvedValue({
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

  describe('Server-Specific Features', () => {
    it('should handle bulk operations cache invalidation', async () => {
      const db = await orm.init(tables);
      const usersTable = db.table('users');

      // Mock bulk operations
      mockDatabases.createDocument.mockResolvedValue({ $id: 'test' });
      mockDatabases.updateDocument.mockResolvedValue({ $id: 'test' });
      mockDatabases.deleteDocument.mockResolvedValue({});

      // Test bulk create
      await (usersTable as any).bulkCreate([{ name: 'Test', email: 'test@test.com' }]);
      expect((usersTable as any).isUpdated()).toBe(false);

      // Reset and test bulk update
      (usersTable as any).setUpdated(true);
      await (usersTable as any).bulkUpdate([{ id: 'test', data: { name: 'Updated' } }]);
      expect((usersTable as any).isUpdated()).toBe(false);

      // Reset and test bulk delete
      (usersTable as any).setUpdated(true);
      await (usersTable as any).bulkDelete(['test']);
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
    });
  });
});