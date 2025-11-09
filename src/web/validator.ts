import { DatabaseSchema, ValidationError, ORMValidationError } from '../shared/types';
import { Validator } from '../shared/utils';

export class WebValidator {
  /**
   * Validate data against schema
   */
  static validateData(
    data: any, 
    schema: DatabaseSchema, 
    requireAll: boolean = true
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check all schema fields
    for (const [fieldName, fieldConfig] of Object.entries(schema)) {
      const value = data[fieldName];
      
      // Skip validation if field is not provided and not required for updates
      if (!requireAll && value === undefined) {
        continue;
      }

      const fieldErrors = Validator.validateField(value, fieldConfig, fieldName);
      errors.push(...fieldErrors);
    }

    return errors;
  }

  /**
   * Validate and throw error if validation fails
   */
  static validateAndThrow(
    data: any,
    schema: DatabaseSchema,
    requireAll: boolean = true
  ): void {
    const errors = this.validateData(data, schema, requireAll);
    if (errors.length > 0) {
      throw new ORMValidationError(errors);
    }
  }
}