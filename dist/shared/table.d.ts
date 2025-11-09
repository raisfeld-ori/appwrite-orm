import { Databases } from 'appwrite';
import { DatabaseSchema } from './types';
type InferFieldType<T> = T extends {
    type: infer U;
    required: true;
} ? U extends 'string' ? string : U extends 'number' ? number : U extends 'boolean' ? boolean : U extends 'Date' ? Date : U extends string[] ? U[number] : unknown : T extends {
    type: infer U;
} ? U extends 'string' ? string | undefined : U extends 'number' ? number | undefined : U extends 'boolean' ? boolean | undefined : U extends 'Date' ? Date | undefined : U extends string[] ? U[number] | undefined : unknown : unknown;
type SchemaToType<T extends DatabaseSchema> = {
    [K in keyof T]: InferFieldType<T[K]>;
} & {
    $id: string;
};
export interface QueryOptions {
    limit?: number;
    offset?: number;
    orderBy?: string[];
    select?: string[];
}
export interface FilterOptions {
    [key: string]: any;
}
export declare abstract class BaseTable<T extends DatabaseSchema> {
    protected databases: Databases;
    protected databaseId: string;
    protected collectionId: string;
    protected schema: T;
    constructor(databases: Databases, databaseId: string, collectionId: string, schema: T);
    /**
     * Get a single document by ID (similar to SQLAlchemy's get)
     */
    get(id: string): Promise<SchemaToType<T> | null>;
    /**
     * Get a single document by ID, throw error if not found (similar to SQLAlchemy's get_or_404)
     */
    getOrFail(id: string): Promise<SchemaToType<T>>;
    /**
     * Query documents with filters (similar to SQLAlchemy's filter)
     */
    query(filters?: FilterOptions, options?: QueryOptions): Promise<SchemaToType<T>[]>;
    /**
     * Get all documents (similar to SQLAlchemy's all())
     */
    all(options?: QueryOptions): Promise<SchemaToType<T>[]>;
    /**
     * Get first document matching filters (similar to SQLAlchemy's first())
     */
    first(filters?: FilterOptions): Promise<SchemaToType<T> | null>;
    /**
     * Get first document or fail (similar to SQLAlchemy's first_or_404())
     */
    firstOrFail(filters?: FilterOptions): Promise<SchemaToType<T>>;
    /**
     * Count documents matching filters (similar to SQLAlchemy's count())
     */
    count(filters?: FilterOptions): Promise<number>;
    /**
     * Create a new document (similar to SQLAlchemy's create)
     */
    create(data: Partial<Omit<SchemaToType<T>, '$id'>>): Promise<SchemaToType<T>>;
    /**
     * Update a document by ID
     */
    update(id: string, data: Partial<Omit<SchemaToType<T>, '$id'>>): Promise<SchemaToType<T>>;
    /**
     * Delete a document by ID
     */
    delete(id: string): Promise<void>;
    /**
     * Find documents with more complex queries
     */
    find(queries: string[]): Promise<SchemaToType<T>[]>;
    /**
     * Find one document with complex queries
     */
    findOne(queries: string[]): Promise<SchemaToType<T> | null>;
    /**
     * Validate data against schema
     */
    protected validateData(data: any, requireAll?: boolean): void;
}
export {};
//# sourceMappingURL=table.d.ts.map