# Queries (Web)

Query and filter data in your web application.

## Simple Queries

Query with filters as objects:

```typescript
// Equal
const admins = await db.table('users').query({ role: 'admin' });

// Multiple filters (AND)
const activeAdmins = await db.table('users').query({
  role: 'admin',
  isActive: true
});
```

## Advanced Queries

Use Appwrite's Query builder for complex queries:

```typescript
import { Query } from 'appwrite';

// Greater than
const adults = await db.table('users').find([
  Query.greaterThanEqual('age', 18)
]);

// Multiple conditions
const results = await db.table('posts').find([
  Query.equal('published', [true]),
  Query.greaterThan('views', 100),
  Query.orderDesc('views'),
  Query.limit(10)
]);

// Text search (requires fulltext index)
const posts = await db.table('posts').find([
  Query.search('title', 'tutorial')
]);
```

## Query Methods

### Equal

```typescript
await db.table('users').find([
  Query.equal('role', ['admin', 'moderator'])
]);
```

### Comparisons

```typescript
// Greater than
Query.greaterThan('age', 18)
Query.greaterThanEqual('age', 18)

// Less than
Query.lessThan('price', 100)
Query.lessThanEqual('price', 100)
```

### String Operations

```typescript
// Starts with
Query.startsWith('email', 'admin@')

// Ends with
Query.endsWith('email', '@company.com')

// Search (requires fulltext index)
Query.search('content', 'tutorial')
```

## Sorting

```typescript
// Ascending
await db.table('posts').find([
  Query.orderAsc('title')
]);

// Descending
await db.table('posts').find([
  Query.orderDesc('createdAt')
]);

// Multiple sorts
await db.table('posts').all({
  orderBy: ['-views', 'title']  // - prefix for descending
});
```

## Pagination

```typescript
// Limit results
await db.table('posts').find([
  Query.limit(10)
]);

// Offset
await db.table('posts').find([
  Query.offset(20),
  Query.limit(10)
]);

// Using options
await db.table('posts').all({
  limit: 10,
  offset: 20
});
```

## Select Fields

```typescript
// Select specific fields
await db.table('users').find([
  Query.select(['name', 'email'])
]);

// Using options
await db.table('users').all({
  select: ['name', 'email']
});
```

## Combined Example

```typescript
import { Query } from 'appwrite';

const posts = await db.table('posts').find([
  Query.equal('published', [true]),
  Query.greaterThan('views', 100),
  Query.lessThan('views', 10000),
  Query.orderDesc('views'),
  Query.limit(20),
  Query.offset(0),
  Query.select(['title', 'views', 'createdAt'])
]);
```

## Count with Filters

```typescript
const count = await db.table('posts').count({
  published: true
});
```

## Next Steps

- [Development Mode](development-mode.md) - Test queries without Appwrite
- [CRUD Operations](crud-operations.md) - Basic operations
