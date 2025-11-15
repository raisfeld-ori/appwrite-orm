# CRUD Operations (Web)

Basic create, read, update, and delete operations in the web client.

## Create Documents

```typescript
const post = await db.table('posts').create({
  title: 'My First Post',
  content: 'Hello world!',
  published: true
});

console.log(post.$id); // Document ID assigned by Appwrite
```

## Read Documents

### Get by ID

```typescript
const post = await db.table('posts').get('document-id');
```

### Get by ID (throw error if not found)

```typescript
try {
  const post = await db.table('posts').getOrFail('document-id');
} catch (error) {
  console.error('Post not found');
}
```

### Get All Documents

```typescript
const allPosts = await db.table('posts').all();
```

### Get with Options

```typescript
const posts = await db.table('posts').all({
  limit: 10,
  offset: 20,
  orderBy: ['-createdAt', 'title'],
  select: ['title', 'published']
});
```

### Find First Match

```typescript
const post = await db.table('posts').first({ published: true });
```

## Update Documents

```typescript
const updated = await db.table('posts').update('document-id', {
  title: 'Updated Title',
  views: 42
});
```

## Delete Documents

```typescript
await db.table('posts').delete('document-id');
```

## Count Documents

```typescript
// Count all
const total = await db.table('posts').count();

// Count with filter
const published = await db.table('posts').count({ published: true });
```

## Type Safety

Use TypeScript interfaces for type-safe operations:

```typescript
interface Post {
  $id: string;
  title: string;
  content: string;
  published: boolean;
  views: number;
}

const post = await db.table('posts').get('id') as Post;
const posts = await db.table('posts').all() as Post[];
```

## Error Handling

```typescript
try {
  const post = await db.table('posts').create({
    title: 'Test Post',
    content: 'Content'
  });
} catch (error) {
  if (error.name === 'ORMValidationError') {
    console.error('Validation failed:', error.errors);
  } else {
    console.error('Appwrite error:', error);
  }
}
```

## Next Steps

- [Queries](queries.md) - Advanced queries and filtering
- [Development Mode](development-mode.md) - Test without Appwrite
