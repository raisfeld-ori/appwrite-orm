import { ORMConfig, TableDefinition, DatabaseField, ORMMigrationError, TypeScriptType } from '../shared/types';

export class SqlMigrations {
  constructor(private config: ORMConfig) {}

  /**
   * Generate SQL CREATE TABLE statements for all tables
   */
  generateSQL(tables: TableDefinition[]): string {
    try {
      // Handle empty schema
      if (!tables || tables.length === 0) {
        return '-- No tables defined\n';
      }

      const sqlStatements: string[] = [];

      // Process each table
      for (const table of tables) {
        if (!table.name || !table.schema) {
          throw new ORMMigrationError(`Invalid table definition: missing 'name' or 'schema' field`);
        }
        sqlStatements.push(this.generateTableSQL(table));
      }

      return sqlStatements.join('\n\n');
    } catch (error) {
      if (error instanceof ORMMigrationError) {
        throw error;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new ORMMigrationError(`SQL export failed: ${message}`);
    }
  }

  /**
   * Generate SQL for a single table
   */
  private generateTableSQL(table: TableDefinition): string {
    const tableName = table.id || table.name;
    const fields: string[] = [];
    const constraints: string[] = [];

    // Always add $id as primary key first
    fields.push('  $id VARCHAR(255) PRIMARY KEY');

    // Process each field
    for (const [fieldName, fieldConfig] of Object.entries(table.schema)) {
      const fieldSQL = this.mapFieldToSQL(fieldName, fieldConfig);
      fields.push(`  ${fieldSQL}`);
    }

    // Generate constraints (UNIQUE, CHECK)
    const tableConstraints = this.generateConstraints(table);
    constraints.push(...tableConstraints);

    // Combine fields and constraints
    const allColumns = [...fields, ...constraints].join(',\n');

    return `CREATE TABLE ${tableName} (\n${allColumns}\n);`;
  }

  /**
   * Map Appwrite field type to generic SQL type with constraints
   */
  private mapFieldToSQL(fieldName: string, field: DatabaseField): string {
    let sqlType: string;
    const parts: string[] = [];

    // Determine base SQL type
    if (Array.isArray(field.type)) {
      // Enum type
      sqlType = `VARCHAR(${field.size || 255})`;
    } else {
      switch (field.type) {
        case 'string':
          sqlType = `VARCHAR(${field.size || 255})`;
          break;
        case 'integer':
        case 'number':
          sqlType = 'INTEGER';
          break;
        case 'float':
          sqlType = 'REAL';
          break;
        case 'boolean':
          // Use INTEGER for SQLite compatibility (0/1)
          sqlType = 'INTEGER';
          break;
        case 'Date':
        case 'datetime':
          // Use TEXT for SQLite compatibility (ISO 8601 format)
          sqlType = 'TEXT';
          break;
        default:
          throw new ORMMigrationError(`Unsupported field type '${field.type}' for SQL export`);
      }
    }

    // Handle array fields - use TEXT to store JSON
    if (field.array) {
      sqlType = 'TEXT';
    }

    parts.push(fieldName);
    parts.push(sqlType);

    // Add NOT NULL constraint for required fields
    if (field.required) {
      parts.push('NOT NULL');
    }

    // Add DEFAULT clause
    if (field.default !== undefined) {
      const defaultValue = this.formatDefaultValue(field.default, field.type);
      parts.push(`DEFAULT ${defaultValue}`);
    }

    return parts.join(' ');
  }

  /**
   * Generate constraint clauses (UNIQUE, CHECK)
   */
  private generateConstraints(table: TableDefinition): string[] {
    const constraints: string[] = [];

    // Generate UNIQUE constraints from indexes
    if (table.indexes) {
      for (const index of table.indexes) {
        if (index.type === 'unique' && index.attributes.length > 0) {
          const columns = index.attributes.join(', ');
          constraints.push(`  UNIQUE (${columns})`);
        }
      }
    }

    // Generate CHECK constraints for field validations
    for (const [fieldName, fieldConfig] of Object.entries(table.schema)) {
      const checkConstraints = this.generateFieldCheckConstraints(fieldName, fieldConfig);
      constraints.push(...checkConstraints);
    }

    return constraints;
  }

  /**
   * Generate CHECK constraints for a field
   */
  private generateFieldCheckConstraints(fieldName: string, field: DatabaseField): string[] {
    const constraints: string[] = [];

    // Skip array fields for CHECK constraints
    if (field.array) {
      return constraints;
    }

    // Min/max constraints for numeric types
    if ((field.type === 'integer' || field.type === 'number' || field.type === 'float')) {
      if (field.min !== undefined && field.max !== undefined) {
        constraints.push(`  CHECK (${fieldName} >= ${field.min} AND ${fieldName} <= ${field.max})`);
      } else if (field.min !== undefined) {
        constraints.push(`  CHECK (${fieldName} >= ${field.min})`);
      } else if (field.max !== undefined) {
        constraints.push(`  CHECK (${fieldName} <= ${field.max})`);
      }
    }

    // Boolean constraints (0 or 1 for SQLite compatibility)
    if (field.type === 'boolean') {
      constraints.push(`  CHECK (${fieldName} IN (0, 1))`);
    }

    // Enum constraints
    if (Array.isArray(field.type) && field.enum && field.enum.length > 0) {
      const enumValues = field.enum.map(v => `'${this.escapeSqlString(v)}'`).join(', ');
      constraints.push(`  CHECK (${fieldName} IN (${enumValues}))`);
    }

    return constraints;
  }

  /**
   * Format default value for SQL
   */
  private formatDefaultValue(value: unknown, type: TypeScriptType): string {
    if (value === null) {
      return 'NULL';
    }

    if (typeof value === 'string') {
      return `'${this.escapeSqlString(value)}'`;
    }

    if (typeof value === 'boolean') {
      // Convert to 0/1 for SQLite compatibility
      return value ? '1' : '0';
    }

    if (typeof value === 'number') {
      return String(value);
    }

    if (value instanceof Date) {
      return `'${value.toISOString()}'`;
    }

    // For other types, convert to string
    return `'${this.escapeSqlString(String(value))}'`;
  }

  /**
   * Escape single quotes in SQL strings
   */
  private escapeSqlString(str: string): string {
    return str.replace(/'/g, "''");
  }
}