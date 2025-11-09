import { ServerORM } from '../../src/server';
import { Database, ORMMigrationError } from '../../src/shared/types';

// Create mock instances that will be reused
const mockDatabasesInstance = {
  get: jest.fn(),
  create: jest.fn(),
  getCollection: jest.fn(),
  createCollection: jest.fn(),
  createStringAttribute: jest.fn(),
  createIntegerAttribute: jest.fn(),
  createBooleanAttribute: jest.fn(),
  createEnumAttribute: jest.fn(),
  createDocument: jest.fn(),
  updateDocument: jest.fn(),
  getDocument: jest.fn(),
  listDocuments: jest.fn(),
  deleteDocument: jest.fn(),
};

// Mock Appwrite
jest.mock('appwrite', () => ({
  Client: jest.fn().mockImplementation(() => ({
    setEndpoint: jest.fn().mockReturnThis(),
    setProject: jest.fn().mockReturnThis(),
    setKey: jest.fn().mockReturnThis(),
  })),
  Databases: jest.fn().mockImplementation(() => mockDatabasesInstance),
  ID: {
    unique: jest.fn(() => 'unique()')
  },
  Query: {}
}));

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
        age: { type: 'number', min: 0, max: 150 },
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
      orm = new ServerORM(mockConfig);
    });

    it('should create database if it does not exist', async () => {
      // Mock database doesn't exist
      mockDatabasesInstance.get.mockRejectedValue(new Error('Database not found'));
      mockDatabasesInstance.create.mockResolvedValue({ $id: 'test-database' });
      
      // Mock collection doesn't exist
      mockDatabasesInstance.getCollection.mockRejectedValue(new Error('Collection not found'));
      mockDatabasesInstance.createCollection.mockResolvedValue({
        $id: 'users',
        attributes: []
      });

      await orm.init(testDatabases);

      expect(mockDatabasesInstance.create).toHaveBeenCalledWith(process.env.APPWRITE_DATABASE_ID || 'test-database-id', 'ORM Database');
    });

    it('should create collection if it does not exist', async () => {
      // Mock database exists
      mockDatabasesInstance.get.mockResolvedValue({ $id: 'test-database' });
      
      // Mock collection doesn't exist
      mockDatabasesInstance.getCollection.mockRejectedValue(new Error('Collection not found'));
      mockDatabasesInstance.createCollection.mockResolvedValue({
        $id: 'users',
        attributes: []
      });

      await orm.init(testDatabases);

      expect(mockDatabasesInstance.createCollection).toHaveBeenCalledWith(
        process.env.APPWRITE_DATABASE_ID || 'test-database-id',
        'users',
        'users',
        ['read("any")']
      );
    });

    it('should create attributes for new fields', async () => {
      // Mock database and collection exist
      mockDatabasesInstance.get.mockResolvedValue({ $id: 'test-database' });
      mockDatabasesInstance.getCollection.mockResolvedValue({
        $id: 'users',
        attributes: [] // no existing attributes
      });

      await orm.init(testDatabases);

      const databaseId = process.env.APPWRITE_DATABASE_ID || 'test-database-id';
      
      expect(mockDatabasesInstance.createStringAttribute).toHaveBeenCalledWith(
        databaseId,
        'users',
        'name',
        100,
        true,
        undefined
      );
      
      expect(mockDatabasesInstance.createStringAttribute).toHaveBeenCalledWith(
        databaseId,
        'users',
        'email',
        255,
        true,
        undefined
      );
      
      expect(mockDatabasesInstance.createIntegerAttribute).toHaveBeenCalledWith(
        databaseId,
        'users',
        'age',
        false,
        0,
        150,
        undefined
      );
      
      expect(mockDatabasesInstance.createBooleanAttribute).toHaveBeenCalledWith(
        databaseId,
        'users',
        'isActive',
        false,
        true
      );
    });

    it('should skip existing attributes', async () => {
      // Mock database and collection exist with some attributes
      mockDatabasesInstance.get.mockResolvedValue({ $id: 'test-database' });
      mockDatabasesInstance.getCollection.mockResolvedValue({
        $id: 'users',
        attributes: [
          { key: 'name' },
          { key: 'email' }
        ]
      });

      await orm.init(testDatabases);

      // Should not create name and email attributes (they exist)
      expect(mockDatabasesInstance.createStringAttribute).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        'name',
        expect.anything(),
        expect.anything(),
        expect.anything()
      );
      
      // Should create age and isActive (they don't exist)
      expect(mockDatabasesInstance.createIntegerAttribute).toHaveBeenCalledWith(
        process.env.APPWRITE_DATABASE_ID || 'test-database-id',
        'users',
        'age',
        false,
        0,
        150,
        undefined
      );
    });
  });

  describe('CRUD operations', () => {
    let ormInstance: any;

    beforeEach(async () => {
      orm = new ServerORM({ ...mockConfig, autoMigrate: false });
      
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