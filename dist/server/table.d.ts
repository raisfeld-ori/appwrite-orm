import { Databases } from 'node-appwrite';
import { DatabaseSchema } from '../shared/types';
import { BaseTable, FilterOptions, QueryOptions } from '../shared/table';
export declare class ServerTable<T extends DatabaseSchema> extends BaseTable<T> {
    private db;
    constructor(databases: Databases, databaseId: string, collectionId: string, schema: T);
    /**
     * Override query method to use node-appwrite Query instead of web SDK Query
     */
    query(filters?: FilterOptions, options?: QueryOptions): Promise<any[]>;
    /**
     * Override find to use node-appwrite queries
     */
    find(queries: any[]): Promise<any[]>;
    /**
     * Override count to use node-appwrite Query
     */
    count(filters?: FilterOptions): Promise<number>;
    /**
     * Override findOne to use node-appwrite Query
     */
    findOne(queries: any[]): Promise<any | null>;
    /**
     * Server-specific method to create collection
     */
    createCollection(name?: string, permissions?: string[]): Promise<void>;
    /**
     * Server-specific method to delete collection
     */
    deleteCollection(): Promise<void>;
    /**
     * Bulk insert documents (server-only optimization)
     */
    bulkCreate(documents: Partial<Omit<any, '$id'>>[]): Promise<any[]>;
    /**
     * Bulk update documents (server-only optimization)
     */
    bulkUpdate(updates: {
        id: string;
        data: Partial<any>;
    }[]): Promise<any[]>;
    /**
     * Bulk delete documents (server-only optimization)
     */
    bulkDelete(ids: string[]): Promise<void>;
}
//# sourceMappingURL=table.d.ts.map