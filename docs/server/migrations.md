# Schema Migrations and Exports

Export your Appwrite database schemas to SQL, Firebase, or text formats for migration, documentation, or backup purposes.

## Overview

The migration export feature lets you convert your Appwrite schema definitions into other database formats. This is useful when:

- Migrating from Appwrite to SQL databases (MySQL, PostgreSQL, SQLite)
- Moving to Firebase Realtime Database or Firestore
- Generating documentation for your database structure
- Creating backup schemas in portable formats

## Export to SQL

Generate SQL CREATE TABLE statements compatible with MySQL, PostgreSQL, and SQLite.

### Basic Usage

```typescript
import { ServerORM } from 'appwrite-orm/server';

const orm = new ServerORM({
  endpoint: 'https://cloud.appwrite.io/v1',
  projectId: 'your-project-id',
  databaseId: 'your-database-id',
  apiKey: 'your-api-key'
});

const tables = [{
  name: 'users',
  schema: {
    name: { type: 'string', required: true, size: 100 },
    email: { type: 'string', required: true },
    age: { type: 'integer', min: 0, max: 120 },
    role: { type: ['admin', 'user'], enum: ['admin', 'user'], default: 'user' }
  },
  indexes: [
    { key: 'email_idx', type: 'unique', attributes: ['email'] }
  ]
}];

// Get Migration instance
const migration = orm.getMigration();

// Export to SQL
const sql = migration.exportToSQL(tables);
console.log(sql);
```

### Generated SQL Output

```sql
CREATE TABLE users (
  $id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  age INTEGER,
  role VARCHAR(255) DEFAULT 'user',
  UNIQUE (email),
  CHECK (age >= 0 AND age <= 120),
  CHECK (role IN ('admin', 'user'))
);
```

### Type Mapping

| Appwrite Type | SQL Type | Notes |
|---------------|----------|-------|
| `string` | `VARCHAR(size)` | Default size: 255 |
| `integer` | `INTEGER` | |
| `number` | `INTEGER` | |
| `float` | `REAL` | |
| `boolean` | `INTEGER` | 0 or 1 for SQLite compatibility |
| `Date` | `TEXT` | ISO 8601 format |
| `datetime` | `TEXT` | ISO 8601 format |
| `enum` | `VARCHAR(size)` | With CHECK constraint |
| `array` | `TEXT` | JSON serialization |

### Constraints

SQL exports include all field constraints:

```typescript
{
  name: 'products',
  schema: {
    name: { type: 'string', required: true },      // NOT NULL
    price: { type: 'float', min: 0 },              // CHECK (price >= 0)
    stock: { type: 'integer', default: 0 },        // DEFAULT 0
    category: { 
      type: ['electronics', 'clothing'], 
      enum: ['electronics', 'clothing'] 
    }  // CHECK (category IN (...))
  },
  indexes: [
    { key: 'name_idx', type: 'unique', attributes: ['name'] }  // UNIQUE
  ]
}
```

### Compatibility Notes

The generated SQL is compatible with:

- **MySQL 5.7+**: Works without modification
- **PostgreSQL 9.5+**: Works without modification
- **SQLite 3.8+**: Works without modification

For vendor-specific features (like auto-increment), you may need to modify the generated SQL.

## Export to Firebase

Generate Firebase Realtime Database security rules and structure.

### Firebase Export Usage

```typescript
const firebase = migration.exportToFirebase(tables);
console.log(firebase);
```

### Generated Firebase Output

```json
{
  "rules": {
    "users": {
      ".read": "auth != null",
      ".write": "auth != null",
      "$userId": {
        ".validate": "newData.hasChildren(['name', 'email'])",
        "name": {
          ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 100"
        },
        "email": {
          ".validate": "newData.isString() && newData.val().length > 0"
        },
        "age": {
          ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 120"
        },
        "role": {
          ".validate": "newData.isString() && newData.val().matches(/^(admin|user)$/)"
        }
      }
    }
  }
}
```

### Firebase Security Rules

Firebase exports include validation rules based on your schema:

```typescript
{
  name: 'posts',
  schema: {
    title: { type: 'string', required: true, size: 200 },
    content: { type: 'string', required: true },
    published: { type: 'boolean', default: false },
    views: { type: 'integer', min: 0 }
  }
}
```

Generates:

```json
{
  "rules": {
    "posts": {
      ".read": "auth != null",
      ".write": "auth != null",
      "$postId": {
        ".validate": "newData.hasChildren(['title', 'content'])",
        "title": {
          ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 200"
        },
        "content": {
          ".validate": "newData.isString() && newData.val().length > 0"
        },
        "published": {
          ".validate": "newData.isBoolean()"
        },
        "views": {
          ".validate": "newData.isNumber() && newData.val() >= 0"
        }
      }
    }
  }
}
```

### Type Validation

| Appwrite Type | Firebase Validation |
|---------------|---------------------|
| `string` | `newData.isString()` |
| `integer` | `newData.isNumber()` with floor check |
| `float` | `newData.isNumber()` |
| `boolean` | `newData.isBoolean()` |
| `enum` | `newData.val().matches(/^(val1\|val2)$/)` |

## Export to Text

Generate human-readable documentation of your schema.

### Basic Usage

```typescript
const text = migration.exportToText(tables);
console.log(text);
```

### Generated Text Output

```text
Database Schema
===============

Collection: users
-----------------
Fields:
  - $id (string, primary key)
  - name (string, required, size: 100)
  - email (string, required, size: 255)
  - age (integer, min: 0, max: 120)
  - role (enum: admin, user, default: user)

Indexes:
  - email_idx (unique): email
```

### Use Cases

Text exports are perfect for:

- Team documentation
- README files
- Database design reviews
- Quick reference guides

## Complete Workflow Example

Export your schema to all three formats:

```typescript
import { ServerORM } from 'appwrite-orm/server';
import { writeFileSync } from 'fs';

const orm = new ServerORM({
  endpoint: process.env.APPWRITE_ENDPOINT!,
  projectId: process.env.APPWRITE_PROJECT_ID!,
  databaseId: process.env.APPWRITE_DATABASE_ID!,
  apiKey: process.env.APPWRITE_API_KEY!
});

// Define your schema
const tables = [
  {
    name: 'users',
    schema: {
      name: { type: 'string', required: true },
      email: { type: 'string', required: true },
      age: { type: 'integer', min: 0, max: 120 }
    },
    indexes: [
      { key: 'email_idx', type: 'unique', attributes: ['email'] }
    ]
  },
  {
    name: 'posts',
    schema: {
      userId: { type: 'string', required: true },
      title: { type: 'string', required: true },
      content: { type: 'string', required: true },
      published: { type: 'boolean', default: false }
    }
  }
];

const migration = orm.getMigration();

// Export to SQL
const sql = migration.exportToSQL(tables);
writeFileSync('schema.sql', sql);

// Export to Firebase
const firebase = migration.exportToFirebase(tables);
writeFileSync('firebase-rules.json', firebase);

// Export to text
const text = migration.exportToText(tables);
writeFileSync('schema.txt', text);

console.log('Schema exported to all formats!');
```

## Best Practices

### Choosing Export Formats

**Use SQL export when:**

- Migrating to relational databases
- Need portable schema definitions
- Working with existing SQL tools
- Require strong data integrity constraints

**Use Firebase export when:**

- Migrating to Firebase
- Need real-time database features
- Working with NoSQL data models
- Require flexible security rules

**Use text export when:**

- Creating documentation
- Sharing schemas with non-technical stakeholders
- Quick reference during development
- Code reviews and design discussions

### Migration Strategy

1. **Test First**: Export and test in a development environment
2. **Validate Data**: Ensure data types are compatible
3. **Handle Arrays**: Array fields may need special handling in SQL
4. **Review Constraints**: Check that constraints match your requirements
5. **Backup Data**: Always backup before migrating

### Schema Design Tips

```typescript
// Good: Clear, well-constrained schema
{
  name: 'users',
  schema: {
    email: { type: 'string', required: true, size: 255 },
    age: { type: 'integer', min: 0, max: 150 },
    role: { type: ['admin', 'user'], enum: ['admin', 'user'], default: 'user' }
  },
  indexes: [
    { key: 'email_unique', type: 'unique', attributes: ['email'] }
  ]
}

// Avoid: Unconstrained fields
{
  name: 'users',
  schema: {
    email: { type: 'string' },  // No size limit
    age: { type: 'integer' },   // No validation
    role: { type: 'string' }    // No enum constraint
  }
}
```

## Error Handling

Exports throw `ORMMigrationError` for invalid schemas:

```typescript
try {
  const sql = migration.exportToSQL(tables);
  writeFileSync('schema.sql', sql);
} catch (error) {
  if (error instanceof ORMMigrationError) {
    console.error('Export failed:', error.message);
  }
}
```

Common errors:

- Missing required fields (`name`, `schema`)
- Empty schema definitions
- Unsupported field types
- Invalid constraint combinations

## Next Steps

- [Setup](setup.md) - Configure auto-migration
- [Indexes](indexes.md) - Optimize query performance
- [CRUD Operations](crud-operations.md) - Work with data
- [Queries](queries.md) - Filter and search data
