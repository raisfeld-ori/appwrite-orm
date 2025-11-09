import { Client, Databases } from 'appwrite';
import { TableDefinition, ORMConfig, DatabaseSchema, validateRequiredConfig } from '../shared/types';
import { Migration } from './migration';
import { ServerORMInstance } from './orm-instance';

export class ServerORM {
  private client: Client;
  private databases: Databases;
  private config: ORMConfig;
  private schemas: Map<string, DatabaseSchema> = new Map();
  private migration: Migration;

  constructor(config: ORMConfig) {
    // Validate required configuration values
    validateRequiredConfig(config);
    
    if (!config.apiKey) {
      throw new Error('API key is required for server-side ORM');
    }

    this.config = config;
    this.client = new Client()
      .setEndpoint(config.endpoint)
      .setProject(config.projectId);
    
    // Set API key for server-side operations
    if (config.apiKey) {
      try {
        (this.client as any).setKey(config.apiKey);
      } catch (error) {
        // For newer Appwrite versions, the key might be set differently
        console.warn('Could not set API key using setKey method. Please ensure you are using the correct Appwrite SDK version.');
      }
    }
    
    this.databases = new Databases(this.client);
    this.migration = new Migration(this.databases, this.config);
  }

  /**
   * Initialize the ORM with table definitions and optional migration
   */
  async init<T extends TableDefinition[]>(tables: T): Promise<ServerORMInstance<T>> {
    // Store schemas
    tables.forEach(table => {
      this.schemas.set(table.name, table.schema);
    });

    // Auto-migrate if enabled
    if (this.config.autoMigrate) {
      await this.migration.migrate(tables);
    }

    return new ServerORMInstance(this.databases, this.config.databaseId, this.schemas);
  }
}