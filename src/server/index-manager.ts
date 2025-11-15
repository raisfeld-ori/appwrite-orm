import { Databases } from 'node-appwrite';
import { ORMConfig, ORMMigrationError, IndexDefinition } from '../shared/types';
import { DatabasesWrapper } from './appwrite-extended';

export class IndexManager {
  private db: DatabasesWrapper;

  constructor(
    databases: Databases,
    private config: ORMConfig
  ) {
    this.db = new DatabasesWrapper(databases);
  }

  /**
   * Create an index in Appwrite
   */
  async createIndex(
    collectionId: string,
    index: IndexDefinition
  ): Promise<void> {
    try {
      await this.db.createIndex(
        this.config.databaseId,
        collectionId,
        index.key,
        index.type,
        index.attributes,
        index.orders
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new ORMMigrationError(`Failed to create index ${index.key}: ${message}`);
    }
  }

  /**
   * Delete an index from Appwrite
   */
  async deleteIndex(collectionId: string, key: string): Promise<void> {
    try {
      await this.db.deleteIndex(this.config.databaseId, collectionId, key);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new ORMMigrationError(`Failed to delete index ${key}: ${message}`);
    }
  }

  /**
   * List all indexes for a collection
   */
  async listIndexes(collectionId: string): Promise<any[]> {
    try {
      const collection = await this.db.getCollection(this.config.databaseId, collectionId);
      return collection.indexes || [];
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new ORMMigrationError(`Failed to list indexes: ${message}`);
    }
  }
}
