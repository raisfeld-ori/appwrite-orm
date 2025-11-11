"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerORM = void 0;
const node_appwrite_1 = require("node-appwrite");
const types_1 = require("../shared/types");
const migration_1 = require("./migration");
const orm_instance_1 = require("./orm-instance");
class ServerORM {
    constructor(config) {
        this.schemas = new Map();
        this.collectionIds = new Map(); // Map table name to collection ID
        // Validate required configuration values
        (0, types_1.validateRequiredConfig)(config);
        if (!config.apiKey) {
            throw new Error('API key is required for server-side ORM');
        }
        // Set autoValidate default to true
        if (config.autoValidate === undefined) {
            config.autoValidate = true;
        }
        // If autoMigrate is true, autoValidate must also be true
        if (config.autoMigrate) {
            config.autoValidate = true;
        }
        this.config = config;
        this.client = new node_appwrite_1.Client();
        // Set endpoint and project
        this.client
            .setEndpoint(config.endpoint)
            .setProject(config.projectId);
        // Set API key for server-side operations
        // The setKey method exists in the node SDK but isn't in TypeScript types
        if (config.apiKey) {
            this.client.setKey(config.apiKey);
        }
        this.databases = new node_appwrite_1.Databases(this.client);
        this.migration = new migration_1.Migration(this.databases, this.config);
    }
    /**
     * Initialize the ORM with table definitions and optional migration
     */
    async init(tables) {
        // Store schemas and collection IDs
        tables.forEach(table => {
            const collectionId = table.id || table.name;
            this.schemas.set(table.name, table.schema);
            this.collectionIds.set(table.name, collectionId);
        });
        // Auto-migrate if enabled
        if (this.config.autoMigrate) {
            await this.migration.migrate(tables);
        }
        else if (this.config.autoValidate) {
            // Validate database structure if autoValidate is enabled
            await this.migration.validate(tables);
        }
        return new orm_instance_1.ServerORMInstance(this.databases, this.config.databaseId, this.schemas, this.collectionIds);
    }
}
exports.ServerORM = ServerORM;
//# sourceMappingURL=orm.js.map