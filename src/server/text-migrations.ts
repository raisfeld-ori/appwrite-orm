import { ORMConfig, TableDefinition, DatabaseField, ORMMigrationError, TypeScriptType } from '../shared/types';

export class TextMigrations {
  constructor(private config: ORMConfig) {}

  /**
   * Generate text description of all tables
   */
  generateText(tables: TableDefinition[]): string {
    try {
      // Handle empty schema
      if (!tables || tables.length === 0) {
        return 'Database Schema\n===============\n\nNo tables defined.\n';
      }

      // Validate tables
      for (const table of tables) {
        if (!table.name || !table.schema) {
          throw new ORMMigrationError(`Invalid table definition: missing 'name' or 'schema' field`);
        }
      }

      const sections: string[] = [];
      
      // Add header
      sections.push('Database Schema');
      sections.push('===============\n');

      // Process each table
      for (const table of tables) {
        sections.push(this.generateTableText(table));
      }

      return sections.join('\n');
    } catch (error) {
      if (error instanceof ORMMigrationError) {
        throw error;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new ORMMigrationError(`Text export failed: ${message}`);
    }
  }

  /**
   * Generate text for a single table
   */
  private generateTableText(table: TableDefinition): string {
    const collectionName = table.id || table.name;
    const lines: string[] = [];

    // Collection header
    lines.push(`Collection: ${collectionName}`);
    lines.push('-'.repeat(collectionName.length + 12));

    // Fields section
    lines.push('Fields:');
    
    // Always include $id field
    lines.push('  - $id (string, primary key)');

    // Process each field
    for (const [fieldName, fieldConfig] of Object.entries(table.schema)) {
      lines.push(this.formatField(fieldName, fieldConfig));
    }

    // Indexes section (if any)
    if (table.indexes && table.indexes.length > 0) {
      lines.push('');
      lines.push('Indexes:');
      lines.push(this.formatIndexes(table.indexes));
    }

    return lines.join('\n');
  }

  /**
   * Format field information
   */
  private formatField(fieldName: string, field: DatabaseField): string {
    const parts: string[] = [];

    // Field name
    parts.push(`  - ${fieldName}`);

    // Type information
    const typeInfo = this.getTypeDescription(field);
    const attributes: string[] = [typeInfo];

    // Required constraint
    if (field.required) {
      attributes.push('required');
    }

    // Array indicator
    if (field.array) {
      attributes.push('array');
    }

    // Size constraint
    if (field.size !== undefined && field.type === 'string') {
      attributes.push(`max length: ${field.size}`);
    }

    // Min/max constraints
    if (field.min !== undefined) {
      attributes.push(`min: ${field.min}`);
    }
    if (field.max !== undefined) {
      attributes.push(`max: ${field.max}`);
    }

    // Default value
    if (field.default !== undefined) {
      attributes.push(`default: ${this.formatDefaultValue(field.default)}`);
    }

    return `${parts[0]} (${attributes.join(', ')})`;
  }

  /**
   * Get human-readable type description
   */
  private getTypeDescription(field: DatabaseField): string {
    if (Array.isArray(field.type)) {
      // Enum type
      if (field.enum && field.enum.length > 0) {
        return `enum: ${field.enum.join(', ')}`;
      }
      return 'enum';
    }

    // Map TypeScript types to readable names
    switch (field.type) {
      case 'string':
        return 'string';
      case 'integer':
      case 'number':
        return 'integer';
      case 'float':
        return 'float';
      case 'boolean':
        return 'boolean';
      case 'Date':
      case 'datetime':
        return 'datetime';
      default:
        return String(field.type);
    }
  }

  /**
   * Format default value for display
   */
  private formatDefaultValue(value: unknown): string {
    if (value === null) {
      return 'null';
    }

    if (typeof value === 'string') {
      return `"${value}"`;
    }

    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }

    if (typeof value === 'number') {
      return String(value);
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    // For other types, convert to string
    return String(value);
  }

  /**
   * Format index information
   */
  private formatIndexes(indexes: { key: string; type: string; attributes: string[] }[]): string {
    const lines: string[] = [];

    for (const index of indexes) {
      const indexName = index.key;
      const indexType = index.type;
      const attributes = index.attributes.join(', ');
      
      lines.push(`  - ${indexName} (${indexType}): ${attributes}`);
    }

    return lines.join('\n');
  }
}
