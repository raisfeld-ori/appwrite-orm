import { Databases, Models } from 'node-appwrite';
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

  /**
   * Delete an attribute from Appwrite
   */
  async deleteAttribute(collectionId: string, key: string): Promise<void> {
    try {
      await this.db.deleteAttribute(this.config.databaseId, collectionId, key);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new ORMMigrationError(`Failed to delete attribute ${key}: ${message}`);
    }
  }

  /**
   * Compare if an existing attribute matches the desired field configuration
   * Note: Some properties like size and array cannot be changed after creation
   */
  attributeMatches(existingAttr: any, key: string, field: DatabaseField): boolean {
    const appwriteType = TypeMapper.toAppwriteType(field.type);
    
    if (existingAttr.type !== appwriteType) {
      return false;
    }
    
    if (existingAttr.array !== (field.array || false)) {
      return false;
    }
    
    if (existingAttr.required !== (field.required || false)) {
      return false;
    }
    
    if (appwriteType === 'string' && existingAttr.size !== (field.size || 255)) {
      return false;
    }
    
    if ((appwriteType === 'integer' || appwriteType === 'float')) {
      if (field.min !== undefined && existingAttr.min !== field.min) {
        return false;
      }
      if (field.max !== undefined && existingAttr.max !== field.max) {
        return false;
      }
    }
    
    if (appwriteType === 'enum') {
      const existingElements = existingAttr.elements || [];
      const desiredElements = field.enum || [];
      if (existingElements.length !== desiredElements.length ||
          !existingElements.every((el: string) => desiredElements.includes(el))) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Check if attributes differ in immutable properties (type, size, array)
   * These properties cannot be updated and require recreation
   */
  private hasImmutableDifferences(existingAttr: any, field: DatabaseField): boolean {
    const appwriteType = TypeMapper.toAppwriteType(field.type);
    
    if (existingAttr.type !== appwriteType) {
      return true;
    }
    
    if (existingAttr.array !== (field.array || false)) {
      return true;
    }
    
    if (appwriteType === 'string' && existingAttr.size !== (field.size || 255)) {
      return true;
    }
    
    if (appwriteType === 'enum') {
      const existingElements = existingAttr.elements || [];
      const desiredElements = field.enum || [];
      if (existingElements.length !== desiredElements.length ||
          !existingElements.every((el: string) => desiredElements.includes(el))) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Update an attribute's mutable properties (required, default, min/max)
   * If immutable properties differ, throws an error to warn about data loss
   */
  async updateAttribute(collectionId: string, key: string, field: DatabaseField, existingAttr: any): Promise<void> {
    if (this.hasImmutableDifferences(existingAttr, field)) {
      throw new ORMMigrationError(
        `Cannot update attribute '${key}' in collection '${collectionId}': ` +
        `Immutable properties (type, size, array, enum values) differ. ` +
        `This would require deleting and recreating the attribute, which would destroy existing data. ` +
        `Please manually migrate the data first.`
      );
    }

    const appwriteType = TypeMapper.toAppwriteType(field.type);
    const isRequired = field.required || false;
    
    // Determine the default value to pass:
    // 1. If field specifies a default, use it (regardless of required status)
    // 2. If changing to required=true and field has NO default, pass undefined (omit xdefault entirely)
    // 3. If not required and no default specified, pass undefined
    let defaultValue: any;
    if ('default' in field) {
      // New schema explicitly sets a default value
      defaultValue = field.default;
    } else if (isRequired) {
      // Changing to required without a default - don't pass xdefault
      defaultValue = undefined;
    } else {
      // Optional field without explicit default
      defaultValue = undefined;
    }

    try {
      switch (appwriteType) {
        case 'string':
          await this.db.updateStringAttribute(
            this.config.databaseId,
            collectionId,
            key,
            isRequired,
            defaultValue as string | null | undefined
          );
          break;

        case 'integer':
        case 'float': {
          const existingMin = existingAttr.min;
          const existingMax = existingAttr.max;
          
          const min = field.min !== undefined ? field.min : (existingMin !== null && existingMin !== undefined ? existingMin : undefined);
          const max = field.max !== undefined ? field.max : (existingMax !== null && existingMax !== undefined ? existingMax : undefined);
          
          if (appwriteType === 'integer') {
            await this.db.updateIntegerAttribute(
              this.config.databaseId,
              collectionId,
              key,
              isRequired,
              min !== undefined ? min : null,
              max !== undefined ? max : null,
              defaultValue as number | null | undefined
            );
          } else {
            await this.db.updateFloatAttribute(
              this.config.databaseId,
              collectionId,
              key,
              isRequired,
              min !== undefined ? min : null,
              max !== undefined ? max : null,
              defaultValue as number | null | undefined
            );
          }
          break;
        }

        case 'boolean':
          await this.db.updateBooleanAttribute(
            this.config.databaseId,
            collectionId,
            key,
            isRequired,
            defaultValue as boolean | null | undefined
          );
          break;

        case 'datetime':
          await this.db.updateDatetimeAttribute(
            this.config.databaseId,
            collectionId,
            key,
            isRequired,
            defaultValue as string | null | undefined
          );
          break;

        case 'enum':
          if (!field.enum || !Array.isArray(field.enum)) {
            throw new Error(`Enum field ${key} must have an enum array`);
          }
          await this.db.updateEnumAttribute(
            this.config.databaseId,
            collectionId,
            key,
            field.enum,
            isRequired,
            defaultValue as string | null | undefined
          );
          break;

        default:
          throw new Error(`Unsupported attribute type: ${appwriteType}`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new ORMMigrationError(`Failed to update attribute ${key}: ${message}`);
    }
  }
}
