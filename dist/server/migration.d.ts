import { Databases } from 'appwrite';
import { TableDefinition, ORMConfig } from '../shared/types';
export declare class Migration {
    private databases;
    private config;
    private attributeManager;
    private permissionManager;
    constructor(databases: Databases, config: ORMConfig);
    /**
     * Migrate table schemas
     */
    migrate(tables: TableDefinition[]): Promise<void>;
    /**
     * Ensure database exists, create if it doesn't
     */
    private ensureDatabaseExists;
    /**
     * Migrate a single collection
     */
    private migrateCollection;
}
//# sourceMappingURL=migration.d.ts.map