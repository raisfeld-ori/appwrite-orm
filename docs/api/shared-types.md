# Shared Types

The shared types module contains all common interfaces, types, and utilities used across both web and server implementations.

## Core Interfaces

### ORMConfig

Configuration interface for ORM initialization.

```typescript
interface ORMConfig {
  endpoint: string;      // Appwrite server endpoint
  projectId: string;     // Appwrite project ID
  databaseId: string;    // Target database ID
  apiKey?: string;       // API key (server-only)
  autoMigrate?: boolean; // Auto-migration flag (server-only)
}
```

**Properties:**

- `endpoint` (required): The Appwrite server endpoint URL
- `projectId` (required): Your Appwrite project identifier
- `databaseId` (required): The target database identifier
- `apiKey` (optional): API key for server-side operations
- `autoMigrate` (optional): Enable automatic schema migration (server-only)

**Example:**

```typescript
const config: ORMConfig = {
  endpoint: 'https://cloud.appwrite.io/v1',
  projectId: 'my-project',
  databaseId: 'main-db',
  apiKey: 'secret-key',
  autoMigrate: true
};
```

### TableDefinition

Defines the structure of a database table/collection.

```typescript
interface TableDefinition<T extends DatabaseSchema = DatabaseSchema> {
  name: string;           // Collection name
  schema: T;              // Field definitions
  role?: Record<string, any>; // Optional permissions
}
```

**Properties:**

- `name` (required): The collection name in Appwrite
- `schema` (required): Field definitions using DatabaseSchema
- `role` (optional): Permission configuration (defaults to public)

**Example:**

```typescript
const userTable: TableDefinition = {
  name: 'users',
  schema: {
    name: { type: 'string', required: true },
    email: { type: 'string', required: true },
    age: { type: 'number', min: 0, max: 120 }
  },
  role: { 'role:all': ['read', 'create'] }
};
```

### DatabaseSchema

Defines the structure of fields in a table.

```typescript
interface DatabaseSchema {
  [fieldName: string]: DatabaseField;
}
```

A record where keys are field names and values are DatabaseField definitions.

### DatabaseField

Defines individual field properties and constraints.

```typescript
interface DatabaseField {
  type: TypeScriptType;    // Field data type
  required?: boolean;      // Whether field is required
  default?: any;          // Default value
  array?: boolean;        // Whether field is an array
  size?: number;          // String length limit
  min?: number;           // Minimum value (numbers)
  max?: number;           // Maximum value (numbers)
  enum?: string[];        // Enum values
}
```

**Properties:**

- `type` (required): The TypeScript type for this field
- `required` (optional): Whether the field is required (default: false)
- `default` (optional): Default value when not provided
- `array` (optional): Whether field accepts arrays
- `size` (optional): Maximum string length
- `min` (optional): Minimum numeric value
- `max` (optional): Maximum numeric value
- `enum` (optional): Array of allowed string values

**Examples:**

```typescript
// String field with constraints
const nameField: DatabaseField = {
  type: 'string',
  required: true,
  size: 100
};

// Number field with range
const ageField: DatabaseField = {
  type: 'number',
  min: 0,
  max: 120,
  default: 0
};

// Enum field
const roleField: DatabaseField = {
  type: ['admin', 'user', 'guest'],
  default: 'user',
  enum: ['admin', 'user', 'guest']
};

// Boolean field
const activeField: DatabaseField = {
  type: 'boolean',
  default: true
};
```

## Type Definitions

### TypeScriptType

Union type representing supported TypeScript data types.

```typescript
type TypeScriptType = 
  | 'string'
  | 'number'
  | 'boolean'
  | 'Date'
  | string[]; // for enums
```

**Supported Types:**

- `'string'` - Text data
- `'number'` - Numeric data (integers and floats)
- `'boolean'` - True/false values
- `'Date'` - Date and time values
- `string[]` - Enum values (array of allowed strings)

### AppwriteAttributeType

Union type representing Appwrite's native attribute types.

```typescript
type AppwriteAttributeType = 
  | 'string'
  | 'integer'
  | 'float'
  | 'boolean'
  | 'datetime'
  | 'email'
  | 'ip'
  | 'url'
  | 'enum';
```

## Error Types

### ValidationError

Interface for individual validation errors.

```typescript
interface ValidationError {
  field: string;    // Field name that failed validation
  message: string;  // Error description
  value?: any;      // The invalid value (optional)
}
```

**Example:**

```typescript
const error: ValidationError = {
  field: 'age',
  message: 'Value -5 is below minimum of 0',
  value: -5
};
```

### ORMValidationError

Custom error class for validation failures.

```typescript
class ORMValidationError extends Error {
  public errors: ValidationError[];
  
  constructor(errors: ValidationError[]);
}
```

**Properties:**

- `errors`: Array of ValidationError objects
- `message`: Formatted error message
- `name`: Always 'ORMValidationError'

**Example:**

```typescript
try {
  await db.users.create(invalidData);
} catch (error) {
  if (error instanceof ORMValidationError) {
    error.errors.forEach(err => {
      console.log(`${err.field}: ${err.message}`);
    });
  }
}
```

### ORMMigrationError

Custom error class for migration failures (server-only).

```typescript
class ORMMigrationError extends Error {
  constructor(message: string);
}
```

**Properties:**

- `message`: Error description
- `name`: Always 'ORMMigrationError'

## Utility Functions

### validateRequiredConfig

Validates that required configuration values are provided.

```typescript
function validateRequiredConfig(config: ORMConfig): void
```

**Parameters:**

- `config`: The ORMConfig object to validate

**Throws:**

- `Error`: If any required fields are missing or empty

**Example:**

```typescript
const config = {
  endpoint: '',  // Invalid: empty string
  projectId: 'my-project',
  databaseId: 'main-db'
};

validateRequiredConfig(config); // Throws: Missing required configuration values: endpoint
```

## Legacy Types

### Database (Deprecated)

Legacy alias for TableDefinition, maintained for backward compatibility.

```typescript
interface Database<T extends DatabaseSchema = DatabaseSchema> extends TableDefinition<T> {}
```

!!! warning "Deprecated"
    Use `TableDefinition` instead of `Database` in new code.

## Type Inference

The ORM provides automatic type inference from schema definitions:

```typescript
const userTable: TableDefinition = {
  name: 'users',
  schema: {
    name: { type: 'string', required: true },
    age: { type: 'number' },
    isActive: { type: 'boolean', default: true }
  }
};

// TypeScript infers the type automatically
type UserType = {
  $id: string;
  name: string;           // required string
  age: number | undefined; // optional number
  isActive: boolean | undefined; // optional boolean with default
};
```

## Usage Examples

### Complete Schema Definition

```typescript
import { TableDefinition, DatabaseField } from 'appwrite-orm';

// Define individual fields
const nameField: DatabaseField = {
  type: 'string',
  required: true,
  size: 100
};

const emailField: DatabaseField = {
  type: 'string',
  required: true,
  size: 255
};

const ageField: DatabaseField = {
  type: 'number',
  min: 0,
  max: 120
};

const roleField: DatabaseField = {
  type: ['admin', 'user', 'guest'],
  default: 'user',
  enum: ['admin', 'user', 'guest']
};

// Combine into table definition
const userTable: TableDefinition = {
  name: 'users',
  schema: {
    name: nameField,
    email: emailField,
    age: ageField,
    role: roleField,
    isActive: { type: 'boolean', default: true },
    createdAt: { type: 'Date', default: new Date() }
  }
};
```

### Error Handling

```typescript
import { ORMValidationError, ValidationError } from 'appwrite-orm';

function handleValidationError(error: ORMValidationError) {
  console.log('Validation failed with errors:');
  
  error.errors.forEach((err: ValidationError) => {
    console.log(`- Field "${err.field}": ${err.message}`);
    if (err.value !== undefined) {
      console.log(`  Invalid value: ${err.value}`);
    }
  });
}
```