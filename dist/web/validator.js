"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebValidator = void 0;
const types_1 = require("../shared/types");
const utils_1 = require("../shared/utils");
class WebValidator {
    /**
     * Validate data against schema
     */
    static validateData(data, schema, requireAll = true) {
        const errors = [];
        // Check all schema fields
        for (const [fieldName, fieldConfig] of Object.entries(schema)) {
            const value = data[fieldName];
            // Skip validation if field is not provided and not required for updates
            if (!requireAll && value === undefined) {
                continue;
            }
            const fieldErrors = utils_1.Validator.validateField(value, fieldConfig, fieldName);
            errors.push(...fieldErrors);
        }
        return errors;
    }
    /**
     * Validate and throw error if validation fails
     */
    static validateAndThrow(data, schema, requireAll = true) {
        const errors = this.validateData(data, schema, requireAll);
        if (errors.length > 0) {
            throw new types_1.ORMValidationError(errors);
        }
    }
}
exports.WebValidator = WebValidator;
//# sourceMappingURL=validator.js.map