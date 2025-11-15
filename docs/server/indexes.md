# Indexes (Server)

Create and manage indexes to optimize query performance.

## Define Indexes in Schema

Add indexes when initializing your ORM:

```typescript
const db = await orm.init([{
  name: 'users',
  schema: {
    email: { type: 'string', required: true },
    age: { type: 'integer' },
    name: { type: 'string', required: true }
  },
  indexes: [
    { key: 'email_idx', type: 'unique', attributes: ['email'] },
    { key: 'age_idx', type: 'key', attributes: ['age'] },
    { key: 'name_search', type: 'fulltext', attributes: ['name'] }
  ]
}]);
```

With `autoMigrate: true`, indexes are created automatically.

## Index Types

### Unique Index

Ensures field values are unique:

```typescript
{
  key: 'email_idx',
  type: 'unique',
  attributes: ['email']
}
```

Good for:
- Email addresses
- Usernames
- SKUs or product codes

### Key Index

Standard index for faster queries:

```typescript
{
  key: 'age_idx',
  type: 'key',
  attributes: ['age'],
  orders: ['ASC']  // Optional sort order
}
```

Good for:
- Fields used in WHERE clauses
- Fields used in sorting
- Foreign keys

### Fulltext Index

Enables text search:

```typescript
{
  key: 'content_search',
  type: 'fulltext',
  attributes: ['title', 'content']
}
```

Good for:
- Search functionality
- Content fields
- Multi-field text search

## Create Indexes Dynamically

Add indexes after initialization:

```typescript
await db.table('users').createIndex({
  key: 'role_idx',
  type: 'key',
  attributes: ['role']
});
```

## List Indexes

Get all indexes for a collection:

```typescript
const indexes = await db.table('users').listIndexes();

indexes.forEach(index => {
  console.log(index.key, index.type);
});
```

## Delete Indexes

Remove an index by its key:

```typescript
await db.table('users').deleteIndex('age_idx');
```

## Composite Indexes

Index multiple fields together:

```typescript
{
  key: 'user_role_status_idx',
  type: 'key',
  attributes: ['role', 'status'],
  orders: ['ASC', 'DESC']
}
```

Good for queries that filter on multiple fields:

```typescript
// This query benefits from the composite index
await db.table('users').find([
  Query.equal('role', ['admin']),
  Query.equal('status', ['active'])
]);
```

## When to Use Indexes

Create indexes for fields you query frequently:

```typescript
// Frequently queried fields
{
  indexes: [
    { key: 'email_idx', type: 'unique', attributes: ['email'] },
    { key: 'created_idx', type: 'key', attributes: ['createdAt'] },
    { key: 'status_idx', type: 'key', attributes: ['status'] }
  ]
}
```

## Performance Impact

**Benefits:**
- Faster queries on indexed fields
- Better sorting performance
- Efficient filtering

**Costs:**
- Slight write overhead
- Storage space for index
- Slower bulk inserts

## Best Practices

### Do Index

- Fields used in WHERE clauses
- Foreign keys for joins
- Fields used for sorting
- Unique fields (email, username)

```typescript
// Good indexes
{
  indexes: [
    { key: 'email_unique', type: 'unique', attributes: ['email'] },
    { key: 'created_sort', type: 'key', attributes: ['createdAt'] },
    { key: 'user_fk', type: 'key', attributes: ['userId'] }
  ]
}
```

### Don't Index

- Rarely queried fields
- Fields with low cardinality (few unique values)
- Very large text fields

```typescript
// Unnecessary indexes
{
  indexes: [
    // Bad: only 2 possible values
    { key: 'gender_idx', type: 'key', attributes: ['gender'] },
    
    // Bad: large field, use fulltext instead
    { key: 'content_idx', type: 'key', attributes: ['content'] }
  ]
}
```

## Fulltext Search Example

```typescript
// Define fulltext index
{
  name: 'posts',
  schema: {
    title: { type: 'string', required: true },
    content: { type: 'string', required: true }
  },
  indexes: [
    { key: 'content_search', type: 'fulltext', attributes: ['title', 'content'] }
  ]
}

// Use fulltext search
import { Query } from 'node-appwrite';

const results = await db.table('posts').find([
  Query.search('title', 'tutorial')
]);
```

## Monitoring Index Usage

Check query performance to optimize indexes:

```typescript
// Slow query? Add an index!
const users = await db.table('users').find([
  Query.equal('role', ['admin']),
  Query.greaterThan('lastLogin', lastMonth)
]);

// Add composite index for this query
await db.table('users').createIndex({
  key: 'role_login_idx',
  type: 'key',
  attributes: ['role', 'lastLogin']
});
```

## Index Naming

Use descriptive names:

```typescript
// Good names
'email_unique'        // Field + type
'user_posts_fk'       // Relationship
'created_at_sort'     // Purpose
'content_search'      // Function

// Bad names
'idx1'
'index'
'temp'
```

## Next Steps

- [Queries](queries.md) - Use indexes in queries
- [Joins](joins.md) - Index foreign keys for joins
- [Setup](setup.md) - Configure auto-migration
