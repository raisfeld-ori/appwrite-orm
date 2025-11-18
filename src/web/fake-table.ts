import { DatabaseSchema } from '../shared/types';
import { FakeDatabaseClient } from './fake-database';
import { Validator } from '../shared/utils';

/**
 * Fake table implementation for development mode
 * Mimics WebTable API but uses cookies instead of Appwrite
 */
export class FakeTable<T extends DatabaseSchema, TInterface = any> {
  private listeners: Map<string, ((event: any) => void)[]> = new Map();
  private lastSnapshot: any[] = [];
  private pollInterval?: NodeJS.Timeout;
  private updated: boolean = true;

  constructor(
    private fakeDb: FakeDatabaseClient,
    private collectionId: string,
    private schema: T
  ) {
    // Take initial snapshot
    this.updateSnapshot();
    
    // Start polling for changes every 100ms in development mode
    this.startPolling();
  }

  /**
   * Create a new document
   */
  async create(data: Partial<Omit<TInterface, '$id'>>): Promise<TInterface> {
    this.validateData(data, true);
    const doc = this.fakeDb.createDocument(this.collectionId, data as any, this.schema);
    
    // Invalidate cache and trigger events
    this.setUpdated(false);
    this.triggerEvent('create', doc);
    
    return doc as TInterface;
  }

  /**
   * Get a document by ID
   */
  async get(id: string): Promise<TInterface | null> {
    const doc = this.fakeDb.getDocument(this.collectionId, id);
    return doc as TInterface | null;
  }

  /**
   * Get a document by ID or throw error
   */
  async getOrFail(id: string): Promise<TInterface> {
    const doc = await this.get(id);
    if (!doc) {
      throw new Error(`Document with id ${id} not found`);
    }
    return doc;
  }

  /**
   * Update a document
   */
  async update(id: string, data: Partial<Omit<TInterface, '$id'>>): Promise<TInterface> {
    this.validateData(data, false);
    const doc = this.fakeDb.updateDocument(this.collectionId, id, data as any, this.schema);
    
    // Invalidate cache and trigger events
    this.setUpdated(false);
    this.triggerEvent('update', doc);
    
    return doc as TInterface;
  }

  /**
   * Delete a document
   */
  async delete(id: string): Promise<void> {
    // Get document before deletion for event
    const doc = this.fakeDb.getDocument(this.collectionId, id);
    
    this.fakeDb.deleteDocument(this.collectionId, id);
    
    // Invalidate cache and trigger events
    this.setUpdated(false);
    if (doc) {
      this.triggerEvent('delete', doc);
    }
  }

  /**
   * Query documents with filters
   */
  async query(filters?: Record<string, unknown>): Promise<TInterface[]> {
    const result = this.fakeDb.listDocuments(this.collectionId, filters);
    return result.documents as TInterface[];
  }

  /**
   * Get all documents
   */
  async all(): Promise<TInterface[]> {
    return this.query();
  }

  /**
   * Find documents with Appwrite-like queries (simplified for development)
   * Note: In development mode, only basic equality filters work through query()
   */
  async find(queries: string[]): Promise<TInterface[]> {
    console.warn('[AppwriteORM Development Mode] Advanced Appwrite queries are not fully supported. Use query() with simple filters instead.');
    return this.all();
  }

  /**
   * Find first document matching filter
   */
  async first(filters?: Record<string, unknown>): Promise<TInterface | null> {
    const results = await this.query(filters);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Find first document or throw error
   */
  async firstOrFail(filters?: Record<string, unknown>): Promise<TInterface> {
    const result = await this.first(filters);
    if (!result) {
      throw new Error('No document found matching the criteria');
    }
    return result;
  }

  /**
   * Find one document with Appwrite-like queries
   */
  async findOne(queries: string[]): Promise<TInterface | null> {
    return this.first();
  }

  /**
   * Count documents
   */
  async count(filters?: Record<string, unknown>): Promise<number> {
    const result = this.fakeDb.listDocuments(this.collectionId, filters);
    return result.total;
  }

  /**
   * Start polling for changes to simulate realtime
   */
  private startPolling(): void {
    this.pollInterval = setInterval(() => {
      this.checkForChanges();
    }, 1000); // Check every 1000ms (1 second)
  }

  /**
   * Update the current snapshot of data
   */
  private updateSnapshot(): void {
    const result = this.fakeDb.listDocuments(this.collectionId);
    this.lastSnapshot = [...result.documents];
  }

  /**
   * Check for changes and trigger events
   */
  private checkForChanges(): void {
    const result = this.fakeDb.listDocuments(this.collectionId);
    const currentDocs = result.documents;
    
    // Compare with last snapshot
    const lastDocsMap = new Map(this.lastSnapshot.map(doc => [doc.$id, doc]));
    const currentDocsMap = new Map(currentDocs.map(doc => [doc.$id, doc]));
    
    // Check for new documents (create events)
    for (const [id, doc] of currentDocsMap) {
      if (!lastDocsMap.has(id)) {
        this.triggerEvent('create', doc);
      }
    }
    
    // Check for deleted documents (delete events)
    for (const [id, doc] of lastDocsMap) {
      if (!currentDocsMap.has(id)) {
        this.triggerEvent('delete', doc);
      }
    }
    
    // Check for updated documents (update events)
    for (const [id, currentDoc] of currentDocsMap) {
      const lastDoc = lastDocsMap.get(id);
      if (lastDoc && JSON.stringify(currentDoc) !== JSON.stringify(lastDoc)) {
        this.triggerEvent('update', currentDoc);
      }
    }
    
    // Update snapshot
    this.lastSnapshot = [...currentDocs];
  }

  /**
   * Trigger an event for listeners
   */
  private triggerEvent(eventType: 'create' | 'update' | 'delete', document: any): void {
    const event = {
      events: [`databases.fake-db.collections.${this.collectionId}.documents.${eventType}`],
      channels: [`databases.fake-db.collections.${this.collectionId}.documents`],
      timestamp: Date.now(),
      payload: document
    };

    // Trigger for all document listeners
    const documentListeners = this.listeners.get('documents') || [];
    documentListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.warn('[FakeTable] Error in event listener:', error);
      }
    });

    // Trigger for specific document listeners
    const specificListeners = this.listeners.get(`documents.${document.$id}`) || [];
    specificListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.warn('[FakeTable] Error in event listener:', error);
      }
    });

    // Trigger for collection listeners
    const collectionEvent = {
      ...event,
      events: [`databases.fake-db.collections.${this.collectionId}.${eventType}`],
      channels: [`databases.fake-db.collections.${this.collectionId}`]
    };
    
    const collectionListeners = this.listeners.get('collection') || [];
    collectionListeners.forEach(listener => {
      try {
        listener(collectionEvent);
      } catch (error) {
        console.warn('[FakeTable] Error in event listener:', error);
      }
    });

    // Trigger for database listeners
    const databaseEvent = {
      ...event,
      events: [`databases.fake-db.${eventType}`],
      channels: [`databases.fake-db`]
    };
    
    const databaseListeners = this.listeners.get('database') || [];
    databaseListeners.forEach(listener => {
      try {
        listener(databaseEvent);
      } catch (error) {
        console.warn('[FakeTable] Error in event listener:', error);
      }
    });
  }

  /**
   * Add a listener to a channel
   */
  private addListener(channel: string, listener: (event: any) => void): () => void {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, []);
    }
    
    this.listeners.get(channel)!.push(listener);
    
    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(channel);
      if (listeners) {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
        
        // Clean up empty listener arrays
        if (listeners.length === 0) {
          this.listeners.delete(channel);
        }
      }
    };
  }

  /**
   * Realtime methods (functional in development mode with mock data)
   */
  listen(channel: string, onEvent: (event: any) => void): () => void {
    console.log(`[FakeTable] Listening to channel: databases.fake-db.collections.${this.collectionId}.${channel}`);
    return this.addListener(channel, onEvent);
  }

  listenToDocuments(onEvent: (event: any) => void): () => void {
    console.log(`[FakeTable] Listening to all documents in collection: ${this.collectionId}`);
    return this.addListener('documents', onEvent);
  }

  listenToDocument(documentId: string, onEvent: (event: any) => void): () => void {
    console.log(`[FakeTable] Listening to document: ${documentId} in collection: ${this.collectionId}`);
    return this.addListener(`documents.${documentId}`, onEvent);
  }

  listenToCollection(onEvent: (event: any) => void): () => void {
    console.log(`[FakeTable] Listening to collection: ${this.collectionId}`);
    return this.addListener('collection', onEvent);
  }

  listenToDatabase(onEvent: (event: any) => void): () => void {
    console.log(`[FakeTable] Listening to database events`);
    return this.addListener('database', onEvent);
  }

  /**
   * Cache management methods
   */
  isUpdated(): boolean {
    return this.updated;
  }

  setUpdated(updated: boolean): void {
    this.updated = updated;
  }

  /**
   * Close all listeners (for cleanup in tests)
   */
  closeListeners(): void {
    // Clear all listeners
    this.listeners.clear();
    
    // Stop polling
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = undefined;
    }
    
    console.log(`[FakeTable] Closed listeners and polling for collection: ${this.collectionId}`);
  }

  destroy(): void {
    this.closeListeners();
    console.log(`[FakeTable] Destroyed listeners and polling for collection: ${this.collectionId}`);
  }

  /**
   * Validate data against schema
   */
  private validateData(data: Record<string, unknown>, requireAll: boolean = false): void {
    const errors: string[] = [];

    // Only validate fields that are present in the data
    for (const [fieldName, value] of Object.entries(data)) {
      const fieldDef = this.schema[fieldName];
      if (fieldDef) {
        const fieldErrors = Validator.validateField(value, fieldDef, fieldName);
        if (fieldErrors.length > 0) {
          errors.push(...fieldErrors.map(e => `${e.field}: ${e.message}`));
        }
      }
    }

    if (requireAll) {
      // Check for missing required fields
      for (const [fieldName, fieldDef] of Object.entries(this.schema)) {
        if (fieldDef.required && !(fieldName in data)) {
          errors.push(`${fieldName}: Required field is missing`);
        }
      }
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }
}
