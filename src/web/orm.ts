import { Client, Databases } from 'appwrite';
import { TableDefinition, ORMConfig, DatabaseSchema, validateRequiredConfig } from '../shared/types';
import { WebORMInstance } from './orm-instance';

export class WebORM {
  private client: Client;
  private databases: Databases;
  private config: ORMConfig;
  private schemas: Map<string, DatabaseSchema> = new Map();

  constructor(config: ORMConfig) {
    // Validate required configuration values
    validateRequiredConfig(config);
    
    this.config = config;
    this.client = new Client()
      .setEndpoint(config.endpoint)
      .setProject(config.projectId);
    
    this.databases = new Databases(this.client);
  }

  /**
   * Initialize the ORM with table definitions
   */
  init<T extends TableDefinition[]>(tables: T): WebORMInstance<T> {
    // Store schemas for validation
    tables.forEach(table => {
      this.schemas.set(table.name, table.schema);
    });

    return new WebORMInstance(this.databases, this.config.databaseId, this.schemas);
  }
}