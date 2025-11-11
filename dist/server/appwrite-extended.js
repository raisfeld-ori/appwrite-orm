"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientWrapper = exports.DatabasesWrapper = void 0;
/**
 * Wrapper class for Appwrite Databases that provides access to server-side API methods
 * In node-appwrite v20+, these methods are available directly on the Databases class
 */
class DatabasesWrapper {
    constructor(databases) {
        this.databases = databases;
    }
    /**
     * Get all standard Databases methods (document operations, list operations, etc.)
     */
    get standard() {
        return this.databases;
    }
    // Database operations
    /**
     * Get a database by ID
     */
    async getDatabase(databaseId) {
        return this.databases.get(databaseId);
    }
    /**
     * Create a new database
     */
    async createDatabase(databaseId, name) {
        return this.databases.create(databaseId, name);
    }
    // Collection operations
    /**
     * Get a collection by ID
     */
    async getCollection(databaseId, collectionId) {
        return this.databases.getCollection(databaseId, collectionId);
    }
    /**
     * Create a new collection
     */
    async createCollection(databaseId, collectionId, name, permissions, documentSecurity = false) {
        return this.databases.createCollection(databaseId, collectionId, name, permissions, documentSecurity);
    }
    /**
     * Delete a collection
     */
    async deleteCollection(databaseId, collectionId) {
        await this.databases.deleteCollection(databaseId, collectionId);
    }
    // Attribute operations
    /**
     * Create a string attribute
     */
    async createStringAttribute(databaseId, collectionId, key, size, required, defaultValue, array = false) {
        return this.databases.createStringAttribute(databaseId, collectionId, key, size, required, defaultValue || undefined, array);
    }
    /**
     * Create an integer attribute
     */
    async createIntegerAttribute(databaseId, collectionId, key, required, min, max, defaultValue, array = false) {
        return this.databases.createIntegerAttribute(databaseId, collectionId, key, required, min || undefined, max || undefined, defaultValue || undefined, array);
    }
    /**
     * Create a float attribute
     */
    async createFloatAttribute(databaseId, collectionId, key, required, min, max, defaultValue, array = false) {
        return this.databases.createFloatAttribute(databaseId, collectionId, key, required, min || undefined, max || undefined, defaultValue || undefined, array);
    }
    /**
     * Create a boolean attribute
     */
    async createBooleanAttribute(databaseId, collectionId, key, required, defaultValue, array = false) {
        return this.databases.createBooleanAttribute(databaseId, collectionId, key, required, defaultValue || undefined, array);
    }
    /**
     * Create a datetime attribute
     */
    async createDatetimeAttribute(databaseId, collectionId, key, required, defaultValue, array = false) {
        return this.databases.createDatetimeAttribute(databaseId, collectionId, key, required, defaultValue || undefined, array);
    }
    /**
     * Create an enum attribute
     */
    async createEnumAttribute(databaseId, collectionId, key, elements, required, defaultValue, array = false) {
        return this.databases.createEnumAttribute(databaseId, collectionId, key, elements, required, defaultValue || undefined, array);
    }
}
exports.DatabasesWrapper = DatabasesWrapper;
/**
 * Wrapper class for Appwrite Client that provides access to server-side API methods
 */
class ClientWrapper {
    constructor(client) {
        this.client = client;
    }
    /**
     * Get the standard Client instance
     */
    get standard() {
        return this.client;
    }
    /**
     * Set the API key for server-side operations
     */
    setKey(key) {
        this.client.setKey(key);
        return this;
    }
}
exports.ClientWrapper = ClientWrapper;
//# sourceMappingURL=appwrite-extended.js.map