import { Databases } from 'node-appwrite';
import { ORMConfig, ORMMigrationError, DatabaseField } from '../shared/types';
import { TypeMapper } from '../shared/utils';
import { DatabasesWrapper } from './appwrite-extended';

export class AttributeManager {
  private db: DatabasesWrapper;

  constructor(
    databases: Databases,
    private config: ORMConfig
  ) {
    this.db = new DatabasesWrapper(databases);
  }

  /**
   * Create an attribute in Appwrite
   */
  async createAttribute(collectionId: string, key: string, field: DatabaseField): Promise<void> {
    const appwriteType = TypeMapper.toAppwriteType(field.type);
    const isRequired = field.required || false;
    // Appwrite doesn't allow default values on required fields
    const defaultValue = isRequired ? undefined : field.default;
    const isArray = field.array || false;
    
    try {
      switch (appwriteType) {
        case 'string':
          await this.db.createStringAttribute(
            this.config.databaseId,
            collectionId,
            key,
            field.size || 255,
            isRequired,
            defaultValue as string | null | undefined,
            isArray
          );
          break;
          
        case 'integer':
          await this.db.createIntegerAttribute(
            this.config.databaseId,
            collectionId,
            key,
            isRequired,
            field.min,
            field.max,
            defaultValue as number | null | undefined,
            isArray
          );
          break;
          
        case 'float':
          await this.db.createFloatAttribute(
            this.config.databaseId,
            collectionId,
            key,
            isRequired,
            field.min,
            field.max,
            defaultValue as number | null | undefined,
            isArray
          );
          break;
          
        case 'boolean':
          await this.db.createBooleanAttribute(
            this.config.databaseId,
            collectionId,
            key,
            isRequired,
            defaultValue as boolean | null | undefined,
            isArray
          );
          break;
          
        case 'datetime':
          await this.db.createDatetimeAttribute(
            this.config.databaseId,
            collectionId,
            key,
            isRequired,
            defaultValue as string | null | undefined,
            isArray
          );
          break;
          
        case 'enum':
          if (!field.enum || !Array.isArray(field.enum)) {
            throw new Error(`Enum field ${key} must have an enum array`);
          }
          await this.db.createEnumAttribute(
            this.config.databaseId,
            collectionId,
            key,
            field.enum,
            isRequired,
            defaultValue as string | null | undefined,
            isArray
          );
          break;
          
        default:
          throw new Error(`Unsupported attribute type: ${appwriteType}`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new ORMMigrationError(`Failed to create attribute ${key}: ${message}`);
    }
  }
}