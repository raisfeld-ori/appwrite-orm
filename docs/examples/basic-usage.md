# Basic Usage Examples

Learn the fundamentals of Appwrite ORM through practical examples that demonstrate core concepts and common patterns.

## Simple User Management

### Schema Definition

```typescript
import { TableDefinition } from 'appwrite-orm';

const userTable: TableDefinition = {
  name: 'users',
  schema: {
    name: { type: 'string', required: true, size: 100 },
    email: { type: 'string', required: true, size: 255 },
    age: { type: 'number', min: 0, max: 120 },
    isActive: { type: 'boolean', default: true },
    role: {
      type: ['admin', 'user', 'guest'],
      enum: ['admin', 'user', 'guest'],
      default: 'user'
    },
    createdAt: { type: 'Date', default: new Date() }
  }
};
```

### Server Implementation

```typescript
import { ServerORM } from 'appwrite-orm/server';

async function setupUserService() {
  // Initialize ORM
  const orm = new ServerORM({
    endpoint: process.env.APPWRITE_ENDPOINT!,
    projectId: process.env.APPWRITE_PROJECT_ID!,
    databaseId: process.env.APPWRITE_DATABASE_ID!,
    apiKey: process.env.APPWRITE_API_KEY!,
    autoMigrate: true
  });

  const db = await orm.init([userTable]);
  return db;
}

// User service functions
class UserService {
  private static db: any;

  static async initialize() {
    this.db = await setupUserService();
  }

  static async createUser(userData: {
    name: string;
    email: string;
    age?: number;
    role?: 'admin' | 'user' | 'guest';
  }) {
    try {
      const user = await this.db.users.create(userData);
      console.log('User created:', user.$id);
      return user;
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  }

  static async getUserById(id: string) {
    return await this.db.users.get(id);
  }

  static async getAllUsers() {
    return await this.db.users.all({ orderBy: ['name'] });
  }

  static async getActiveUsers() {
    return await this.db.users.query({ isActive: true });
  }

  static async updateUser(id: string, updates: Partial<{
    name: string;
    email: string;
    age: number;
    isActive: boolean;
    role: 'admin' | 'user' | 'guest';
  }>) {
    return await this.db.users.update(id, updates);
  }

  static async deleteUser(id: string) {
    await this.db.users.delete(id);
    console.log('User deleted:', id);
  }

  static async getUserStats() {
    const [total, active, admins] = await Promise.all([
      this.db.users.count(),
      this.db.users.count({ isActive: true }),
      this.db.users.count({ role: 'admin' })
    ]);

    return { total, active, admins, inactive: total - active };
  }
}

// Usage example
async function main() {
  await UserService.initialize();

  // Create users
  const user1 = await UserService.createUser({
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
    role: 'user'
  });

  const user2 = await UserService.createUser({
    name: 'Jane Admin',
    email: 'jane@example.com',
    age: 28,
    role: 'admin'
  });

  // Get users
  const allUsers = await UserService.getAllUsers();
  console.log('All users:', allUsers.length);

  const activeUsers = await UserService.getActiveUsers();
  console.log('Active users:', activeUsers.length);

  // Update user
  await UserService.updateUser(user1.$id, {
    age: 31,
    role: 'admin'
  });

  // Get statistics
  const stats = await UserService.getUserStats();
  console.log('User statistics:', stats);
}

main().catch(console.error);
```

### Web Implementation

```typescript
import { WebORM } from 'appwrite-orm/web';

class WebUserService {
  private db: any;

  constructor() {
    const orm = new WebORM({
      endpoint: process.env.REACT_APP_APPWRITE_ENDPOINT!,
      projectId: process.env.REACT_APP_APPWRITE_PROJECT_ID!,
      databaseId: process.env.REACT_APP_APPWRITE_DATABASE_ID!
    });

    this.db = orm.init([userTable]);
  }

  async createUser(userData: {
    name: string;
    email: string;
    age?: number;
  }) {
    return await this.db.users.create(userData);
  }

  async getUsers() {
    return await this.db.users.all({ orderBy: ['name'] });
  }

  async getUserById(id: string) {
    return await this.db.users.get(id);
  }

  async updateUser(id: string, updates: any) {
    return await this.db.users.update(id, updates);
  }

  async deleteUser(id: string) {
    await this.db.users.delete(id);
  }
}

// React component example
import React, { useState, useEffect } from 'react';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userService] = useState(() => new WebUserService());

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const userList = await userService.getUsers();
      setUsers(userList);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (userData: any) => {
    try {
      await userService.createUser(userData);
      await loadUsers(); // Refresh list
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await userService.deleteUser(userId);
      await loadUsers(); // Refresh list
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>User Management</h2>
      
      <UserForm onSubmit={handleCreateUser} />
      
      <div>
        <h3>Users ({users.length})</h3>
        {users.map(user => (
          <div key={user.$id} className="user-item">
            <span>{user.name} ({user.email})</span>
            <button onClick={() => handleDeleteUser(user.$id)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function UserForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: formData.name,
      email: formData.email,
      age: formData.age ? parseInt(formData.age) : undefined
    });
    setFormData({ name: '', email: '', age: '' });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Name"
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
        required
      />
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
        required
      />
      <input
        type="number"
        placeholder="Age"
        value={formData.age}
        onChange={(e) => setFormData({...formData, age: e.target.value})}
      />
      <button type="submit">Create User</button>
    </form>
  );
}
```

## Blog System Example

### Schema Definitions

```typescript
import { TableDefinition } from 'appwrite-orm';

const authorTable: TableDefinition = {
  name: 'authors',
  schema: {
    name: { type: 'string', required: true, size: 100 },
    email: { type: 'string', required: true, size: 255 },
    bio: { type: 'string', size: 1000 },
    avatar: { type: 'string', size: 255 },
    isActive: { type: 'boolean', default: true },
    createdAt: { type: 'Date', default: new Date() }
  }
};

const postTable: TableDefinition = {
  name: 'posts',
  schema: {
    title: { type: 'string', required: true, size: 255 },
    slug: { type: 'string', required: true, size: 255 },
    content: { type: 'string', required: true },
    excerpt: { type: 'string', size: 500 },
    authorId: { type: 'string', required: true },
    status: {
      type: ['draft', 'published', 'archived'],
      enum: ['draft', 'published', 'archived'],
      default: 'draft'
    },
    publishedAt: { type: 'Date' },
    viewCount: { type: 'number', default: 0, min: 0 },
    tags: { type: 'string', size: 500 }, // JSON string of tags
    createdAt: { type: 'Date', default: new Date() },
    updatedAt: { type: 'Date', default: new Date() }
  }
};

const commentTable: TableDefinition = {
  name: 'comments',
  schema: {
    postId: { type: 'string', required: true },
    authorName: { type: 'string', required: true, size: 100 },
    authorEmail: { type: 'string', required: true, size: 255 },
    content: { type: 'string', required: true, size: 1000 },
    isApproved: { type: 'boolean', default: false },
    createdAt: { type: 'Date', default: new Date() }
  }
};
```

### Blog Service Implementation

```typescript
import { ServerORM } from 'appwrite-orm/server';
import { Query } from 'appwrite';

class BlogService {
  private static db: any;

  static async initialize() {
    const orm = new ServerORM({
      endpoint: process.env.APPWRITE_ENDPOINT!,
      projectId: process.env.APPWRITE_PROJECT_ID!,
      databaseId: process.env.APPWRITE_DATABASE_ID!,
      apiKey: process.env.APPWRITE_API_KEY!,
      autoMigrate: true
    });

    this.db = await orm.init([authorTable, postTable, commentTable]);
  }

  // Author operations
  static async createAuthor(authorData: {
    name: string;
    email: string;
    bio?: string;
    avatar?: string;
  }) {
    return await this.db.authors.create(authorData);
  }

  static async getAuthorById(id: string) {
    return await this.db.authors.get(id);
  }

  // Post operations
  static async createPost(postData: {
    title: string;
    content: string;
    authorId: string;
    excerpt?: string;
    tags?: string[];
  }) {
    const slug = this.generateSlug(postData.title);
    
    return await this.db.posts.create({
      ...postData,
      slug,
      tags: postData.tags ? JSON.stringify(postData.tags) : undefined
    });
  }

  static async publishPost(postId: string) {
    return await this.db.posts.update(postId, {
      status: 'published',
      publishedAt: new Date()
    });
  }

  static async getPublishedPosts(page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;
    
    return await this.db.posts.find([
      Query.equal('status', 'published'),
      Query.orderDesc('publishedAt'),
      Query.limit(limit),
      Query.offset(offset)
    ]);
  }

  static async getPostBySlug(slug: string) {
    const post = await this.db.posts.first({ slug });
    
    if (post) {
      // Increment view count
      await this.db.posts.update(post.$id, {
        viewCount: post.viewCount + 1
      });
      
      // Get author information
      const author = await this.getAuthorById(post.authorId);
      
      return {
        ...post,
        author,
        tags: post.tags ? JSON.parse(post.tags) : []
      };
    }
    
    return null;
  }

  static async getPostsByAuthor(authorId: string) {
    return await this.db.posts.query({ authorId }, {
      orderBy: ['-createdAt']
    });
  }

  static async searchPosts(searchTerm: string) {
    // Simple search implementation
    // In a real app, you might use full-text search
    return await this.db.posts.find([
      Query.search('title', searchTerm),
      Query.equal('status', 'published'),
      Query.orderDesc('publishedAt')
    ]);
  }

  // Comment operations
  static async addComment(commentData: {
    postId: string;
    authorName: string;
    authorEmail: string;
    content: string;
  }) {
    return await this.db.comments.create(commentData);
  }

  static async getPostComments(postId: string) {
    return await this.db.comments.query(
      { postId, isApproved: true },
      { orderBy: ['createdAt'] }
    );
  }

  static async approveComment(commentId: string) {
    return await this.db.comments.update(commentId, {
      isApproved: true
    });
  }

  static async getPendingComments() {
    return await this.db.comments.query(
      { isApproved: false },
      { orderBy: ['-createdAt'] }
    );
  }

  // Utility methods
  private static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  static async getBlogStats() {
    const [totalPosts, publishedPosts, totalAuthors, totalComments, pendingComments] = await Promise.all([
      this.db.posts.count(),
      this.db.posts.count({ status: 'published' }),
      this.db.authors.count(),
      this.db.comments.count(),
      this.db.comments.count({ isApproved: false })
    ]);

    return {
      totalPosts,
      publishedPosts,
      draftPosts: totalPosts - publishedPosts,
      totalAuthors,
      totalComments,
      pendingComments
    };
  }
}

// Usage example
async function blogExample() {
  await BlogService.initialize();

  // Create an author
  const author = await BlogService.createAuthor({
    name: 'John Writer',
    email: 'john@example.com',
    bio: 'A passionate writer and developer.'
  });

  // Create a post
  const post = await BlogService.createPost({
    title: 'Getting Started with Appwrite ORM',
    content: 'This is a comprehensive guide to using Appwrite ORM...',
    excerpt: 'Learn how to use Appwrite ORM effectively',
    authorId: author.$id,
    tags: ['appwrite', 'orm', 'typescript']
  });

  // Publish the post
  await BlogService.publishPost(post.$id);

  // Add a comment
  await BlogService.addComment({
    postId: post.$id,
    authorName: 'Reader',
    authorEmail: 'reader@example.com',
    content: 'Great article! Very helpful.'
  });

  // Get published posts
  const publishedPosts = await BlogService.getPublishedPosts(1, 5);
  console.log('Published posts:', publishedPosts.length);

  // Get blog statistics
  const stats = await BlogService.getBlogStats();
  console.log('Blog stats:', stats);
}

blogExample().catch(console.error);
```

## E-commerce Product Catalog

### Product Schema

```typescript
const productTable: TableDefinition = {
  name: 'products',
  schema: {
    name: { type: 'string', required: true, size: 255 },
    description: { type: 'string', size: 2000 },
    sku: { type: 'string', required: true, size: 100 },
    price: { type: 'number', required: true, min: 0 },
    salePrice: { type: 'number', min: 0 },
    cost: { type: 'number', min: 0 },
    stock: { type: 'number', default: 0, min: 0 },
    category: {
      type: ['electronics', 'clothing', 'books', 'home', 'sports'],
      enum: ['electronics', 'clothing', 'books', 'home', 'sports'],
      required: true
    },
    status: {
      type: ['draft', 'active', 'inactive', 'discontinued'],
      enum: ['draft', 'active', 'inactive', 'discontinued'],
      default: 'draft'
    },
    weight: { type: 'number', min: 0 },
    dimensions: { type: 'string', size: 100 },
    tags: { type: 'string', size: 500 },
    images: { type: 'string', size: 1000 }, // JSON array of image URLs
    createdAt: { type: 'Date', default: new Date() },
    updatedAt: { type: 'Date', default: new Date() }
  }
};
```

### Product Service

```typescript
class ProductService {
  private static db: any;

  static async initialize() {
    const orm = new ServerORM({
      endpoint: process.env.APPWRITE_ENDPOINT!,
      projectId: process.env.APPWRITE_PROJECT_ID!,
      databaseId: process.env.APPWRITE_DATABASE_ID!,
      apiKey: process.env.APPWRITE_API_KEY!,
      autoMigrate: true
    });

    this.db = await orm.init([productTable]);
  }

  static async createProduct(productData: {
    name: string;
    description?: string;
    sku: string;
    price: number;
    category: string;
    stock?: number;
    images?: string[];
  }) {
    return await this.db.products.create({
      ...productData,
      images: productData.images ? JSON.stringify(productData.images) : undefined
    });
  }

  static async getProducts(filters: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    status?: string;
  } = {}, page: number = 1, limit: number = 20) {
    const queries = [];
    const offset = (page - 1) * limit;

    // Apply filters
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

    if (filters.status) {
      queries.push(Query.equal('status', filters.status));
    } else {
      queries.push(Query.equal('status', 'active'));
    }

    // Add pagination and sorting
    queries.push(Query.orderAsc('name'));
    queries.push(Query.limit(limit));
    queries.push(Query.offset(offset));

    const products = await this.db.products.find(queries);
    
    // Parse images JSON
    return products.map((product: any) => ({
      ...product,
      images: product.images ? JSON.parse(product.images) : []
    }));
  }

  static async getProductById(id: string) {
    const product = await this.db.products.get(id);
    
    if (product) {
      return {
        ...product,
        images: product.images ? JSON.parse(product.images) : []
      };
    }
    
    return null;
  }

  static async updateStock(productId: string, quantity: number) {
    const product = await this.getProductById(productId);
    
    if (!product) {
      throw new Error('Product not found');
    }

    const newStock = Math.max(0, product.stock + quantity);
    
    return await this.db.products.update(productId, {
      stock: newStock,
      updatedAt: new Date()
    });
  }

  static async getFeaturedProducts(limit: number = 10) {
    return await this.db.products.find([
      Query.equal('status', 'active'),
      Query.greaterThan('stock', 0),
      Query.orderDesc('createdAt'),
      Query.limit(limit)
    ]);
  }

  static async searchProducts(searchTerm: string) {
    return await this.db.products.find([
      Query.search('name', searchTerm),
      Query.equal('status', 'active'),
      Query.orderAsc('name')
    ]);
  }

  static async getLowStockProducts(threshold: number = 10) {
    return await this.db.products.find([
      Query.lessThanEqual('stock', threshold),
      Query.greaterThan('stock', 0),
      Query.equal('status', 'active'),
      Query.orderAsc('stock')
    ]);
  }

  static async getProductsByCategory(category: string) {
    return await this.db.products.query(
      { category, status: 'active' },
      { orderBy: ['name'] }
    );
  }
}

// Usage example
async function ecommerceExample() {
  await ProductService.initialize();

  // Create products
  const laptop = await ProductService.createProduct({
    name: 'Gaming Laptop',
    description: 'High-performance gaming laptop with RTX graphics',
    sku: 'LAPTOP-001',
    price: 1299.99,
    category: 'electronics',
    stock: 50,
    images: ['laptop1.jpg', 'laptop2.jpg']
  });

  const tshirt = await ProductService.createProduct({
    name: 'Cotton T-Shirt',
    description: 'Comfortable cotton t-shirt',
    sku: 'SHIRT-001',
    price: 29.99,
    category: 'clothing',
    stock: 100
  });

  // Get products with filters
  const electronicsProducts = await ProductService.getProducts({
    category: 'electronics',
    minPrice: 100,
    inStock: true
  });

  console.log('Electronics products:', electronicsProducts.length);

  // Update stock (simulate sale)
  await ProductService.updateStock(laptop.$id, -1);

  // Get low stock products
  const lowStock = await ProductService.getLowStockProducts(10);
  console.log('Low stock products:', lowStock.length);
}

ecommerceExample().catch(console.error);
```

## Task Management System

### Task Schema

```typescript
const taskTable: TableDefinition = {
  name: 'tasks',
  schema: {
    title: { type: 'string', required: true, size: 255 },
    description: { type: 'string', size: 1000 },
    assigneeId: { type: 'string' },
    creatorId: { type: 'string', required: true },
    status: {
      type: ['todo', 'in_progress', 'review', 'done'],
      enum: ['todo', 'in_progress', 'review', 'done'],
      default: 'todo'
    },
    priority: {
      type: ['low', 'medium', 'high', 'urgent'],
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    dueDate: { type: 'Date' },
    completedAt: { type: 'Date' },
    estimatedHours: { type: 'number', min: 0 },
    actualHours: { type: 'number', min: 0 },
    tags: { type: 'string', size: 500 },
    createdAt: { type: 'Date', default: new Date() },
    updatedAt: { type: 'Date', default: new Date() }
  }
};
```

### Task Service

```typescript
class TaskService {
  private static db: any;

  static async initialize() {
    const orm = new ServerORM({
      endpoint: process.env.APPWRITE_ENDPOINT!,
      projectId: process.env.APPWRITE_PROJECT_ID!,
      databaseId: process.env.APPWRITE_DATABASE_ID!,
      apiKey: process.env.APPWRITE_API_KEY!,
      autoMigrate: true
    });

    this.db = await orm.init([taskTable, userTable]); // Reuse userTable from earlier
  }

  static async createTask(taskData: {
    title: string;
    description?: string;
    creatorId: string;
    assigneeId?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    dueDate?: Date;
    estimatedHours?: number;
    tags?: string[];
  }) {
    return await this.db.tasks.create({
      ...taskData,
      tags: taskData.tags ? JSON.stringify(taskData.tags) : undefined
    });
  }

  static async assignTask(taskId: string, assigneeId: string) {
    return await this.db.tasks.update(taskId, {
      assigneeId,
      updatedAt: new Date()
    });
  }

  static async updateTaskStatus(taskId: string, status: 'todo' | 'in_progress' | 'review' | 'done') {
    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    if (status === 'done') {
      updateData.completedAt = new Date();
    }

    return await this.db.tasks.update(taskId, updateData);
  }

  static async getTasksByAssignee(assigneeId: string) {
    return await this.db.tasks.query(
      { assigneeId },
      { orderBy: ['-createdAt'] }
    );
  }

  static async getTasksByStatus(status: string) {
    return await this.db.tasks.query(
      { status },
      { orderBy: ['priority', '-createdAt'] }
    );
  }

  static async getOverdueTasks() {
    const now = new Date().toISOString();
    
    return await this.db.tasks.find([
      Query.lessThan('dueDate', now),
      Query.notEqual('status', 'done'),
      Query.orderAsc('dueDate')
    ]);
  }

  static async getTaskStats() {
    const [total, todo, inProgress, review, done, overdue] = await Promise.all([
      this.db.tasks.count(),
      this.db.tasks.count({ status: 'todo' }),
      this.db.tasks.count({ status: 'in_progress' }),
      this.db.tasks.count({ status: 'review' }),
      this.db.tasks.count({ status: 'done' }),
      this.getOverdueTasks().then((tasks: any[]) => tasks.length)
    ]);

    return {
      total,
      todo,
      inProgress,
      review,
      done,
      overdue
    };
  }
}

// Usage example
async function taskExample() {
  await TaskService.initialize();

  // Create users first
  const creator = await this.db.users.create({
    name: 'Project Manager',
    email: 'pm@example.com',
    role: 'admin'
  });

  const developer = await this.db.users.create({
    name: 'Developer',
    email: 'dev@example.com',
    role: 'user'
  });

  // Create tasks
  const task1 = await TaskService.createTask({
    title: 'Implement user authentication',
    description: 'Add login and registration functionality',
    creatorId: creator.$id,
    assigneeId: developer.$id,
    priority: 'high',
    estimatedHours: 8,
    tags: ['authentication', 'security']
  });

  const task2 = await TaskService.createTask({
    title: 'Write API documentation',
    description: 'Document all API endpoints',
    creatorId: creator.$id,
    priority: 'medium',
    estimatedHours: 4,
    tags: ['documentation', 'api']
  });

  // Update task status
  await TaskService.updateTaskStatus(task1.$id, 'in_progress');

  // Get tasks by assignee
  const developerTasks = await TaskService.getTasksByAssignee(developer.$id);
  console.log('Developer tasks:', developerTasks.length);

  // Get task statistics
  const stats = await TaskService.getTaskStats();
  console.log('Task stats:', stats);
}

taskExample().catch(console.error);
```

These examples demonstrate the core patterns and capabilities of the Appwrite ORM:

1. **Schema Definition**: Clear, type-safe schema definitions with constraints
2. **Service Layer**: Organized business logic with proper error handling
3. **CRUD Operations**: Create, read, update, and delete operations
4. **Query Patterns**: Filtering, sorting, pagination, and complex queries
5. **Relationships**: Managing related data across collections
6. **Real-world Scenarios**: Practical examples from different domains

Each example can be extended with additional features like validation, error handling, caching, and more sophisticated business logic as needed for your specific use case.