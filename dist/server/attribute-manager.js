"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttributeManager = void 0;
const types_1 = require("../shared/types");
const utils_1 = require("../shared/utils");
const appwrite_extended_1 = require("./appwrite-extended");
class AttributeManager {
    constructor(databases, config) {
        this.config = config;
        this.db = new appwrite_extended_1.DatabasesWrapper(databases);
    }
    /**
     * Create an attribute in Appwrite
     */
    async createAttribute(collectionId, key, field) {
        const appwriteType = utils_1.TypeMapper.toAppwriteType(field.type);
        const isRequired = field.required || false;
        // Appwrite doesn't allow default values on required fields
        const defaultValue = isRequired ? undefined : field.default;
        // Determine if number should be integer or float
        // Use float if:
        // - min/max/default are floats
        // - field name suggests money/decimals (balance, price, amount, rate, etc.)
        // - no constraints suggest it should be integer (like age, count, etc.)
        let useFloat = false;
        if (appwriteType === 'integer') {
            if (field.min !== undefined && !Number.isInteger(field.min))
                useFloat = true;
            if (field.max !== undefined && !Number.isInteger(field.max))
                useFloat = true;
            if (defaultValue !== undefined && !Number.isInteger(defaultValue))
                useFloat = true;
            // Check field name for common float indicators
            const floatIndicators = /balance|price|amount|rate|cost|fee|charge|commission|percentage|ratio|weight|height|distance|latitude|longitude|temperature/i;
            const integerIndicators = /age|count|quantity|number|id|index|rank|level|score|points?$/i;
            if (floatIndicators.test(key)) {
                useFloat = true;
            }
            else if (!integerIndicators.test(key) && field.min === undefined && field.max === undefined) {
                // Default to float if no clear indicator and no constraints
                useFloat = true;
            }
        }
        try {
            switch (appwriteType) {
                case 'string':
                    await this.db.createStringAttribute(this.config.databaseId, collectionId, key, field.size || 255, isRequired, defaultValue, field.array || false);
                    break;
                case 'integer':
                    if (useFloat) {
                        await this.db.createFloatAttribute(this.config.databaseId, collectionId, key, isRequired, field.min, field.max, defaultValue, field.array || false);
                    }
                    else {
                        await this.db.createIntegerAttribute(this.config.databaseId, collectionId, key, isRequired, field.min, field.max, defaultValue, field.array || false);
                    }
                    break;
                case 'float':
                    await this.db.createFloatAttribute(this.config.databaseId, collectionId, key, isRequired, field.min, field.max, defaultValue, field.array || false);
                    break;
                case 'boolean':
                    await this.db.createBooleanAttribute(this.config.databaseId, collectionId, key, isRequired, defaultValue, field.array || false);
                    break;
                case 'datetime':
                    await this.db.createDatetimeAttribute(this.config.databaseId, collectionId, key, isRequired, defaultValue, field.array || false);
                    break;
                case 'enum':
                    if (!field.enum || !Array.isArray(field.enum)) {
                        throw new Error(`Enum field ${key} must have an enum array`);
                    }
                    await this.db.createEnumAttribute(this.config.databaseId, collectionId, key, field.enum, isRequired, defaultValue, field.array || false);
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