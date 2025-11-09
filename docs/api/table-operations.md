# Table Operations

The BaseTable class provides a comprehensive set of methods for database operations, inspired by SQLAlchemy's query interface. All table classes (WebTable and ServerTable) inherit from BaseTable.

## BaseTable Class

Abstract base class providing core table operations with type safety.

```typescript
abstract class BaseTable<T extends DatabaseSchema> {
  protected databases: Databases;
  protected databaseId: string;
  protected collectionId: string;
  protected schema: T;
}
```

## CRUD Operations

### create()

Creates a new document in the collection.

```typescript
async create(data: Partial<Omit<SchemaToType<T>, '$id'>>): Promise<SchemaToType<T>>
```

**Parameters:**

- `data`: Object containing field values (excluding `$id`)

**Returns:**

- `Promise<SchemaToType<T>>`: Created document with generated `$id`

**Throws:**

- `ORMValidationError`: If data validation fails

**Example:**

```typescript
const user = await db.users.create({
  name: 'John Doe',
  email: 'john@example.com',
  age: 30
});

console.log('Created user with ID:', user.$id);
```

### get()

Retrieves a single document by ID.

```typescript
async get(id: string): Promise<SchemaToType<T> | null>
```

**Parameters:**

- `id`: Document ID to retrieve

**Returns:**

- `Promise<SchemaToType<T> | null>`: Document if found, null otherwise

**Example:**

```typescript
const user = await db.users.get('user-id-123');
if (user) {
  console.log('Found user:', user.name);
} else {
  console.log('User not found');
}
```

### getOrFail()

Retrieves a document by ID, throwing an error if not found.

```typescript
async getOrFail(id: string): Promise<SchemaToType<T>>
```

**Parameters:**

- `id`: Document ID to retrieve

**Returns:**

- `Promise<SchemaToType<T>>`: Document (guaranteed to exist)

**Throws:**

- `Error`: If document is not found

**Example:**

```typescript
try {
  const user = await db.users.getOrFail('user-id-123');
  console.log('User found:', user.name);
} catch (error) {
  console.log('User does not exist');
}
```

### update()

Updates an existing document by ID.

```typescript
async update(id: string, data: Partial<Omit<SchemaToType<T>, '$id'>>): Promise<SchemaToType<T>>
```

**Parameters:**

- `id`: Document ID to update
- `data`: Fields to update (partial object)

**Returns:**

- `Promise<SchemaToType<T>>`: Updated document

**Throws:**

- `ORMValidationError`: If validation fails

**Example:**

```typescript
const updatedUser = await db.users.update('user-id-123', {
  age: 31,
  email: 'newemail@example.com'
});
```

### delete()

Deletes a document by ID.

```typescript
async delete(id: string): Promise<void>
```

**Parameters:**

- `id`: Document ID to delete

**Returns:**

- `Promise<void>`: Resolves when deletion is complete

**Example:**

```typescript
await db.users.delete('user-id-123');
console.log('User deleted');
```

## Query Operations

### query()

Queries documents with filters and options.

```typescript
async query(filters?: FilterOptions, options?: QueryOptions): Promise<SchemaToType<T>[]>
```

**Parameters:**

- `filters` (optional): Object with field-value pairs for filtering
- `options` (optional): Query options (pagination, sorting, etc.)

**Returns:**

- `Promise<SchemaToType<T>[]>`: Array of matching documents

**Example:**

```typescript
// Simple filtering
const activeUsers = await db.users.query({ isActive: true });

// With options
const recentUsers = await db.users.query(
  { isActive: true },
  { 
    limit: 10, 
    offset: 0, 
    orderBy: ['-createdAt'],
    select: ['name', 'email']
  }
);
```

### all()

Retrieves all documents from the collection.

```typescript
async all(options?: QueryOptions): Promise<SchemaToType<T>[]>
```

**Parameters:**

- `options` (optional): Query options for pagination and sorting

**Returns:**

- `Promise<SchemaToType<T>[]>`: Array of all documents

**Example:**

```typescript
// Get all users
const allUsers = await db.users.all();

// With pagination
const firstPage = await db.users.all({ 
  limit: 20, 
  offset: 0,
  orderBy: ['name']
});
```

### first()

Gets the first document matching the filters.

```typescript
async first(filters?: FilterOptions): Promise<SchemaToType<T> | null>
```

**Parameters:**

- `filters` (optional): Filter criteria

**Returns:**

- `Promise<SchemaToType<T> | null>`: First matching document or null

**Example:**

```typescript
// Get first admin user
const admin = await db.users.first({ role: 'admin' });

// Get any user
const anyUser = await db.users.first();
```

### firstOrFail()

Gets the first document or throws an error if none found.

```typescript
async firstOrFail(filters?: FilterOptions): Promise<SchemaToType<T>>
```

**Parameters:**

- `filters` (optional): Filter criteria

**Returns:**

- `Promise<SchemaToType<T>>`: First matching document (guaranteed)

**Throws:**

- `Error`: If no documents match the criteria

**Example:**

```typescript
try {
  const admin = await db.users.firstOrFail({ role: 'admin' });
  console.log('Admin found:', admin.name);
} catch (error) {
  console.log('No admin users found');
}
```

### count()

Counts documents matching the filters.

```typescript
async count(filters?: FilterOptions): Promise<number>
```

**Parameters:**

- `filters` (optional): Filter criteria

**Returns:**

- `Promise<number>`: Number of matching documents

**Example:**

```typescript
// Count all users
const totalUsers = await db.users.count();

// Count active users
const activeUsers = await db.users.count({ isActive: true });

console.log(`${activeUsers} of ${totalUsers} users are active`);
```

## Advanced Query Operations

### find()

Executes complex queries using Appwrite Query objects.

```typescript
async find(queries: string[]): Promise<SchemaToType<T>[]>
```

**Parameters:**

- `queries`: Array of Appwrite Query strings

**Returns:**

- `Promise<SchemaToType<T>[]>`: Array of matching documents

**Example:**

```typescript
import { Query } from 'appwrite-orm';

const results = await db.users.find([
  Query.greaterThanEqual('age', 18),
  Query.lessThan('age', 65),
  Query.equal('isActive', true),
  Query.orderDesc('createdAt'),
  Query.limit(50)
]);
```

### findOne()

Finds the first document matching complex queries.

```typescript
async findOne(queries: string[]): Promise<SchemaToType<T> | null>
```

**Parameters:**

- `queries`: Array of Appwrite Query strings

**Returns:**

- `Promise<SchemaToType<T> | null>`: First matching document or null

**Example:**

```typescript
const recentUser = await db.users.findOne([
  Query.equal('isActive', true),
  Query.orderDesc('createdAt')
]);
```

## Query Options Interface

```typescript
interface QueryOptions {
  limit?: number;      // Maximum number of results
  offset?: number;     // Number of results to skip
  orderBy?: string[];  // Sort fields (prefix with '-' for descending)
  select?: string[];   // Fields to include in results
}
```

### Pagination

```typescript
// Page 1 (first 20 results)
const page1 = await db.users.all({ limit: 20, offset: 0 });

// Page 2 (next 20 results)
const page2 = await db.users.all({ limit: 20, offset: 20 });
```

### Sorting

```typescript
// Sort by name ascending
const byName = await db.users.all({ orderBy: ['name'] });

// Sort by age descending, then name ascending
const byAgeDesc = await db.users.all({ orderBy: ['-age', 'name'] });
```

### Field Selection

```typescript
// Only get name and email fields
const basicInfo = await db.users.all({ 
  select: ['name', 'email'] 
});
```

## Filter Options Interface

```typescript
interface FilterOptions {
  [key: string]: any;  // Field name to value mapping
}
```

### Simple Filtering

```typescript
// Single field filter
const admins = await db.users.query({ role: 'admin' });

// Multiple field filters (AND logic)
const activeAdmins = await db.users.query({ 
  role: 'admin', 
  isActive: true 
});
```

## Type Safety

All operations are fully type-safe based on your schema definition:

```typescript
const userTable: TableDefinition = {
  name: 'users',
  schema: {
    name: { type: 'string', required: true },
    age: { type: 'number' },
    isActive: { type: 'boolean', default: true }
  }
};

const db = await orm.init([userTable]);

// TypeScript knows the exact type
const user = await db.users.create({
  name: 'John',  // string (required)
  age: 30        // number (optional)
});

// user.$id: string
// user.name: string
// user.age: number | undefined
// user.isActive: boolean | undefined
```

## Error Handling

### Validation Errors

```typescript
import { ORMValidationError } from 'appwrite-orm';

try {
  await db.users.create({
    name: '',  // Required field is empty
    age: -5    // Below minimum if min constraint exists
  });
} catch (error) {
  if (error instanceof ORMValidationError) {
    error.errors.forEach(err => {
      console.log(`${err.field}: ${err.message}`);
    });
  }
}
```

### Not Found Errors

```typescript
try {
  const user = await db.users.getOrFail('non-existent-id');
} catch (error) {
  console.log('User not found:', error.message);
}
```

## Performance Tips

### Use Appropriate Methods

```typescript
// ✅ Good: Use count() for counting
const userCount = await db.users.count({ isActive: true });

// ❌ Bad: Don't load all data just to count
const users = await db.users.query({ isActive: true });
const userCount = users.length;
```

### Limit Results

```typescript
// ✅ Good: Use pagination
const users = await db.users.all({ limit: 50, offset: 0 });

// ❌ Bad: Loading all data at once
const allUsers = await db.users.all();
```

### Select Only Needed Fields

```typescript
// ✅ Good: Select specific fields
const userNames = await db.users.all({ 
  select: ['name', 'email'] 
});

// ❌ Bad: Loading all fields when not needed
const users = await db.users.all();
```

## Common Patterns

### Pagination Helper

```typescript
async function paginateUsers(page: number, pageSize: number = 20) {
  const offset = (page - 1) * pageSize;
  const users = await db.users.all({ 
    limit: pageSize, 
    offset,
    orderBy: ['name']
  });
  
  const total = await db.users.count();
  
  return {
    users,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  };
}
```

### Search Function

```typescript
async function searchUsers(searchTerm: string) {
  // Note: This uses simple equality. For full-text search,
  // you'd need to use Appwrite's search capabilities
  return await db.users.find([
    Query.search('name', searchTerm),
    Query.orderAsc('name')
  ]);
}
```

### Batch Operations

```typescript
async function createMultipleUsers(userData: any[]) {
  const results = [];
  
  for (const data of userData) {
    try {
      const user = await db.users.create(data);
      results.push({ success: true, user });
    } catch (error) {
      results.push({ success: false, error: error.message });
    }
  }
  
  return results;
}
```

## Next Steps

- [Validation](validation.md) - Learn about data validation
- [Web ORM](web-orm.md) - Web-specific features
- [Server ORM](server-orm.md) - Server-specific features