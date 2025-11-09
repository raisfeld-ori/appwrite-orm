# API Reference Overview

The Appwrite ORM provides a comprehensive API for type-safe database operations. The API is organized into several modules:

## Package Structure

```
appwrite-orm/
├── index.ts          # Main exports (all modules)
├── web/              # Web-specific exports
├── server/           # Server-specific exports
└── shared/           # Common types and utilities
```

## Main Exports

### From Root Package (`appwrite-orm`)

```typescript
// ORM Classes
export { WebORM } from './web';
export { ServerORM } from './server';

// Instance Classes
export { WebORMInstance } from './web';
export { ServerORMInstance } from './server';

// Table Classes
export { WebTable } from './web';
export { ServerTable } from './server';
export { BaseTable } from './shared';

// Utility Classes
export { Migration } from './server';
export { AttributeManager } from './server';
export { PermissionManager } from './server';
export { WebValidator } from './web';

// Types and Interfaces
export * from './shared/types';

// Appwrite Re-exports
export { Query } from 'appwrite';
```

### From Web Package (`appwrite-orm/web`)

```typescript
export { WebORM } from './orm';
export { WebORMInstance } from './orm-instance';
export { WebTable } from './table';
export { WebValidator } from './validator';
export { Query } from 'appwrite';
export * from '../shared/types';
export * from '../shared/table';
```

### From Server Package (`appwrite-orm/server`)

```typescript
export { ServerORM } from './orm';
export { ServerORMInstance } from './orm-instance';
export { ServerTable } from './table';
export { Migration } from './migration';
export { AttributeManager } from './attribute-manager';
export { PermissionManager } from './permission-manager';
export { Query } from 'appwrite';
export * from '../shared/types';
export * from '../shared/table';
```

## Core Classes

### ORM Classes

| Class | Environment | Description |
|-------|-------------|-------------|
| `WebORM` | Browser | Main ORM class for web applications |
| `ServerORM` | Node.js | Main ORM class with migration support |

### Instance Classes

| Class | Environment | Description |
|-------|-------------|-------------|
| `WebORMInstance` | Browser | Initialized ORM instance with table access |
| `ServerORMInstance` | Node.js | Initialized ORM instance with table access |

### Table Classes

| Class | Environment | Description |
|-------|-------------|-------------|
| `BaseTable` | Both | Abstract base class for table operations |
| `WebTable` | Browser | Web-specific table implementation |
| `ServerTable` | Node.js | Server-specific table implementation |

### Utility Classes

| Class | Environment | Description |
|-------|-------------|-------------|
| `Migration` | Server | Database schema migration utilities |
| `AttributeManager` | Server | Appwrite attribute management |
| `PermissionManager` | Server | Collection permission management |
| `WebValidator` | Web | Client-side data validation |
| `Validator` | Both | Shared validation utilities |
| `TypeMapper` | Both | Type conversion utilities |

## Type System

### Core Types

```typescript
// Configuration
interface ORMConfig
interface TableDefinition<T>
interface DatabaseSchema
interface DatabaseField

// Data Types
type AppwriteAttributeType
type TypeScriptType

// Query Types
interface QueryOptions
interface FilterOptions

// Error Types
class ORMValidationError
class ORMMigrationError
interface ValidationError
```

## Method Categories

### CRUD Operations

- `create()` - Create new records
- `get()` - Retrieve by ID
- `update()` - Update existing records
- `delete()` - Remove records

### Query Operations

- `query()` - Filter and search records
- `all()` - Get all records
- `first()` - Get first matching record
- `count()` - Count matching records
- `find()` - Complex query operations

### Validation

- `validateData()` - Validate against schema
- `validateField()` - Validate individual fields
- `validateRequiredConfig()` - Validate ORM configuration

### Migration (Server Only)

- `migrate()` - Run schema migrations
- `createCollection()` - Create new collections
- `updateCollection()` - Update existing collections
- `createAttribute()` - Add new attributes
- `updateAttribute()` - Modify attributes

## Error Handling

The ORM provides structured error handling with custom error types:

```typescript
try {
  await db.users.create(invalidData);
} catch (error) {
  if (error instanceof ORMValidationError) {
    // Handle validation errors
    error.errors.forEach(err => {
      console.log(`${err.field}: ${err.message}`);
    });
  } else if (error instanceof ORMMigrationError) {
    // Handle migration errors
    console.log('Migration failed:', error.message);
  }
}
```

## Type Safety

The ORM provides full TypeScript support with automatic type inference:

```typescript
const userTable: TableDefinition = {
  name: 'users',
  schema: {
    name: { type: 'string', required: true },
    age: { type: 'number', min: 0 }
  }
};

const db = await orm.init([userTable]);

// TypeScript knows the return type
const user = await db.users.create({
  name: 'John',  // string (required)
  age: 30        // number (optional)
});

// user.$id: string
// user.name: string
// user.age: number | undefined
```

## Next Steps

- [Shared Types](shared-types.md) - Common types and interfaces
- [Web ORM](web-orm.md) - Browser-specific implementation
- [Server ORM](server-orm.md) - Node.js-specific implementation
- [Table Operations](table-operations.md) - CRUD and query methods