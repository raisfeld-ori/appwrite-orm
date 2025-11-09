"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerORM = void 0;
const appwrite_1 = require("appwrite");
const types_1 = require("../shared/types");
const migration_1 = require("./migration");
const orm_instance_1 = require("./orm-instance");
class ServerORM {
    constructor(config) {
        this.schemas = new Map();
        // Validate required configuration values
        (0, types_1.validateRequiredConfig)(config);
        if (!config.apiKey) {
            throw new Error('API key is required for server-side ORM');
        }
        this.config = config;
        this.client = new appwrite_1.Client()
            .setEndpoint(config.endpoint)
            .setProject(config.projectId);
        // Set API key for server-side operations
        if (config.apiKey) {
            try {
                this.client.setKey(config.apiKey);
            }
            catch (error) {
                // For newer Appwrite versions, the key might be set differently
                console.warn('Could not set API key using setKey method. Please ensure you are using the correct Appwrite SDK version.');
            }
        }
        this.databases = new appwrite_1.Databases(this.client);
        this.migration = new migration_1.Migration(this.databases, this.config);
    }
    /**
     * Initialize the ORM with table definitions and optional migration
     */
    async init(tables) {
        // Store schemas
        tables.forEach(table => {
            this.schemas.set(table.name, table.schema);
        });
        // Auto-migrate if enabled
        if (this.config.autoMigrate) {
            await this.migration.migrate(tables);
        }
        return new orm_instance_1.ServerORMInstance(this.databases, this.config.databaseId, this.schemas);
    }
}
exports.ServerORM = ServerORM;
//# sourceMappingURL=orm.js.map