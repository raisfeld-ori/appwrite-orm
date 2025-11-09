# Querying Data Guide

Master the art of querying data with the Appwrite ORM's powerful and intuitive query interface, inspired by SQLAlchemy.

## Basic Query Methods

### Simple Retrieval

```typescript
// Get all records
const allUsers = await db.users.all();

// Get record by ID
const user = await db.users.get('user-id-123');

// Get first record
const firstUser = await db.users.first();

// Count all records
const userCount = await db.users.count();
```

### Error-Safe Retrieval

```typescript
// Returns null if not found
const user = await db.users.get('non-existent-id');
if (user) {
  console.log('User found:', user.name);
} else {
  console.log('User not found');
}

// Throws error if not found
try {
  const user = await db.users.getOrFail('user-id-123');
  console.log('User found:', user.name);
} catch (error) {
  console.log('User does not exist');
}
```

## Filtering Data

### Simple Filters

```typescript
// Single field filter
const activeUsers = await db.users.query({ isActive: true });

// Multiple field filters (AND logic)
const activeAdmins = await db.users.query({
  isActive: true,
  role: 'admin'
});

// Filter with null/undefined values (ignored)
const results = await db.users.query({
  isActive: true,
  age: undefined  // This filter is ignored
});
```

### First Match Queries

```typescript
// Get first matching record
const admin = await db.users.first({ role: 'admin' });

// Get first or throw error
const admin = await db.users.firstOrFail({ role: 'admin' });
```

### Counting with Filters

```typescript
// Count matching records
const activeUserCount = await db.users.count({ isActive: true });
const adminCount = await db.users.count({ role: 'admin' });

console.log(`${activeUserCount} active users, ${adminCount} admins`);
```

## Advanced Queries with Appwrite Query

For complex queries, use Appwrite's Query builder:

```typescript
import { Query } from 'appwrite-orm';

// Numeric comparisons
const adults = await db.users.find([
  Query.greaterThanEqual('age', 18)
]);

const seniors = await db.users.find([
  Query.greaterThan('age', 65)
]);

const youngAdults = await db.users.find([
  Query.greaterThanEqual('age', 18),
  Query.lessThan('age', 30)
]);
```

### String Queries

```typescript
// Text search (if supported by Appwrite)
const searchResults = await db.users.find([
  Query.search('name', 'john')
]);

// String comparisons
const usersStartingWithA = await db.users.find([
  Query.startsWith('name', 'A')
]);
```

### Array and Enum Queries

```typescript
// Check if value is in array
const staffMembers = await db.users.find([
  Query.equal('role', ['admin', 'moderator'])
]);

// Multiple values
const specificUsers = await db.users.find([
  Query.equal('$id', ['user1', 'user2', 'user3'])
]);
```

### Date Queries

```typescript
// Recent users (last 30 days)
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const recentUsers = await db.users.find([
  Query.greaterThan('createdAt', thirtyDaysAgo.toISOString())
]);

// Users created in 2024
const users2024 = await db.users.find([
  Query.greaterThanEqual('createdAt', '2024-01-01T00:00:00.000Z'),
  Query.lessThan('createdAt', '2025-01-01T00:00:00.000Z')
]);
```

## Sorting and Ordering

### Basic Sorting

```typescript
// Sort by single field (ascending)
const usersByName = await db.users.all({
  orderBy: ['name']
});

// Sort descending (prefix with '-')
const usersByNewest = await db.users.all({
  orderBy: ['-createdAt']
});

// Multiple sort fields
const sortedUsers = await db.users.all({
  orderBy: ['-role', 'name'] // Role desc, then name asc
});
```

### Sorting with Filters

```typescript
// Combine filtering and sorting
const activeUsersByName = await db.users.query(
  { isActive: true },
  { orderBy: ['name'] }
);
```

### Advanced Sorting

```typescript
// Using Query builder for sorting
const topRatedProducts = await db.products.find([
  Query.greaterThan('rating', 4.0),
  Query.orderDesc('rating'),
  Query.orderAsc('price')
]);
```

## Pagination

### Basic Pagination

```typescript
// First page (20 items)
const page1 = await db.users.all({
  limit: 20,
  offset: 0,
  orderBy: ['name']
});

// Second page
const page2 = await db.users.all({
  limit: 20,
  offset: 20,
  orderBy: ['name']
});
```

### Pagination Helper Function

```typescript
async function paginateUsers(page: number, pageSize: number = 20) {
  const offset = (page - 1) * pageSize;
  
  const [users, total] = await Promise.all([
    db.users.all({ 
      limit: pageSize, 
      offset,
      orderBy: ['name']
    }),
    db.users.count()
  ]);
  
  return {
    users,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      hasNext: offset + pageSize < total,
      hasPrev: page > 1
    }
  };
}

// Usage
const result = await paginateUsers(1, 10);
console.log(`Page ${result.pagination.page} of ${result.pagination.totalPages}`);
```

### Cursor-Based Pagination

```typescript
// More efficient for large datasets
async function paginateUsersCursor(lastUserId?: string, limit: number = 20) {
  const queries = [Query.limit(limit), Query.orderAsc('$id')];
  
  if (lastUserId) {
    queries.push(Query.greaterThan('$id', lastUserId));
  }
  
  const users = await db.users.find(queries);
  
  return {
    users,
    nextCursor: users.length > 0 ? users[users.length - 1].$id : null,
    hasMore: users.length === limit
  };
}
```

## Field Selection

### Select Specific Fields

```typescript
// Only get name and email
const basicUserInfo = await db.users.all({
  select: ['name', 'email']
});

// Combine with other options
const activeUserEmails = await db.users.query(
  { isActive: true },
  { 
    select: ['email', 'name'],
    orderBy: ['name']
  }
);
```

### Performance Benefits

```typescript
// ✅ Good: Only fetch needed fields
const userList = await db.users.all({
  select: ['name', 'email', 'isActive'],
  limit: 100
});

// ❌ Bad: Fetching all fields when only few are needed
const allUsers = await db.users.all({ limit: 100 });
```

## Complex Query Patterns

### Multiple Conditions

```typescript
// AND conditions
const eligibleUsers = await db.users.find([
  Query.equal('isActive', true),
  Query.greaterThanEqual('age', 18),
  Query.lessThan('age', 65),
  Query.notEqual('role', 'banned')
]);
```

### OR Conditions (Workaround)

Since Appwrite doesn't directly support OR, use multiple queries:

```typescript
// Get admins OR moderators
const [admins, moderators] = await Promise.all([
  db.users.query({ role: 'admin' }),
  db.users.query({ role: 'moderator' })
]);

const staffMembers = [...admins, ...moderators];

// Remove duplicates if needed
const uniqueStaff = staffMembers.filter((user, index, arr) => 
  arr.findIndex(u => u.$id === user.$id) === index
);
```

### Nested Queries (Relationships)

```typescript
// Get posts by specific author
const authorPosts = await db.posts.query({ authorId: 'user-123' });

// Get authors of recent posts
const recentPosts = await db.posts.find([
  Query.greaterThan('createdAt', '2024-01-01'),
  Query.select(['authorId'])
]);

const authorIds = [...new Set(recentPosts.map(p => p.authorId))];
const authors = await Promise.all(
  authorIds.map(id => db.users.get(id))
);
```

## Query Optimization

### Use Appropriate Methods

```typescript
// ✅ Good: Use count() for counting
const userCount = await db.users.count({ isActive: true });

// ❌ Bad: Fetch all data just to count
const users = await db.users.query({ isActive: true });
const count = users.length;
```

### Limit Results

```typescript
// ✅ Good: Always use reasonable limits
const recentPosts = await db.posts.find([
  Query.orderDesc('createdAt'),
  Query.limit(50)
]);

// ❌ Bad: Fetching unlimited results
const allPosts = await db.posts.all();
```

### Index-Friendly Queries

```typescript
// ✅ Good: Query on indexed fields (like $id, createdAt)
const userById = await db.users.get('user-123');
const recentUsers = await db.users.find([
  Query.orderDesc('createdAt'),
  Query.limit(20)
]);

// Consider Appwrite indexing for frequently queried fields
const activeUsers = await db.users.query({ isActive: true }); // Index 'isActive'
```

## Real-World Query Examples

### User Management Queries

```typescript
// Dashboard statistics
async function getUserStats() {
  const [total, active, admins, recent] = await Promise.all([
    db.users.count(),
    db.users.count({ isActive: true }),
    db.users.count({ role: 'admin' }),
    db.users.count({
      createdAt: Query.greaterThan('createdAt', getLastWeek())
    })
  ]);
  
  return { total, active, admins, recent };
}

// User search
async function searchUsers(searchTerm: string, page: number = 1) {
  const pageSize = 20;
  const offset = (page - 1) * pageSize;
  
  // Simple name search (you might want full-text search)
  const users = await db.users.find([
    Query.search('name', searchTerm),
    Query.orderAsc('name'),
    Query.limit(pageSize),
    Query.offset(offset)
  ]);
  
  return users;
}
```

### E-commerce Queries

```typescript
// Product catalog with filters
async function getProducts(filters: {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}, page: number = 1) {
  const queries = [];
  
  if (filters.category) {
    queries.push(Query.equal('category', filters.category));
  }
  
  if (filters.minPrice !== undefined) {
    queries.push(Query.greaterThanEqual('price', filters.minPrice));
  }
  
  if (filters.maxPrice !== undefined) {
    queries.push(Query.lessThanEqual('price', filters.maxPrice));
  }
  
  if (filters.inStock) {
    queries.push(Query.greaterThan('stock', 0));
  }
  
  queries.push(Query.orderAsc('name'));
  queries.push(Query.limit(20));
  queries.push(Query.offset((page - 1) * 20));
  
  return await db.products.find(queries);
}

// Best sellers
async function getBestSellers(limit: number = 10) {
  return await db.products.find([
    Query.greaterThan('salesCount', 0),
    Query.orderDesc('salesCount'),
    Query.limit(limit)
  ]);
}
```

### Content Management Queries

```typescript
// Blog post queries
async function getPublishedPosts(page: number = 1, category?: string) {
  const queries = [
    Query.equal('status', 'published'),
    Query.orderDesc('publishedAt')
  ];
  
  if (category) {
    queries.push(Query.equal('category', category));
  }
  
  queries.push(Query.limit(10));
  queries.push(Query.offset((page - 1) * 10));
  
  return await db.posts.find(queries);
}

// Featured content
async function getFeaturedPosts() {
  return await db.posts.find([
    Query.equal('status', 'published'),
    Query.equal('isFeatured', true),
    Query.orderDesc('publishedAt'),
    Query.limit(5)
  ]);
}
```

## Query Performance Tips

### 1. Use Indexes Wisely

```typescript
// Appwrite automatically indexes some fields
// Query on these for better performance:
// - $id (always indexed)
// - $createdAt (usually indexed)
// - $updatedAt (usually indexed)

// Consider creating custom indexes for frequently queried fields
const frequentQueries = await db.users.query({ isActive: true }); // Index 'isActive'
```

### 2. Batch Related Queries

```typescript
// ✅ Good: Batch related operations
const [users, posts, comments] = await Promise.all([
  db.users.count(),
  db.posts.count(),
  db.comments.count()
]);

// ❌ Bad: Sequential queries
const users = await db.users.count();
const posts = await db.posts.count();
const comments = await db.comments.count();
```

### 3. Cache Expensive Queries

```typescript
// Simple in-memory cache
const cache = new Map();

async function getCachedUserStats() {
  const cacheKey = 'user-stats';
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes
    return cached.data;
  }
  
  const stats = await getUserStats();
  cache.set(cacheKey, {
    data: stats,
    timestamp: Date.now()
  });
  
  return stats;
}
```

## Error Handling in Queries

```typescript
async function safeQuery() {
  try {
    const users = await db.users.query({ isActive: true });
    return { success: true, data: users };
  } catch (error) {
    console.error('Query failed:', error);
    return { success: false, error: error.message };
  }
}

// Handle specific error types
async function robustQuery() {
  try {
    return await db.users.firstOrFail({ role: 'admin' });
  } catch (error) {
    if (error.message.includes('not found')) {
      // Handle no results
      return null;
    }
    throw error; // Re-throw unexpected errors
  }
}
```

## Testing Queries

```typescript
describe('User queries', () => {
  beforeEach(async () => {
    // Set up test data
    await db.users.create({ name: 'John', role: 'admin', isActive: true });
    await db.users.create({ name: 'Jane', role: 'user', isActive: false });
  });

  test('should find active users', async () => {
    const activeUsers = await db.users.query({ isActive: true });
    expect(activeUsers).toHaveLength(1);
    expect(activeUsers[0].name).toBe('John');
  });

  test('should count users by role', async () => {
    const adminCount = await db.users.count({ role: 'admin' });
    expect(adminCount).toBe(1);
  });
});
```

## Next Steps

- [Data Validation](data-validation.md) - Ensure data quality
- [Error Handling](error-handling.md) - Handle query errors gracefully
- [Testing](testing.md) - Test your query logic