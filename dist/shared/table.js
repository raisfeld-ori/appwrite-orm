"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseTable = void 0;
const appwrite_1 = require("appwrite");
const types_1 = require("./types");
const utils_1 = require("./utils");
class BaseTable {
    constructor(databases, databaseId, collectionId, schema) {
        this.databases = databases;
        this.databaseId = databaseId;
        this.collectionId = collectionId;
        this.schema = schema;
    }
    /**
     * Get a single document by ID (similar to SQLAlchemy's get)
     */
    async get(id) {
        try {
            const result = await this.databases.getDocument(this.databaseId, this.collectionId, id);
            return result;
        }
        catch (error) {
            if (error.code === 404) {
                return null;
            }
            throw error;
        }
    }
    /**
     * Get a single document by ID, throw error if not found (similar to SQLAlchemy's get_or_404)
     */
    async getOrFail(id) {
        const result = await this.get(id);
        if (!result) {
            throw new Error(`Document with ID ${id} not found in collection ${this.collectionId}`);
        }
        return result;
    }
    /**
     * Query documents with filters (similar to SQLAlchemy's filter)
     */
    async query(filters, options) {
        const queries = [];
        // Build filter queries
        if (filters) {
            for (const [key, value] of Object.entries(filters)) {
                if (value !== undefined && value !== null) {
                    // Wrap value in array if it isn't already (Appwrite Query API expects arrays)
                    const valueArray = Array.isArray(value) ? value : [value];
                    queries.push(appwrite_1.Query.equal(key, valueArray));
                }
            }
        }
        // Add ordering
        if (options?.orderBy) {
            options.orderBy.forEach(order => {
                if (order.startsWith('-')) {
                    queries.push(appwrite_1.Query.orderDesc(order.substring(1)));
                }
                else {
                    queries.push(appwrite_1.Query.orderAsc(order));
                }
            });
        }
        // Add pagination
        if (options?.limit) {
            queries.push(appwrite_1.Query.limit(options.limit));
        }
        if (options?.offset) {
            queries.push(appwrite_1.Query.offset(options.offset));
        }
        // Add select fields
        if (options?.select) {
            queries.push(appwrite_1.Query.select(options.select));
        }
        const result = await this.databases.listDocuments(this.databaseId, this.collectionId, queries);
        return result.documents;
    }
    /**
     * Get all documents (similar to SQLAlchemy's all())
     */
    async all(options) {
        return this.query(undefined, options);
    }
    /**
     * Get first document matching filters (similar to SQLAlchemy's first())
     */
    async first(filters) {
        const results = await this.query(filters, { limit: 1 });
        return results.length > 0 ? results[0] : null;
    }
    /**
     * Get first document or fail (similar to SQLAlchemy's first_or_404())
     */
    async firstOrFail(filters) {
        const result = await this.first(filters);
        if (!result) {
            throw new Error(`No document found in collection ${this.collectionId} with given filters`);
        }
        return result;
    }
    /**
     * Count documents matching filters (similar to SQLAlchemy's count())
     */
    async count(filters) {
        const queries = [];
        if (filters) {
            for (const [key, value] of Object.entries(filters)) {
                if (value !== undefined && value !== null) {
                    queries.push(appwrite_1.Query.equal(key, value));
                }
            }
        }
        const result = await this.databases.listDocuments(this.databaseId, this.collectionId, queries);
        return result.total;
    }
    /**
     * Create a new document (similar to SQLAlchemy's create)
     */
    async create(data) {
        // Validate data against schema
        this.validateData(data, true);
        const result = await this.databases.createDocument(this.databaseId, this.collectionId, appwrite_1.ID.unique(), data);
        return result;
    }
    /**
     * Update a document by ID
     */
    async update(id, data) {
        // Validate data against schema (partial validation for updates)
        this.validateData(data, false);
        const result = await this.databases.updateDocument(this.databaseId, this.collectionId, id, data);
        return result;
    }
    /**
     * Delete a document by ID
     */
    async delete(id) {
        await this.databases.deleteDocument(this.databaseId, this.collectionId, id);
    }
    /**
     * Find documents with more complex queries
     */
    async find(queries) {
        const result = await this.databases.listDocuments(this.databaseId, this.collectionId, queries);
        return result.documents;
    }
    /**
     * Find one document with complex queries
     */
    async findOne(queries) {
        const queriesWithLimit = [...queries, appwrite_1.Query.limit(1)];
        const results = await this.find(queriesWithLimit);
        return results.length > 0 ? results[0] : null;
    }
    /**
     * Validate data against schema
     */
    validateData(data, requireAll = false) {
        const errors = [];
        // Only validate fields that are present in the data
        for (const [fieldName, value] of Object.entries(data)) {
            const fieldDef = this.schema[fieldName];
            if (fieldDef) {
                const fieldErrors = utils_1.Validator.validateField(value, fieldDef, fieldName);
                errors.push(...fieldErrors);
            }
        }
        if (requireAll) {
            // Check for missing required fields
            for (const [fieldName, fieldDef] of Object.entries(this.schema)) {
                if (fieldDef.required && !(fieldName in data)) {
                    errors.push({
                        field: fieldName,
                        message: 'Required field is missing'
                    });
                }
            }
        }
        if (errors.length > 0) {
            throw new types_1.ORMValidationError(errors);
        }
    }
}
exports.BaseTable = BaseTable;
//# sourceMappingURL=table.js.map