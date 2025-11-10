import { Databases } from 'appwrite';
import { TableDefinition, DatabaseSchema } from '../shared/types';
import { ServerTable } from './table';
export declare class ServerORMInstance<T extends TableDefinition[]> {
    private databases;
    private databaseId;
    private schemas;
    private collectionIds;
    private tables;
    constructor(databases: Databases, databaseId: string, schemas: Map<string, DatabaseSchema>, collectionIds?: Map<string, string>);
    /**
     * Get a table instance by name (similar to SQLAlchemy's table access)
     */
    table<K extends T[number]['name']>(name: K): ServerTable<Extract<T[number], {
        name: K;
    }>['schema']>;
    /**
     * Legacy method - Create a new document
     * @deprecated Use table(name).create() instead
     */
    create<K extends T[number]['name']>(collection: K, data: any): Promise<any>;
    /**
     * Legacy method - Update a document
     * @deprecated Use table(name).update() instead
     */
    update<K extends T[number]['name']>(collection: K, documentId: string, data: any): Promise<any>;
    /**
     * Legacy method - Get a document by ID
     * @deprecated Use table(name).get() instead
     */
    get<K extends T[number]['name']>(collection: K, documentId: string): Promise<any>;
    /**
     * Legacy method - List documents with optional queries
     * @deprecated Use table(name).query() or table(name).all() instead
     */
    list<K extends T[number]['name']>(collection: K, queries?: string[]): Promise<{
        documents: any[];
        total: number;
    }>;
    /**
     * Legacy method - Delete a document
     * @deprecated Use table(name).delete() instead
     */
    delete(collection: string, documentId: string): Promise<void>;
    /**
     * Legacy method - Create a new collection (server-only feature)
     * @deprecated Use table(name).createCollection() instead
     */
    createCollection(collectionId: string, name: string, permissions?: string[]): Promise<void>;
    /**
     * Legacy method - Delete a collection (server-only feature)
     * @deprecated Use table(name).deleteCollection() instead
     */
    deleteCollection(collectionId: string): Promise<void>;
}
//# sourceMappingURL=orm-instance.d.ts.map