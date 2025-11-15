import { Databases, Query, Models } from 'node-appwrite';
import { DatabaseSchema, IndexDefinition } from '../shared/types';
import { BaseTable, FilterOptions, QueryOptions, SchemaToType } from '../shared/table';
import { DatabasesWrapper } from './appwrite-extended';

// Type for node-appwrite query parameters
type QueryType = string;

export class ServerTable<T extends DatabaseSchema, TInterface = SchemaToType<T>> extends BaseTable<T, TInterface> {
  private db: DatabasesWrapper;

  constructor(
    databases: Databases,
    databaseId: string,
    collectionId: string,
    schema: T
  ) {
    // Type assertion needed because node-appwrite and appwrite have compatible but different types
    super(databases as any, databaseId, collectionId, schema);
    this.db = new DatabasesWrapper(databases);
  }

  /**
   * Override query method to use node-appwrite Query instead of web SDK Query
   */
  async query(filters?: FilterOptions, options?: QueryOptions): Promise<TInterface[]> {
    const queries: QueryType[] = [];

    // Build filter queries using node-appwrite Query
    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
          // Wrap value in array if it isn't already
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

    return result.documents as TInterface[];
  }

  /**
   * Override find to use node-appwrite queries
   */
  async find(queries: QueryType[]): Promise<TInterface[]> {
    const result = await this.databases.listDocuments(
      this.databaseId,
      this.collectionId,
      queries
    );

    return result.documents as TInterface[];
  }

  /**
   * Override count to use node-appwrite Query
   */
  async count(filters?: FilterOptions): Promise<number> {
    const queries: QueryType[] = [];

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

    return result.total;
  }

  /**
   * Override findOne to use node-appwrite Query
   */
  async findOne(queries: QueryType[]): Promise<TInterface | null> {
    const queriesWithLimit = [...queries, Query.limit(1)];
    const results = await this.find(queriesWithLimit);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Server-specific method to create collection
   */
  async createCollection(name?: string, permissions?: string[]): Promise<void> {
    await this.db.createCollection(
      this.databaseId,
      this.collectionId,
      name || this.collectionId,
      permissions
    );
  }

  /**
   * Server-specific method to delete collection
   */
  async deleteCollection(): Promise<void> {
    await this.db.deleteCollection(this.databaseId, this.collectionId);
  }

  /**
   * Bulk insert documents (server-only optimization)
   */
  async bulkCreate(documents: Partial<Omit<Models.Document, '$id'>>[]): Promise<Models.Document[]> {
    const results: Models.Document[] = [];
    for (const doc of documents) {
      const result = await this.create(doc as Partial<Omit<any, '$id'>>);
      results.push(result as Models.Document);
    }
    return results;
  }

  /**
   * Bulk update documents (server-only optimization)
   */
  async bulkUpdate(updates: { id: string; data: Partial<Record<string, unknown>> }[]): Promise<Models.Document[]> {
    const results: Models.Document[] = [];
    for (const update of updates) {
      const result = await this.update(update.id, update.data as Partial<Omit<any, '$id'>>);
      results.push(result as Models.Document);
    }
    return results;
  }

  /**
   * Bulk delete documents (server-only optimization)
   */
  async bulkDelete(ids: string[]): Promise<void> {
    for (const id of ids) {
      await this.delete(id);
    }
  }

  /**
   * Create an index on this collection (server-only feature)
   */
  async createIndex(index: IndexDefinition): Promise<void> {
    await this.db.createIndex(
      this.databaseId,
      this.collectionId,
      index.key,
      index.type,
      index.attributes,
      index.orders
    );
  }

  /**
   * Delete an index from this collection (server-only feature)
   */
  async deleteIndex(key: string): Promise<void> {
    await this.db.deleteIndex(this.databaseId, this.collectionId, key);
  }

  /**
   * List all indexes for this collection (server-only feature)
   */
  async listIndexes(): Promise<any[]> {
    const collection = await this.db.getCollection(this.databaseId, this.collectionId);
    return collection.indexes || [];
  }
}