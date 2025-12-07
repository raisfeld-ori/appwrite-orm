import { Databases, Client } from 'node-appwrite';

/**
 * Wrapper class for Appwrite Databases that provides access to server-side API methods
 * In node-appwrite v20+, these methods are available directly on the Databases class
 */
export class DatabasesWrapper {
  private databases: Databases;

  constructor(databases: Databases) {
    this.databases = databases;
  }

  /**
   * Get all standard Databases methods (document operations, list operations, etc.)
   */
  get standard(): Databases {
    return this.databases;
  }

  // Database operations
  
  /**
   * Get a database by ID
   */
  async getDatabase(databaseId: string): Promise<any> {
    return this.databases.get(databaseId);
  }

  /**
   * Create a new database
   */
  async createDatabase(databaseId: string, name: string): Promise<any> {
    return this.databases.create(databaseId, name);
  }

  // Collection operations
  
  /**
   * Get a collection by ID
   */
  async getCollection(databaseId: string, collectionId: string): Promise<any> {
    return this.databases.getCollection(databaseId, collectionId);
  }

  /**
   * Create a new collection
   */
  async createCollection(
    databaseId: string,
    collectionId: string,
    name: string,
    permissions?: string[],
    documentSecurity: boolean = false
  ): Promise<any> {
    return this.databases.createCollection(databaseId, collectionId, name, permissions, documentSecurity);
  }

  /**
   * Delete a collection
   */
  async deleteCollection(databaseId: string, collectionId: string): Promise<void> {
    await this.databases.deleteCollection(databaseId, collectionId);
  }

  // Attribute operations
  
  /**
   * Create a string attribute
   */
  async createStringAttribute(
    databaseId: string,
    collectionId: string,
    key: string,
    size: number,
    required: boolean,
    defaultValue?: string | null,
    array: boolean = false
  ): Promise<any> {
    return this.databases.createStringAttribute(databaseId, collectionId, key, size, required, defaultValue || undefined, array);
  }

  /**
   * Create an integer attribute
   */
  async createIntegerAttribute(
    databaseId: string,
    collectionId: string,
    key: string,
    required: boolean,
    min?: number | null,
    max?: number | null,
    defaultValue?: number | null,
    array: boolean = false
  ): Promise<any> {
    return this.databases.createIntegerAttribute(
      databaseId, 
      collectionId, 
      key, 
      required, 
      min !== null && min !== undefined ? min : undefined, 
      max !== null && max !== undefined ? max : undefined, 
      defaultValue !== null && defaultValue !== undefined ? defaultValue : undefined, 
      array
    );
  }

  /**
   * Create a float attribute
   */
  async createFloatAttribute(
    databaseId: string,
    collectionId: string,
    key: string,
    required: boolean,
    min?: number | null,
    max?: number | null,
    defaultValue?: number | null,
    array: boolean = false
  ): Promise<any> {
    return this.databases.createFloatAttribute(
      databaseId, 
      collectionId, 
      key, 
      required, 
      min !== null && min !== undefined ? min : undefined, 
      max !== null && max !== undefined ? max : undefined, 
      defaultValue !== null && defaultValue !== undefined ? defaultValue : undefined, 
      array
    );
  }

  /**
   * Create a boolean attribute
   */
  async createBooleanAttribute(
    databaseId: string,
    collectionId: string,
    key: string,
    required: boolean,
    defaultValue?: boolean | null,
    array: boolean = false
  ): Promise<any> {
    return this.databases.createBooleanAttribute(
      databaseId, 
      collectionId, 
      key, 
      required, 
      defaultValue !== null && defaultValue !== undefined ? defaultValue : undefined, 
      array
    );
  }

  /**
   * Create a datetime attribute
   */
  async createDatetimeAttribute(
    databaseId: string,
    collectionId: string,
    key: string,
    required: boolean,
    defaultValue?: string | null,
    array: boolean = false
  ): Promise<any> {
    return this.databases.createDatetimeAttribute(databaseId, collectionId, key, required, defaultValue || undefined, array);
  }

  /**
   * Create an enum attribute
   */
  async createEnumAttribute(
    databaseId: string,
    collectionId: string,
    key: string,
    elements: string[],
    required: boolean,
    defaultValue?: string | null,
    array: boolean = false
  ): Promise<any> {
    return this.databases.createEnumAttribute(databaseId, collectionId, key, elements, required, defaultValue || undefined, array);
  }

  // Index operations

  /**
   * Create an index
   */
  async createIndex(
    databaseId: string,
    collectionId: string,
    key: string,
    type: string,
    attributes: string[],
    orders?: string[]
  ): Promise<any> {
    return this.databases.createIndex(databaseId, collectionId, key, type as any, attributes, orders as any);
  }

  /**
   * Delete an index
   */
  async deleteIndex(databaseId: string, collectionId: string, key: string): Promise<void> {
    await this.databases.deleteIndex(databaseId, collectionId, key);
  }

  /**
   * Delete an attribute
   */
  async deleteAttribute(databaseId: string, collectionId: string, key: string): Promise<void> {
    await this.databases.deleteAttribute(databaseId, collectionId, key);
  }

  /**
   * Update a string attribute
   */
  async updateStringAttribute(
    databaseId: string,
    collectionId: string,
    key: string,
    required: boolean,
    defaultValue?: string | null
  ): Promise<any> {
    const params: any = { databaseId, collectionId, key, required };
    if (required) {
      params.xdefault = null;
    } else {
      params.xdefault = defaultValue !== null && defaultValue !== undefined ? defaultValue : null;
    }
    return this.databases.updateStringAttribute(params);
  }

  /**
   * Update an integer attribute
   */
  async updateIntegerAttribute(
    databaseId: string,
    collectionId: string,
    key: string,
    required: boolean,
    min?: number | null,
    max?: number | null,
    defaultValue?: number | null
  ): Promise<any> {
    const params: any = { databaseId, collectionId, key, required };
    
    // Appwrite requires xdefault parameter in all cases
    // When required=true: must pass null (not undefined, not omitted)
    // When required=false: pass the value or null
    if (required) {
      params.xdefault = null;
    } else {
      params.xdefault = defaultValue !== null && defaultValue !== undefined ? defaultValue : null;
    }
    
    if (min !== null && min !== undefined) {
      params.min = min;
    }
    if (max !== null && max !== undefined) {
      params.max = max;
    }
    
    return this.databases.updateIntegerAttribute(params);
  }

  /**
   * Update a float attribute
   */
  async updateFloatAttribute(
    databaseId: string,
    collectionId: string,
    key: string,
    required: boolean,
    min?: number | null,
    max?: number | null,
    defaultValue?: number | null
  ): Promise<any> {
    const params: any = { databaseId, collectionId, key, required };
    
    if (required) {
      params.xdefault = null;
    } else {
      params.xdefault = defaultValue !== null && defaultValue !== undefined ? defaultValue : null;
    }
    
    if (min !== null && min !== undefined) {
      params.min = min;
    }
    if (max !== null && max !== undefined) {
      params.max = max;
    }
    
    return this.databases.updateFloatAttribute(params);
  }

  /**
   * Update a boolean attribute
   */
  async updateBooleanAttribute(
    databaseId: string,
    collectionId: string,
    key: string,
    required: boolean,
    defaultValue?: boolean | null
  ): Promise<any> {
    const params: any = { databaseId, collectionId, key, required };
    if (required) {
      params.xdefault = null;
    } else {
      params.xdefault = defaultValue !== null && defaultValue !== undefined ? defaultValue : null;
    }
    return this.databases.updateBooleanAttribute(params);
  }

  /**
   * Update a datetime attribute
   */
  async updateDatetimeAttribute(
    databaseId: string,
    collectionId: string,
    key: string,
    required: boolean,
    defaultValue?: string | null
  ): Promise<any> {
    const params: any = { databaseId, collectionId, key, required };
    if (required) {
      params.xdefault = null;
    } else {
      params.xdefault = defaultValue !== null && defaultValue !== undefined ? defaultValue : null;
    }
    return this.databases.updateDatetimeAttribute(params);
  }

  /**
   * Update an enum attribute
   */
  async updateEnumAttribute(
    databaseId: string,
    collectionId: string,
    key: string,
    elements: string[],
    required: boolean,
    defaultValue?: string | null
  ): Promise<any> {
    const params: any = { databaseId, collectionId, key, elements, required };
    if (required) {
      params.xdefault = null;
    } else {
      params.xdefault = defaultValue !== null && defaultValue !== undefined ? defaultValue : null;
    }
    return this.databases.updateEnumAttribute(params);
  }
}

/**
 * Wrapper class for Appwrite Client that provides access to server-side API methods
 */
export class ClientWrapper {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  /**
   * Get the standard Client instance
   */
  get standard(): Client {
    return this.client;
  }

  /**
   * Set the API key for server-side operations
   */
  setKey(key: string): this {
    (this.client as any).setKey(key);
    return this;
  }
}
