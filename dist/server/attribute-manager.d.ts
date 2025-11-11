import { Databases } from 'node-appwrite';
import { ORMConfig } from '../shared/types';
export declare class AttributeManager {
    private config;
    private db;
    constructor(databases: Databases, config: ORMConfig);
    /**
     * Create an attribute in Appwrite
     */
    createAttribute(collectionId: string, key: string, field: any): Promise<void>;
}
//# sourceMappingURL=attribute-manager.d.ts.map