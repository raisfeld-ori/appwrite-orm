import { ServerORM } from '../../src/server';
import { Query } from 'node-appwrite';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Increase default Jest timeout for slow integration tests
jest.setTimeout(120000);

// Interface definitions for type-safe responses
interface User {
  $id: string;
  name: string;
  email: string;
  age: number;
  isActive: boolean;
  createdAt?: string;
}

interface Post {
  $id: string;
  title: string;
  content: string;
  userId: string;
  views: number;
  published: boolean;
}

interface Comment {
  $id: string;
  postId: string;
  userId: string;
  text: string;
  createdAt: string;
}

const hasRequiredEnvVars = !!(process.env.APPWRITE_ENDPOINT && 
  process.env.APPWRITE_PROJECT_ID && 
  process.env.APPWRITE_DATABASE_ID && 
  process.env.APPWRITE_API_KEY);

const describeIfEnv = hasRequiredEnvVars ? describe : describe.skip;

describeIfEnv('Server ORM Full-Flow Integration Tests', () => {
  let orm: ServerORM;
  let db: any;
  const testPrefix = `test_${Date.now()}_`;
  
  const usersTable = {
    name: `${testPrefix}users`,
    schema: {
      name: { type: 'string' as const, required: true, size: 255 },
      email: { type: 'string' as const, required: true, size: 255 },
      age: { type: 'integer' as const, min: 0, max: 150 },
      isActive: { type: 'boolean' as const, default: true },
      createdAt: { type: 'datetime' as const }
    },
    indexes: [
      {
        key: 'email_idx',
        type: 'unique' as const,
        attributes: ['email']
      },
      {
        key: 'age_idx',
        type: 'key' as const,
        attributes: ['age'],
        orders: ['ASC' as const]
      }
    ]
  };

  const postsTable = {
    name: `${testPrefix}posts`,
    schema: {
      title: { type: 'string' as const, required: true, size: 500 },
      content: { type: 'string' as const, required: true, size: 10000 },
      userId: { type: 'string' as const, required: true, size: 255 },
      views: { type: 'integer' as const, default: 0, min: 0 },
      published: { type: 'boolean' as const, default: false }
    },
    indexes: [
      {
        key: 'userId_idx',
        type: 'key' as const,
        attributes: ['userId']
      }
    ]
  };

  const commentsTable = {
    name: `${testPrefix}comments`,
    schema: {
      postId: { type: 'string' as const, required: true, size: 255 },
      userId: { type: 'string' as const, required: true, size: 255 },
      text: { type: 'string' as const, required: true, size: 5000 },
      createdAt: { type: 'datetime' as const, required: true }
    },
    indexes: [
      {
        key: 'postId_idx',
        type: 'key' as const,
        attributes: ['postId']
      }
    ]
  };

  beforeAll(async () => {
    orm = new ServerORM({
      endpoint: process.env.APPWRITE_ENDPOINT!,
      projectId: process.env.APPWRITE_PROJECT_ID!,
      databaseId: process.env.APPWRITE_DATABASE_ID!,
      apiKey: process.env.APPWRITE_API_KEY!,
      autoMigrate: true
    });

    db = await orm.init([usersTable, postsTable, commentsTable]);
  }, 30000);

  afterAll(async () => {
    // Cleanup: Delete test collections
    try {
      await db.table(usersTable.name).deleteCollection();
      await db.table(postsTable.name).deleteCollection();
      await db.table(commentsTable.name).deleteCollection();
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }, 30000);

  describe('CRUD Operations', () => {
    let userId: string;
    let postId: string;

    it('should create a user document', async () => {
      const user = await db.table(usersTable.name).create({
        name: 'John Doe',
        email: `john.doe.${Date.now()}@example.com`,
        age: 30,
        isActive: true,
        createdAt: new Date().toISOString()
      });

      expect(user).toBeDefined();
      expect(user.$id).toBeDefined();
      expect(user.name).toBe('John Doe');
      expect(user.age).toBe(30);
      
      userId = user.$id;
    });

    it('should read a user document by ID', async () => {
      const user = await db.table(usersTable.name).get(userId);

      expect(user).toBeDefined();
      expect(user!.$id).toBe(userId);
      expect(user!.name).toBe('John Doe');
    });

    it('should update a user document', async () => {
      const updatedUser = await db.table(usersTable.name).update(userId, {
        age: 31,
        isActive: false
      });

      expect(updatedUser.age).toBe(31);
      expect(updatedUser.isActive).toBe(false);
    });

    it('should query users with filters', async () => {
      const users = await db.table(usersTable.name).query({ isActive: false });

      expect(users).toBeDefined();
      expect(users.length).toBeGreaterThan(0);
      expect(users[0].isActive).toBe(false);
    });

    it('should create a post linked to user', async () => {
      const post = await db.table(postsTable.name).create({
        title: 'My First Post',
        content: 'This is the content of my first post.',
        userId: userId,
        views: 0,
        published: true
      });

      expect(post).toBeDefined();
      expect(post.$id).toBeDefined();
      expect(post.userId).toBe(userId);
      
      postId = post.$id;
    });

    it('should create a comment linked to post and user', async () => {
      const comment = await db.table(commentsTable.name).create({
        postId: postId,
        userId: userId,
        text: 'Great post!',
        createdAt: new Date().toISOString()
      });

      expect(comment).toBeDefined();
      expect(comment.$id).toBeDefined();
      expect(comment.postId).toBe(postId);
      expect(comment.userId).toBe(userId);
    });

    it('should use advanced queries with Query builder', async () => {
      const adultUsers = await db.table(usersTable.name).find([
        Query.greaterThanEqual('age', 18),
        Query.orderDesc('age'),
        Query.limit(10)
      ]);

      expect(adultUsers).toBeDefined();
      expect(Array.isArray(adultUsers)).toBe(true);
    });

    it('should count documents', async () => {
      const count = await db.table(usersTable.name).count();
      expect(count).toBeGreaterThan(0);
    });

    it('should delete a user document', async () => {
      // Create a temporary user to delete
      const tempUser = await db.table(usersTable.name).create({
        name: 'Temp User',
        email: `temp.${Date.now()}@example.com`,
        age: 25,
        isActive: true
      });

      await db.table(usersTable.name).delete(tempUser.$id);

      const deletedUser = await db.table(usersTable.name).get(tempUser.$id);
      expect(deletedUser).toBeNull();
    });
  });

  describe('Index Operations', () => {
    it('should list indexes for a collection', async () => {
      const indexes = await db.table(usersTable.name).listIndexes();

      expect(indexes).toBeDefined();
      expect(Array.isArray(indexes)).toBe(true);
      expect(indexes.length).toBeGreaterThan(0);
      
      const emailIndex = indexes.find((idx: any) => idx.key === 'email_idx');
      expect(emailIndex).toBeDefined();
      expect(emailIndex.type).toBe('unique');
    });

    it('should create a new index dynamically', async () => {
      await db.table(usersTable.name).createIndex({
        key: 'name_idx',
        type: 'key' as const,
        attributes: ['name']
      });

      const indexes = await db.table(usersTable.name).listIndexes();
      const nameIndex = indexes.find((idx: any) => idx.key === 'name_idx');
      expect(nameIndex).toBeDefined();
    });
  });

  describe('Join Operations', () => {
    let user1Id: string;
    let user2Id: string;
    let post1Id: string;
    let post2Id: string;

    beforeAll(async () => {
      // Create test data for joins
      const user1 = await db.table(usersTable.name).create({
        name: 'Alice',
        email: `alice.${Date.now()}@example.com`,
        age: 28,
        isActive: true
      });
      user1Id = user1.$id;

      const user2 = await db.table(usersTable.name).create({
        name: 'Bob',
        email: `bob.${Date.now()}@example.com`,
        age: 32,
        isActive: true
      });
      user2Id = user2.$id;

      const post1 = await db.table(postsTable.name).create({
        title: 'Alice Post',
        content: 'Content by Alice',
        userId: user1Id,
        views: 10,
        published: true
      });
      post1Id = post1.$id;

      const post2 = await db.table(postsTable.name).create({
        title: 'Bob Post',
        content: 'Content by Bob',
        userId: user2Id,
        views: 20,
        published: true
      });
      post2Id = post2.$id;

      await db.table(commentsTable.name).create({
        postId: post1Id,
        userId: user2Id,
        text: 'Nice post, Alice!',
        createdAt: new Date().toISOString()
      });
    });

    it('should perform a left join between users and posts', async () => {
      const results = await db.leftJoin(
        usersTable.name,
        postsTable.name,
        { foreignKey: '$id', referenceKey: 'userId', as: 'posts' }
      );

      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
      
      const userWithPosts = results.find((r: any) => r.$id === user1Id);
      expect(userWithPosts).toBeDefined();
      expect(userWithPosts.posts).toBeDefined();
    });

    it('should perform an inner join between posts and comments', async () => {
      const results = await db.innerJoin(
        postsTable.name,
        commentsTable.name,
        { foreignKey: '$id', referenceKey: 'postId', as: 'comments' }
      );

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      
      // All results should have comments
      results.forEach((result: any) => {
        expect(result.comments).not.toBeNull();
      });
    });

    it('should join with filters', async () => {
      const results = await db.join(
        usersTable.name,
        postsTable.name,
        { foreignKey: '$id', referenceKey: 'userId', as: 'posts' },
        { name: 'Alice' }
      );

      expect(results).toBeDefined();
      expect(results.length).toBe(1);
      expect(results[0].name).toBe('Alice');
    });
  });

  describe('Bulk Operations', () => {
    it('should bulk create multiple users', async () => {
      const users = await db.table(usersTable.name).bulkCreate([
        {
          name: 'User 1',
          email: `user1.${Date.now()}@example.com`,
          age: 25,
          isActive: true
        },
        {
          name: 'User 2',
          email: `user2.${Date.now()}@example.com`,
          age: 26,
          isActive: true
        },
        {
          name: 'User 3',
          email: `user3.${Date.now()}@example.com`,
          age: 27,
          isActive: false
        }
      ]);

      expect(users).toBeDefined();
      expect(users.length).toBe(3);
    });

    it('should bulk update multiple users', async () => {
      const allUsers = await db.table(usersTable.name).all({ limit: 3 });
      const updates = allUsers.map((user: any) => ({
        id: user.$id,
        data: { isActive: true }
      }));

      const results = await db.table(usersTable.name).bulkUpdate(updates);

      expect(results).toBeDefined();
      expect(results.length).toBe(updates.length);
      results.forEach((user: any) => {
        expect(user.isActive).toBe(true);
      });
    });
  });

  describe('Validation', () => {
    it('should validate required fields', async () => {
      await expect(
        db.table(usersTable.name).create({
          age: 25
          // missing required 'name' and 'email'
        })
      ).rejects.toThrow();
    });

    it('should validate field constraints (min/max)', async () => {
      await expect(
        db.table(usersTable.name).create({
          name: 'Test User',
          email: `test.${Date.now()}@example.com`,
          age: 200 // exceeds max of 150
        })
      ).rejects.toThrow();
    });
  });

  describe('Pagination and Ordering', () => {
    it('should paginate results', async () => {
      const page1 = await db.table(usersTable.name).all({ limit: 2, offset: 0 });
      const page2 = await db.table(usersTable.name).all({ limit: 2, offset: 2 });

      expect(page1.length).toBeLessThanOrEqual(2);
      expect(page2.length).toBeLessThanOrEqual(2);
      
      if (page1.length > 0 && page2.length > 0) {
        expect(page1[0].$id).not.toBe(page2[0].$id);
      }
    });

    it('should order results', async () => {
      const usersAsc = await db.table(usersTable.name).all({ 
        orderBy: ['age'],
        limit: 10
      });

      const usersDesc = await db.table(usersTable.name).all({ 
        orderBy: ['-age'],
        limit: 10
      });

      expect(usersAsc).toBeDefined();
      expect(usersDesc).toBeDefined();
      
      if (usersAsc.length > 1) {
        expect(usersAsc[0].age).toBeLessThanOrEqual(usersAsc[1].age);
      }
      
      if (usersDesc.length > 1) {
        expect(usersDesc[0].age).toBeGreaterThanOrEqual(usersDesc[1].age);
      }
    });
  });
});
