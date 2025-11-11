import { Databases, Client } from 'node-appwrite';
/**
 * Wrapper class for Appwrite Databases that provides access to server-side API methods
 * In node-appwrite v20+, these methods are available directly on the Databases class
 */
export declare class DatabasesWrapper {
    private databases;
    constructor(databases: Databases);
    /**
     * Get all standard Databases methods (document operations, list operations, etc.)
     */
    get standard(): Databases;
    /**
     * Get a database by ID
     */
    getDatabase(databaseId: string): Promise<any>;
    /**
     * Create a new database
     */
    createDatabase(databaseId: string, name: string): Promise<any>;
    /**
     * Get a collection by ID
     */
    getCollection(databaseId: string, collectionId: string): Promise<any>;
    /**
     * Create a new collection
     */
    createCollection(databaseId: string, collectionId: string, name: string, permissions?: string[], documentSecurity?: boolean): Promise<any>;
    /**
     * Delete a collection
     */
    deleteCollection(databaseId: string, collectionId: string): Promise<void>;
    /**
     * Create a string attribute
     */
    createStringAttribute(databaseId: string, collectionId: string, key: string, size: number, required: boolean, defaultValue?: string | null, array?: boolean): Promise<any>;
    /**
     * Create an integer attribute
     */
    createIntegerAttribute(databaseId: string, collectionId: string, key: string, required: boolean, min?: number | null, max?: number | null, defaultValue?: number | null, array?: boolean): Promise<any>;
    /**
     * Create a float attribute
     */
    createFloatAttribute(databaseId: string, collectionId: string, key: string, required: boolean, min?: number | null, max?: number | null, defaultValue?: number | null, array?: boolean): Promise<any>;
    /**
     * Create a boolean attribute
     */
    createBooleanAttribute(databaseId: string, collectionId: string, key: string, required: boolean, defaultValue?: boolean | null, array?: boolean): Promise<any>;
    /**
     * Create a datetime attribute
     */
    createDatetimeAttribute(databaseId: string, collectionId: string, key: string, required: boolean, defaultValue?: string | null, array?: boolean): Promise<any>;
    /**
     * Create an enum attribute
     */
    createEnumAttribute(databaseId: string, collectionId: string, key: string, elements: string[], required: boolean, defaultValue?: string | null, array?: boolean): Promise<any>;
}
/**
 * Wrapper class for Appwrite Client that provides access to server-side API methods
 */
export declare class ClientWrapper {
    private client;
    constructor(client: Client);
    /**
     * Get the standard Client instance
     */
    get standard(): Client;
    /**
     * Set the API key for server-side operations
     */
    setKey(key: string): this;
}
//# sourceMappingURL=appwrite-extended.d.ts.map