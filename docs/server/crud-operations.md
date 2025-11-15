# CRUD Operations (Server)

Basic create, read, update, and delete operations on the server.

## Create Documents

```typescript
const user = await db.table('users').create({
  name: 'John Doe',
  email: 'john@example.com',
  age: 30
});

console.log(user.$id); // Auto-generated ID
```

## Read Documents

### Get by ID

```typescript
const user = await db.table('users').get('document-id');
```

### Get by ID (throw error if not found)

```typescript
try {
  const user = await db.table('users').getOrFail('document-id');
} catch (error) {
  console.error('User not found');
}
```

### Get All Documents

```typescript
const allUsers = await db.table('users').all();
```

### Get with Options

```typescript
const users = await db.table('users').all({
  limit: 10,
  offset: 20,
  orderBy: ['-createdAt', 'name'],
  select: ['name', 'email']
});
```

### Find First Match

```typescript
const admin = await db.table('users').first({ role: 'admin' });
```

## Update Documents

```typescript
const updated = await db.table('users').update('document-id', {
  name: 'Jane Doe',
  age: 31
});
```

## Delete Documents

```typescript
await db.table('users').delete('document-id');
```

## Count Documents

```typescript
// Count all
const total = await db.table('users').count();

// Count with filter
const admins = await db.table('users').count({ role: 'admin' });
```

## Type Safety

Use TypeScript interfaces for type-safe operations:

```typescript
interface User {
  $id: string;
  name: string;
  email: string;
  age: number;
  role: 'admin' | 'user';
}

const user = await db.table('users').get('id') as User;
const users = await db.table('users').all() as User[];

// Now you have full type safety
console.log(user.name.toUpperCase());
```

## Error Handling

```typescript
import { ORMValidationError } from 'appwrite-orm';

try {
  const user = await db.table('users').create({
    name: 'John',
    email: 'invalid-email'
  });
} catch (error) {
  if (error instanceof ORMValidationError) {
    console.error('Validation errors:', error.errors);
    // error.errors is an array of { field, message, value }
  } else {
    console.error('Database error:', error);
  }
}
```

## Validation

The ORM validates data against your schema:

```typescript
// Schema
{
  name: { type: 'string', required: true },
  email: { type: 'string', required: true },
  age: { type: 'integer', min: 0, max: 120 }
}

// ✅ Valid
await db.table('users').create({
  name: 'John',
  email: 'john@example.com',
  age: 30
});

// ❌ Validation error: missing required field
await db.table('users').create({
  name: 'John'
  // email is required
});

// ❌ Validation error: age out of range
await db.table('users').create({
  name: 'John',
  email: 'john@example.com',
  age: 150  // max is 120
});
```

## Next Steps

- [Queries](queries.md) - Advanced queries
- [Bulk Operations](bulk-operations.md) - Process multiple documents
- [Joins](joins.md) - Query related data
