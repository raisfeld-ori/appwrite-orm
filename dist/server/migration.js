"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migration = void 0;
const types_1 = require("../shared/types");
const attribute_manager_1 = require("./attribute-manager");
const permission_manager_1 = require("./permission-manager");
class Migration {
    constructor(databases, config) {
        this.databases = databases;
        this.config = config;
        this.attributeManager = new attribute_manager_1.AttributeManager(databases, config);
        this.permissionManager = new permission_manager_1.PermissionManager();
    }
    /**
     * Migrate table schemas
     */
    async migrate(tables) {
        try {
            // Ensure database exists
            await this.ensureDatabaseExists();
            // Process each collection
            for (const table of tables) {
                await this.migrateCollection(table);
            }
        }
        catch (error) {
            throw new types_1.ORMMigrationError(`Migration failed: ${error?.message || 'Unknown error'}`);
        }
    }
    /**
     * Ensure database exists, create if it doesn't
     */
    async ensureDatabaseExists() {
        try {
            await this.databases.get(this.config.databaseId);
        }
        catch (error) {
            // Database doesn't exist, create it
            await this.databases.create(this.config.databaseId, 'ORM Database');
        }
    }
    /**
     * Migrate a single collection
     */
    async migrateCollection(table) {
        try {
            // Check if collection exists
            let collection;
            try {
                collection = await this.databases.getCollection(this.config.databaseId, table.name);
            }
            catch (error) {
                // Create collection if it doesn't exist
                // Default to public permissions if no role specified
                const permissions = table.role ? this.permissionManager.convertRoleToPermissions(table.role) : ['read("any")'];
                collection = await this.databases.createCollection(this.config.databaseId, table.name, table.name, permissions);
            }
            // Get existing attributes
            const existingAttributes = new Set(collection.attributes?.map((attr) => attr.key) || []);
            // Add new attributes
            for (const [fieldName, fieldConfig] of Object.entries(table.schema)) {
                if (!existingAttributes.has(fieldName)) {
                    await this.attributeManager.createAttribute(table.name, fieldName, fieldConfig);
                }
            }
        }
        catch (error) {
            throw new types_1.ORMMigrationError(`Failed to migrate collection ${table.name}: ${error?.message || 'Unknown error'}`);
        }
    }
}
exports.Migration = Migration;
//# sourceMappingURL=migration.js.map