import { WebORM } from '../../src/web';
import { Database, ORMValidationError } from '../../src/shared/types';

// Create mock instances that will be reused
const mockDatabasesInstance = {
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
  })),
  Databases: jest.fn().mockImplementation(() => mockDatabasesInstance),
  ID: {
    unique: jest.fn(() => 'unique()')
  },
  Query: {}
}));

describe('WebORM', () => {
  const mockConfig = {
    endpoint: process.env.APPWRITE_ENDPOINT || 'https://test.appwrite.io/v1',
    projectId: process.env.APPWRITE_PROJECT_ID || 'test-project-id',
    databaseId: process.env.APPWRITE_DATABASE_ID || 'test-database-id'
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
    },
    {
      name: 'posts',
      schema: {
        title: { type: 'string', required: true },
        content: { type: 'string' },
        status: { type: ['draft', 'published'], enum: ['draft', 'published'] }
      }
    }
  ];

  let orm: WebORM;
  let ormInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset all mock functions
    Object.values(mockDatabasesInstance).forEach(mockFn => {
      if (jest.isMockFunction(mockFn)) {
        mockFn.mockReset();
      }
    });
    
    orm = new WebORM(mockConfig);
    ormInstance = orm.init(testDatabases);
  });

  describe('initialization', () => {
    it('should initialize with correct config', () => {
      expect(orm).toBeInstanceOf(WebORM);
    });

    it('should return ORM instance with schemas', () => {
      expect(ormInstance).toBeDefined();
    });
  });

  describe('validation', () => {
    it('should validate required fields on create', async () => {
      const mockDatabases = require('appwrite').Databases;
      const mockInstance = new mockDatabases();
      
      try {
        await ormInstance.create('users', {
          email: 'test@example.com',
          age: 25
          // missing required 'name' field
        });
        fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error).toBeInstanceOf(ORMValidationError);
        expect(error.errors).toHaveLength(1);
        expect(error.errors[0].field).toBe('name');
      }
    });

    it('should validate field types', async () => {
      try {
        await ormInstance.create('users', {
          name: 'John Doe',
          email: 'test@example.com',
          age: 'invalid-age' // should be number
        });
        fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error).toBeInstanceOf(ORMValidationError);
        expect(error.errors[0].field).toBe('age');
      }
    });

    it('should validate string size limits', async () => {
      try {
        await ormInstance.create('users', {
          name: 'a'.repeat(101), // exceeds size limit of 100
          email: 'test@example.com'
        });
        fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error).toBeInstanceOf(ORMValidationError);
        expect(error.errors[0].field).toBe('name');
      }
    });

    it('should validate enum values', async () => {
      try {
        await ormInstance.create('posts', {
          title: 'Test Post',
          status: 'invalid-status' // not in enum
        });
        fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error).toBeInstanceOf(ORMValidationError);
        expect(error.errors[0].field).toBe('status');
      }
    });

    it('should pass validation with valid data', async () => {
      mockDatabasesInstance.createDocument.mockResolvedValue({
        $id: 'doc123',
        name: 'John Doe',
        email: 'test@example.com',
        age: 25
      });

      const result = await ormInstance.create('users', {
        name: 'John Doe',
        email: 'test@example.com',
        age: 25
      });

      expect(mockDatabasesInstance.createDocument).toHaveBeenCalledWith(
        process.env.APPWRITE_DATABASE_ID || 'test-database-id',
        'users',
        'unique()',
        {
          name: 'John Doe',
          email: 'test@example.com',
          age: 25
        }
      );
    });
  });
});