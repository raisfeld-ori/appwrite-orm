# Caching

ServerORM includes a high-performance caching system designed for server applications. It automatically optimizes database queries and provides manual control when needed.

## How It Works

The server caching system provides:

1. **Automatic Query Caching**: All read operations are cached
2. **Smart Invalidation**: Cache clears when data changes
3. **TTL Management**: Cache expires after 5 minutes
4. **Memory Efficient**: Optimized for server memory usage

## Automatic Caching

All query operations are automatically cached:

```typescript
import { ServerORM } from 'appwrite-orm/server';

const orm = new ServerORM({
  endpoint: process.env.APPWRITE_ENDPOINT!,
  projectId: process.env.APPWRITE_PROJECT_ID!,
  databaseId: process.env.APPWRITE_DATABASE_ID!,
  apiKey: process.env.APPWRITE_API_KEY!,
  autoMigrate: true
});

const db = await orm.init([{
  name: 'users',
  schema: {
    name: { type: 'string', required: true },
    email: { type: 'string', required: true }
  }
}]);

const usersTable = db.table('users');

// First call - hits database
const users1 = await usersTable.all();

// Second call - uses cache (instant)
const users2 = await usersTable.all();

// Different query - separate cache entry
const activeUsers = await usersTable.find(['equal("active", true)']);
```

## Cache Invalidation

Cache is automatically invalidated on mutations:

```typescript
// These calls use cache
const users1 = await usersTable.all();
const users2 = await usersTable.all();

// This mutation invalidates ALL cache for this table
await usersTable.create({
  name: 'John Doe',
  email: 'john@example.com'
});

// This call hits the database again
const users3 = await usersTable.all();
```

### Operations That Invalidate Cache

- `create()` - Creating new documents
- `update()` - Updating existing documents
- `delete()` - Deleting documents
- `bulkCreate()` - Bulk creation
- `bulkUpdate()` - Bulk updates
- `bulkDelete()` - Bulk deletion

## Manual Cache Control

### Check Cache Status

```typescript
const usersTable = db.table('users');

// Check if cache is valid
if (usersTable.isUpdated()) {
  console.log('Cache is fresh');
} else {
  console.log('Cache is stale');
}
```

### Manual Cache Invalidation

```typescript
const usersTable = db.table('users');

// Force cache invalidation
usersTable.setUpdated(false);

// Next query will hit the database
const freshUsers = await usersTable.all();
```

### Cache Refresh Pattern

```typescript
async function refreshUserCache() {
  const usersTable = db.table('users');
  
  // Invalidate cache
  usersTable.setUpdated(false);
  
  // Preload fresh data
  await usersTable.all();
  
  console.log('User cache refreshed');
}

// Refresh cache every hour
setInterval(refreshUserCache, 60 * 60 * 1000);
```

## Express.js Integration

### Basic API with Caching

```typescript
import express from 'express';
import { ServerORM } from 'appwrite-orm/server';

const app = express();
app.use(express.json());

const orm = new ServerORM({
  endpoint: process.env.APPWRITE_ENDPOINT!,
  projectId: process.env.APPWRITE_PROJECT_ID!,
  databaseId: process.env.APPWRITE_DATABASE_ID!,
  apiKey: process.env.APPWRITE_API_KEY!,
  autoMigrate: true
});

const db = await orm.init([{
  name: 'products',
  schema: {
    name: { type: 'string', required: true },
    price: { type: 'float', required: true },
    category: { type: 'string', required: true }
  }
}]);

// GET /products - Uses cache automatically
app.get('/products', async (req, res) => {
  try {
    const products = await db.table('products').all();
    
    // Add cache headers
    res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /products - Invalidates cache automatically
app.post('/products', async (req, res) => {
  try {
    const product = await db.table('products').create(req.body);
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /products/refresh - Force cache refresh
app.post('/products/refresh', async (req, res) => {
  try {
    const productsTable = db.table('products');
    productsTable.setUpdated(false);
    
    const products = await productsTable.all();
    res.json({ message: 'Cache refreshed', count: products.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Cache Status Middleware

```typescript
function cacheStatusMiddleware(tableName: string) {
  return (req: any, res: any, next: any) => {
    const table = db.table(tableName);
    const isCached = table.isUpdated();
    
    res.set('X-Cache-Status', isCached ? 'HIT' : 'MISS');
    res.set('X-Cache-Table', tableName);
    
    next();
  };
}

// Usage
app.get('/users', 
  cacheStatusMiddleware('users'),
  async (req, res) => {
    const users = await db.table('users').all();
    res.json(users);
  }
);
```

## Background Jobs and Caching

### Cache-Aware Job Processing

```typescript
import { ServerORM } from 'appwrite-orm/server';

const db = await orm.init([{
  name: 'analytics',
  schema: {
    metric: { type: 'string', required: true },
    value: { type: 'float', required: true },
    timestamp: { type: 'datetime', default: new Date() }
  }
}]);

class AnalyticsService {
  private analyticsTable = db.table('analytics');

  async getMetrics(fromDate: Date, toDate: Date) {
    // Check if we have fresh cached data
    if (this.analyticsTable.isUpdated()) {
      console.log('Using cached analytics data');
    }

    return await this.analyticsTable.find([
      `greaterThanEqual("timestamp", "${fromDate.toISOString()}")`,
      `lessThanEqual("timestamp", "${toDate.toISOString()}")`
    ]);
  }

  async recordMetric(metric: string, value: number) {
    // This will invalidate cache automatically
    await this.analyticsTable.create({
      metric,
      value,
      timestamp: new Date()
    });

    console.log('Analytics cache invalidated due to new metric');
  }

  async refreshCache() {
    this.analyticsTable.setUpdated(false);
    await this.getMetrics(
      new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
      new Date()
    );
    console.log('Analytics cache refreshed');
  }
}

const analytics = new AnalyticsService();

// Refresh cache every 10 minutes
setInterval(() => analytics.refreshCache(), 10 * 60 * 1000);
```

### Batch Processing with Cache Management

```typescript
class BatchProcessor {
  private usersTable = db.table('users');

  async processBatch(userUpdates: any[]) {
    console.log(`Processing batch of ${userUpdates.length} updates`);

    // Invalidate cache before batch operations
    this.usersTable.setUpdated(false);

    const results = [];
    for (const update of userUpdates) {
      try {
        const result = await this.usersTable.update(update.id, update.data);
        results.push({ success: true, id: update.id, result });
      } catch (error) {
        results.push({ success: false, id: update.id, error: error.message });
      }
    }

    // Preload fresh cache after batch processing
    await this.usersTable.all();
    console.log('Cache refreshed after batch processing');

    return results;
  }
}
```

## Microservices and Distributed Caching

### Service-Level Cache Management

```typescript
class UserService {
  private usersTable = db.table('users');

  async getUser(id: string) {
    // Individual document queries are also cached
    return await this.usersTable.get(id);
  }

  async getAllUsers() {
    const cacheStatus = this.usersTable.isUpdated() ? 'HIT' : 'MISS';
    console.log(`Users cache status: ${cacheStatus}`);
    
    return await this.usersTable.all();
  }

  async updateUser(id: string, data: any) {
    const result = await this.usersTable.update(id, data);
    
    // Notify other services about cache invalidation
    await this.notifyOtherServices('users-cache-invalidated');
    
    return result;
  }

  async invalidateCache() {
    this.usersTable.setUpdated(false);
    console.log('Users cache invalidated');
  }

  private async notifyOtherServices(event: string) {
    // Implement your inter-service communication
    // Redis pub/sub, message queue, etc.
  }
}
```

### Redis Integration for Shared Cache Status

```typescript
import Redis from 'ioredis';

class CacheManager {
  private redis = new Redis(process.env.REDIS_URL);
  private usersTable = db.table('users');

  async getCacheStatus(tableName: string): Promise<boolean> {
    const status = await this.redis.get(`cache:${tableName}:status`);
    return status === 'valid';
  }

  async setCacheStatus(tableName: string, isValid: boolean) {
    const status = isValid ? 'valid' : 'invalid';
    await this.redis.setex(`cache:${tableName}:status`, 300, status); // 5 min TTL
  }

  async getUsers() {
    // Check distributed cache status
    const isCacheValid = await this.getCacheStatus('users');
    
    if (!isCacheValid) {
      this.usersTable.setUpdated(false);
    }

    const users = await this.usersTable.all();
    
    // Update distributed cache status
    await this.setCacheStatus('users', true);
    
    return users;
  }

  async invalidateUsersCache() {
    this.usersTable.setUpdated(false);
    await this.setCacheStatus('users', false);
    
    // Notify other instances
    await this.redis.publish('cache:invalidate', JSON.stringify({
      table: 'users',
      timestamp: Date.now()
    }));
  }
}
```

## Performance Monitoring

### Cache Hit Rate Tracking

```typescript
class CacheMonitor {
  private stats = {
    hits: 0,
    misses: 0,
    invalidations: 0
  };

  trackQuery(tableName: string, wasHit: boolean) {
    if (wasHit) {
      this.stats.hits++;
    } else {
      this.stats.misses++;
    }
  }

  trackInvalidation(tableName: string) {
    this.stats.invalidations++;
  }

  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
    
    return {
      ...this.stats,
      total,
      hitRate: `${hitRate.toFixed(2)}%`
    };
  }

  reset() {
    this.stats = { hits: 0, misses: 0, invalidations: 0 };
  }
}

const monitor = new CacheMonitor();

// Wrap table operations to track cache performance
function createMonitoredTable(table: any, tableName: string) {
  return new Proxy(table, {
    get(target, prop) {
      if (prop === 'all' || prop === 'find' || prop === 'get') {
        return async (...args: any[]) => {
          const wasHit = target.isUpdated();
          monitor.trackQuery(tableName, wasHit);
          return await target[prop](...args);
        };
      }
      
      if (prop === 'create' || prop === 'update' || prop === 'delete') {
        return async (...args: any[]) => {
          const result = await target[prop](...args);
          monitor.trackInvalidation(tableName);
          return result;
        };
      }
      
      return target[prop];
    }
  });
}

// Usage
const monitoredUsersTable = createMonitoredTable(db.table('users'), 'users');

// Check stats periodically
setInterval(() => {
  console.log('Cache stats:', monitor.getStats());
}, 60000); // Every minute
```

## Memory Management

### Cache Size Monitoring

```typescript
class MemoryManager {
  private maxCacheSize = 100 * 1024 * 1024; // 100MB
  
  getCurrentMemoryUsage(): number {
    const usage = process.memoryUsage();
    return usage.heapUsed;
  }

  shouldClearCache(): boolean {
    return this.getCurrentMemoryUsage() > this.maxCacheSize;
  }

  clearAllCaches() {
    // Clear cache for all tables
    db.closeListeners(); // This also clears caches
    
    console.log('All caches cleared due to memory pressure');
  }

  startMemoryMonitoring() {
    setInterval(() => {
      if (this.shouldClearCache()) {
        this.clearAllCaches();
      }
    }, 30000); // Check every 30 seconds
  }
}

const memoryManager = new MemoryManager();
memoryManager.startMemoryMonitoring();
```

## Best Practices

### 1. Use Cache Status for Optimization

```typescript
// ✅ Good - Check cache status for optimization
async function getUsers() {
  const usersTable = db.table('users');
  
  if (usersTable.isUpdated()) {
    console.log('Serving from cache');
  } else {
    console.log('Fetching from database');
  }
  
  return await usersTable.all();
}
```

### 2. Batch Operations for Better Performance

```typescript
// ✅ Good - Batch operations
async function updateMultipleUsers(updates: any[]) {
  const usersTable = db.table('users');
  
  // Invalidate once before batch
  usersTable.setUpdated(false);
  
  const results = await Promise.all(
    updates.map(update => usersTable.update(update.id, update.data))
  );
  
  return results;
}

// ❌ Less efficient - Individual operations
async function updateUsersOneByOne(updates: any[]) {
  const results = [];
  for (const update of updates) {
    // Each operation invalidates cache separately
    const result = await db.table('users').update(update.id, update.data);
    results.push(result);
  }
  return results;
}
```

### 3. Implement Cache Warming

```typescript
class CacheWarmer {
  async warmCache() {
    console.log('Warming up caches...');
    
    // Preload frequently accessed data
    await Promise.all([
      db.table('users').all(),
      db.table('products').all(),
      db.table('categories').all()
    ]);
    
    console.log('Cache warming completed');
  }

  startCacheWarming() {
    // Warm cache on startup
    this.warmCache();
    
    // Warm cache every hour
    setInterval(() => this.warmCache(), 60 * 60 * 1000);
  }
}

const warmer = new CacheWarmer();
warmer.startCacheWarming();
```

### 4. Handle Cache in Error Scenarios

```typescript
async function robustDataFetch(tableName: string) {
  const table = db.table(tableName);
  
  try {
    return await table.all();
  } catch (error) {
    console.error(`Error fetching ${tableName}:`, error);
    
    // Invalidate cache on error
    table.setUpdated(false);
    
    // Retry once
    try {
      return await table.all();
    } catch (retryError) {
      console.error(`Retry failed for ${tableName}:`, retryError);
      throw retryError;
    }
  }
}
```

## Troubleshooting

### Cache Not Working

```typescript
// Debug cache status
const table = db.table('users');
console.log('Cache status:', table.isUpdated());

// Force cache refresh
table.setUpdated(false);
const data = await table.all();
console.log('After refresh:', table.isUpdated());
```

### Memory Issues

```typescript
// Monitor memory usage
setInterval(() => {
  const usage = process.memoryUsage();
  console.log('Memory usage:', {
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`
  });
}, 60000);
```

### Performance Issues

```typescript
// Add timing to queries
async function timedQuery(table: any, operation: string) {
  const start = Date.now();
  const wasHit = table.isUpdated();
  
  const result = await table.all();
  
  const duration = Date.now() - start;
  console.log(`${operation} (${wasHit ? 'CACHE' : 'DB'}): ${duration}ms`);
  
  return result;
}
```