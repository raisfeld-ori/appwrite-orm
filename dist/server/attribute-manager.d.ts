import { Databases } from 'appwrite';
import { ORMConfig } from '../shared/types';
export declare class AttributeManager {
    private databases;
    private config;
    constructor(databases: Databases, config: ORMConfig);
    /**
     * Create an attribute in Appwrite
     */
    createAttribute(collectionId: string, key: string, field: any): Promise<void>;
}
//# sourceMappingURL=attribute-manager.d.ts.map