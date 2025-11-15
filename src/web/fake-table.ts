import { DatabaseSchema } from '../shared/types';
import { FakeDatabaseClient } from './fake-database';
import { Validator } from '../shared/utils';

/**
 * Fake table implementation for development mode
 * Mimics WebTable API but uses cookies instead of Appwrite
 */
export class FakeTable<T extends DatabaseSchema, TInterface = any> {
  constructor(
    private fakeDb: FakeDatabaseClient,
    private collectionId: string,
    private schema: T
  ) {}

  /**
   * Create a new document
   */
  async create(data: Partial<Omit<TInterface, '$id'>>): Promise<TInterface> {
    this.validateData(data, true);
    const doc = this.fakeDb.createDocument(this.collectionId, data as any, this.schema);
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
    return doc as TInterface;
  }

  /**
   * Delete a document
   */
  async delete(id: string): Promise<void> {
    this.fakeDb.deleteDocument(this.collectionId, id);
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
