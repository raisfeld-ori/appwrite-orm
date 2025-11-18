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
    it('should initialize without errors with valid config', async () => {
      const orm = new WebORM({ ...testConfig, autoValidate: false });
      const instance = await orm.init([testDatabase]);
      expect(instance).toBeDefined();
    });

    it('should initialize with environment variables', async () => {
      // This test will use actual env vars if available, fallback to test values
      const orm = new WebORM({
        endpoint: process.env.APPWRITE_ENDPOINT || 'https://test.appwrite.io/v1',
        projectId: process.env.APPWRITE_PROJECT_ID || 'test-project-id',
        databaseId: process.env.APPWRITE_DATABASE_ID || 'test-database-id',
        autoValidate: false
      });
      
      const instance = await orm.init([testDatabase]);
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

  describe('Realtime and Caching Integration', () => {
    it('should initialize WebORM with realtime capabilities', async () => {
      const orm = new WebORM({ ...testConfig, autoValidate: false });
      const instance = await orm.init([testDatabase]);
      const table = instance.table('test-collection');
      
      // Should have realtime methods available
      expect(typeof table.listen).toBe('function');
      expect(typeof table.listenToDocuments).toBe('function');
      expect(typeof table.listenToDocument).toBe('function');
      expect(typeof table.listenToCollection).toBe('function');
      expect(typeof table.listenToDatabase).toBe('function');
      
      // Should have cache management methods
      expect(typeof table.isUpdated).toBe('function');
      expect(typeof table.setUpdated).toBe('function');
      expect(typeof table.destroy).toBe('function');
    });

    it('should initialize ServerORM with realtime capabilities', async () => {
      const orm = new ServerORM({
        ...testConfig,
        apiKey: process.env.APPWRITE_API_KEY || 'test-key',
        autoMigrate: false,
        autoValidate: false
      });
      
      const instance = await orm.init([testDatabase]);
      const table = instance.table('test-collection');
      
      // Should have realtime methods available
      expect(typeof table.listen).toBe('function');
      expect(typeof table.listenToDocuments).toBe('function');
      expect(typeof table.listenToDocument).toBe('function');
      expect(typeof table.listenToCollection).toBe('function');
      expect(typeof table.listenToDatabase).toBe('function');
      
      // Should have cache management methods
      expect(typeof table.isUpdated).toBe('function');
      expect(typeof table.setUpdated).toBe('function');
      expect(typeof table.destroy).toBe('function');
    });

    it('should handle development mode without realtime', async () => {
      const orm = new WebORM({ 
        ...testConfig, 
        development: true,
        autoValidate: false 
      });
      
      const instance = await orm.init([testDatabase]);
      const table = instance.table('test-collection');
      
      // Should still have methods but they should throw appropriate errors
      expect(typeof table.listen).toBe('function');
      expect(typeof table.listenToDocuments).toBe('function');
      
      // Cache methods should still work
      expect(typeof table.isUpdated).toBe('function');
      expect(typeof table.setUpdated).toBe('function');
      expect(table.isUpdated()).toBe(true); // Initially true
      
      // Manual cache control should work
      table.setUpdated(false);
      expect(table.isUpdated()).toBe(false);
      
      table.setUpdated(true);
      expect(table.isUpdated()).toBe(true);
    });

    it('should maintain backward compatibility with existing API', async () => {
      const orm = new WebORM({ ...testConfig, autoValidate: false });
      const instance = await orm.init([testDatabase]);
      const table = instance.table('test-collection');
      
      // All existing methods should still be available
      expect(typeof table.get).toBe('function');
      expect(typeof table.getOrFail).toBe('function');
      expect(typeof table.all).toBe('function');
      expect(typeof table.first).toBe('function');
      expect(typeof table.firstOrFail).toBe('function');
      expect(typeof table.count).toBe('function');
      expect(typeof table.create).toBe('function');
      expect(typeof table.update).toBe('function');
      expect(typeof table.delete).toBe('function');
      expect(typeof table.query).toBe('function');
      expect(typeof table.find).toBe('function');
      expect(typeof table.findOne).toBe('function');
      
      // Legacy ORM instance methods should still work
      expect(typeof instance.create).toBe('function');
      expect(typeof instance.update).toBe('function');
      expect(typeof instance.get).toBe('function');
      expect(typeof instance.list).toBe('function');
      expect(typeof instance.delete).toBe('function');
    });

    it('should handle table cleanup properly', async () => {
      const orm = new WebORM({ ...testConfig, autoValidate: false });
      const instance = await orm.init([testDatabase]);
      const table = instance.table('test-collection');
      
      // Should not throw when destroying
      expect(() => {
        table.destroy();
      }).not.toThrow();
      
      // Should be able to call destroy multiple times
      expect(() => {
        table.destroy();
      }).not.toThrow();
    });

    it('should handle server-specific features', async () => {
      const orm = new ServerORM({
        ...testConfig,
        apiKey: process.env.APPWRITE_API_KEY || 'test-key',
        autoMigrate: false,
        autoValidate: false
      });
      
      const instance = await orm.init([testDatabase]);
      const table = instance.table('test-collection');
      
      // Server-specific methods should be available
      expect(typeof table.bulkCreate).toBe('function');
      expect(typeof table.bulkUpdate).toBe('function');
      expect(typeof table.bulkDelete).toBe('function');
      expect(typeof table.createCollection).toBe('function');
      expect(typeof table.deleteCollection).toBe('function');
      expect(typeof table.createIndex).toBe('function');
      expect(typeof table.deleteIndex).toBe('function');
      expect(typeof table.listIndexes).toBe('function');
      
      // Export methods should be available
      expect(typeof instance.exportToSQL).toBe('function');
      expect(typeof instance.exportToFirebase).toBe('function');
      expect(typeof instance.exportToText).toBe('function');
    });
  });
});