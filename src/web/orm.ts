import { Client, Databases } from 'appwrite';
import { TableDefinition, ORMConfig, DatabaseSchema, validateRequiredConfig, ORMMigrationError } from '../shared/types';
import { WebORMInstance } from './orm-instance';
import { FakeORMInstance } from './fake-orm-instance';

export class WebORM {
  private client?: Client;
  private databases?: Databases;
  private config: ORMConfig;
  private devInfo?: string;
  private schemas: Map<string, DatabaseSchema> = new Map();
  private collectionIds: Map<string, string> = new Map(); // Map table name to collection ID

  constructor(config: ORMConfig) {
    // Validate required configuration values (skip if in development mode)
    if (!config.development) {
      validateRequiredConfig(config);
    }
    
    // Set autoValidate default to true (unless in development mode)
    if (config.autoValidate === undefined) {
      config.autoValidate = !config.development;
    }
    
    this.config = config;

    // Only initialize Appwrite client if not in development mode
    if (!config.development) {
      this.client = new Client()
        .setEndpoint(config.endpoint)
        .setProject(config.projectId);
      
      this.databases = new Databases(this.client);
    }
  }

  /**
   * Initialize the ORM with table definitions
   */
  async init<T extends TableDefinition[]>(tables: T): Promise<WebORMInstance<T> | FakeORMInstance<T>> {
    // Store schemas for validation and collection IDs
    tables.forEach(table => {
      const collectionId = table.id || table.name;
      this.schemas.set(table.name, table.schema);
      this.collectionIds.set(table.name, collectionId);
    });

    // If in development mode, return fake instance
    if (this.config.development) {
      this.devInfo = '[AppwriteORM] Running in DEVELOPMENT mode - using cookies for data storage';
      return new FakeORMInstance(this.config.databaseId, this.schemas, this.collectionIds);
    }
    // Validate database structure if autoValidate is enabled
    if (this.config.autoValidate) {
      await this.validateTables(tables);
    }

    return new WebORMInstance(this.databases!, this.config.databaseId, this.schemas, this.collectionIds, this.client, this.config);
  }

  /**
   * When running in development, return informational message instead of logging
   */
  getDevInfo(): string | undefined {
    return this.devInfo;
  }

  /**
   * Validate that collections exist in the database
   * Note: Web SDK doesn't support getCollection, so we validate by attempting to list documents
   */
  private async validateTables(tables: TableDefinition[]): Promise<void> {
    if (!this.databases) {
      throw new ORMMigrationError('Database client not initialized');
    }

    try {
      for (const table of tables) {
        const collectionId = table.id || table.name;
        try {
          await this.databases.listDocuments(this.config.databaseId, collectionId, []);
        } catch (error: any) {
          throw new ORMMigrationError(
            `Collection '${collectionId}' not found or not accessible. Make sure the collection exists and has proper read permissions. Error: ${error?.message || error}`
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