import { Databases, Models } from 'node-appwrite';
import { TableDefinition, DatabaseSchema } from '../shared/types';
import { ServerTable } from './table';

// Type helper to create table map from table definitions
type CreateTableMap<T extends TableDefinition[]> = {
  [K in T[number]['name']]: ServerTable<Extract<T[number], { name: K }>['schema']>;
};

export class ServerORMInstance<T extends TableDefinition[]> {
  private tables: Map<string, ServerTable<DatabaseSchema>> = new Map();

  constructor(
    private databases: Databases,
    private databaseId: string,
    private schemas: Map<string, DatabaseSchema>,
    private collectionIds: Map<string, string> = new Map()
  ) {
    // Initialize table instances
    for (const [name, schema] of schemas.entries()) {
      const collectionId = collectionIds.get(name) || name;
      const table = new ServerTable(databases, databaseId, collectionId, schema);
      this.tables.set(name, table);
    }
  }

  /**
   * Get a table instance by name (similar to SQLAlchemy's table access)
   */
  table<K extends T[number]['name']>(name: K): ServerTable<Extract<T[number], { name: K }>['schema']> {
    const table = this.tables.get(name);
    if (!table) {
      throw new Error(`Table ${name} not found`);
    }
    return table;
  }

  /**
   * Legacy method - Create a new document
   * @deprecated Use table(name).create() instead
   */
  async create<K extends T[number]['name']>(
    collection: K,
    data: Record<string, unknown>
  ): Promise<Models.Document> {
    return this.table(collection).create(data as any) as Promise<Models.Document>;
  }

  /**
   * Legacy method - Update a document
   * @deprecated Use table(name).update() instead
   */
  async update<K extends T[number]['name']>(
    collection: K,
    documentId: string,
    data: Record<string, unknown>
  ): Promise<Models.Document> {
    return this.table(collection).update(documentId, data as any) as Promise<Models.Document>;
  }

  /**
   * Legacy method - Get a document by ID
   * @deprecated Use table(name).get() instead
   */
  async get<K extends T[number]['name']>(
    collection: K,
    documentId: string
  ): Promise<Models.Document | null> {
    return this.table(collection).get(documentId) as Promise<Models.Document | null>;
  }

  /**
   * Legacy method - List documents with optional queries
   * @deprecated Use table(name).query() or table(name).all() instead
   */
  async list<K extends T[number]['name']>(
    collection: K,
    queries?: string[]
  ): Promise<{
    documents: Models.Document[];
    total: number;
  }> {
    if (queries) {
      const documents = await this.table(collection).find(queries);
      return { documents: documents as Models.Document[], total: documents.length };
    } else {
      const documents = await this.table(collection).all();
      return { documents: documents as Models.Document[], total: documents.length };
    }
  }

  /**
   * Legacy method - Delete a document
   * @deprecated Use table(name).delete() instead
   */
  async delete<K extends T[number]['name']>(collection: K, documentId: string): Promise<void> {
    return this.table(collection).delete(documentId);
  }

  /**
   * Legacy method - Create a new collection (server-only feature)
   * @deprecated Use table(name).createCollection() instead
   */
  async createCollection<K extends T[number]['name']>(
    collectionId: K,
    name: string,
    permissions?: string[]
  ): Promise<void> {
    return this.table(collectionId).createCollection(name, permissions);
  }

  /**
   * Legacy method - Delete a collection (server-only feature)
   * @deprecated Use table(name).deleteCollection() instead
   */
  async deleteCollection<K extends T[number]['name']>(collectionId: K): Promise<void> {
    return this.table(collectionId).deleteCollection();
  }
}