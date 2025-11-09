import { TableDefinition, ORMConfig } from '../shared/types';
import { WebORMInstance } from './orm-instance';
export declare class WebORM {
    private client;
    private databases;
    private config;
    private schemas;
    constructor(config: ORMConfig);
    /**
     * Initialize the ORM with table definitions
     */
    init<T extends TableDefinition[]>(tables: T): WebORMInstance<T>;
}
//# sourceMappingURL=orm.d.ts.map