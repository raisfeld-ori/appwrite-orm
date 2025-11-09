import { Databases } from 'appwrite';
import { DatabaseSchema } from '../shared/types';
import { BaseTable } from '../shared/table';
export declare class WebTable<T extends DatabaseSchema> extends BaseTable<T> {
    constructor(databases: Databases, databaseId: string, collectionId: string, schema: T);
    /**
     * Override validation to use WebValidator
     */
    protected validateData(data: any, requireAll?: boolean): void;
}
//# sourceMappingURL=table.d.ts.map