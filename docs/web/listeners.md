# Realtime Listeners

WebORM provides powerful realtime event listeners that automatically keep your application synchronized with database changes. When data changes in Appwrite, your listeners are notified instantly.

## Overview

Realtime listeners allow you to:

- React to data changes in real-time
- Automatically invalidate cache when data changes
- Build live, collaborative applications
- Sync data across multiple browser tabs/windows

## Basic Usage

### Listen to Document Changes

```typescript
const db = await orm.init([{
  name: 'posts',
  schema: {
    title: { type: 'string', required: true },
    content: { type: 'string', required: true }
  }
}]);

const postsTable = db.table('posts');

// Listen to all document changes in the collection
const unsubscribe = postsTable.listenToDocuments((event) => {
  console.log('Document changed:', event.payload);
  console.log('Event type:', event.events);
  
  // Cache is automatically invalidated
  // Your UI can react to this change
});

// Clean up when done
unsubscribe();
```

### Listen to Specific Document

```typescript
const postId = 'post-123';

const unsubscribe = postsTable.listenToDocument(postId, (event) => {
  console.log('Specific post changed:', event.payload);
  
  if (event.events.includes('databases.*.collections.*.documents.*.delete')) {
    console.log('Post was deleted');
  }
});
```

### Listen to Collection Events

```typescript
// Listen to collection-level changes
const unsubscribe = postsTable.listenToCollection((event) => {
  console.log('Collection changed:', event);
  // Triggered by collection structure changes, permissions, etc.
});
```

### Listen to Database Events

```typescript
// Listen to database-level changes
const unsubscribe = postsTable.listenToDatabase((event) => {
  console.log('Database changed:', event);
  // Triggered by any change in the database
});
```

### Custom Channel Listeners

```typescript
// Listen to custom event patterns
const unsubscribe = postsTable.listen('documents.*.update', (event) => {
  console.log('Document update event:', event);
});

// Listen to create events only
const unsubscribeCreate = postsTable.listen('documents.*.create', (event) => {
  console.log('New document created:', event.payload);
});
```

## Event Object Structure

```typescript
postsTable.listenToDocuments((event) => {
  console.log(event);
  /*
  {
    events: [
      'databases.db-id.collections.posts.documents.doc-id.create'
    ],
    channels: [
      'databases.db-id.collections.posts.documents'
    ],
    timestamp: '2023-12-07T10:30:00.000Z',
    payload: {
      $id: 'doc-id',
      $collectionId: 'posts',
      $databaseId: 'db-id',
      title: 'My Post',
      content: 'Post content',
      $createdAt: '2023-12-07T10:30:00.000Z',
      $updatedAt: '2023-12-07T10:30:00.000Z'
    }
  }
  */
});
```

## React Integration

### Basic React Component

```typescript
import { useState, useEffect } from 'react';

function PostsList({ db }) {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const loadPosts = async () => {
      const allPosts = await db.table('posts').all();
      setPosts(allPosts);
    };

    // Set up realtime listener
    const unsubscribe = db.table('posts').listenToDocuments((event) => {
      console.log('Posts changed, reloading...');
      loadPosts(); // Reload data when changes occur
    });

    loadPosts();

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, [db]);

  return (
    <div>
      {posts.map(post => (
        <div key={post.$id}>
          <h3>{post.title}</h3>
          <p>{post.content}</p>
        </div>
      ))}
    </div>
  );
}
```

### Advanced React Hook

```typescript
import { useState, useEffect, useCallback } from 'react';

function useRealtimeData(table, dependencies = []) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await table.all();
      setData(result);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, [table, ...dependencies]);

  useEffect(() => {
    // Initial load
    loadData();

    // Set up realtime listener
    const unsubscribe = table.listenToDocuments((event) => {
      console.log('Realtime update received:', event.events);
      loadData(); // Reload on changes
    });

    return () => {
      unsubscribe();
    };
  }, [loadData, table]);

  return { data, loading, lastUpdate, reload: loadData };
}

// Usage
function PostsList({ db }) {
  const { data: posts, loading, lastUpdate } = useRealtimeData(
    db.table('posts')
  );

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <p>Last updated: {lastUpdate?.toLocaleTimeString()}</p>
      {posts.map(post => (
        <div key={post.$id}>{post.title}</div>
      ))}
    </div>
  );
}
```

### Optimistic Updates

```typescript
function PostEditor({ db, postId }) {
  const [post, setPost] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const loadPost = async () => {
      if (postId) {
        const postData = await db.table('posts').get(postId);
        setPost(postData);
      }
    };

    // Listen to changes for this specific post
    const unsubscribe = db.table('posts').listenToDocument(postId, (event) => {
      if (!isEditing) {
        // Only update if we're not currently editing
        setPost(event.payload);
      }
    });

    loadPost();
    return () => unsubscribe();
  }, [db, postId, isEditing]);

  const handleSave = async (updatedData) => {
    setIsEditing(true);
    
    // Optimistic update
    setPost({ ...post, ...updatedData });
    
    try {
      await db.table('posts').update(postId, updatedData);
    } catch (error) {
      // Revert on error
      const freshPost = await db.table('posts').get(postId);
      setPost(freshPost);
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <div>
      {post && (
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          handleSave({
            title: formData.get('title'),
            content: formData.get('content')
          });
        }}>
          <input name="title" defaultValue={post.title} />
          <textarea name="content" defaultValue={post.content} />
          <button type="submit">Save</button>
        </form>
      )}
    </div>
  );
}
```

## Live Chat Example

```typescript
import { useState, useEffect, useRef } from 'react';

function ChatRoom({ db, roomId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const loadMessages = async () => {
      const roomMessages = await db.table('messages').find([
        `equal("roomId", "${roomId}")`
      ]);
      setMessages(roomMessages);
    };

    // Listen for new messages
    const unsubscribe = db.table('messages').listenToDocuments((event) => {
      const message = event.payload;
      
      if (message.roomId === roomId) {
        if (event.events.includes('create')) {
          // Add new message
          setMessages(prev => [...prev, message]);
        } else if (event.events.includes('update')) {
          // Update existing message
          setMessages(prev => 
            prev.map(m => m.$id === message.$id ? message : m)
          );
        } else if (event.events.includes('delete')) {
          // Remove deleted message
          setMessages(prev => 
            prev.filter(m => m.$id !== message.$id)
          );
        }
      }
    });

    loadMessages();
    return () => unsubscribe();
  }, [db, roomId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    await db.table('messages').create({
      roomId,
      text: newMessage,
      userId: 'current-user-id',
      timestamp: new Date()
    });

    setNewMessage('');
  };

  return (
    <div className="chat-room">
      <div className="messages">
        {messages.map(message => (
          <div key={message.$id} className="message">
            <strong>{message.userId}:</strong> {message.text}
            <small>{new Date(message.timestamp).toLocaleTimeString()}</small>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={sendMessage}>
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
```

## Development Mode

In development mode, realtime functionality uses polling to simulate real-time updates:

```typescript
const orm = new WebORM({
  endpoint: 'http://localhost',
  projectId: 'dev',
  databaseId: 'test-db',
  development: true  // Enables polling simulation
});

const db = await orm.init(tables);

// Listeners work the same way, but use polling internally
const unsubscribe = db.table('posts').listenToDocuments((event) => {
  console.log('Simulated realtime event:', event);
});
```

The polling checks for changes every second and generates events when data changes are detected.

## Multiple Listeners

You can set up multiple listeners for different purposes:

```typescript
const postsTable = db.table('posts');

// Listen for new posts
const unsubscribeNew = postsTable.listen('documents.*.create', (event) => {
  showNotification(`New post: ${event.payload.title}`);
});

// Listen for post updates
const unsubscribeUpdates = postsTable.listen('documents.*.update', (event) => {
  updatePostInUI(event.payload);
});

// Listen for post deletions
const unsubscribeDeletes = postsTable.listen('documents.*.delete', (event) => {
  removePostFromUI(event.payload.$id);
});

// Clean up all listeners
const cleanup = () => {
  unsubscribeNew();
  unsubscribeUpdates();
  unsubscribeDeletes();
};
```

## Error Handling

```typescript
const unsubscribe = postsTable.listenToDocuments((event) => {
  try {
    // Process the event
    handleRealtimeUpdate(event);
  } catch (error) {
    console.error('Error processing realtime event:', error);
    
    // Optionally reload data on error
    reloadData();
  }
});

// Handle connection issues
const unsubscribeWithRetry = postsTable.listenToDocuments((event) => {
  handleRealtimeUpdate(event);
}, {
  onError: (error) => {
    console.error('Realtime connection error:', error);
    // Implement retry logic if needed
  }
});
```

## Cleanup and Memory Management

### Component Cleanup

```typescript
function MyComponent({ db }) {
  useEffect(() => {
    const unsubscribes = [];

    // Set up multiple listeners
    unsubscribes.push(
      db.table('posts').listenToDocuments(handlePosts),
      db.table('comments').listenToDocuments(handleComments),
      db.table('users').listenToDocuments(handleUsers)
    );

    return () => {
      // Clean up all listeners
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [db]);

  return <div>My Component</div>;
}
```

### Global Cleanup

```typescript
// Clean up all listeners for a table
const postsTable = db.table('posts');
postsTable.closeListeners();

// Clean up all listeners for the entire database
db.closeListeners();
```

## Best Practices

### 1. Always Clean Up Listeners

```typescript
// ✅ Good - Always clean up
useEffect(() => {
  const unsubscribe = table.listenToDocuments(handler);
  return () => unsubscribe();
}, []);

// ❌ Bad - Memory leak
useEffect(() => {
  table.listenToDocuments(handler);
}, []);
```

### 2. Debounce Rapid Updates

```typescript
import { debounce } from 'lodash';

const debouncedHandler = debounce((event) => {
  // Handle the event
  updateUI(event.payload);
}, 300);

const unsubscribe = table.listenToDocuments(debouncedHandler);
```

### 3. Filter Events When Needed

```typescript
const unsubscribe = table.listenToDocuments((event) => {
  // Only handle create events
  if (event.events.some(e => e.includes('.create'))) {
    handleNewDocument(event.payload);
  }
});
```

### 4. Use Specific Listeners

```typescript
// ✅ Good - Specific listener
const unsubscribe = table.listenToDocument(specificId, handler);

// ❌ Less efficient - Filter in handler
const unsubscribe = table.listenToDocuments((event) => {
  if (event.payload.$id === specificId) {
    handler(event);
  }
});
```

## Troubleshooting

### Listeners Not Firing

1. Check Appwrite realtime permissions
2. Verify collection and database IDs
3. Ensure proper authentication
4. Check browser console for errors

### Performance Issues

1. Limit the number of active listeners
2. Use specific listeners instead of broad ones
3. Debounce rapid updates
4. Clean up unused listeners

### Development Mode Issues

1. Ensure development mode is enabled
2. Check that data is actually changing
3. Verify polling is working (check console logs)

## Connection Status

```typescript
// Monitor connection status (if available)
const unsubscribe = table.listenToDocuments((event) => {
  console.log('Connected and receiving events');
}, {
  onConnect: () => console.log('Realtime connected'),
  onDisconnect: () => console.log('Realtime disconnected'),
  onError: (error) => console.error('Realtime error:', error)
});
```