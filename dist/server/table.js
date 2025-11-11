"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerTable = void 0;
const node_appwrite_1 = require("node-appwrite");
const table_1 = require("../shared/table");
const appwrite_extended_1 = require("./appwrite-extended");
class ServerTable extends table_1.BaseTable {
    constructor(databases, databaseId, collectionId, schema) {
        // Type assertion needed because node-appwrite and appwrite have compatible but different types
        super(databases, databaseId, collectionId, schema);
        this.db = new appwrite_extended_1.DatabasesWrapper(databases);
    }
    /**
     * Override query method to use node-appwrite Query instead of web SDK Query
     */
    async query(filters, options) {
        const queries = [];
        // Build filter queries using node-appwrite Query
        if (filters) {
            for (const [key, value] of Object.entries(filters)) {
                if (value !== undefined && value !== null) {
                    // Wrap value in array if it isn't already
                    const valueArray = Array.isArray(value) ? value : [value];
                    queries.push(node_appwrite_1.Query.equal(key, valueArray));
                }
            }
        }
        // Add ordering
        if (options?.orderBy) {
            options.orderBy.forEach(order => {
                if (order.startsWith('-')) {
                    queries.push(node_appwrite_1.Query.orderDesc(order.substring(1)));
                }
                else {
                    queries.push(node_appwrite_1.Query.orderAsc(order));
                }
            });
        }
        // Add pagination
        if (options?.limit) {
            queries.push(node_appwrite_1.Query.limit(options.limit));
        }
        if (options?.offset) {
            queries.push(node_appwrite_1.Query.offset(options.offset));
        }
        // Add select fields
        if (options?.select) {
            queries.push(node_appwrite_1.Query.select(options.select));
        }
        const result = await this.databases.listDocuments(this.databaseId, this.collectionId, queries);
        return result.documents;
    }
    /**
     * Override find to use node-appwrite queries
     */
    async find(queries) {
        const result = await this.databases.listDocuments(this.databaseId, this.collectionId, queries);
        return result.documents;
    }
    /**
     * Override count to use node-appwrite Query
     */
    async count(filters) {
        const queries = [];
        if (filters) {
            for (const [key, value] of Object.entries(filters)) {
                if (value !== undefined && value !== null) {
                    const valueArray = Array.isArray(value) ? value : [value];
                    queries.push(node_appwrite_1.Query.equal(key, valueArray));
                }
            }
        }
        const result = await this.databases.listDocuments(this.databaseId, this.collectionId, queries);
        return result.total;
    }
    /**
     * Override findOne to use node-appwrite Query
     */
    async findOne(queries) {
        const queriesWithLimit = [...queries, node_appwrite_1.Query.limit(1)];
        const results = await this.find(queriesWithLimit);
        return results.length > 0 ? results[0] : null;
    }
    /**
     * Server-specific method to create collection
     */
    async createCollection(name, permissions) {
        await this.db.createCollection(this.databaseId, this.collectionId, name || this.collectionId, permissions);
    }
    /**
     * Server-specific method to delete collection
     */
    async deleteCollection() {
        await this.db.deleteCollection(this.databaseId, this.collectionId);
    }
    /**
     * Bulk insert documents (server-only optimization)
     */
    async bulkCreate(documents) {
        const results = [];
        for (const doc of documents) {
            const result = await this.create(doc);
            results.push(result);
        }
        return results;
    }
    /**
     * Bulk update documents (server-only optimization)
     */
    async bulkUpdate(updates) {
        const results = [];
        for (const update of updates) {
            const result = await this.update(update.id, update.data);
            results.push(result);
        }
        return results;
    }
    /**
     * Bulk delete documents (server-only optimization)
     */
    async bulkDelete(ids) {
        for (const id of ids) {
            await this.delete(id);
        }
    }
}
exports.ServerTable = ServerTable;
//# sourceMappingURL=table.js.map