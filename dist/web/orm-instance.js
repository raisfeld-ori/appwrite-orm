"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebORMInstance = void 0;
const table_1 = require("./table");
class WebORMInstance {
    constructor(databases, databaseId, schemas, collectionIds = new Map()) {
        this.databases = databases;
        this.databaseId = databaseId;
        this.schemas = schemas;
        this.collectionIds = collectionIds;
        this.tables = new Map();
        // Initialize table instances
        for (const [name, schema] of schemas.entries()) {
            const collectionId = collectionIds.get(name) || name;
            const table = new table_1.WebTable(databases, databaseId, collectionId, schema);
            this.tables.set(name, table);
        }
    }
    /**
     * Get a table instance by name (similar to SQLAlchemy's table access)
     */
    table(name) {
        const table = this.tables.get(name);
        if (!table) {
            throw new Error(`Table ${name} not found`);
        }
        return table;
    }
    /**
     * Legacy method - Create a new document with validation
     * @deprecated Use table(name).create() instead
     */
    async create(collection, data) {
        return this.table(collection).create(data);
    }
    /**
     * Legacy method - Update a document with validation
     * @deprecated Use table(name).update() instead
     */
    async update(collection, documentId, data) {
        return this.table(collection).update(documentId, data);
    }
    /**
     * Legacy method - Get a document by ID
     * @deprecated Use table(name).get() instead
     */
    async get(collection, documentId) {
        return this.table(collection).get(documentId);
    }
    /**
     * Legacy method - List documents with optional queries
     * @deprecated Use table(name).query() or table(name).all() instead
     */
    async list(collection, queries) {
        if (queries) {
            const documents = await this.table(collection).find(queries);
            return { documents, total: documents.length };
        }
        else {
            const documents = await this.table(collection).all();
            return { documents, total: documents.length };
        }
    }
    /**
     * Legacy method - Delete a document
     * @deprecated Use table(name).delete() instead
     */
    async delete(collection, documentId) {
        return this.table(collection).delete(documentId);
    }
}
exports.WebORMInstance = WebORMInstance;
//# sourceMappingURL=orm-instance.js.map