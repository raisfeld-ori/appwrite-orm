import { WebORM, ServerORM } from '../src';
import { Database } from '../src/shared/types';

// Simple integration tests
describe('ORM Integration Tests', () => {
  const testDatabase: Database = {
    name: 'test-collection',
    schema: {
      name: { type: 'string', required: true },
      age: { type: 'number', min: 0 },
      isActive: { type: 'boolean', default: true }
    }
  };

  // Use environment variables with fallbacks for testing
  const testConfig = {
    endpoint: process.env.APPWRITE_ENDPOINT || 'https://test.appwrite.io/v1',
    projectId: process.env.APPWRITE_PROJECT_ID || 'test-project-id',
    databaseId: process.env.APPWRITE_DATABASE_ID || 'test-database-id'
  };

  describe('Configuration Validation', () => {
    it('should throw error for missing endpoint', () => {
      expect(() => {
        new WebORM({
          endpoint: '',
          projectId: 'test-project',
          databaseId: 'test-db'
        });
      }).toThrow('Missing required configuration values: endpoint');
    });

    it('should throw error for missing projectId', () => {
      expect(() => {
        new WebORM({
          endpoint: process.env.APPWRITE_ENDPOINT || 'https://test.appwrite.io/v1',
          projectId: '',
          databaseId: process.env.APPWRITE_DATABASE_ID || 'test-database-id'
        });
      }).toThrow('Missing required configuration values: projectId');
    });

    it('should throw error for missing databaseId', () => {
      expect(() => {
        new WebORM({
          endpoint: process.env.APPWRITE_ENDPOINT || 'https://test.appwrite.io/v1',
          projectId: process.env.APPWRITE_PROJECT_ID || 'test-project-id',
          databaseId: ''
        });
      }).toThrow('Missing required configuration values: databaseId');
    });

    it('should throw error for multiple missing values', () => {
      expect(() => {
        new WebORM({
          endpoint: '',
          projectId: '',
          databaseId: process.env.APPWRITE_DATABASE_ID || 'test-database-id'
        });
      }).toThrow('Missing required configuration values: endpoint, projectId');
    });
  });

  describe('WebORM', () => {
    it('should initialize without errors with valid config', () => {
      const orm = new WebORM(testConfig);
      const instance = orm.init([testDatabase]);
      expect(instance).toBeDefined();
    });

    it('should initialize with environment variables', () => {
      // This test will use actual env vars if available, fallback to test values
      const orm = new WebORM({
        endpoint: process.env.APPWRITE_ENDPOINT || 'https://test.appwrite.io/v1',
        projectId: process.env.APPWRITE_PROJECT_ID || 'test-project-id',
        databaseId: process.env.APPWRITE_DATABASE_ID || 'test-database-id'
      });
      
      const instance = orm.init([testDatabase]);
      expect(instance).toBeDefined();
    });
  });

  describe('ServerORM', () => {
    it('should require API key', () => {
      expect(() => {
        new ServerORM(testConfig);
      }).toThrow('API key is required for server-side ORM');
    });

    it('should validate required config before checking API key', () => {
      expect(() => {
        new ServerORM({
          endpoint: '',
          projectId: process.env.APPWRITE_PROJECT_ID || 'test-project-id',
          databaseId: process.env.APPWRITE_DATABASE_ID || 'test-database-id',
          apiKey: process.env.APPWRITE_API_KEY || 'test-key'
        });
      }).toThrow('Missing required configuration values: endpoint');
    });

    it('should initialize with API key and valid config', () => {
      expect(() => {
        new ServerORM({
          ...testConfig,
          apiKey: process.env.APPWRITE_API_KEY || 'test-key',
          autoMigrate: false
        });
      }).not.toThrow();
    });
  });
});