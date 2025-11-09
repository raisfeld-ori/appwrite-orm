import { AppwriteAttributeType, TypeScriptType, DatabaseField, ValidationError } from './types';

export class TypeMapper {
  static toAppwriteType(tsType: TypeScriptType): AppwriteAttributeType {
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

  static fromAppwriteType(appwriteType: AppwriteAttributeType): TypeScriptType {
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

export class Validator {
  static validateField(value: any, field: DatabaseField, fieldName: string): ValidationError[] {
    const errors: ValidationError[] = [];

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

  private static validateType(value: any, expectedType: TypeScriptType): boolean {
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

  private static getTypeString(type: TypeScriptType): string {
    if (Array.isArray(type)) {
      return 'enum';
    }
    return type;
  }
}