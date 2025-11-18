import { ORMConfig, TableDefinition, DatabaseField, ORMMigrationError, TypeScriptType } from '../shared/types';

export class FirebaseMigrations {
  constructor(private config: ORMConfig) {}

  /**
   * Generate Firebase security rules and structure
   */
  generateFirebase(tables: TableDefinition[]): string {
    try {
      // Handle empty schema
      if (!tables || tables.length === 0) {
        return JSON.stringify({ rules: {} }, null, 2);
      }

      // Validate tables
      for (const table of tables) {
        if (!table.name || !table.schema) {
          throw new ORMMigrationError(`Invalid table definition: missing 'name' or 'schema' field`);
        }
      }

      // Generate the complete Firebase structure
      const firebaseRules = {
        rules: this.generateStructure(tables)
      };

      return JSON.stringify(firebaseRules, null, 2);
    } catch (error) {
      if (error instanceof ORMMigrationError) {
        throw error;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new ORMMigrationError(`Firebase export failed: ${message}`);
    }
  }

  /**
   * Generate database structure schema with security rules
   */
  private generateStructure(tables: TableDefinition[]): any {
    const structure: any = {};

    for (const table of tables) {
      const collectionName = table.id || table.name;
      structure[collectionName] = this.generateSecurityRules(table);
    }

    return structure;
  }

  /**
   * Generate security rules for a collection
   */
  private generateSecurityRules(table: TableDefinition): any {
    const rules: any = {};

    // Generate read/write permissions based on Appwrite roles
    const { read, write } = this.convertRoleToFirebaseAuth(table.role);
    rules['.read'] = read;
    rules['.write'] = write;

    // Generate validation rules for each document
    const requiredFields = this.getRequiredFields(table.schema);
    const documentRules: any = {};

    // Add hasChildren validation for required fields
    if (requiredFields.length > 0) {
      const fieldsArray = requiredFields.map(f => `'${f}'`).join(', ');
      documentRules['.validate'] = `newData.hasChildren([${fieldsArray}])`;
    }

    // Add field-level validation rules
    for (const [fieldName, fieldConfig] of Object.entries(table.schema)) {
      documentRules[fieldName] = this.mapFieldToFirebaseValidation(fieldName, fieldConfig);
    }

    // Use $itemId as the wildcard for document IDs
    rules['$itemId'] = documentRules;

    return rules;
  }

  /**
   * Convert Appwrite role to Firebase authentication expressions
   */
  private convertRoleToFirebaseAuth(role?: Record<string, unknown>): { read: string; write: string } {
    // Default to authenticated users if no role specified
    if (!role || Object.keys(role).length === 0) {
      return {
        read: 'auth != null',
        write: 'auth != null'
      };
    }

    const readRules: string[] = [];
    const writeRules: string[] = [];

    for (const [action, value] of Object.entries(role)) {
      const authExpression = this.roleValueToFirebaseAuth(value);
      
      if (action === 'read') {
        readRules.push(authExpression);
      } else if (action === 'write' || action === 'create' || action === 'update' || action === 'delete') {
        writeRules.push(authExpression);
      }
    }

    return {
      read: readRules.length > 0 ? readRules.join(' || ') : 'auth != null',
      write: writeRules.length > 0 ? writeRules.join(' || ') : 'auth != null'
    };
  }

  /**
   * Convert role value to Firebase auth expression
   */
  private roleValueToFirebaseAuth(value: unknown): string {
    if (value === 'any' || value === 'public') {
      return 'true';
    }
    
    if (typeof value === 'string') {
      // For specific roles, check if auth.token contains the role
      return `auth != null && auth.token.role == '${value}'`;
    }
    
    if (Array.isArray(value)) {
      // Multiple roles - check if auth.token.role matches any
      const roleChecks = value.map(v => `auth.token.role == '${v}'`).join(' || ');
      return `auth != null && (${roleChecks})`;
    }

    // Default to authenticated
    return 'auth != null';
  }

  /**
   * Get list of required field names
   */
  private getRequiredFields(schema: Record<string, DatabaseField>): string[] {
    return Object.entries(schema)
      .filter(([_, field]) => field.required === true)
      .map(([fieldName]) => fieldName);
  }

  /**
   * Map Appwrite field to Firebase validation rule
   */
  private mapFieldToFirebaseValidation(fieldName: string, field: DatabaseField): any {
    const validation: any = {};
    const validationRules: string[] = [];

    // Base type validation
    const typeValidation = this.getTypeValidation(field.type, field.array);
    if (typeValidation) {
      validationRules.push(typeValidation);
    }

    // String length constraints
    if (!field.array && field.type === 'string') {
      if (field.size !== undefined) {
        validationRules.push(`newData.val().length <= ${field.size}`);
      }
    }

    // Numeric constraints
    if (!field.array && (field.type === 'integer' || field.type === 'number' || field.type === 'float')) {
      if (field.min !== undefined) {
        validationRules.push(`newData.val() >= ${field.min}`);
      }
      if (field.max !== undefined) {
        validationRules.push(`newData.val() <= ${field.max}`);
      }
    }

    // Enum constraints
    if (Array.isArray(field.type) && field.enum && field.enum.length > 0) {
      const enumPattern = field.enum.map(v => this.escapeRegexString(v)).join('|');
      validationRules.push(`newData.val().matches(/^(${enumPattern})$/)`);
    }

    // Combine all validation rules
    if (validationRules.length > 0) {
      validation['.validate'] = validationRules.join(' && ');
    }

    return validation;
  }

  /**
   * Get Firebase type validation expression
   */
  private getTypeValidation(type: TypeScriptType, isArray?: boolean): string | null {
    // Arrays are not directly validated in Firebase, they're just objects with numeric keys
    if (isArray) {
      return null;
    }

    if (Array.isArray(type)) {
      // Enum type - validate as string
      return 'newData.isString()';
    }

    switch (type) {
      case 'string':
        return 'newData.isString()';
      case 'integer':
      case 'number':
        return 'newData.isNumber() && newData.val() === Math.floor(newData.val())';
      case 'float':
        return 'newData.isNumber()';
      case 'boolean':
        return 'newData.isBoolean()';
      case 'Date':
      case 'datetime':
        // Dates are typically stored as ISO strings in Firebase
        return 'newData.isString()';
      default:
        return null;
    }
  }

  /**
   * Escape special regex characters for Firebase validation
   */
  private escapeRegexString(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
