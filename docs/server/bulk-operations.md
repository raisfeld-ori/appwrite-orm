# Bulk Operations (Server Only)

Efficiently process multiple documents at once.

## Bulk Create

Create multiple documents in one operation:

```typescript
const users = await db.table('users').bulkCreate([
  { name: 'User 1', email: 'user1@example.com' },
  { name: 'User 2', email: 'user2@example.com' },
  { name: 'User 3', email: 'user3@example.com' }
]);

console.log(users); // Array of created documents with IDs
```

## Bulk Update

Update multiple documents with different data:

```typescript
await db.table('users').bulkUpdate([
  { id: 'user-id-1', data: { status: 'active' } },
  { id: 'user-id-2', data: { status: 'inactive' } },
  { id: 'user-id-3', data: { role: 'admin' } }
]);
```

## Bulk Delete

Delete multiple documents by ID:

```typescript
await db.table('users').bulkDelete([
  'user-id-1',
  'user-id-2',
  'user-id-3'
]);
```

## Error Handling

Bulk operations process each document individually. If one fails, others continue:

```typescript
try {
  const results = await db.table('users').bulkCreate([
    { name: 'Valid User', email: 'valid@example.com' },
    { name: 'Invalid User' }, // Missing required email
    { name: 'Another Valid', email: 'valid2@example.com' }
  ]);
  
  // results.successful: Created documents
  // results.failed: Array of errors
  
  console.log(`Created: ${results.successful.length}`);
  console.log(`Failed: ${results.failed.length}`);
} catch (error) {
  console.error('Bulk operation error:', error);
}
```

## Use Cases

### Import Data

```typescript
import data from './users.json';

const users = await db.table('users').bulkCreate(
  data.map(user => ({
    name: user.name,
    email: user.email,
    role: 'user'
  }))
);

console.log(`Imported ${users.length} users`);
```

### Batch Updates

```typescript
// Mark all old posts as archived
const oldPosts = await db.table('posts').find([
  Query.lessThan('createdAt', oneYearAgo)
]);

await db.table('posts').bulkUpdate(
  oldPosts.map(post => ({
    id: post.$id,
    data: { archived: true }
  }))
);
```

### Cleanup

```typescript
// Delete inactive users
const inactiveUsers = await db.table('users').query({ isActive: false });

const ids = inactiveUsers.map(user => user.$id);
await db.table('users').bulkDelete(ids);
```

## Performance

Bulk operations are faster than individual operations:

```typescript
// ❌ Slow: Individual creates
for (const user of users) {
  await db.table('users').create(user);
}

// ✅ Fast: Bulk create
await db.table('users').bulkCreate(users);
```

## Batch Size Recommendations

For very large datasets, process in batches:

```typescript
const users = [...]; // Large array

// Process 100 at a time
const batchSize = 100;
for (let i = 0; i < users.length; i += batchSize) {
  const batch = users.slice(i, i + batchSize);
  await db.table('users').bulkCreate(batch);
  console.log(`Processed ${i + batch.length} of ${users.length}`);
}
```

## Validation

All documents are validated before bulk operations:

```typescript
// Schema
{
  name: { type: 'string', required: true },
  email: { type: 'string', required: true }
}

// ✅ All valid
await db.table('users').bulkCreate([
  { name: 'User 1', email: 'user1@example.com' },
  { name: 'User 2', email: 'user2@example.com' }
]);

// ❌ Some invalid - operation fails for invalid items
await db.table('users').bulkCreate([
  { name: 'Valid', email: 'valid@example.com' },
  { name: 'Invalid' } // Missing email
]);
```

## Not Available in Web ORM

Bulk operations are server-only. For web clients, use individual operations or send data to your backend:

```typescript
// Web alternative
const results = await Promise.all(
  users.map(user => db.table('users').create(user))
);
```

## Type Safety

Use TypeScript interfaces for bulk operations:

```typescript
interface User {
  name: string;
  email: string;
  role: 'admin' | 'user';
}

const usersToCreate: Omit<User, '$id'>[] = [
  { name: 'User 1', email: 'user1@example.com', role: 'user' },
  { name: 'User 2', email: 'user2@example.com', role: 'admin' }
];

const created = await db.table('users').bulkCreate(usersToCreate);
```

## Next Steps

- [CRUD Operations](crud-operations.md) - Individual operations
- [Queries](queries.md) - Find documents to process
- [Setup](setup.md) - Configure your ORM
