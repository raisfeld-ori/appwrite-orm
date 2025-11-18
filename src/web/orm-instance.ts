import { Databases, Query } from 'appwrite';
import { TableDefinition, DatabaseSchema, JoinOptions } from '../shared/types';
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
    private collectionIds: Map<string, string> = new Map(),
    private client?: any,
    private config?: any
  ) {
    // Initialize table instances
    for (const [name, schema] of schemas.entries()) {
      const collectionId = collectionIds.get(name) || name;
      const table = new WebTable(databases, databaseId, collectionId, schema, client, config);
      this.tables.set(name, table);
    }
  }

  /**
   * Get a table instance by name (similar to SQLAlchemy's table access)
   */
  table<K extends T[number]['name']>(name: K): WebTable<Extract<T[number], { name: K }>['schema'], any> {
    const table = this.tables.get(name);
    if (!table) {
      throw new Error(`Table ${name} not found`);
    }
    return table as any;
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
  async delete<K extends T[number]['name']>(collection: K, documentId: string): Promise<void> {
    return this.table(collection).delete(documentId);
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
    const queries = [Query.equal(referenceKey, foreignKeyValues)];
    
    if (filters2) {
      for (const [key, value] of Object.entries(filters2)) {
        if (value !== undefined && value !== null) {
          const valueArray = Array.isArray(value) ? value : [value];
          queries.push(Query.equal(key, valueArray));
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
   * Close all listeners across all tables (useful for test cleanup)
   */
  closeListeners(): void {
    Object.values(this.tables).forEach(table => {
      if (table && typeof table.closeListeners === 'function') {
        table.closeListeners();
      }
    });
  }
}