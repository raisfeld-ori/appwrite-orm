import { DatabaseSchema, ValidationError } from '../shared/types';
export declare class WebValidator {
    /**
     * Validate data against schema
     */
    static validateData(data: any, schema: DatabaseSchema, requireAll?: boolean): ValidationError[];
    /**
     * Validate and throw error if validation fails
     */
    static validateAndThrow(data: any, schema: DatabaseSchema, requireAll?: boolean): void;
}
//# sourceMappingURL=validator.d.ts.map