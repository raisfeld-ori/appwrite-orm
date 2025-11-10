"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebORM = void 0;
const appwrite_1 = require("appwrite");
const types_1 = require("../shared/types");
const orm_instance_1 = require("./orm-instance");
class WebORM {
    constructor(config) {
        this.schemas = new Map();
        this.collectionIds = new Map(); // Map table name to collection ID
        // Validate required configuration values
        (0, types_1.validateRequiredConfig)(config);
        // Set autoValidate default to true
        if (config.autoValidate === undefined) {
            config.autoValidate = true;
        }
        this.config = config;
        this.client = new appwrite_1.Client()
            .setEndpoint(config.endpoint)
            .setProject(config.projectId);
        this.databases = new appwrite_1.Databases(this.client);
    }
    /**
     * Initialize the ORM with table definitions
     */
    async init(tables) {
        // Store schemas for validation and collection IDs
        tables.forEach(table => {
            const collectionId = table.id || table.name;
            this.schemas.set(table.name, table.schema);
            this.collectionIds.set(table.name, collectionId);
        });
        // Validate database structure if autoValidate is enabled
        if (this.config.autoValidate) {
            await this.validateTables(tables);
        }
        return new orm_instance_1.WebORMInstance(this.databases, this.config.databaseId, this.schemas, this.collectionIds);
    }
    /**
     * Validate that collections exist in the database
     */
    async validateTables(tables) {
        try {
            for (const table of tables) {
                const collectionId = table.id || table.name;
                try {
                    // Try to get the collection to verify it exists
                    await this.databases.getCollection(this.config.databaseId, collectionId);
                }
                catch (error) {
                    throw new types_1.ORMMigrationError(`Collection ${collectionId} does not exist in database. Please create it first or use ServerORM with autoMigrate.`);
                }
            }
        }
        catch (error) {
            if (error instanceof types_1.ORMMigrationError) {
                throw error;
            }
            throw new types_1.ORMMigrationError(`Validation failed: ${error?.message || 'Unknown error'}`);
        }
    }
}
exports.WebORM = WebORM;
//# sourceMappingURL=orm.js.map