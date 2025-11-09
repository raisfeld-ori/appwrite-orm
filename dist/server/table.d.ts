import { Databases } from 'appwrite';
import { DatabaseSchema } from '../shared/types';
import { BaseTable } from '../shared/table';
export declare class ServerTable<T extends DatabaseSchema> extends BaseTable<T> {
    constructor(databases: Databases, databaseId: string, collectionId: string, schema: T);
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