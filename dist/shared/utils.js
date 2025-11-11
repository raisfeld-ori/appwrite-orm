"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Validator = exports.TypeMapper = void 0;
class TypeMapper {
    static toAppwriteType(tsType) {
        if (Array.isArray(tsType)) {
            return 'enum';
        }
        switch (tsType) {
            case 'string':
                return 'string';
            case 'number':
                return 'integer';
            case 'boolean':
                return 'boolean';
            case 'Date':
                return 'datetime';
            default:
                return 'string';
        }
    }
    static fromAppwriteType(appwriteType) {
        switch (appwriteType) {
            case 'string':
            case 'email':
            case 'ip':
            case 'url':
                return 'string';
            case 'integer':
            case 'float':
                return 'number';
            case 'boolean':
                return 'boolean';
            case 'datetime':
                return 'Date';
            case 'enum':
                return [];
            default:
                return 'string';
        }
    }
}
exports.TypeMapper = TypeMapper;
class Validator {
    static validateField(value, field, fieldName) {
        const errors = [];
        // Check required fields
        if (field.required && (value === undefined || value === null)) {
            errors.push({
                field: fieldName,
                message: 'Field is required',
                value
            });
            return errors;
        }
        // Skip validation if value is undefined/null and not required
        if (value === undefined || value === null) {
            return errors;
        }
        // If field is an array, validate each element
        if (field.array && Array.isArray(value)) {
            for (const item of value) {
                if (!this.validateType(item, field.type)) {
                    errors.push({
                        field: fieldName,
                        message: `Array contains invalid type. Expected ${this.getTypeString(field.type)}, got ${typeof item}`,
                        value
                    });
                    break; // Only report once per array
                }
            }
            return errors;
        }
        // If field is marked as array but value isn't an array, that's an error
        if (field.array && !Array.isArray(value)) {
            errors.push({
                field: fieldName,
                message: `Expected array, got ${typeof value}`,
                value
            });
            return errors;
        }
        // Type validation
        if (!this.validateType(value, field.type)) {
            errors.push({
                field: fieldName,
                message: `Expected type ${this.getTypeString(field.type)}, got ${typeof value}`,
                value
            });
            return errors;
        }
        // String validations
        if (field.type === 'string' && typeof value === 'string') {
            if (field.size && value.length > field.size) {
                errors.push({
                    field: fieldName,
                    message: `String length exceeds maximum of ${field.size}`,
                    value
                });
            }
        }
        // Number validations
        if (field.type === 'number' && typeof value === 'number') {
            if (field.min !== undefined && value < field.min) {
                errors.push({
                    field: fieldName,
                    message: `Value ${value} is below minimum of ${field.min}`,
                    value
                });
            }
            if (field.max !== undefined && value > field.max) {
                errors.push({
                    field: fieldName,
                    message: `Value ${value} exceeds maximum of ${field.max}`,
                    value
                });
            }
        }
        // Enum validation
        if (Array.isArray(field.type) && field.enum) {
            if (!field.enum.includes(value)) {
                errors.push({
                    field: fieldName,
                    message: `Value must be one of: ${field.enum.join(', ')}`,
                    value
                });
            }
        }
        return errors;
    }
    static validateType(value, expectedType) {
        if (Array.isArray(expectedType)) {
            return typeof value === 'string';
        }
        switch (expectedType) {
            case 'string':
                return typeof value === 'string';
            case 'number':
                return typeof value === 'number' && !isNaN(value);
            case 'boolean':
                return typeof value === 'boolean';
            case 'Date':
                return value instanceof Date || typeof value === 'string';
            default:
                return false;
        }
    }
    static getTypeString(type) {
        if (Array.isArray(type)) {
            return 'enum';
        }
        return type;
    }
}
exports.Validator = Validator;
//# sourceMappingURL=utils.js.map