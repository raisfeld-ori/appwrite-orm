import { Databases } from 'appwrite';
import { ORMConfig, ORMMigrationError } from '../shared/types';
import { TypeMapper } from '../shared/utils';

export class AttributeManager {
  constructor(
    private databases: Databases,
    private config: ORMConfig
  ) {}

  /**
   * Create an attribute in Appwrite
   */
  async createAttribute(collectionId: string, key: string, field: any): Promise<void> {
    const appwriteType = TypeMapper.toAppwriteType(field.type);
    
    try {
      switch (appwriteType) {
        case 'string':
          await (this.databases as any).createStringAttribute(
            this.config.databaseId,
            collectionId,
            key,
            field.size || 255,
            field.required || false,
            field.default
          );
          break;
          
        case 'integer':
          await (this.databases as any).createIntegerAttribute(
            this.config.databaseId,
            collectionId,
            key,
            field.required || false,
            field.min,
            field.max,
            field.default
          );
          break;
          
        case 'float':
          await (this.databases as any).createFloatAttribute(
            this.config.databaseId,
            collectionId,
            key,
            field.required || false,
            field.min,
            field.max,
            field.default
          );
          break;
          
        case 'boolean':
          await (this.databases as any).createBooleanAttribute(
            this.config.databaseId,
            collectionId,
            key,
            field.required || false,
            field.default
          );
          break;
          
        case 'datetime':
          await (this.databases as any).createDatetimeAttribute(
            this.config.databaseId,
            collectionId,
            key,
            field.required || false,
            field.default
          );
          break;
          
        case 'enum':
          if (!field.enum || !Array.isArray(field.enum)) {
            throw new Error(`Enum field ${key} must have an enum array`);
          }
          await (this.databases as any).createEnumAttribute(
            this.config.databaseId,
            collectionId,
            key,
            field.enum,
            field.required || false,
            field.default
          );
          break;
          
        default:
          throw new Error(`Unsupported attribute type: ${appwriteType}`);
      }
    } catch (error: any) {
      throw new ORMMigrationError(`Failed to create attribute ${key}: ${error?.message || 'Unknown error'}`);
    }
  }
}