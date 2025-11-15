import { TableDefinition, DatabaseSchema, JoinOptions } from '../shared/types';
import { FakeDatabaseClient } from './fake-database';
import { FakeTable } from './fake-table';

/**
 * Fake ORM instance for development mode
 * Mimics WebORMInstance API but uses cookies instead of Appwrite
 */
export class FakeORMInstance<T extends TableDefinition[]> {
  private tables: Map<string, FakeTable<any>> = new Map();
  private fakeDb: FakeDatabaseClient;

  constructor(
    databaseId: string,
    private schemas: Map<string, DatabaseSchema>,
    private collectionIds: Map<string, string> = new Map()
  ) {
    this.fakeDb = new FakeDatabaseClient(databaseId);

    // Initialize table instances
    for (const [name, schema] of schemas.entries()) {
      const collectionId = collectionIds.get(name) || name;
      const table = new FakeTable(this.fakeDb, collectionId, schema);
      this.tables.set(name, table);
    }
  }

  /**
   * Get a table instance by name
   */
  table<K extends T[number]['name']>(name: K): FakeTable<Extract<T[number], { name: K }>['schema'], any> {
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
    data: any
  ): Promise<any> {
    return this.table(collection).create(data);
  }

  /**
   * Legacy method - Update a document
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
   * Legacy method - List documents
   * @deprecated Use table(name).query() or table(name).all() instead
   */
  async list<K extends T[number]['name']>(
    collection: K,
    queries?: string[]
  ): Promise<{
    documents: any[];
    total: number;
  }> {
    const documents = await this.table(collection).all();
    return { documents, total: documents.length };
  }

  /**
   * Legacy method - Delete a document
   * @deprecated Use table(name).delete() instead
   */
  async delete<K extends T[number]['name']>(collection: K, documentId: string): Promise<void> {
    return this.table(collection).delete(documentId);
  }

  /**
   * Join two collections (simplified in development mode)
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

    // Fetch all documents from second collection and filter manually
    const allDocs2 = await table2.query(filters2);
    const referenceKey = options.referenceKey || '$id';
    
    const docs2 = allDocs2.filter((doc: any) => 
      foreignKeyValues.includes(doc[referenceKey])
    );

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
   * Left join two collections
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
    return this.join(collection1, collection2, options, filters1, filters2);
  }

  /**
   * Inner join two collections
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
   * Clear all development data
   */
  clearAll(): void {
    this.fakeDb.clearDatabase();
  }
}
