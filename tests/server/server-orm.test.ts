import { ServerORM } from '../../src/server';
import { Database, ORMMigrationError } from '../../src/shared/types';

// Mock appwrite (used by BaseTable)
jest.mock('appwrite', () => ({
  ID: {
    unique: jest.fn(() => 'unique()')
  },
  Query: {
    equal: jest.fn((field, value) => `Query.equal("${field}", ${JSON.stringify(value)})`),
    greaterThan: jest.fn((field, value) => `Query.greaterThan("${field}", ${value})`),
    lessThan: jest.fn((field, value) => `Query.lessThan("${field}", ${value})`),
    limit: jest.fn((value) => `Query.limit(${value})`),
    offset: jest.fn((value) => `Query.offset(${value})`),
    orderAsc: jest.fn((field) => `Query.orderAsc("${field}")`),
    orderDesc: jest.fn((field) => `Query.orderDesc("${field}")`),
  }
}));

// Mock node-appwrite
jest.mock('node-appwrite', () => {
  const mockDatabasesInstance = {
    get: jest.fn(),
    create: jest.fn(),
    getCollection: jest.fn(),
    createCollection: jest.fn(),
    deleteCollection: jest.fn(),
    createStringAttribute: jest.fn(),
    createIntegerAttribute: jest.fn(),
    createFloatAttribute: jest.fn(),
    createBooleanAttribute: jest.fn(),
    createDatetimeAttribute: jest.fn(),
    createEnumAttribute: jest.fn(),
    deleteAttribute: jest.fn(),
    updateStringAttribute: jest.fn(),
    updateIntegerAttribute: jest.fn(),
    updateFloatAttribute: jest.fn(),
    updateBooleanAttribute: jest.fn(),
    updateDatetimeAttribute: jest.fn(),
    updateEnumAttribute: jest.fn(),
    createDocument: jest.fn(),
    updateDocument: jest.fn(),
    getDocument: jest.fn(),
    listDocuments: jest.fn(),
    deleteDocument: jest.fn(),
  };

  const mockClientInstance = {
    setEndpoint: jest.fn().mockReturnThis(),
    setProject: jest.fn().mockReturnThis(),
    setKey: jest.fn().mockReturnThis(),
  };

  return {
    Client: jest.fn().mockImplementation(() => mockClientInstance),
    Databases: jest.fn().mockImplementation(() => mockDatabasesInstance),
    ID: {
      unique: jest.fn(() => 'unique()')
    },
    Query: {
      equal: jest.fn((field, value) => `Query.equal("${field}", ${JSON.stringify(value)})`),
      greaterThan: jest.fn((field, value) => `Query.greaterThan("${field}", ${value})`),
      lessThan: jest.fn((field, value) => `Query.lessThan("${field}", ${value})`),
      limit: jest.fn((value) => `Query.limit(${value})`),
      offset: jest.fn((value) => `Query.offset(${value})`),
      orderAsc: jest.fn((field) => `Query.orderAsc("${field}")`),
      orderDesc: jest.fn((field) => `Query.orderDesc("${field}")`),
    }
  };
});

// Get the mocked instances for assertions
const { Databases } = require('node-appwrite');
const mockDatabasesInstance = new Databases();

describe('ServerORM', () => {
  const mockConfig = {
    endpoint: process.env.APPWRITE_ENDPOINT || 'https://test.appwrite.io/v1',
    projectId: process.env.APPWRITE_PROJECT_ID || 'test-project-id',
    databaseId: process.env.APPWRITE_DATABASE_ID || 'test-database-id',
    apiKey: process.env.APPWRITE_API_KEY || 'test-api-key-for-server',
    autoMigrate: true
  };

  const testDatabases: Database[] = [
    {
      name: 'users',
      schema: {
        name: { type: 'string', required: true, size: 100 },
        email: { type: 'string', required: true },
        age: { type: 'integer', min: 0, max: 150 },
        isActive: { type: 'boolean', default: true }
      }
    }
  ];

  let orm: ServerORM;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset all mock functions
    Object.values(mockDatabasesInstance).forEach(mockFn => {
      if (jest.isMockFunction(mockFn)) {
        mockFn.mockReset();
      }
    });
  });

  describe('initialization', () => {
    it('should require API key for server ORM', () => {
      expect(() => {
        new ServerORM({
          endpoint: process.env.APPWRITE_ENDPOINT || 'https://test.appwrite.io/v1',
          projectId: process.env.APPWRITE_PROJECT_ID || 'test-project-id',
          databaseId: process.env.APPWRITE_DATABASE_ID || 'test-database-id'
          // missing apiKey
        });
      }).toThrow('API key is required for server-side ORM');
    });

    it('should initialize with correct config', () => {
      orm = new ServerORM(mockConfig);
      expect(orm).toBeInstanceOf(ServerORM);
    });
  });

  describe('migration', () => {
    beforeEach(() => {
      // Clear all mocks before each test
      jest.clearAllMocks();
      orm = new ServerORM(mockConfig);
    });

    it('should create database if it does not exist', async () => {
      // Mock database doesn't exist, then exists after creation
      mockDatabasesInstance.get
        .mockRejectedValueOnce(new Error('Database not found'))
        .mockResolvedValueOnce({ $id: 'test-database' });
      
      mockDatabasesInstance.create.mockResolvedValueOnce({ $id: 'test-database' });
      mockDatabasesInstance.getCollection.mockRejectedValueOnce(new Error('Collection not found'));
      mockDatabasesInstance.createCollection.mockResolvedValueOnce({ $id: 'users', attributes: [] });
      mockDatabasesInstance.createStringAttribute.mockResolvedValue({});
      mockDatabasesInstance.createIntegerAttribute.mockResolvedValue({});
      mockDatabasesInstance.createBooleanAttribute.mockResolvedValue({});

      await orm.init(testDatabases);

      // Verify createDatabase was called
      expect(mockDatabasesInstance.create).toHaveBeenCalledWith(
        process.env.APPWRITE_DATABASE_ID || 'test-database-id',
        'ORM Database'
      );
    });

    it('should create collection if it does not exist', async () => {
      // Mock database exists
      mockDatabasesInstance.get.mockResolvedValueOnce({ $id: 'test-database' });
      mockDatabasesInstance.getCollection.mockRejectedValueOnce(new Error('Collection not found'));
      mockDatabasesInstance.createCollection.mockResolvedValueOnce({ $id: 'users', attributes: [] });
      mockDatabasesInstance.createStringAttribute.mockResolvedValue({});
      mockDatabasesInstance.createIntegerAttribute.mockResolvedValue({});
      mockDatabasesInstance.createBooleanAttribute.mockResolvedValue({});

      await orm.init(testDatabases);

      // Verify createCollection was called
      expect(mockDatabasesInstance.createCollection).toHaveBeenCalledWith(
        process.env.APPWRITE_DATABASE_ID || 'test-database-id',
        'users',
        'users',
        ['read("any")'],
        false
      );
    });

    it('should create attributes for new fields', async () => {
      // Mock database and collection exist, no attributes exist
      mockDatabasesInstance.get.mockResolvedValueOnce({ $id: 'test-database' });
      mockDatabasesInstance.getCollection.mockResolvedValueOnce({
        $id: 'users',
        attributes: [] // No existing attributes
      });
      
      mockDatabasesInstance.createStringAttribute.mockResolvedValue({});
      mockDatabasesInstance.createIntegerAttribute.mockResolvedValue({});
      mockDatabasesInstance.createBooleanAttribute.mockResolvedValue({});

      await orm.init(testDatabases);

      const databaseId = process.env.APPWRITE_DATABASE_ID || 'test-database-id';

      // Verify string attributes were created
      expect(mockDatabasesInstance.createStringAttribute).toHaveBeenCalledWith(
        databaseId,
        'users',
        'name',
        100,
        true,
        undefined,
        false
      );

      expect(mockDatabasesInstance.createStringAttribute).toHaveBeenCalledWith(
        databaseId,
        'users',
        'email',
        255,
        true,
        undefined,
        false
      );

      // Verify integer attribute was created
      expect(mockDatabasesInstance.createIntegerAttribute).toHaveBeenCalledWith(
        databaseId,
        'users',
        'age',
        false,
        0,
        150,
        undefined,
        false
      );

      // Verify boolean attribute was created
      expect(mockDatabasesInstance.createBooleanAttribute).toHaveBeenCalledWith(
        databaseId,
        'users',
        'isActive',
        false,
        true,
        false
      );
    });

    it('should skip existing attributes', async () => {
      const databaseId = process.env.APPWRITE_DATABASE_ID || 'test-database-id';

      // Mock database and collection exist with some attributes
      mockDatabasesInstance.get.mockResolvedValueOnce({ $id: 'test-database' });
      mockDatabasesInstance.getCollection.mockResolvedValueOnce({
        $id: 'users',
        attributes: [
          { key: 'name', type: 'string', size: 100, required: true, array: false },
          { key: 'email', type: 'string', size: 255, required: true, array: false }
        ]
      });

      mockDatabasesInstance.createIntegerAttribute.mockResolvedValue({});
      mockDatabasesInstance.createBooleanAttribute.mockResolvedValue({});

      await orm.init(testDatabases);

      // Verify that only age and isActive attributes were created (name and email already exist)
      expect(mockDatabasesInstance.createIntegerAttribute).toHaveBeenCalledWith(
        databaseId,
        'users',
        'age',
        false,
        0,
        150,
        undefined,
        false
      );

      expect(mockDatabasesInstance.createBooleanAttribute).toHaveBeenCalledWith(
        databaseId,
        'users',
        'isActive',
        false,
        true,
        false
      );

      // Verify that name and email were NOT created again
      expect(mockDatabasesInstance.createStringAttribute).not.toHaveBeenCalled();
    });
  });

  describe('CRUD operations', () => {
    let ormInstance: any;

    beforeEach(async () => {
      orm = new ServerORM({ ...mockConfig, autoMigrate: false, autoValidate: false });
      
      mockDatabasesInstance.get.mockResolvedValue({ $id: 'test-database' });
      
      ormInstance = await orm.init(testDatabases);
    });

    it('should create documents', async () => {
      mockDatabasesInstance.createDocument.mockResolvedValue({
        $id: 'doc123',
        name: 'John Doe',
        email: 'test@example.com'
      });

      const result = await ormInstance.create('users', {
        name: 'John Doe',
        email: 'test@example.com'
      });

      expect(mockDatabasesInstance.createDocument).toHaveBeenCalledWith(
        process.env.APPWRITE_DATABASE_ID || 'test-database-id',
        'users',
        'unique()',
        {
          name: 'John Doe',
          email: 'test@example.com'
        }
      );
    });
  });
});