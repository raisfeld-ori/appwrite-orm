import { AppwriteAttributeType, TypeScriptType, DatabaseField, ValidationError } from './types';
export declare class TypeMapper {
    static toAppwriteType(tsType: TypeScriptType): AppwriteAttributeType;
    static fromAppwriteType(appwriteType: AppwriteAttributeType): TypeScriptType;
}
export declare class Validator {
    static validateField(value: any, field: DatabaseField, fieldName: string): ValidationError[];
    private static validateType;
    private static getTypeString;
}
//# sourceMappingURL=utils.d.ts.map