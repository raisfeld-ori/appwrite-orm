"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerTable = void 0;
const table_1 = require("../shared/table");
class ServerTable extends table_1.BaseTable {
    constructor(databases, databaseId, collectionId, schema) {
        super(databases, databaseId, collectionId, schema);
    }
    /**
     * Server-specific method to create collection
     */
    async createCollection(name, permissions) {
        await this.databases.createCollection(this.databaseId, this.collectionId, name || this.collectionId, permissions);
    }
    /**
     * Server-specific method to delete collection
     */
    async deleteCollection() {
        await this.databases.deleteCollection(this.databaseId, this.collectionId);
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