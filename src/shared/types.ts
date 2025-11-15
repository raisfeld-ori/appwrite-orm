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
  | 'integer'
  | 'float'
  | 'boolean'
  | 'Date'
  | 'datetime'
  | string[]; // for enums

export interface DatabaseField {
  type: TypeScriptType;
  required?: boolean;
  default?: unknown;
  array?: boolean;
  size?: number; // for strings
  min?: number; // for numbers
  max?: number; // for numbers
  enum?: string[]; // for enum types
}

export interface DatabaseSchema {
  [fieldName: string]: DatabaseField;
}

export interface TableDefinition<T extends DatabaseSchema = DatabaseSchema, TInterface = any> {
  name: string;
  id?: string; // Optional collection ID, defaults to name if not provided
  schema: T;
  role?: Record<string, unknown>; // Optional JSON role, defaults to public
  interface?: TInterface; // Optional TypeScript interface for type-safe responses
  indexes?: IndexDefinition[]; // Optional indexes for the collection
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
  development?: boolean; // For web client only - use cookies instead of Appwrite API
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

  if (missingFields.length > 0 && !config.development) {
    throw new Error(`Missing required configuration values: ${missingFields.join(', ')}`);
  }
}

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
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

export type IndexType = 'key' | 'fulltext' | 'unique';

export interface IndexDefinition {
  key: string; // Unique index identifier
  type: IndexType;
  attributes: string[]; // Array of attribute keys
  orders?: ('ASC' | 'DESC')[]; // Optional sort orders for each attribute
}

// Join types for querying related data
export interface JoinOptions {
  foreignKey: string; // The field in the first collection that references the second
  referenceKey?: string; // The field in the second collection (defaults to '$id')
  as?: string; // Alias for the joined data in results
}

export interface JoinResult<T, U> {
  [key: string]: T & { [joinAlias: string]: U | U[] | null };
}