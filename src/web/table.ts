import { Databases } from 'appwrite';
import { DatabaseSchema } from '../shared/types';
import { BaseTable, SchemaToType } from '../shared/table';
import { WebValidator } from './validator';

export class WebTable<T extends DatabaseSchema, TInterface = SchemaToType<T>> extends BaseTable<T, TInterface> {
  constructor(
    databases: Databases,
    databaseId: string,
    collectionId: string,
    schema: T
  ) {
    super(databases, databaseId, collectionId, schema);
  }

  /**
   * Override validation to use WebValidator
   */
  protected validateData(data: any, requireAll: boolean = false): void {
    WebValidator.validateAndThrow(data, this.schema, requireAll);
  }
}