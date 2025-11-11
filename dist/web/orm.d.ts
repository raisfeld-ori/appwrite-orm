import { TableDefinition, ORMConfig } from '../shared/types';
import { WebORMInstance } from './orm-instance';
export declare class WebORM {
    private client;
    private databases;
    private db;
    private config;
    private schemas;
    private collectionIds;
    constructor(config: ORMConfig);
    /**
     * Initialize the ORM with table definitions
     */
    init<T extends TableDefinition[]>(tables: T): Promise<WebORMInstance<T>>;
    /**
     * Validate that collections exist in the database
     */
    private validateTables;
}
//# sourceMappingURL=orm.d.ts.map