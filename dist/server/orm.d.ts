import { TableDefinition, ORMConfig } from '../shared/types';
import { ServerORMInstance } from './orm-instance';
export declare class ServerORM {
    private client;
    private databases;
    private config;
    private schemas;
    private migration;
    constructor(config: ORMConfig);
    /**
     * Initialize the ORM with table definitions and optional migration
     */
    init<T extends TableDefinition[]>(tables: T): Promise<ServerORMInstance<T>>;
}
//# sourceMappingURL=orm.d.ts.map