import { Databases, Models, Query as NodeQuery } from 'node-appwrite';
import { TableDefinition, DatabaseSchema, JoinOptions } from '../shared/types';
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
    private collectionIds: Map<string, string> = new Map(),
    private migration?: any,
    private tableDefinitions?: T
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
  table<K extends T[number]['name']>(name: K): ServerTable<Extract<T[number], { name: K }>['schema'], any> {
    const table = this.tables.get(name);
    if (!table) {
      throw new Error(`Table ${name} not found`);
    }
    return table as any;
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

  /**
   * Join two collections by fetching related documents
   * This performs a client-side join by fetching documents from both collections
   */
  async join<
    K1 extends T[number]['name'],
    K2 extends T[number]['name']
  >(
    collection1: K1,
    collection2: K2,
    options: JoinOptions,
    filters1?: Record<string, unknown>,
    filters2?: Record<string, unknown>
  ): Promise<any[]> {
    const table1 = this.table(collection1);
    const table2 = this.table(collection2);
    
    // Fetch documents from first collection
    const docs1 = await table1.query(filters1);
    
    if (docs1.length === 0) {
      return [];
    }

    // Extract foreign key values
    const foreignKeyValues = docs1
      .map((doc: any) => doc[options.foreignKey])
      .filter((val: any) => val !== undefined && val !== null);

    if (foreignKeyValues.length === 0) {
      return docs1.map((doc: any) => ({
        ...doc,
        [options.as || collection2]: null
      }));
    }

    // Fetch related documents from second collection
    const referenceKey = options.referenceKey || '$id';
    const queries = [NodeQuery.equal(referenceKey, foreignKeyValues)];
    
    if (filters2) {
      for (const [key, value] of Object.entries(filters2)) {
        if (value !== undefined && value !== null) {
          const valueArray = Array.isArray(value) ? value : [value];
          queries.push(NodeQuery.equal(key, valueArray));
        }
      }
    }

    const docs2 = await table2.find(queries);

    // Create a map for quick lookup
    const docs2Map = new Map();
    docs2.forEach((doc: any) => {
      const key = doc[referenceKey];
      if (!docs2Map.has(key)) {
        docs2Map.set(key, []);
      }
      docs2Map.get(key).push(doc);
    });

    // Merge results
    const joinAlias = options.as || collection2;
    return docs1.map((doc: any) => {
      const foreignKeyValue = doc[options.foreignKey];
      const relatedDocs = docs2Map.get(foreignKeyValue) || [];
      
      return {
        ...doc,
        [joinAlias]: relatedDocs.length === 1 ? relatedDocs[0] : relatedDocs.length > 0 ? relatedDocs : null
      };
    });
  }

  /**
   * Left join two collections - includes all documents from collection1 even if no match in collection2
   */
  async leftJoin<
    K1 extends T[number]['name'],
    K2 extends T[number]['name']
  >(
    collection1: K1,
    collection2: K2,
    options: JoinOptions,
    filters1?: Record<string, unknown>,
    filters2?: Record<string, unknown>
  ): Promise<any[]> {
    // Left join is the default behavior of join method
    return this.join(collection1, collection2, options, filters1, filters2);
  }

  /**
   * Inner join two collections - only includes documents where there's a match in both collections
   */
  async innerJoin<
    K1 extends T[number]['name'],
    K2 extends T[number]['name']
  >(
    collection1: K1,
    collection2: K2,
    options: JoinOptions,
    filters1?: Record<string, unknown>,
    filters2?: Record<string, unknown>
  ): Promise<any[]> {
    const results = await this.join(collection1, collection2, options, filters1, filters2);
    const joinAlias = options.as || collection2;
    
    // Filter out results where joined data is null
    return results.filter((doc: any) => doc[joinAlias] !== null);
  }

  /**
   * Export schema to SQL format
   * @returns SQL CREATE TABLE statements as a string
   * @throws Error if migration instance is not available
   */
  exportToSQL(): string {
    if (!this.migration || !this.tableDefinitions) {
      throw new Error('Export functionality requires migration instance and table definitions');
    }
    return this.migration.exportToSQL(this.tableDefinitions);
  }

  /**
   * Export schema to Firebase format
   * @returns Firebase security rules and structure as a JSON string
   * @throws Error if migration instance is not available
   */
  exportToFirebase(): string {
    if (!this.migration || !this.tableDefinitions) {
      throw new Error('Export functionality requires migration instance and table definitions');
    }
    return this.migration.exportToFirebase(this.tableDefinitions);
  }

  /**
   * Export schema to text format
   * @returns Human-readable text description of the schema
   * @throws Error if migration instance is not available
   */
  exportToText(): string {
    if (!this.migration || !this.tableDefinitions) {
      throw new Error('Export functionality requires migration instance and table definitions');
    }
    return this.migration.exportToText(this.tableDefinitions);
  }
}