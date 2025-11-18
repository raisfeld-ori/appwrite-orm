# Caching

WebORM includes a built-in intelligent caching system that automatically optimizes your application's performance by reducing database calls.

## How It Works

The caching system operates transparently:

1. **First Query**: Hits the database and caches the result
2. **Subsequent Queries**: Returns cached data if still valid
3. **Automatic Invalidation**: Cache is cleared when data changes
4. **TTL Expiration**: Cache expires after 5 minutes

## Automatic Caching

All query operations are automatically cached:

```typescript
const db = await orm.init([{
  name: 'posts',
  schema: {
    title: { type: 'string', required: true },
    content: { type: 'string', required: true }
  }
}]);

const postsTable = db.table('posts');

// First call - hits database
const posts1 = await postsTable.all();

// Second call - uses cache (instant)
const posts2 = await postsTable.all();

// Third call - still uses cache
const posts3 = await postsTable.find(['equal("published", true)']);
```

## Cache Invalidation

Cache is automatically invalidated when data changes:

```typescript
// These calls use cache
const posts1 = await postsTable.all();
const posts2 = await postsTable.all();

// This mutation invalidates the cache
await postsTable.create({
  title: 'New Post',
  content: 'Fresh content'
});

// This call hits the database again
const posts3 = await postsTable.all();
```

### Mutation Operations That Invalidate Cache

- `create()` - Creating new documents
- `update()` - Updating existing documents  
- `delete()` - Deleting documents
- `bulkCreate()` - Bulk operations
- `bulkUpdate()` - Bulk operations
- `bulkDelete()` - Bulk operations

## Manual Cache Control

### Check Cache Status

```typescript
const postsTable = db.table('posts');

// Check if cache is valid/fresh
if (postsTable.isUpdated()) {
  console.log('Cache is fresh - next query will use cache');
} else {
  console.log('Cache is stale - next query will hit database');
}
```

### Manual Cache Invalidation

```typescript
const postsTable = db.table('posts');

// Force cache invalidation
postsTable.setUpdated(false);

// Next query will hit the database
const freshPosts = await postsTable.all();
```

### Manual Cache Refresh

```typescript
const postsTable = db.table('posts');

// Invalidate and immediately refresh
postsTable.setUpdated(false);
const freshPosts = await postsTable.all();

// Cache is now fresh again
console.log(postsTable.isUpdated()); // true
```

## Cache TTL (Time To Live)

Cache entries automatically expire after 5 minutes:

```typescript
// First call at 10:00 AM
const posts1 = await postsTable.all(); // Hits database

// Call at 10:02 AM  
const posts2 = await postsTable.all(); // Uses cache

// Call at 10:06 AM (6 minutes later)
const posts3 = await postsTable.all(); // Hits database (TTL expired)
```

## Realtime Integration

When using realtime listeners, cache is automatically invalidated when events are received:

```typescript
const postsTable = db.table('posts');

// Set up realtime listener
const unsubscribe = postsTable.listenToDocuments((event) => {
  console.log('Data changed, cache invalidated automatically');
});

// These calls use cache
const posts1 = await postsTable.all();
const posts2 = await postsTable.all();

// When another user creates a post, the realtime event
// automatically invalidates our cache
// Next call will get fresh data
const posts3 = await postsTable.all();
```

## React Integration

### Basic Caching with React

```typescript
import { useState, useEffect } from 'react';

function PostsList({ db }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true);
      
      // This will use cache if available
      const allPosts = await db.table('posts').all();
      
      setPosts(allPosts);
      setLoading(false);
    };

    loadPosts();
  }, [db]);

  const createPost = async (postData) => {
    // This invalidates cache automatically
    const newPost = await db.table('posts').create(postData);
    
    // Reload to get fresh data (will hit database)
    const updatedPosts = await db.table('posts').all();
    setPosts(updatedPosts);
  };

  return (
    <div>
      {loading ? 'Loading...' : posts.map(post => (
        <div key={post.$id}>{post.title}</div>
      ))}
    </div>
  );
}
```

### Advanced React Hook

```typescript
import { useState, useEffect, useCallback } from 'react';

function useCachedData(table, dependencies = []) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cacheStatus, setCacheStatus] = useState(true);

  const refresh = useCallback(async (force = false) => {
    if (force) {
      table.setUpdated(false);
    }
    
    setCacheStatus(table.isUpdated());
    setLoading(true);
    
    const result = await table.all();
    setData(result);
    setLoading(false);
    
    setCacheStatus(table.isUpdated());
  }, [table, ...dependencies]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    data,
    loading,
    refresh,
    isCached: cacheStatus,
    invalidateCache: () => table.setUpdated(false)
  };
}

// Usage
function PostsList({ db }) {
  const { 
    data: posts, 
    loading, 
    refresh, 
    isCached, 
    invalidateCache 
  } = useCachedData(db.table('posts'));

  return (
    <div>
      <div>
        Cache Status: {isCached ? 'Fresh' : 'Stale'}
        <button onClick={() => refresh(true)}>Force Refresh</button>
        <button onClick={invalidateCache}>Invalidate Cache</button>
      </div>
      
      {loading ? 'Loading...' : posts.map(post => (
        <div key={post.$id}>{post.title}</div>
      ))}
    </div>
  );
}
```

## Development Mode

In development mode, caching works the same way but uses browser localStorage:

```typescript
const orm = new WebORM({
  endpoint: 'http://localhost',
  projectId: 'dev',
  databaseId: 'test-db',
  development: true  // Uses localStorage for caching
});

const db = await orm.init(tables);

// Caching works identically
const posts = await db.table('posts').all(); // Cached in localStorage
```

## Best Practices

### 1. Let Automatic Invalidation Work

```typescript
// ✅ Good - Let the system handle cache invalidation
await postsTable.create(newPost);
const updatedPosts = await postsTable.all(); // Fresh data

// ❌ Avoid - Manual invalidation usually unnecessary
postsTable.setUpdated(false);
await postsTable.create(newPost);
const updatedPosts = await postsTable.all();
```

### 2. Use Cache Status for UI Feedback

```typescript
function DataComponent({ table }) {
  const [showCacheIndicator, setShowCacheIndicator] = useState(false);

  const loadData = async () => {
    const wasCached = table.isUpdated();
    const data = await table.all();
    
    if (wasCached) {
      setShowCacheIndicator(true);
      setTimeout(() => setShowCacheIndicator(false), 1000);
    }
    
    return data;
  };

  return (
    <div>
      {showCacheIndicator && <span>⚡ Loaded from cache</span>}
      {/* Your data display */}
    </div>
  );
}
```

### 3. Force Refresh When Needed

```typescript
function RefreshableList({ table }) {
  const [data, setData] = useState([]);

  const handleRefresh = async () => {
    // Force fresh data from database
    table.setUpdated(false);
    const freshData = await table.all();
    setData(freshData);
  };

  return (
    <div>
      <button onClick={handleRefresh}>🔄 Refresh</button>
      {/* Your list */}
    </div>
  );
}
```

## Performance Benefits

The caching system provides significant performance improvements:

- **Reduced Database Load**: Fewer queries to Appwrite
- **Faster Response Times**: Cached data returns instantly
- **Better User Experience**: Smoother interactions
- **Bandwidth Savings**: Less network traffic
- **Cost Optimization**: Fewer API calls to Appwrite

## Cache Limitations

- **Memory Usage**: Cache is stored in memory (browser/Node.js)
- **Single Instance**: Cache is not shared between browser tabs or server instances
- **TTL Bound**: Cache expires after 5 minutes regardless of usage
- **Query Specific**: Different queries maintain separate cache entries

## Troubleshooting

### Cache Not Working

```typescript
// Check if caching is enabled (it's always enabled)
console.log('Cache status:', table.isUpdated());

// Verify cache invalidation
await table.create(data);
console.log('After mutation:', table.isUpdated()); // Should be false
```

### Stale Data Issues

```typescript
// Force refresh if you suspect stale data
table.setUpdated(false);
const freshData = await table.all();
```

### Memory Concerns

```typescript
// Clear cache manually if needed (rare)
table.setUpdated(false);
// Cache will be rebuilt on next query
```