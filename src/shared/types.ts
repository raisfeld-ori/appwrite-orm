// Shared types for both web and server versions

export type AppwriteAttributeType = 
  | 'string'
  | 'integer'
  | 'float'
  | 'boolean'
  | 'datetime'
  | 'email'
  | 'ip'
  | 'url'
  | 'enum';

export type TypeScriptType = 
  | 'string'
  | 'number'
  | 'boolean'
  | 'Date'
  | string[]; // for enums

export interface DatabaseField {
  type: TypeScriptType;
  required?: boolean;
  default?: any;
  array?: boolean;
  size?: number; // for strings
  min?: number; // for numbers
  max?: number; // for numbers
  enum?: string[]; // for enum types
}

export interface DatabaseSchema {
  [fieldName: string]: DatabaseField;
}

export interface TableDefinition<T extends DatabaseSchema = DatabaseSchema> {
  name: string;
  id?: string; // Optional collection ID, defaults to name if not provided
  schema: T;
  role?: Record<string, any>; // Optional JSON role, defaults to public
}

// Legacy alias for backward compatibility
export interface Database<T extends DatabaseSchema = DatabaseSchema> extends TableDefinition<T> {}

export interface ORMConfig {
  endpoint: string;
  projectId: string;
  databaseId: string;
  apiKey?: string; // Only for server-side
  autoMigrate?: boolean; // Only for server-side
  autoValidate?: boolean; // Validate database structure on init (defaults to true, always true if autoMigrate is true)
}

// Validation function for required config values
export function validateRequiredConfig(config: ORMConfig): void {
  const requiredFields = ['endpoint', 'projectId', 'databaseId'] as const;
  const missingFields: string[] = [];

  for (const field of requiredFields) {
    if (!config[field] || config[field].trim() === '') {
      missingFields.push(field);
    }
  }

  if (missingFields.length > 0) {
    throw new Error(`Missing required configuration values: ${missingFields.join(', ')}`);
  }
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export class ORMValidationError extends Error {
  public errors: ValidationError[];
  
  constructor(errors: ValidationError[]) {
    super(`Validation failed: ${errors.map(e => `${e.field}: ${e.message}`).join(', ')}`);
    this.name = 'ORMValidationError';
    this.errors = errors;
  }
}

export class ORMMigrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ORMMigrationError';
  }
}