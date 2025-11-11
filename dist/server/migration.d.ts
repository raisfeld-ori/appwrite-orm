import { Databases } from 'node-appwrite';
import { TableDefinition, ORMConfig } from '../shared/types';
export declare class Migration {
    private config;
    private attributeManager;
    private permissionManager;
    private db;
    constructor(databases: Databases, config: ORMConfig);
    /**
     * Migrate table schemas
     */
    migrate(tables: TableDefinition[]): Promise<void>;
    /**
     * Validate database structure matches the provided table definitions
     */
    validate(tables: TableDefinition[]): Promise<void>;
    /**
     * Ensure database exists, create if it doesn't
     */
    private ensureDatabaseExists;
    /**
     * Migrate a single collection
     */
    private migrateCollection;
    /**
     * Validate a single collection structure
     */
    private validateCollection;
}
//# sourceMappingURL=migration.d.ts.map