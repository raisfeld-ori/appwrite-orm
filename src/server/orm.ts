import { Client, Databases } from 'node-appwrite';
import { TableDefinition, ORMConfig, DatabaseSchema, validateRequiredConfig } from '../shared/types';
import { Migration } from './migration';
import { ServerORMInstance } from './orm-instance';
import { FakeServerORMInstance } from './fake-orm-instance';

export class ServerORM {
  private client?: Client;
  private databases?: Databases;
  private config: ORMConfig;
  private devInfo?: string;
  private schemas: Map<string, DatabaseSchema> = new Map();
  private collectionIds: Map<string, string> = new Map(); // Map table name to collection ID
  private migration?: Migration;

  constructor(config: ORMConfig) {
    // Validate required configuration values (skip if in development mode)
    if (!config.development) {
      validateRequiredConfig(config);
      
      if (!config.apiKey) {
        throw new Error('API key is required for server-side ORM');
      }
    }

    // Set autoValidate default to true (unless in development mode)
    if (config.autoValidate === undefined) {
      config.autoValidate = !config.development;
    }

    // If autoMigrate is true, autoValidate must also be true
    if (config.autoMigrate) {
      config.autoValidate = true;
    }

    this.config = config;

    // Only initialize Appwrite client if not in development mode
    if (!config.development) {
      this.client = new Client();
      
      // Set endpoint and project
      this.client
        .setEndpoint(config.endpoint)
        .setProject(config.projectId);
      
      // Set API key for server-side operations
      // The setKey method exists in the node SDK but isn't in TypeScript types
      if (config.apiKey) {
        (this.client as any).setKey(config.apiKey);
      }
      
      this.databases = new Databases(this.client);
      this.migration = new Migration(this.databases, this.config);
    }
  }

  /**
   * Initialize the ORM with table definitions and optional migration
   */
  async init<T extends TableDefinition[]>(tables: T): Promise<ServerORMInstance<T> | FakeServerORMInstance<T>> {
    // Store schemas and collection IDs
    tables.forEach(table => {
      const collectionId = table.id || table.name;
      this.schemas.set(table.name, table.schema);
      this.collectionIds.set(table.name, collectionId);
    });

    // If in development mode, return fake instance
    if (this.config.development) {
      this.devInfo = '[AppwriteORM Server] Running in DEVELOPMENT mode - using in-memory storage';
      return new FakeServerORMInstance(this.config.databaseId, this.schemas, this.collectionIds);
    }

    // Auto-migrate if enabled
    if (this.config.autoMigrate) {
      await this.migration!.migrate(tables);
    } else if (this.config.autoValidate) {
      // Validate database structure if autoValidate is enabled
      await this.migration!.validate(tables);
    }

    return new ServerORMInstance(this.databases!, this.config.databaseId, this.schemas, this.collectionIds, this.migration, tables, this.client, this.config);
  }

  /**
   * When running in development, return informational message instead of logging
   */
  getDevInfo(): string | undefined {
    return this.devInfo;
  }
}