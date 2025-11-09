import { Databases } from 'appwrite';
import { DatabaseSchema } from '../shared/types';
import { BaseTable } from '../shared/table';
import { Validator } from '../shared/utils';

export class ServerTable<T extends DatabaseSchema> extends BaseTable<T> {
  constructor(
    databases: Databases,
    databaseId: string,
    collectionId: string,
    schema: T
  ) {
    super(databases, databaseId, collectionId, schema);
  }

  /**
   * Server-specific method to create collection
   */
  async createCollection(name?: string, permissions?: string[]): Promise<void> {
    await (this.databases as any).createCollection(
      this.databaseId,
      this.collectionId,
      name || this.collectionId,
      permissions
    );
  }

  /**
   * Server-specific method to delete collection
   */
  async deleteCollection(): Promise<void> {
    await (this.databases as any).deleteCollection(this.databaseId, this.collectionId);
  }

  /**
   * Bulk insert documents (server-only optimization)
   */
  async bulkCreate(documents: Partial<Omit<any, '$id'>>[]): Promise<any[]> {
    const results = [];
    for (const doc of documents) {
      const result = await this.create(doc);
      results.push(result);
    }
    return results;
  }

  /**
   * Bulk update documents (server-only optimization)
   */
  async bulkUpdate(updates: { id: string; data: Partial<any> }[]): Promise<any[]> {
    const results = [];
    for (const update of updates) {
      const result = await this.update(update.id, update.data);
      results.push(result);
    }
    return results;
  }

  /**
   * Bulk delete documents (server-only optimization)
   */
  async bulkDelete(ids: string[]): Promise<void> {
    for (const id of ids) {
      await this.delete(id);
    }
  }
}