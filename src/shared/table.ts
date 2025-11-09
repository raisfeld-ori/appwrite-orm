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
type SchemaToType<T extends DatabaseSchema> = {
  [K in keyof T]: InferFieldType<T[K]>;
} & { $id: string };

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string[];
  select?: string[];
}

export interface FilterOptions {
  [key: string]: any;
}

export abstract class BaseTable<T extends DatabaseSchema> {
  protected databases: Databases;
  protected databaseId: string;
  protected collectionId: string;
  protected schema: T;

  constructor(
    databases: Databases,
    databaseId: string,
    collectionId: string,
    schema: T
  ) {
    this.databases = databases;
    this.databaseId = databaseId;
    this.collectionId = collectionId;
    this.schema = schema;
  }

  /**
   * Get a single document by ID (similar to SQLAlchemy's get)
   */
  async get(id: string): Promise<SchemaToType<T> | null> {
    try {
      const result = await this.databases.getDocument(
        this.databaseId,
        this.collectionId,
        id
      );
      return result as SchemaToType<T>;
    } catch (error: any) {
      if (error.code === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get a single document by ID, throw error if not found (similar to SQLAlchemy's get_or_404)
   */
  async getOrFail(id: string): Promise<SchemaToType<T>> {
    const result = await this.get(id);
    if (!result) {
      throw new Error(`Document with ID ${id} not found in collection ${this.collectionId}`);
    }
    return result;
  }

  /**
   * Query documents with filters (similar to SQLAlchemy's filter)
   */
  async query(filters?: FilterOptions, options?: QueryOptions): Promise<SchemaToType<T>[]> {
    const queries: string[] = [];

    // Build filter queries
    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
          queries.push(Query.equal(key, value));
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

    return result.documents as SchemaToType<T>[];
  }

  /**
   * Get all documents (similar to SQLAlchemy's all())
   */
  async all(options?: QueryOptions): Promise<SchemaToType<T>[]> {
    return this.query(undefined, options);
  }

  /**
   * Get first document matching filters (similar to SQLAlchemy's first())
   */
  async first(filters?: FilterOptions): Promise<SchemaToType<T> | null> {
    const results = await this.query(filters, { limit: 1 });
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Get first document or fail (similar to SQLAlchemy's first_or_404())
   */
  async firstOrFail(filters?: FilterOptions): Promise<SchemaToType<T>> {
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
    const queries: string[] = [];

    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
          queries.push(Query.equal(key, value));
        }
      }
    }

    const result = await this.databases.listDocuments(
      this.databaseId,
      this.collectionId,
      queries
    );

    return result.total;
  }

  /**
   * Create a new document (similar to SQLAlchemy's create)
   */
  async create(data: Partial<Omit<SchemaToType<T>, '$id'>>): Promise<SchemaToType<T>> {
    // Validate data against schema
    this.validateData(data, true);

    const result = await this.databases.createDocument(
      this.databaseId,
      this.collectionId,
      ID.unique(),
      data as any
    );

    return result as SchemaToType<T>;
  }

  /**
   * Update a document by ID
   */
  async update(id: string, data: Partial<Omit<SchemaToType<T>, '$id'>>): Promise<SchemaToType<T>> {
    // Validate data against schema (partial validation for updates)
    this.validateData(data, false);

    const result = await this.databases.updateDocument(
      this.databaseId,
      this.collectionId,
      id,
      data as any
    );

    return result as SchemaToType<T>;
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
  }

  /**
   * Find documents with more complex queries
   */
  async find(queries: string[]): Promise<SchemaToType<T>[]> {
    const result = await this.databases.listDocuments(
      this.databaseId,
      this.collectionId,
      queries
    );

    return result.documents as SchemaToType<T>[];
  }

  /**
   * Find one document with complex queries
   */
  async findOne(queries: string[]): Promise<SchemaToType<T> | null> {
    const queriesWithLimit = [...queries, Query.limit(1)];
    const results = await this.find(queriesWithLimit);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Validate data against schema
   */
  protected validateData(data: any, requireAll: boolean = false): void {
    const errors: ValidationError[] = [];

    for (const [fieldName, fieldDef] of Object.entries(this.schema)) {
      const value = data[fieldName];
      const fieldErrors = Validator.validateField(value, fieldDef, fieldName);
      errors.push(...fieldErrors);
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