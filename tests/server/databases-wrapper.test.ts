import { Databases, Client } from 'node-appwrite';
import { DatabasesWrapper, ClientWrapper } from '../../src/server/appwrite-extended';

describe('DatabasesWrapper', () => {
  let mockClient: any;
  let mockDatabases: Databases;
  let wrapper: DatabasesWrapper;

  beforeEach(() => {
    mockClient = {
      call: jest.fn(),
    };
    
    mockDatabases = {
      client: mockClient,
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
    } as any;

    wrapper = new DatabasesWrapper(mockDatabases);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create wrapper with valid databases instance', () => {
      expect(wrapper).toBeInstanceOf(DatabasesWrapper);
      expect(wrapper.standard).toBe(mockDatabases);
    });
  });

  describe('Database operations', () => {
    it('should get a database', async () => {
      const mockResponse = { $id: 'test-db', name: 'Test Database' };
      (mockDatabases.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await wrapper.getDatabase('test-db');

      expect(mockDatabases.get).toHaveBeenCalledWith('test-db');
      expect(result).toEqual(mockResponse);
    });

    it('should create a database', async () => {
      const mockResponse = { $id: 'new-db', name: 'New Database' };
      (mockDatabases.create as jest.Mock).mockResolvedValue(mockResponse);

      const result = await wrapper.createDatabase('new-db', 'New Database');

      expect(mockDatabases.create).toHaveBeenCalledWith('new-db', 'New Database');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Collection operations', () => {
    it('should get a collection', async () => {
      const mockResponse = { $id: 'test-collection', name: 'Test Collection' };
      (mockDatabases.getCollection as jest.Mock).mockResolvedValue(mockResponse);

      const result = await wrapper.getCollection('test-db', 'test-collection');

      expect(mockDatabases.getCollection).toHaveBeenCalledWith('test-db', 'test-collection');
      expect(result).toEqual(mockResponse);
    });

    it('should create a collection', async () => {
      const mockResponse = { $id: 'new-collection', name: 'New Collection' };
      (mockDatabases.createCollection as jest.Mock).mockResolvedValue(mockResponse);

      const result = await wrapper.createCollection(
        'test-db',
        'new-collection',
        'New Collection',
        ['read("any")'],
        true
      );

      expect(mockDatabases.createCollection).toHaveBeenCalledWith(
        'test-db',
        'new-collection',
        'New Collection',
        ['read("any")'],
        true
      );
      expect(result).toEqual(mockResponse);
    });

    it('should delete a collection', async () => {
      (mockDatabases.deleteCollection as jest.Mock).mockResolvedValue(undefined);

      await wrapper.deleteCollection('test-db', 'test-collection');

      expect(mockDatabases.deleteCollection).toHaveBeenCalledWith('test-db', 'test-collection');
    });
  });

  describe('Attribute operations', () => {
    it('should create a string attribute', async () => {
      const mockResponse = { key: 'name', type: 'string', size: 255 };
      (mockDatabases.createStringAttribute as jest.Mock).mockResolvedValue(mockResponse);

      const result = await wrapper.createStringAttribute(
        'test-db',
        'test-collection',
        'name',
        255,
        true,
        'John Doe',
        false
      );

      expect(mockDatabases.createStringAttribute).toHaveBeenCalledWith(
        'test-db',
        'test-collection',
        'name',
        255,
        true,
        'John Doe',
        false
      );
      expect(result).toEqual(mockResponse);
    });

    it('should create an integer attribute', async () => {
      const mockResponse = { key: 'age', type: 'integer' };
      (mockDatabases.createIntegerAttribute as jest.Mock).mockResolvedValue(mockResponse);

      const result = await wrapper.createIntegerAttribute(
        'test-db',
        'test-collection',
        'age',
        false,
        0,
        150,
        null,
        false
      );

      expect(mockDatabases.createIntegerAttribute).toHaveBeenCalledWith(
        'test-db',
        'test-collection',
        'age',
        false,
        0,
        150,
        undefined,
        false
      );
      expect(result).toEqual(mockResponse);
    });

    it('should create a float attribute', async () => {
      const mockResponse = { key: 'price', type: 'float' };
      (mockDatabases.createFloatAttribute as jest.Mock).mockResolvedValue(mockResponse);

      const result = await wrapper.createFloatAttribute(
        'test-db',
        'test-collection',
        'price',
        true,
        0.01,
        999999.99,
        0,
        false
      );

      expect(mockDatabases.createFloatAttribute).toHaveBeenCalledWith(
        'test-db',
        'test-collection',
        'price',
        true,
        0.01,
        999999.99,
        0,
        false
      );
      expect(result).toEqual(mockResponse);
    });

    it('should create a boolean attribute', async () => {
      const mockResponse = { key: 'isActive', type: 'boolean' };
      (mockDatabases.createBooleanAttribute as jest.Mock).mockResolvedValue(mockResponse);

      const result = await wrapper.createBooleanAttribute(
        'test-db',
        'test-collection',
        'isActive',
        false,
        true,
        false
      );

      expect(mockDatabases.createBooleanAttribute).toHaveBeenCalledWith(
        'test-db',
        'test-collection',
        'isActive',
        false,
        true,
        false
      );
      expect(result).toEqual(mockResponse);
    });

    it('should create a datetime attribute', async () => {
      const mockResponse = { key: 'createdAt', type: 'datetime' };
      (mockDatabases.createDatetimeAttribute as jest.Mock).mockResolvedValue(mockResponse);

      const result = await wrapper.createDatetimeAttribute(
        'test-db',
        'test-collection',
        'createdAt',
        true,
        '2025-01-01T00:00:00.000Z',
        false
      );

      expect(mockDatabases.createDatetimeAttribute).toHaveBeenCalledWith(
        'test-db',
        'test-collection',
        'createdAt',
        true,
        '2025-01-01T00:00:00.000Z',
        false
      );
      expect(result).toEqual(mockResponse);
    });

    it('should create an enum attribute', async () => {
      const mockResponse = { key: 'status', type: 'enum' };
      (mockDatabases.createEnumAttribute as jest.Mock).mockResolvedValue(mockResponse);

      const result = await wrapper.createEnumAttribute(
        'test-db',
        'test-collection',
        'status',
        ['active', 'inactive', 'pending'],
        true,
        'active',
        false
      );

      expect(mockDatabases.createEnumAttribute).toHaveBeenCalledWith(
        'test-db',
        'test-collection',
        'status',
        ['active', 'inactive', 'pending'],
        true,
        'active',
        false
      );
      expect(result).toEqual(mockResponse);
    });
  });
});

describe('ClientWrapper', () => {
  let mockClient: any;
  let wrapper: ClientWrapper;

  beforeEach(() => {
    mockClient = {
      setKey: jest.fn().mockReturnThis(),
    };

    wrapper = new ClientWrapper(mockClient as Client);
  });

  it('should set API key', () => {
    wrapper.setKey('test-api-key');
    expect(mockClient.setKey).toHaveBeenCalledWith('test-api-key');
  });

  it('should return the wrapper for method chaining', () => {
    const result = wrapper.setKey('test-api-key');
    expect(result).toBe(wrapper);
  });

  it('should provide access to the standard client', () => {
    expect(wrapper.standard).toBe(mockClient);
  });
});
