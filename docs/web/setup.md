# Web/Client Setup

Use Appwrite ORM in your browser-based applications (React, Vue, Svelte, vanilla JS).

## Installation

```bash
npm install appwrite-orm appwrite
```

## Basic Setup

```typescript
import { WebORM } from 'appwrite-orm/web';

const orm = new WebORM({
  endpoint: 'https://cloud.appwrite.io/v1',
  projectId: 'your-project-id',
  databaseId: 'your-database-id'
});

const db = await orm.init([{
  name: 'posts',
  schema: {
    title: { type: 'string', required: true },
    content: { type: 'string', required: true },
    published: { type: 'boolean', default: false },
    views: { type: 'integer', default: 0 }
  }
}]);
```

## Define Your Schema

```typescript
const db = await orm.init([
  {
    name: 'posts',
    schema: {
      title: { type: 'string', required: true, size: 255 },
      content: { type: 'string', required: true },
      published: { type: 'boolean', default: false },
      views: { type: 'integer', default: 0 },
      tags: { type: 'string', array: true }
    }
  },
  {
    name: 'comments',
    schema: {
      postId: { type: 'string', required: true },
      text: { type: 'string', required: true },
      author: { type: 'string', required: true }
    }
  }
]);
```

## Framework Examples

### React

```typescript
import { WebORM } from 'appwrite-orm/web';
import { useState, useEffect } from 'react';

function App() {
  const [db, setDb] = useState(null);

  useEffect(() => {
    const initORM = async () => {
      const orm = new WebORM({
        endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT,
        projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID,
        databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID
      });

      const database = await orm.init([{
        name: 'posts',
        schema: {
          title: { type: 'string', required: true },
          content: { type: 'string', required: true }
        }
      }]);

      setDb(database);
    };

    initORM();
  }, []);

  const createPost = async () => {
    const post = await db.table('posts').create({
      title: 'My Post',
      content: 'Hello world!'
    });
    console.log('Created:', post);
  };

  return <button onClick={createPost}>Create Post</button>;
}
```

### Vue

```vue
<script setup>
import { WebORM } from 'appwrite-orm/web';
import { ref, onMounted } from 'vue';

const db = ref(null);
const posts = ref([]);

onMounted(async () => {
  const orm = new WebORM({
    endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT,
    projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID,
    databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID
  });

  db.value = await orm.init([{
    name: 'posts',
    schema: {
      title: { type: 'string', required: true },
      content: { type: 'string', required: true }
    }
  }]);

  posts.value = await db.value.table('posts').all();
});

const createPost = async () => {
  const post = await db.value.table('posts').create({
    title: 'My Post',
    content: 'Hello world!'
  });
  posts.value.push(post);
};
</script>

<template>
  <button @click="createPost">Create Post</button>
  <div v-for="post in posts" :key="post.$id">
    {{ post.title }}
  </div>
</template>
```

## Important Notes

### Collections Must Exist

WebORM cannot create collections - you must create them in Appwrite first:

1. Go to your Appwrite Console
2. Navigate to Databases → Your Database
3. Create collections matching your schema names
4. Add attributes matching your schema fields

### Use Development Mode for Testing

For quick prototyping without Appwrite setup:

```typescript
const orm = new WebORM({
  endpoint: 'http://localhost',
  projectId: 'dev',
  databaseId: 'test-db',
  development: true  // Uses browser cookies
});
```

## Next Steps

- [CRUD Operations](crud-operations.md)
- [Queries](queries.md)
- [Development Mode](development-mode.md)
- [Caching](caching.md)
- [Realtime Listeners](listeners.md)
