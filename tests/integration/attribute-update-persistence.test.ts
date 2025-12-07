import { ServerORM } from '../../src/server';
import { WebORM } from '../../src/web';
import * as dotenv from 'dotenv';

dotenv.config();

jest.setTimeout(120000);

interface TestUser {
  $id: string;
  username: string;
  email: string;
  score: number;
  isActive: boolean;
  bio?: string;
}

const hasRequiredEnvVars = !!(process.env.APPWRITE_ENDPOINT && 
  process.env.APPWRITE_PROJECT_ID && 
  process.env.APPWRITE_DATABASE_ID && 
  process.env.APPWRITE_API_KEY);

const describeIfEnv = hasRequiredEnvVars ? describe : describe.skip;

describe('Development Mode - Attribute Update Data Persistence', () => {
  let orm: WebORM;
  let db: any;
  const testPrefix = `dev_test_${Date.now()}_`;

  const initialUsersTable = {
    name: `${testPrefix}users`,
    schema: {
      username: { type: 'string' as const, required: true, size: 100 },
      email: { type: 'string' as const, required: true, size: 255 },
      score: { type: 'integer' as const, default: 0, min: 0, max: 1000 },
      isActive: { type: 'boolean' as const, default: false },
      bio: { type: 'string' as const, size: 1000 }
    }
  };

  beforeAll(() => {
    if (typeof document === 'undefined') {
      (global as any).document = {
        cookie: '',
      };
    }
  });

  afterAll(() => {
    if ((global as any).document) {
      delete (global as any).document;
    }
  });

  beforeEach(async () => {
    orm = new WebORM({
      endpoint: 'http://localhost',
      projectId: 'test',
      databaseId: 'test_dev',
      development: true
    });

    db = await orm.init([initialUsersTable]);
    
    if (db.clearAll) {
      db.clearAll();
    }
  });

  it('should preserve data when updating required field from false to true', async () => {
    const user1 = await db.table(initialUsersTable.name).create({
      username: 'john_doe',
      email: 'john@example.com',
      score: 100,
      isActive: false,
      bio: 'Original bio'
    });

    const user2 = await db.table(initialUsersTable.name).create({
      username: 'jane_smith',
      email: 'jane@example.com',
      score: 200,
      isActive: true,
      bio: 'Another bio'
    });

    const updatedUsersTable = {
      name: `${testPrefix}users`,
      schema: {
        username: { type: 'string' as const, required: true, size: 100 },
        email: { type: 'string' as const, required: true, size: 255 },
        score: { type: 'integer' as const, required: true, min: 0, max: 1000 },
        isActive: { type: 'boolean' as const, required: true },
        bio: { type: 'string' as const, size: 1000 }
      }
    };

    await orm.init([updatedUsersTable]);

    const retrievedUser1 = await db.table(initialUsersTable.name).get(user1.$id);
    const retrievedUser2 = await db.table(initialUsersTable.name).get(user2.$id);

    expect(retrievedUser1).toBeDefined();
    expect(retrievedUser1!.username).toBe('john_doe');
    expect(retrievedUser1!.email).toBe('john@example.com');
    expect(retrievedUser1!.score).toBe(100);
    expect(retrievedUser1!.isActive).toBe(false);
    expect(retrievedUser1!.bio).toBe('Original bio');

    expect(retrievedUser2).toBeDefined();
    expect(retrievedUser2!.username).toBe('jane_smith');
    expect(retrievedUser2!.email).toBe('jane@example.com');
    expect(retrievedUser2!.score).toBe(200);
    expect(retrievedUser2!.isActive).toBe(true);
    expect(retrievedUser2!.bio).toBe('Another bio');
  });

  it('should preserve data when changing default values', async () => {
    const user = await db.table(initialUsersTable.name).create({
      username: 'test_user',
      email: 'test@example.com',
      score: 500,
      isActive: false,
      bio: 'Test bio'
    });

    const updatedUsersTable = {
      name: `${testPrefix}users`,
      schema: {
        username: { type: 'string' as const, required: true, size: 100 },
        email: { type: 'string' as const, required: true, size: 255 },
        score: { type: 'integer' as const, default: 100, min: 0, max: 1000 },
        isActive: { type: 'boolean' as const, default: true },
        bio: { type: 'string' as const, size: 1000 }
      }
    };

    await orm.init([updatedUsersTable]);

    const retrieved = await db.table(initialUsersTable.name).get(user.$id);

    expect(retrieved).toBeDefined();
    expect(retrieved!.username).toBe('test_user');
    expect(retrieved!.score).toBe(500);
    expect(retrieved!.isActive).toBe(false);
    expect(retrieved!.bio).toBe('Test bio');
  });

  it('should preserve data when changing min/max constraints', async () => {
    const user = await db.table(initialUsersTable.name).create({
      username: 'high_scorer',
      email: 'high@example.com',
      score: 999,
      isActive: true
    });

    const updatedUsersTable = {
      name: `${testPrefix}users`,
      schema: {
        username: { type: 'string' as const, required: true, size: 100 },
        email: { type: 'string' as const, required: true, size: 255 },
        score: { type: 'integer' as const, default: 0, min: 0, max: 10000 },
        isActive: { type: 'boolean' as const, default: false },
        bio: { type: 'string' as const, size: 1000 }
      }
    };

    await orm.init([updatedUsersTable]);

    const retrieved = await db.table(initialUsersTable.name).get(user.$id);

    expect(retrieved).toBeDefined();
    expect(retrieved!.username).toBe('high_scorer');
    expect(retrieved!.score).toBe(999);
    expect(retrieved!.isActive).toBe(true);
  });

  it('should preserve all data across multiple updates', async () => {
    const users = await Promise.all([
      db.table(initialUsersTable.name).create({
        username: 'user1',
        email: 'user1@example.com',
        score: 10,
        isActive: false,
        bio: 'Bio 1'
      }),
      db.table(initialUsersTable.name).create({
        username: 'user2',
        email: 'user2@example.com',
        score: 20,
        isActive: true,
        bio: 'Bio 2'
      }),
      db.table(initialUsersTable.name).create({
        username: 'user3',
        email: 'user3@example.com',
        score: 30,
        isActive: false,
        bio: 'Bio 3'
      })
    ]);

    const update1 = {
      name: `${testPrefix}users`,
      schema: {
        username: { type: 'string' as const, required: true, size: 100 },
        email: { type: 'string' as const, required: true, size: 255 },
        score: { type: 'integer' as const, required: true, min: 0, max: 1000 },
        isActive: { type: 'boolean' as const, default: false },
        bio: { type: 'string' as const, size: 1000 }
      }
    };

    await orm.init([update1]);

    const update2 = {
      name: `${testPrefix}users`,
      schema: {
        username: { type: 'string' as const, required: true, size: 100 },
        email: { type: 'string' as const, required: true, size: 255 },
        score: { type: 'integer' as const, required: true, min: 0, max: 10000 },
        isActive: { type: 'boolean' as const, required: true },
        bio: { type: 'string' as const, size: 1000 }
      }
    };

    await orm.init([update2]);

    const allUsers = await db.table(initialUsersTable.name).all();

    expect(allUsers).toHaveLength(3);
    
    const retrievedUsers = users.map(u => 
      allUsers.find((au: any) => au.$id === u.$id)
    );

    retrievedUsers.forEach((retrieved, idx) => {
      expect(retrieved).toBeDefined();
      expect(retrieved!.username).toBe(users[idx].username);
      expect(retrieved!.email).toBe(users[idx].email);
      expect(retrieved!.score).toBe(users[idx].score);
      expect(retrieved!.isActive).toBe(users[idx].isActive);
      expect(retrieved!.bio).toBe(users[idx].bio);
    });
  });
});

describeIfEnv('Server Mode - Attribute Update Data Persistence', () => {
  let orm: ServerORM;
  let db: any;
  const testPrefix = `server_test_${Date.now()}_`;

  const initialUsersTable = {
    name: `${testPrefix}users`,
    schema: {
      username: { type: 'string' as const, required: true, size: 100 },
      email: { type: 'string' as const, required: true, size: 255 },
      score: { type: 'integer' as const, default: 0, min: 0, max: 1000 },
      isActive: { type: 'boolean' as const, default: false },
      bio: { type: 'string' as const, size: 1000 }
    },
    indexes: [
      {
        key: 'email_idx',
        type: 'unique' as const,
        attributes: ['email']
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

    db = await orm.init([initialUsersTable]);
  });

  afterAll(async () => {
    if (db && db.table) {
      try {
        const allUsers = await db.table(initialUsersTable.name).all();
        for (const user of allUsers) {
          await db.table(initialUsersTable.name).delete(user.$id);
        }
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    }
  });

  it('should preserve data when updating required field from false to true', async () => {
    const timestamp = Date.now();
    const user1 = await db.table(initialUsersTable.name).create({
      username: `john_doe_${timestamp}`,
      email: `john_${timestamp}@example.com`,
      score: 100,
      isActive: false,
      bio: 'Original bio'
    });

    const user2 = await db.table(initialUsersTable.name).create({
      username: `jane_smith_${timestamp}`,
      email: `jane_${timestamp}@example.com`,
      score: 200,
      isActive: true,
      bio: 'Another bio'
    });

    const updatedUsersTable = {
      name: `${testPrefix}users`,
      schema: {
        username: { type: 'string' as const, required: true, size: 100 },
        email: { type: 'string' as const, required: true, size: 255 },
        score: { type: 'integer' as const, required: true, min: 0, max: 1000 },
        isActive: { type: 'boolean' as const, required: true },
        bio: { type: 'string' as const, size: 1000 }
      },
      indexes: [
        {
          key: 'email_idx',
          type: 'unique' as const,
          attributes: ['email']
        }
      ]
    };

    const ormUpdated = new ServerORM({
      endpoint: process.env.APPWRITE_ENDPOINT!,
      projectId: process.env.APPWRITE_PROJECT_ID!,
      databaseId: process.env.APPWRITE_DATABASE_ID!,
      apiKey: process.env.APPWRITE_API_KEY!,
      autoMigrate: true
    });

    const dbUpdated = await ormUpdated.init([updatedUsersTable]);

    await new Promise(resolve => setTimeout(resolve, 2000));

    const retrievedUser1 = await dbUpdated.table(initialUsersTable.name).get(user1.$id);
    const retrievedUser2 = await dbUpdated.table(initialUsersTable.name).get(user2.$id);

    expect(retrievedUser1).toBeDefined();
    expect(retrievedUser1!.username).toBe(`john_doe_${timestamp}`);
    expect(retrievedUser1!.email).toBe(`john_${timestamp}@example.com`);
    expect(retrievedUser1!.score).toBe(100);
    expect(retrievedUser1!.isActive).toBe(false);
    expect(retrievedUser1!.bio).toBe('Original bio');

    expect(retrievedUser2).toBeDefined();
    expect(retrievedUser2!.username).toBe(`jane_smith_${timestamp}`);
    expect(retrievedUser2!.email).toBe(`jane_${timestamp}@example.com`);
    expect(retrievedUser2!.score).toBe(200);
    expect(retrievedUser2!.isActive).toBe(true);
    expect(retrievedUser2!.bio).toBe('Another bio');

    await dbUpdated.table(initialUsersTable.name).delete(user1.$id);
    await dbUpdated.table(initialUsersTable.name).delete(user2.$id);
  });

  it('should preserve data when changing default values', async () => {
    const timestamp = Date.now();
    const user = await db.table(initialUsersTable.name).create({
      username: `test_user_${timestamp}`,
      email: `test_${timestamp}@example.com`,
      score: 500,
      isActive: false,
      bio: 'Test bio'
    });

    const updatedUsersTable = {
      name: `${testPrefix}users`,
      schema: {
        username: { type: 'string' as const, required: true, size: 100 },
        email: { type: 'string' as const, required: true, size: 255 },
        score: { type: 'integer' as const, default: 100, min: 0, max: 1000 },
        isActive: { type: 'boolean' as const, default: true },
        bio: { type: 'string' as const, size: 1000 }
      },
      indexes: [
        {
          key: 'email_idx',
          type: 'unique' as const,
          attributes: ['email']
        }
      ]
    };

    const ormUpdated = new ServerORM({
      endpoint: process.env.APPWRITE_ENDPOINT!,
      projectId: process.env.APPWRITE_PROJECT_ID!,
      databaseId: process.env.APPWRITE_DATABASE_ID!,
      apiKey: process.env.APPWRITE_API_KEY!,
      autoMigrate: true
    });

    const dbUpdated = await ormUpdated.init([updatedUsersTable]);

    await new Promise(resolve => setTimeout(resolve, 2000));

    const retrieved = await dbUpdated.table(initialUsersTable.name).get(user.$id);

    expect(retrieved).toBeDefined();
    expect(retrieved!.username).toBe(`test_user_${timestamp}`);
    expect(retrieved!.score).toBe(500);
    expect(retrieved!.isActive).toBe(false);
    expect(retrieved!.bio).toBe('Test bio');

    await dbUpdated.table(initialUsersTable.name).delete(user.$id);
  });

  it('should preserve data when changing min/max constraints', async () => {
    const timestamp = Date.now();
    const user = await db.table(initialUsersTable.name).create({
      username: `high_scorer_${timestamp}`,
      email: `high_${timestamp}@example.com`,
      score: 999,
      isActive: true
    });

    const updatedUsersTable = {
      name: `${testPrefix}users`,
      schema: {
        username: { type: 'string' as const, required: true, size: 100 },
        email: { type: 'string' as const, required: true, size: 255 },
        score: { type: 'integer' as const, default: 0, min: 0, max: 10000 },
        isActive: { type: 'boolean' as const, default: false },
        bio: { type: 'string' as const, size: 1000 }
      },
      indexes: [
        {
          key: 'email_idx',
          type: 'unique' as const,
          attributes: ['email']
        }
      ]
    };

    const ormUpdated = new ServerORM({
      endpoint: process.env.APPWRITE_ENDPOINT!,
      projectId: process.env.APPWRITE_PROJECT_ID!,
      databaseId: process.env.APPWRITE_DATABASE_ID!,
      apiKey: process.env.APPWRITE_API_KEY!,
      autoMigrate: true
    });

    const dbUpdated = await ormUpdated.init([updatedUsersTable]);

    await new Promise(resolve => setTimeout(resolve, 2000));

    const retrieved = await dbUpdated.table(initialUsersTable.name).get(user.$id);

    expect(retrieved).toBeDefined();
    expect(retrieved!.username).toBe(`high_scorer_${timestamp}`);
    expect(retrieved!.score).toBe(999);
    expect(retrieved!.isActive).toBe(true);

    await dbUpdated.table(initialUsersTable.name).delete(user.$id);
  });

  it('should preserve all data across multiple updates', async () => {
    const timestamp = Date.now();
    const users = await Promise.all([
      db.table(initialUsersTable.name).create({
        username: `user1_${timestamp}`,
        email: `user1_${timestamp}@example.com`,
        score: 10,
        isActive: false,
        bio: 'Bio 1'
      }),
      db.table(initialUsersTable.name).create({
        username: `user2_${timestamp}`,
        email: `user2_${timestamp}@example.com`,
        score: 20,
        isActive: true,
        bio: 'Bio 2'
      }),
      db.table(initialUsersTable.name).create({
        username: `user3_${timestamp}`,
        email: `user3_${timestamp}@example.com`,
        score: 30,
        isActive: false,
        bio: 'Bio 3'
      })
    ]);

    const update1 = {
      name: `${testPrefix}users`,
      schema: {
        username: { type: 'string' as const, required: true, size: 100 },
        email: { type: 'string' as const, required: true, size: 255 },
        score: { type: 'integer' as const, required: true, min: 0, max: 1000 },
        isActive: { type: 'boolean' as const, default: false },
        bio: { type: 'string' as const, size: 1000 }
      },
      indexes: [
        {
          key: 'email_idx',
          type: 'unique' as const,
          attributes: ['email']
        }
      ]
    };

    const orm1 = new ServerORM({
      endpoint: process.env.APPWRITE_ENDPOINT!,
      projectId: process.env.APPWRITE_PROJECT_ID!,
      databaseId: process.env.APPWRITE_DATABASE_ID!,
      apiKey: process.env.APPWRITE_API_KEY!,
      autoMigrate: true
    });

    const db1 = await orm1.init([update1]);

    await new Promise(resolve => setTimeout(resolve, 2000));

    const update2 = {
      name: `${testPrefix}users`,
      schema: {
        username: { type: 'string' as const, required: true, size: 100 },
        email: { type: 'string' as const, required: true, size: 255 },
        score: { type: 'integer' as const, required: true, min: 0, max: 10000 },
        isActive: { type: 'boolean' as const, required: true },
        bio: { type: 'string' as const, size: 1000 }
      },
      indexes: [
        {
          key: 'email_idx',
          type: 'unique' as const,
          attributes: ['email']
        }
      ]
    };

    const orm2 = new ServerORM({
      endpoint: process.env.APPWRITE_ENDPOINT!,
      projectId: process.env.APPWRITE_PROJECT_ID!,
      databaseId: process.env.APPWRITE_DATABASE_ID!,
      apiKey: process.env.APPWRITE_API_KEY!,
      autoMigrate: true
    });

    const db2 = await orm2.init([update2]);

    await new Promise(resolve => setTimeout(resolve, 2000));

    const allUsers = await db2.table(initialUsersTable.name).all();

    const retrievedUsers = users.map(u => 
      allUsers.find((au: any) => au.$id === u.$id)
    );

    retrievedUsers.forEach((retrieved, idx) => {
      expect(retrieved).toBeDefined();
      expect(retrieved!.username).toBe(users[idx].username);
      expect(retrieved!.email).toBe(users[idx].email);
      expect(retrieved!.score).toBe(users[idx].score);
      expect(retrieved!.isActive).toBe(users[idx].isActive);
      expect(retrieved!.bio).toBe(users[idx].bio);
    });

    for (const user of users) {
      await db2.table(initialUsersTable.name).delete(user.$id);
    }
  });

  it('should throw error when attempting to change immutable properties', async () => {
    const immutableChangeTable = {
      name: `${testPrefix}users`,
      schema: {
        username: { type: 'string' as const, required: true, size: 200 },
        email: { type: 'string' as const, required: true, size: 255 },
        score: { type: 'integer' as const, default: 0, min: 0, max: 1000 },
        isActive: { type: 'boolean' as const, default: false },
        bio: { type: 'string' as const, size: 1000 }
      },
      indexes: [
        {
          key: 'email_idx',
          type: 'unique' as const,
          attributes: ['email']
        }
      ]
    };

    const ormImmutable = new ServerORM({
      endpoint: process.env.APPWRITE_ENDPOINT!,
      projectId: process.env.APPWRITE_PROJECT_ID!,
      databaseId: process.env.APPWRITE_DATABASE_ID!,
      apiKey: process.env.APPWRITE_API_KEY!,
      autoMigrate: true
    });

    await expect(ormImmutable.init([immutableChangeTable]))
      .rejects.toThrow(/Immutable properties.*would destroy existing data/);
  });
});
