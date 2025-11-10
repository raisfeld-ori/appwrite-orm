import { Databases } from 'appwrite';
import { TableDefinition, DatabaseSchema } from '../shared/types';
import { WebTable } from './table';

// Type helper to create table map from table definitions
type CreateTableMap<T extends TableDefinition[]> = {
  [K in T[number]['name']]: WebTable<Extract<T[number], { name: K }>['schema']>;
};

export class WebORMInstance<T extends TableDefinition[]> {
  private tables: Map<string, WebTable<any>> = new Map();

  constructor(
    private databases: Databases,
    private databaseId: string,
    private schemas: Map<string, DatabaseSchema>,
    private collectionIds: Map<string, string> = new Map()
  ) {
    // Initialize table instances
    for (const [name, schema] of schemas.entries()) {
      const collectionId = collectionIds.get(name) || name;
      const table = new WebTable(databases, databaseId, collectionId, schema);
      this.tables.set(name, table);
    }
  }

  /**
   * Get a table instance by name (similar to SQLAlchemy's table access)
   */
  table<K extends T[number]['name']>(name: K): WebTable<Extract<T[number], { name: K }>['schema']> {
    const table = this.tables.get(name);
    if (!table) {
      throw new Error(`Table ${name} not found`);
    }
    return table;
  }

  /**
   * Legacy method - Create a new document with validation
   * @deprecated Use table(name).create() instead
   */
  async create<K extends T[number]['name']>(
    collection: K,
    data: any
  ): Promise<any> {
    return this.table(collection).create(data);
  }

  /**
   * Legacy method - Update a document with validation
   * @deprecated Use table(name).update() instead
   */
  async update<K extends T[number]['name']>(
    collection: K,
    documentId: string,
    data: any
  ): Promise<any> {
    return this.table(collection).update(documentId, data);
  }

  /**
   * Legacy method - Get a document by ID
   * @deprecated Use table(name).get() instead
   */
  async get<K extends T[number]['name']>(
    collection: K,
    documentId: string
  ): Promise<any> {
    return this.table(collection).get(documentId);
  }

  /**
   * Legacy method - List documents with optional queries
   * @deprecated Use table(name).query() or table(name).all() instead
   */
  async list<K extends T[number]['name']>(
    collection: K,
    queries?: string[]
  ): Promise<{
    documents: any[];
    total: number;
  }> {
    if (queries) {
      const documents = await this.table(collection).find(queries);
      return { documents, total: documents.length };
    } else {
      const documents = await this.table(collection).all();
      return { documents, total: documents.length };
    }
  }

  /**
   * Legacy method - Delete a document
   * @deprecated Use table(name).delete() instead
   */
  async delete(collection: string, documentId: string): Promise<void> {
    return this.table(collection as any).delete(documentId);
  }
}