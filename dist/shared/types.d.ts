export type AppwriteAttributeType = 'string' | 'integer' | 'float' | 'boolean' | 'datetime' | 'email' | 'ip' | 'url' | 'enum';
export type TypeScriptType = 'string' | 'number' | 'boolean' | 'Date' | string[];
export interface DatabaseField {
    type: TypeScriptType;
    required?: boolean;
    default?: any;
    array?: boolean;
    size?: number;
    min?: number;
    max?: number;
    enum?: string[];
}
export interface DatabaseSchema {
    [fieldName: string]: DatabaseField;
}
export interface TableDefinition<T extends DatabaseSchema = DatabaseSchema> {
    name: string;
    schema: T;
    role?: Record<string, any>;
}
export interface Database<T extends DatabaseSchema = DatabaseSchema> extends TableDefinition<T> {
}
export interface ORMConfig {
    endpoint: string;
    projectId: string;
    databaseId: string;
    apiKey?: string;
    autoMigrate?: boolean;
}
export declare function validateRequiredConfig(config: ORMConfig): void;
export interface ValidationError {
    field: string;
    message: string;
    value?: any;
}
export declare class ORMValidationError extends Error {
    errors: ValidationError[];
    constructor(errors: ValidationError[]);
}
export declare class ORMMigrationError extends Error {
    constructor(message: string);
}
//# sourceMappingURL=types.d.ts.map