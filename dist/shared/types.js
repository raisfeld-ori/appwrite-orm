"use strict";
// Shared types for both web and server versions
Object.defineProperty(exports, "__esModule", { value: true });
exports.ORMMigrationError = exports.ORMValidationError = void 0;
exports.validateRequiredConfig = validateRequiredConfig;
// Validation function for required config values
function validateRequiredConfig(config) {
    const requiredFields = ['endpoint', 'projectId', 'databaseId'];
    const missingFields = [];
    for (const field of requiredFields) {
        if (!config[field] || config[field].trim() === '') {
            missingFields.push(field);
        }
    }
    if (missingFields.length > 0) {
        throw new Error(`Missing required configuration values: ${missingFields.join(', ')}`);
    }
}
class ORMValidationError extends Error {
    constructor(errors) {
        super(`Validation failed: ${errors.map(e => `${e.field}: ${e.message}`).join(', ')}`);
        this.name = 'ORMValidationError';
        this.errors = errors;
    }
}
exports.ORMValidationError = ORMValidationError;
class ORMMigrationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ORMMigrationError';
    }
}
exports.ORMMigrationError = ORMMigrationError;
//# sourceMappingURL=types.js.map