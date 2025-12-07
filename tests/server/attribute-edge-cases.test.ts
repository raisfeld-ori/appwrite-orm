import { Migration } from '../../src/server/migration';
import { AttributeManager } from '../../src/server/attribute-manager';
import { TableDefinition, ORMMigrationError } from '../../src/shared/types';

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
    createIndex: jest.fn(),
    deleteIndex: jest.fn(),
  };

  const mockClientInstance = {
    setEndpoint: jest.fn().mockReturnThis(),
    setProject: jest.fn().mockReturnThis(),
    setKey: jest.fn().mockReturnThis(),
  };

  return {
    Client: jest.fn().mockImplementation(() => mockClientInstance),
    Databases: jest.fn().mockImplementation(() => mockDatabasesInstance),
  };
});

const { Databases } = require('node-appwrite');
const mockDatabasesInstance = new Databases();

describe('AttributeManager - Edge Cases', () => {
  let attributeManager: AttributeManager;
  const mockConfig = {
    endpoint: 'https://test.appwrite.io/v1',
    projectId: 'test-project',
    databaseId: 'test-database',
    apiKey: 'test-key',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    attributeManager = new AttributeManager(mockDatabasesInstance, mockConfig);
  });

  describe('attributeMatches', () => {
    it('should return true for matching string attributes', () => {
      const existingAttr = {
        key: 'name',
        type: 'string',
        size: 255,
        required: true,
        array: false,
      };
      const field = {
        type: 'string' as const,
        required: true,
        size: 255,
      };

      expect(attributeManager.attributeMatches(existingAttr, 'name', field)).toBe(true);
    });

    it('should return false for different types', () => {
      const existingAttr = {
        key: 'age',
        type: 'string',
        required: true,
        array: false,
      };
      const field = {
        type: 'integer' as const,
        required: true,
      };

      expect(attributeManager.attributeMatches(existingAttr, 'age', field)).toBe(false);
    });

    it('should return false for different required status', () => {
      const existingAttr = {
        key: 'email',
        type: 'string',
        size: 255,
        required: true,
        array: false,
      };
      const field = {
        type: 'string' as const,
        required: false,
        size: 255,
      };

      expect(attributeManager.attributeMatches(existingAttr, 'email', field)).toBe(false);
    });

    it('should return false for different string sizes', () => {
      const existingAttr = {
        key: 'description',
        type: 'string',
        size: 100,
        required: false,
        array: false,
      };
      const field = {
        type: 'string' as const,
        required: false,
        size: 500,
      };

      expect(attributeManager.attributeMatches(existingAttr, 'description', field)).toBe(false);
    });

    it('should return false for different array status', () => {
      const existingAttr = {
        key: 'tags',
        type: 'string',
        size: 255,
        required: false,
        array: false,
      };
      const field = {
        type: 'string' as const,
        required: false,
        array: true,
      };

      expect(attributeManager.attributeMatches(existingAttr, 'tags', field)).toBe(false);
    });

    it('should return false for different min/max on integers', () => {
      const existingAttr = {
        key: 'count',
        type: 'integer',
        required: false,
        array: false,
        min: 0,
        max: 100,
      };
      const field = {
        type: 'integer' as const,
        required: false,
        min: 0,
        max: 200,
      };

      expect(attributeManager.attributeMatches(existingAttr, 'count', field)).toBe(false);
    });

    it('should return false for different enum values', () => {
      const existingAttr = {
        key: 'status',
        type: 'enum',
        required: false,
        array: false,
        elements: ['active', 'inactive'],
      };
      const field = {
        type: ['active', 'inactive', 'pending'] as any,
        required: false,
        enum: ['active', 'inactive', 'pending'],
      };

      expect(attributeManager.attributeMatches(existingAttr, 'status', field)).toBe(false);
    });

    it('should return true for matching enum values', () => {
      const existingAttr = {
        key: 'status',
        type: 'enum',
        required: false,
        array: false,
        elements: ['active', 'inactive'],
      };
      const field = {
        type: ['active', 'inactive'] as any,
        required: false,
        enum: ['active', 'inactive'],
      };

      expect(attributeManager.attributeMatches(existingAttr, 'status', field)).toBe(true);
    });
  });

  describe('updateAttribute', () => {
    it('should update mutable properties (required, default, min/max)', async () => {
      const existingAttr = {
        key: 'name',
        type: 'string',
        size: 100,
        required: false,
        array: false,
      };
      
      mockDatabasesInstance.updateStringAttribute.mockResolvedValue({});

      const field = {
        type: 'string' as const,
        required: true,
        size: 100,
      };

      await attributeManager.updateAttribute('test-collection', 'name', field, existingAttr);

      expect(mockDatabasesInstance.updateStringAttribute).toHaveBeenCalledWith({
        databaseId: 'test-database',
        collectionId: 'test-collection',
        key: 'name',
        required: true,
        xdefault: null
      });
      expect(mockDatabasesInstance.deleteAttribute).not.toHaveBeenCalled();
    });

    it('should throw error when trying to update immutable properties (type)', async () => {
      const existingAttr = {
        key: 'age',
        type: 'string',
        size: 255,
        required: true,
        array: false,
      };
      
      const field = {
        type: 'integer' as const,
        required: true,
      };

      await expect(
        attributeManager.updateAttribute('test-collection', 'age', field, existingAttr)
      ).rejects.toThrow(/Immutable properties.*would destroy existing data/);
    });

    it('should throw error when trying to change size', async () => {
      const existingAttr = {
        key: 'description',
        type: 'string',
        size: 100,
        required: false,
        array: false,
      };
      
      const field = {
        type: 'string' as const,
        required: false,
        size: 500,
      };

      await expect(
        attributeManager.updateAttribute('test-collection', 'description', field, existingAttr)
      ).rejects.toThrow(/Immutable properties.*would destroy existing data/);
    });

    it('should throw error when trying to change array status', async () => {
      const existingAttr = {
        key: 'tags',
        type: 'string',
        size: 255,
        required: false,
        array: false,
      };
      
      const field = {
        type: 'string' as const,
        required: false,
        array: true,
      };

      await expect(
        attributeManager.updateAttribute('test-collection', 'tags', field, existingAttr)
      ).rejects.toThrow(/Immutable properties.*would destroy existing data/);
    });
  });
});

describe('Migration - Edge Cases', () => {
  let migration: Migration;
  const mockConfig = {
    endpoint: 'https://test.appwrite.io/v1',
    projectId: 'test-project',
    databaseId: 'test-database',
    apiKey: 'test-key',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    migration = new Migration(mockDatabasesInstance, mockConfig);
  });

  it('should handle existing attributes that already match', async () => {
    const testTable: TableDefinition = {
      name: 'users',
      schema: {
        name: { type: 'string', required: true, size: 100 },
        email: { type: 'string', required: true, size: 255 },
      },
    };

    mockDatabasesInstance.get.mockResolvedValue({ $id: 'test-database' });
    mockDatabasesInstance.getCollection.mockResolvedValue({
      $id: 'users',
      name: 'users',
      attributes: [
        { key: 'name', type: 'string', size: 100, required: true, array: false, status: 'available' },
        { key: 'email', type: 'string', size: 255, required: true, array: false, status: 'available' },
      ],
    });

    await migration.migrate([testTable]);

    expect(mockDatabasesInstance.createStringAttribute).not.toHaveBeenCalled();
  });

  it('should update mismatched mutable attributes', async () => {
    const testTable: TableDefinition = {
      name: 'users',
      schema: {
        name: { type: 'string', required: true, size: 100 },
      },
    };

    mockDatabasesInstance.get.mockResolvedValue({ $id: 'test-database' });
    mockDatabasesInstance.getCollection.mockResolvedValue({
      $id: 'users',
      name: 'users',
      attributes: [
        { key: 'name', type: 'string', size: 100, required: false, array: false, status: 'available' },
      ],
    });

    mockDatabasesInstance.updateStringAttribute.mockResolvedValue({});

    await migration.migrate([testTable]);

    expect(mockDatabasesInstance.updateStringAttribute).toHaveBeenCalledWith({
      databaseId: 'test-database',
      collectionId: 'users',
      key: 'name',
      required: true,
      xdefault: null
    });
    expect(mockDatabasesInstance.deleteAttribute).not.toHaveBeenCalled();
  });

  it('should throw error when trying to update immutable attributes', async () => {
    const testTable: TableDefinition = {
      name: 'users',
      schema: {
        name: { type: 'string', required: true, size: 200 },
      },
    };

    mockDatabasesInstance.get.mockResolvedValue({ $id: 'test-database' });
    mockDatabasesInstance.getCollection.mockResolvedValue({
      $id: 'users',
      name: 'users',
      attributes: [
        { key: 'name', type: 'string', size: 100, required: true, array: false, status: 'available' },
      ],
    });

    await expect(migration.migrate([testTable])).rejects.toThrow(/Immutable properties.*would destroy existing data/);
  });

  it('should gracefully handle duplicate attribute creation errors', async () => {
    const testTable: TableDefinition = {
      name: 'users',
      schema: {
        name: { type: 'string', required: true, size: 100 },
      },
    };

    mockDatabasesInstance.get.mockResolvedValue({ $id: 'test-database' });
    mockDatabasesInstance.getCollection
      .mockResolvedValueOnce({
        $id: 'users',
        name: 'users',
        attributes: [],
      })
      .mockResolvedValueOnce({
        $id: 'users',
        name: 'users',
        attributes: [
          { key: 'name', type: 'string', size: 100, required: true, array: false, status: 'available' },
        ],
      });

    mockDatabasesInstance.createStringAttribute.mockRejectedValue(
      new Error('Attribute with the requested key already exists')
    );

    await expect(migration.migrate([testTable])).resolves.not.toThrow();
  });

  it('should throw error if duplicate attribute has wrong configuration', async () => {
    const testTable: TableDefinition = {
      name: 'users',
      schema: {
        name: { type: 'string', required: true, size: 200 },
      },
    };

    mockDatabasesInstance.get.mockResolvedValue({ $id: 'test-database' });
    mockDatabasesInstance.getCollection
      .mockResolvedValueOnce({
        $id: 'users',
        name: 'users',
        attributes: [],
      })
      .mockResolvedValueOnce({
        $id: 'users',
        name: 'users',
        attributes: [
          { key: 'name', type: 'string', size: 100, required: true, array: false, status: 'available' },
        ],
      });

    mockDatabasesInstance.createStringAttribute.mockRejectedValue(
      new Error('Attribute with the requested key already exists')
    );

    await expect(migration.migrate([testTable])).rejects.toThrow();
  });
});
