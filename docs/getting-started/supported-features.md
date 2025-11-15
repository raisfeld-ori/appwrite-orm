# Supported Features

What you can do with Appwrite ORM.

## Data Types

All Appwrite attribute types are supported:

| Type | Description | Example |
|------|-------------|---------|
| `string` | Text data | `'Hello World'` |
| `integer` | Whole numbers | `42` |
| `float` | Decimal numbers | `3.14` |
| `boolean` | True/false | `true` |
| `datetime` | Dates and times | `new Date()` |
| `email` | Email addresses | `'user@example.com'` |
| `ip` | IP addresses | `'192.168.1.1'` |
| `url` | URLs | `'https://example.com'` |
| `enum` | Fixed values | `['admin', 'user']` |

## Schema Options

Configure fields with validation rules:

```typescript
{
  name: { type: 'string', required: true, size: 255 },
  age: { type: 'integer', min: 0, max: 120 },
  price: { type: 'float', min: 0 },
  role: { type: ['admin', 'user'], enum: ['admin', 'user'], default: 'user' },
  tags: { type: 'string', array: true }
}
```

Options:
- `type` - Data type (required)
- `required` - Must be provided
- `default` - Default value if not provided
- `array` - Allow multiple values
- `size` - Max string length
- `min` - Minimum number value
- `max` - Maximum number value
- `enum` - Allowed values for enum types

## CRUD Operations

All basic operations are supported:

```typescript
// Create
await db.table('users').create({ name: 'John' });

// Read
await db.table('users').get(id);
await db.table('users').all();
await db.table('users').first({ name: 'John' });

// Update
await db.table('users').update(id, { name: 'Jane' });

// Delete
await db.table('users').delete(id);
```

## Querying

Query with filters, sorting, and pagination:

```typescript
import { Query } from 'node-appwrite'; // or 'appwrite' for web

// Simple queries
await db.table('users').query({ role: 'admin' });
await db.table('users').count({ isActive: true });

// Advanced queries
await db.table('users').find([
  Query.equal('role', ['admin']),
  Query.greaterThan('age', 21),
  Query.orderDesc('createdAt'),
  Query.limit(10),
  Query.offset(20)
]);
```

## Indexes

Create indexes for better query performance:

```typescript
// During initialization
{
  name: 'users',
  schema: { /* ... */ },
  indexes: [
    { key: 'email_idx', type: 'unique', attributes: ['email'] },
    { key: 'age_idx', type: 'key', attributes: ['age'] },
    { key: 'name_search', type: 'fulltext', attributes: ['name'] }
  ]
}

// Or create dynamically (server only)
await db.table('users').createIndex({
  key: 'role_idx',
  type: 'key',
  attributes: ['role']
});
```

Index types:
- `key` - Standard index for faster queries
- `unique` - Ensures unique values
- `fulltext` - For text search

## Joins (Server Only)

Query related data across collections:

```typescript
// Get users with their posts
const result = await db.leftJoin(
  'users',
  'posts',
  { foreignKey: '$id', referenceKey: 'userId', as: 'posts' }
);

// Inner join (only matching records)
const result = await db.innerJoin(
  'users',
  'posts',
  { foreignKey: '$id', referenceKey: 'userId', as: 'posts' }
);
```

## Bulk Operations (Server Only)

Process multiple documents efficiently:

```typescript
// Bulk create
await db.table('users').bulkCreate([
  { name: 'User 1', email: 'user1@example.com' },
  { name: 'User 2', email: 'user2@example.com' }
]);

// Bulk update
await db.table('users').bulkUpdate([
  { id: 'id1', data: { isActive: true } },
  { id: 'id2', data: { isActive: false } }
]);

// Bulk delete
await db.table('users').bulkDelete(['id1', 'id2', 'id3']);
```

## Type Safety

Get full TypeScript support:

```typescript
interface User {
  $id: string;
  name: string;
  email: string;
  age: number;
}

// Type-safe results
const user = await db.table('users').get(id) as User;
const users = await db.table('users').all() as User[];
```

## Feature Comparison

| Feature | Server | Web | Dev Mode |
|---------|--------|-----|----------|
| CRUD Operations | ✅ | ✅ | ✅ |
| Queries | ✅ | ✅ | ⚠️ Simplified |
| Indexes | ✅ | ✅ | ❌ |
| Joins | ✅ | ❌ | ❌ |
| Bulk Operations | ✅ | ❌ | ❌ |
| Auto Migration | ✅ | ❌ | N/A |
| Validation | ✅ | ✅ | ✅ |

## Next Steps

- [Server Features](../server/crud-operations.md)
- [Web Features](../web/crud-operations.md)
- [Queries](../server/queries.md)
