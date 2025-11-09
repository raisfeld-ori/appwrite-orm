import { Databases } from 'appwrite';
import { TableDefinition, ORMConfig, ORMMigrationError } from '../shared/types';
import { AttributeManager } from './attribute-manager';
import { PermissionManager } from './permission-manager';

export class Migration {
  private attributeManager: AttributeManager;
  private permissionManager: PermissionManager;

  constructor(
    private databases: Databases,
    private config: ORMConfig
  ) {
    this.attributeManager = new AttributeManager(databases, config);
    this.permissionManager = new PermissionManager();
  }

  /**
   * Migrate table schemas
   */
  async migrate(tables: TableDefinition[]): Promise<void> {
    try {
      // Ensure database exists
      await this.ensureDatabaseExists();

      // Process each collection
      for (const table of tables) {
        await this.migrateCollection(table);
      }
    } catch (error: any) {
      throw new ORMMigrationError(`Migration failed: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Ensure database exists, create if it doesn't
   */
  private async ensureDatabaseExists(): Promise<void> {
    try {
      await (this.databases as any).get(this.config.databaseId);
    } catch (error) {
      // Database doesn't exist, create it
      await (this.databases as any).create(this.config.databaseId, 'ORM Database');
    }
  }

  /**
   * Migrate a single collection
   */
  private async migrateCollection(table: TableDefinition): Promise<void> {
    try {
      // Check if collection exists
      let collection: any;
      try {
        collection = await (this.databases as any).getCollection(this.config.databaseId, table.name);
      } catch (error) {
        // Create collection if it doesn't exist
        // Default to public permissions if no role specified
        const permissions = table.role ? this.permissionManager.convertRoleToPermissions(table.role) : ['read("any")'];
        collection = await (this.databases as any).createCollection(
          this.config.databaseId,
          table.name,
          table.name,
          permissions
        );
      }

      // Get existing attributes
      const existingAttributes = new Set(collection.attributes?.map((attr: any) => attr.key) || []);

      // Add new attributes
      for (const [fieldName, fieldConfig] of Object.entries(table.schema)) {
        if (!existingAttributes.has(fieldName)) {
          await this.attributeManager.createAttribute(table.name, fieldName, fieldConfig);
        }
      }

    } catch (error: any) {
      throw new ORMMigrationError(`Failed to migrate collection ${table.name}: ${error?.message || 'Unknown error'}`);
    }
  }
}