import { Databases, ID, Query } from 'appwrite';
import { DatabaseSchema, ValidationError, ORMValidationError } from './types';
import { Validator } from './utils';

// Type helper to infer TypeScript type from DatabaseField
type InferFieldType<T> = T extends { type: infer U; required: true }
  ? U extends 'string' ? string
  : U extends 'number' ? number
  : U extends 'boolean' ? boolean
  : U extends 'Date' ? Date
  : U extends string[] ? U[number]
  : unknown
  : T extends { type: infer U }
  ? U extends 'string' ? string | undefined
  : U extends 'number' ? number | undefined
  : U extends 'boolean' ? boolean | undefined
  : U extends 'Date' ? Date | undefined
  : U extends string[] ? U[number] | undefined
  : unknown
  : unknown;

// Convert schema to TypeScript type
export type SchemaToType<T extends DatabaseSchema> = {
  [K in keyof T]: InferFieldType<T[K]>;
} & { $id: string };

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string[];
  select?: string[];
}

export interface FilterOptions {
  [key: string]: unknown;
}

// Cache interface for storing query results
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  queryKey: string;
}

export abstract class BaseTable<T extends DatabaseSchema, TInterface = SchemaToType<T>> {
  protected databases: Databases;
  protected databaseId: string;
  protected collectionId: string;
  protected schema: T;
  protected client?: any; // Appwrite Client instance
  protected config?: any; // ORM Config
  
  // Cache and update tracking
  private cache: Map<string, CacheEntry<any>> = new Map();
  private updated: boolean = true; // Initially true to force first query
  private realtimeUnsubscribe?: () => void;
  private manualListeners: (() => void)[] = [];
  private messages: string[] = [];

  constructor(
    databases: Databases,
    databaseId: string,
    collectionId: string,
    schema: T,
    client?: any,
    config?: any
  ) {
    this.databases = databases;
    this.databaseId = databaseId;
    this.collectionId = collectionId;
    this.schema = schema;
    this.client = client;
    this.config = config;
    
    // Set up automatic realtime listening for cache invalidation
    this.setupRealtimeTracking();
  }

  /**
   * Get a single document by ID (similar to SQLAlchemy's get)
   */
  async get(id: string): Promise<TInterface | null> {
    const cacheKey = this.generateCacheKey('get', [id]);
    
    // Try to get from cache first
    const cached = this.getFromCache<TInterface | null>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    try {
      const result = await this.databases.getDocument(
        this.databaseId,
        this.collectionId,
        id
      );
      const typedResult = result as TInterface;
      
      // Cache the result
      this.setCache(cacheKey, typedResult);
      
      return typedResult;
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && (error as any).code === 404) {
        // Cache null result for 404s
        this.setCache(cacheKey, null);
        return null;
      }
      throw error;
    }
  }

  /**
   * Get a single document by ID, throw error if not found (similar to SQLAlchemy's get_or_404)
   */
  async getOrFail(id: string): Promise<TInterface> {
    const result = await this.get(id);
    if (!result) {
      throw new Error(`Document with ID ${id} not found in collection ${this.collectionId}`);
    }
    return result;
  }

  /**
   * Query documents with filters (similar to SQLAlchemy's filter)
   */
  async query(filters?: FilterOptions, options?: QueryOptions): Promise<TInterface[]> {
    const cacheKey = this.generateCacheKey('query', [filters, options]);
    
    // Try to get from cache first
    const cached = this.getFromCache<TInterface[]>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    const queries: string[] = [];

    // Build filter queries
    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
          // Wrap value in array if it isn't already (Appwrite Query API expects arrays)
          const valueArray = Array.isArray(value) ? value : [value];
          queries.push(Query.equal(key, valueArray));
        }
      }
    }

    // Add ordering
    if (options?.orderBy) {
      options.orderBy.forEach(order => {
        if (order.startsWith('-')) {
          queries.push(Query.orderDesc(order.substring(1)));
        } else {
          queries.push(Query.orderAsc(order));
        }
      });
    }

    // Add pagination
    if (options?.limit) {
      queries.push(Query.limit(options.limit));
    }
    if (options?.offset) {
      queries.push(Query.offset(options.offset));
    }

    // Add select fields
    if (options?.select) {
      queries.push(Query.select(options.select));
    }

    const result = await this.databases.listDocuments(
      this.databaseId,
      this.collectionId,
      queries
    );

    const typedResult = result.documents as TInterface[];
    
    // Cache the result
    this.setCache(cacheKey, typedResult);

    return typedResult;
  }

  /**
   * Get all documents (similar to SQLAlchemy's all())
   */
  async all(options?: QueryOptions): Promise<TInterface[]> {
    const cacheKey = this.generateCacheKey('all', [options]);
    
    // Try to get from cache first
    const cached = this.getFromCache<TInterface[]>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    const result = await this.query(undefined, options);
    
    // Cache the result (query method already caches, but we cache with 'all' key too)
    this.setCache(cacheKey, result);
    
    return result;
  }

  /**
   * Get first document matching filters (similar to SQLAlchemy's first())
   */
  async first(filters?: FilterOptions): Promise<TInterface | null> {
    const cacheKey = this.generateCacheKey('first', [filters]);
    
    // Try to get from cache first
    const cached = this.getFromCache<TInterface | null>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    const results = await this.query(filters, { limit: 1 });
    const result = results.length > 0 ? results[0] : null;
    
    // Cache the result
    this.setCache(cacheKey, result);
    
    return result;
  }

  /**
   * Get first document or fail (similar to SQLAlchemy's first_or_404())
   */
  async firstOrFail(filters?: FilterOptions): Promise<TInterface> {
    const result = await this.first(filters);
    if (!result) {
      throw new Error(`No document found in collection ${this.collectionId} with given filters`);
    }
    return result;
  }

  /**
   * Count documents matching filters (similar to SQLAlchemy's count())
   */
  async count(filters?: FilterOptions): Promise<number> {
    const cacheKey = this.generateCacheKey('count', [filters]);
    
    // Try to get from cache first
    const cached = this.getFromCache<number>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    const queries: string[] = [];

    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
          const valueArray = Array.isArray(value) ? value : [value];
          queries.push(Query.equal(key, valueArray));
        }
      }
    }

    const result = await this.databases.listDocuments(
      this.databaseId,
      this.collectionId,
      queries
    );

    const count = result.total;
    
    // Cache the result
    this.setCache(cacheKey, count);

    return count;
  }

  /**
   * Create a new document (similar to SQLAlchemy's create)
   */
  async create(data: Partial<Omit<SchemaToType<T>, '$id'>>): Promise<TInterface> {
    // Validate data against schema
    this.validateData(data, true);

    const result = await this.databases.createDocument(
      this.databaseId,
      this.collectionId,
      ID.unique(),
      data as Record<string, unknown>
    );

    // Invalidate cache since data has changed
    this.setUpdated(false);

    return result as TInterface;
  }

  /**
   * Update a document by ID
   */
  async update(id: string, data: Partial<Omit<SchemaToType<T>, '$id'>>): Promise<TInterface> {
    // Validate data against schema (partial validation for updates)
    this.validateData(data, false);

    const result = await this.databases.updateDocument(
      this.databaseId,
      this.collectionId,
      id,
      data as Record<string, unknown>
    );

    // Invalidate cache since data has changed
    this.setUpdated(false);

    return result as TInterface;
  }

  /**
   * Delete a document by ID
   */
  async delete(id: string): Promise<void> {
    await this.databases.deleteDocument(
      this.databaseId,
      this.collectionId,
      id
    );

    // Invalidate cache since data has changed
    this.setUpdated(false);
  }

  /**
   * Find documents with more complex queries
   */
  async find(queries: string[]): Promise<TInterface[]> {
    const cacheKey = this.generateCacheKey('find', [queries]);
    
    // Try to get from cache first
    const cached = this.getFromCache<TInterface[]>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    const result = await this.databases.listDocuments(
      this.databaseId,
      this.collectionId,
      queries
    );

    const typedResult = result.documents as TInterface[];
    
    // Cache the result
    this.setCache(cacheKey, typedResult);

    return typedResult;
  }

  /**
   * Find one document with complex queries
   */
  async findOne(queries: string[]): Promise<TInterface | null> {
    const cacheKey = this.generateCacheKey('findOne', [queries]);
    
    // Try to get from cache first
    const cached = this.getFromCache<TInterface | null>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    const queriesWithLimit = [...queries, Query.limit(1)];
    const results = await this.find(queriesWithLimit);
    const result = results.length > 0 ? results[0] : null;
    
    // Cache the result
    this.setCache(cacheKey, result);
    
    return result;
  }

  /**
   * Set up automatic realtime tracking for cache invalidation
   */
  private setupRealtimeTracking(): void {
    if (!this.client || typeof this.client.subscribe !== 'function') {
      return; // No client available or client doesn't support realtime, skip realtime tracking
    }

    try {
      // Listen to all database events that could affect this collection
      const channels = [
        `databases.${this.databaseId}.collections.${this.collectionId}.documents`,
        `databases.${this.databaseId}.collections.${this.collectionId}`,
        `databases.${this.databaseId}`
      ];

      // Subscribe to multiple channels for comprehensive event coverage
      this.realtimeUnsubscribe = this.client.subscribe(channels, (event: any) => {
        this.handleRealtimeEvent(event);
      });
    } catch (error) {
      // Record failure for diagnostics (do not log to console)
      this.messages.push(`Realtime tracking setup failed: ${String(error)}`);
    }
  }

  /**
   * Handle realtime events for cache invalidation
   */
  private handleRealtimeEvent(event: any): void {
    // Check if the event affects this collection
    const affectsThisCollection = event.events?.some((eventName: string) => {
      return eventName.includes(`collections.${this.collectionId}`) ||
             eventName.includes(`databases.${this.databaseId}`);
    });

    if (affectsThisCollection) {
      // Mark as updated (data has changed)
      this.updated = false;
      
      // Clear cache since data has changed
      this.clearCache();
    }
  }

  /**
   * Generate a cache key for a query
   */
  private generateCacheKey(method: string, params: any[]): string {
    return `${method}:${JSON.stringify(params)}`;
  }

  /**
   * Get data from cache if available and valid
   */
  private getFromCache<R>(cacheKey: string): R | null {
    if (!this.updated) {
      // Data has changed, cache is invalid
      return null;
    }

    const entry = this.cache.get(cacheKey);
    if (!entry) {
      return null;
    }

    // Optional: Add TTL (time-to-live) check
    const maxAge = 5 * 60 * 1000; // 5 minutes
    if (Date.now() - entry.timestamp > maxAge) {
      this.cache.delete(cacheKey);
      return null;
    }

    return entry.data;
  }

  /**
   * Store data in cache
   */
  private setCache<R>(cacheKey: string, data: R): void {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      queryKey: cacheKey
    });
    
    // Mark as updated (cache is now fresh)
    this.updated = true;
  }

  /**
   * Clear all cache entries
   */
  private clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get the current updated status
   */
  public isUpdated(): boolean {
    return this.updated;
  }

  /** Return collected internal messages (warnings, diagnostics) */
  public getMessages(): string[] {
    return [...this.messages];
  }
  /**
   * Manually mark data as updated or not updated
   */
  public setUpdated(updated: boolean): void {
    this.updated = updated;
    if (!updated) {
      this.clearCache();
    }
  }

  /**
   * Listen to realtime events for this collection
   * @param channel - The channel to listen to (e.g., 'documents', 'documents.{documentId}')
   * @param onEvent - Callback function to handle events
   * @returns A function to unsubscribe from the channel
   */
  listen(channel: string, onEvent: (event: any) => void): () => void {
    if (!this.client || typeof this.client.subscribe !== 'function') {
      throw new Error('Client not available for realtime functionality. Make sure client is passed to the table constructor.');
    }

    // Construct the full channel path
    const fullChannel = `databases.${this.databaseId}.collections.${this.collectionId}.${channel}`;
    
    // Subscribe to the channel
    const unsubscribe = this.client.subscribe(fullChannel, onEvent);
    
    // Track this listener for cleanup
    this.manualListeners.push(unsubscribe);
    
    // Return a wrapped unsubscribe function that also removes from tracking
    return () => {
      const index = this.manualListeners.indexOf(unsubscribe);
      if (index > -1) {
        this.manualListeners.splice(index, 1);
      }
      unsubscribe();
    };
  }

  /**
   * Listen to all document events in this collection
   * @param onEvent - Callback function to handle events
   * @returns A function to unsubscribe from the channel
   */
  listenToDocuments(onEvent: (event: any) => void): () => void {
    return this.listen('documents', onEvent);
  }

  /**
   * Listen to events for a specific document in this collection
   * @param documentId - The ID of the document to listen to
   * @param onEvent - Callback function to handle events
   * @returns A function to unsubscribe from the channel
   */
  listenToDocument(documentId: string, onEvent: (event: any) => void): () => void {
    return this.listen(`documents.${documentId}`, onEvent);
  }

  /**
   * Listen to database-level events
   * @param onEvent - Callback function to handle events
   * @returns A function to unsubscribe from the channel
   */
  listenToDatabase(onEvent: (event: any) => void): () => void {
    if (!this.client || typeof this.client.subscribe !== 'function') {
      throw new Error('Client not available for realtime functionality. Make sure client is passed to the table constructor.');
    }

    const channel = `databases.${this.databaseId}`;
    const unsubscribe = this.client.subscribe(channel, onEvent);
    
    // Track this listener for cleanup
    this.manualListeners.push(unsubscribe);
    
    // Return a wrapped unsubscribe function that also removes from tracking
    return () => {
      const index = this.manualListeners.indexOf(unsubscribe);
      if (index > -1) {
        this.manualListeners.splice(index, 1);
      }
      unsubscribe();
    };
  }

  /**
   * Listen to collection-level events
   * @param onEvent - Callback function to handle events
   * @returns A function to unsubscribe from the channel
   */
  listenToCollection(onEvent: (event: any) => void): () => void {
    if (!this.client || typeof this.client.subscribe !== 'function') {
      throw new Error('Client not available for realtime functionality. Make sure client is passed to the table constructor.');
    }

    const channel = `databases.${this.databaseId}.collections.${this.collectionId}`;
    const unsubscribe = this.client.subscribe(channel, onEvent);
    
    // Track this listener for cleanup
    this.manualListeners.push(unsubscribe);
    
    // Return a wrapped unsubscribe function that also removes from tracking
    return () => {
      const index = this.manualListeners.indexOf(unsubscribe);
      if (index > -1) {
        this.manualListeners.splice(index, 1);
      }
      unsubscribe();
    };
  }

  /**
   * Close all manual listeners (for cleanup in tests)
   */
  public closeListeners(): void {
    // Close all manual listeners
    this.manualListeners.forEach(unsubscribe => {
      try {
        unsubscribe();
      } catch (error) {
        // Silently ignore errors during cleanup
      }
    });
    this.manualListeners = [];
  }

  /**
   * Clean up realtime subscriptions
   */
  public destroy(): void {
    if (this.realtimeUnsubscribe) {
      this.realtimeUnsubscribe();
    }
    this.closeListeners();
    this.clearCache();
  }

  /**
   * Validate data against schema
   */
  protected validateData(data: Record<string, unknown>, requireAll: boolean = false): void {
    const errors: ValidationError[] = [];

    // Only validate fields that are present in the data
    for (const [fieldName, value] of Object.entries(data)) {
      const fieldDef = this.schema[fieldName];
      if (fieldDef) {
        const fieldErrors = Validator.validateField(value, fieldDef, fieldName);
        errors.push(...fieldErrors);
      }
    }

    if (requireAll) {
      // Check for missing required fields
      for (const [fieldName, fieldDef] of Object.entries(this.schema)) {
        if (fieldDef.required && !(fieldName in data)) {
          errors.push({
            field: fieldName,
            message: 'Required field is missing'
          });
        }
      }
    }

    if (errors.length > 0) {
      throw new ORMValidationError(errors);
    }
  }
}