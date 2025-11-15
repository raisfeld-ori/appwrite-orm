# Queries (Server)

Query and filter data with the full power of Appwrite's Query API.

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
import { Query } from 'node-appwrite';

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

### Not Equal

```typescript
await db.table('users').find([
  Query.notEqual('status', ['banned'])
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

// Between
Query.between('age', 18, 65)
```

### Array Operations

```typescript
// Check if array contains value
Query.contains('tags', 'javascript')

// Is null
Query.isNull('deletedAt')

// Is not null
Query.isNotNull('publishedAt')
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

Return only specific fields to reduce payload size:

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

## Cursor Pagination

For efficient pagination of large datasets:

```typescript
// First page
const page1 = await db.table('posts').find([
  Query.limit(25),
  Query.cursorAfter('')
]);

// Next page using last document ID
const page2 = await db.table('posts').find([
  Query.limit(25),
  Query.cursorAfter(page1[page1.length - 1].$id)
]);
```

## Combined Example

```typescript
import { Query } from 'node-appwrite';

// Find published posts with high views, sorted by date
const popularPosts = await db.table('posts').find([
  Query.equal('published', [true]),
  Query.greaterThan('views', 1000),
  Query.lessThan('views', 100000),
  Query.isNotNull('featuredImage'),
  Query.orderDesc('createdAt'),
  Query.limit(20),
  Query.offset(0),
  Query.select(['title', 'views', 'createdAt', 'featuredImage'])
]);
```

## Count with Filters

```typescript
// Count all published posts
const count = await db.table('posts').count({ published: true });

// Count with complex query
import { Query } from 'node-appwrite';

const count = await db.table('users').find([
  Query.greaterThan('age', 18),
  Query.equal('isActive', [true])
]).then(results => results.length);
```

## Query Performance Tips

1. **Use indexes** for fields you query frequently
2. **Select only needed fields** to reduce payload
3. **Use cursor pagination** for large datasets
4. **Avoid searching without indexes**

```typescript
// Good: Uses index
const users = await db.table('users').find([
  Query.equal('email', ['user@example.com'])
]);

// Better: Only get needed fields
const users = await db.table('users').find([
  Query.equal('email', ['user@example.com']),
  Query.select(['name', 'email'])
]);
```

## Next Steps

- [Indexes](indexes.md) - Optimize query performance
- [Joins](joins.md) - Query related data
- [CRUD Operations](crud-operations.md) - Basic operations
