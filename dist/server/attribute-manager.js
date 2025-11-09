"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttributeManager = void 0;
const types_1 = require("../shared/types");
const utils_1 = require("../shared/utils");
class AttributeManager {
    constructor(databases, config) {
        this.databases = databases;
        this.config = config;
    }
    /**
     * Create an attribute in Appwrite
     */
    async createAttribute(collectionId, key, field) {
        const appwriteType = utils_1.TypeMapper.toAppwriteType(field.type);
        try {
            switch (appwriteType) {
                case 'string':
                    await this.databases.createStringAttribute(this.config.databaseId, collectionId, key, field.size || 255, field.required || false, field.default);
                    break;
                case 'integer':
                    await this.databases.createIntegerAttribute(this.config.databaseId, collectionId, key, field.required || false, field.min, field.max, field.default);
                    break;
                case 'float':
                    await this.databases.createFloatAttribute(this.config.databaseId, collectionId, key, field.required || false, field.min, field.max, field.default);
                    break;
                case 'boolean':
                    await this.databases.createBooleanAttribute(this.config.databaseId, collectionId, key, field.required || false, field.default);
                    break;
                case 'datetime':
                    await this.databases.createDatetimeAttribute(this.config.databaseId, collectionId, key, field.required || false, field.default);
                    break;
                case 'enum':
                    if (!field.enum || !Array.isArray(field.enum)) {
                        throw new Error(`Enum field ${key} must have an enum array`);
                    }
                    await this.databases.createEnumAttribute(this.config.databaseId, collectionId, key, field.enum, field.required || false, field.default);
                    break;
                default:
                    throw new Error(`Unsupported attribute type: ${appwriteType}`);
            }
        }
        catch (error) {
            throw new types_1.ORMMigrationError(`Failed to create attribute ${key}: ${error?.message || 'Unknown error'}`);
        }
    }
}
exports.AttributeManager = AttributeManager;
//# sourceMappingURL=attribute-manager.js.map