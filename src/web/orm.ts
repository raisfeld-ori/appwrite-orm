import { Client, Databases } from 'appwrite';
import { TableDefinition, ORMConfig, DatabaseSchema, validateRequiredConfig, ORMMigrationError } from '../shared/types';
import { WebORMInstance } from './orm-instance';
import { DatabasesWrapper } from '../server/appwrite-extended';

export class WebORM {
  private client: Client;
  private databases: Databases;
  private db: DatabasesWrapper;
  private config: ORMConfig;
  private schemas: Map<string, DatabaseSchema> = new Map();
  private collectionIds: Map<string, string> = new Map(); // Map table name to collection ID

  constructor(config: ORMConfig) {
    // Validate required configuration values
    validateRequiredConfig(config);
    
    // Set autoValidate default to true
    if (config.autoValidate === undefined) {
      config.autoValidate = true;
    }
    
    this.config = config;
    this.client = new Client()
      .setEndpoint(config.endpoint)
      .setProject(config.projectId);
    
    this.databases = new Databases(this.client);
    // Type assertion needed because DatabasesWrapper expects node-appwrite types
    // but at runtime they're compatible for the operations we use
    this.db = new DatabasesWrapper(this.databases as any);
  }

  /**
   * Initialize the ORM with table definitions
   */
  async init<T extends TableDefinition[]>(tables: T): Promise<WebORMInstance<T>> {
    // Store schemas for validation and collection IDs
    tables.forEach(table => {
      const collectionId = table.id || table.name;
      this.schemas.set(table.name, table.schema);
      this.collectionIds.set(table.name, collectionId);
    });

    // Validate database structure if autoValidate is enabled
    if (this.config.autoValidate) {
      await this.validateTables(tables);
    }

    return new WebORMInstance(this.databases, this.config.databaseId, this.schemas, this.collectionIds);
  }

  /**
   * Validate that collections exist in the database
   */
  private async validateTables(tables: TableDefinition[]): Promise<void> {
    try {
      for (const table of tables) {
        const collectionId = table.id || table.name;
        try {
          // Try to get the collection to verify it exists
          await this.db.getCollection(this.config.databaseId, collectionId);
        } catch (error) {
          throw new ORMMigrationError(
            `Collection ${collectionId} does not exist in database. Please create it first or use ServerORM with autoMigrate.`
          );
        }
      }
    } catch (error: any) {
      if (error instanceof ORMMigrationError) {
        throw error;
      }
      throw new ORMMigrationError(`Validation failed: ${error?.message || 'Unknown error'}`);
    }
  }
}