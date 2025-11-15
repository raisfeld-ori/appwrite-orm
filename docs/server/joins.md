# Joins (Server Only)

Query related data across multiple collections.

## Left Join

Get all records from the first collection, with matching records from the second:

```typescript
// Get all users with their posts
const usersWithPosts = await db.leftJoin(
  'users',
  'posts',
  { 
    foreignKey: '$id',       // Field in users
    referenceKey: 'userId',  // Field in posts
    as: 'posts'             // Name for joined data
  }
);

// Result structure:
// [
//   {
//     $id: 'user1',
//     name: 'John',
//     posts: [/* array of posts */]
//   },
//   {
//     $id: 'user2',
//     name: 'Jane',
//     posts: []  // No posts = empty array
//   }
// ]
```

## Inner Join

Only get records that have matches in both collections:

```typescript
// Get only users who have posts
const usersWithPosts = await db.innerJoin(
  'users',
  'posts',
  {
    foreignKey: '$id',
    referenceKey: 'userId',
    as: 'posts'
  }
);

// Users without posts are excluded
```

## Join with Filters

Filter data in both collections:

```typescript
// Get active users with published posts
const result = await db.join(
  'users',
  'posts',
  {
    foreignKey: '$id',
    referenceKey: 'userId',
    as: 'posts'
  },
  { isActive: true },      // Filter users
  { published: true }       // Filter posts
);
```

## Common Use Cases

### User Posts

```typescript
interface User {
  $id: string;
  name: string;
  email: string;
}

interface Post {
  $id: string;
  userId: string;
  title: string;
  content: string;
}

const usersWithPosts = await db.leftJoin(
  'users',
  'posts',
  { foreignKey: '$id', referenceKey: 'userId', as: 'posts' }
) as (User & { posts: Post[] })[];

usersWithPosts.forEach(user => {
  console.log(`${user.name} has ${user.posts.length} posts`);
});
```

### Post Comments

```typescript
const postsWithComments = await db.leftJoin(
  'posts',
  'comments',
  { foreignKey: '$id', referenceKey: 'postId', as: 'comments' }
);
```

### Product Reviews

```typescript
const productsWithReviews = await db.leftJoin(
  'products',
  'reviews',
  { foreignKey: '$id', referenceKey: 'productId', as: 'reviews' }
);
```

## Multiple Joins

For multiple related collections, join sequentially:

```typescript
// Get users with posts and comments
const usersWithPosts = await db.leftJoin(
  'users',
  'posts',
  { foreignKey: '$id', referenceKey: 'userId', as: 'posts' }
);

// Then join posts with comments (manual)
for (const user of usersWithPosts) {
  for (const post of user.posts) {
    const comments = await db.table('comments').query({ postId: post.$id });
    post.comments = comments;
  }
}
```

## Performance Considerations

Joins execute multiple queries under the hood:

```typescript
// This runs:
// 1. Query users
// 2. Query posts for each user
const result = await db.leftJoin('users', 'posts', {
  foreignKey: '$id',
  referenceKey: 'userId',
  as: 'posts'
});
```

**Tips:**
- Use filters to reduce data fetched
- Consider if you need all joined data
- For large datasets, paginate the first collection
- Index the `referenceKey` field for better performance

## Join Options

```typescript
interface JoinOptions {
  foreignKey: string;      // Field in first collection (usually '$id')
  referenceKey?: string;   // Field in second collection (default: '$id')
  as?: string;            // Property name for joined data (default: collection name)
}
```

## Examples by Relationship Type

### One-to-Many

```typescript
// One user has many posts
const usersWithPosts = await db.leftJoin(
  'users',
  'posts',
  { foreignKey: '$id', referenceKey: 'userId', as: 'posts' }
);
```

### Many-to-One

```typescript
// Many posts belong to one category
const postsWithCategory = await db.leftJoin(
  'posts',
  'categories',
  { foreignKey: 'categoryId', referenceKey: '$id', as: 'category' }
);
```

### Self-Join

```typescript
// Comments with parent comments
const commentsWithReplies = await db.leftJoin(
  'comments',
  'comments',
  { foreignKey: '$id', referenceKey: 'parentId', as: 'replies' }
);
```

## Not Available in Web ORM

Joins are server-only because they require multiple database queries. For web clients, fetch related data separately:

```typescript
// Web alternative
const posts = await db.table('posts').all();
const comments = await db.table('comments').all();

// Combine in application code
const postsWithComments = posts.map(post => ({
  ...post,
  comments: comments.filter(c => c.postId === post.$id)
}));
```

## Next Steps

- [Indexes](indexes.md) - Optimize join performance
- [Queries](queries.md) - Filter joined data
- [Bulk Operations](bulk-operations.md) - Process multiple records
