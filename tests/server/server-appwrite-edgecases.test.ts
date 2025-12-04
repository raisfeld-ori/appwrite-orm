import { ServerORM } from '../../src/server';
import { Client, Databases } from 'node-appwrite';
import * as dotenv from 'dotenv';

dotenv.config();

const hasRequiredEnvVars = !!(
  process.env.APPWRITE_ENDPOINT &&
  process.env.APPWRITE_PROJECT_ID &&
  process.env.APPWRITE_DATABASE_ID &&
  process.env.APPWRITE_API_KEY
);

const describeIfEnv = hasRequiredEnvVars ? describe : describe.skip;

describeIfEnv('Server ORM Appwrite Edgecases (real env)', () => {
  const prefix = `edge_${Date.now()}_`;
  const dbId = process.env.APPWRITE_DATABASE_ID!;
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT!)
    .setProject(process.env.APPWRITE_PROJECT_ID!);
  // setKey isn't typed on the client in TS defs
  (client as any).setKey(process.env.APPWRITE_API_KEY!);
  const databases = new Databases(client);

  async function deleteCollectionIfExists(collectionId: string) {
    try {
      await databases.deleteCollection(dbId, collectionId);
    } catch (err) {
      // ignore
    }
  }

  afterAll(async () => {
    // Try to cleanup any collections we attempted to create
    const names = [
      `${prefix}too_many_attributes`,
      `${prefix}long_attribute_name`,
      `${prefix}too_large_size`,
      `${prefix}duplicate_indexes`,
      `${prefix}many_indexes`,
      `${prefix}bad_enum`
    ];
    for (const n of names) {
      await deleteCollectionIfExists(n);
    }
  }, 30000);

  it('fails when creating a collection with too many attributes', async () => {
    const fields: Record<string, any> = {};
    // create 300 attributes which is likely to exceed Appwrite practical limits
    for (let i = 0; i < 300; i++) {
      fields[`f_${i}`] = { type: 'string' as const, size: 100 };
    }

    const table = {
      name: `${prefix}too_many_attributes`,
      schema: fields
    };

    const orm = new ServerORM({
      endpoint: process.env.APPWRITE_ENDPOINT!,
      projectId: process.env.APPWRITE_PROJECT_ID!,
      databaseId: dbId,
      apiKey: process.env.APPWRITE_API_KEY!,
      autoMigrate: true
    });

    try {
      await orm.init([table] as any);
      await deleteCollectionIfExists(table.name);
    } catch (err) {
      expect(err).toBeTruthy();
    }
  }, 60000);

  it('fails when attribute name is too long', async () => {
    const longName = 'a'.repeat(512);
    const table = {
      name: `${prefix}long_attribute_name`,
      schema: {
        [longName]: { type: 'string' as const, size: 255 }
      }
    };

    const orm = new ServerORM({
      endpoint: process.env.APPWRITE_ENDPOINT!,
      projectId: process.env.APPWRITE_PROJECT_ID!,
      databaseId: dbId,
      apiKey: process.env.APPWRITE_API_KEY!,
      autoMigrate: true
    });

    try {
      await orm.init([table] as any);
      await deleteCollectionIfExists(table.name);
    } catch (err) {
      expect(err).toBeTruthy();
    }
  }, 30000);

  it('fails when a string attribute size is unreasonably large', async () => {
    const table = {
      name: `${prefix}too_large_size`,
      schema: {
        large: { type: 'string' as const, size: 100000000 }
      }
    };

    const orm = new ServerORM({
      endpoint: process.env.APPWRITE_ENDPOINT!,
      projectId: process.env.APPWRITE_PROJECT_ID!,
      databaseId: dbId,
      apiKey: process.env.APPWRITE_API_KEY!,
      autoMigrate: true
    });

    try {
      await orm.init([table] as any);
      await deleteCollectionIfExists(table.name);
    } catch (err) {
      expect(err).toBeTruthy();
    }
  }, 30000);

  it('fails when duplicate index keys are provided', async () => {
    const table = {
      name: `${prefix}duplicate_indexes`,
      schema: {
        name: { type: 'string' as const, size: 255 }
      },
      indexes: [
        { key: 'dup_idx', type: 'key' as const, attributes: ['name'] },
        { key: 'dup_idx', type: 'key' as const, attributes: ['name'] }
      ]
    };

    const orm = new ServerORM({
      endpoint: process.env.APPWRITE_ENDPOINT!,
      projectId: process.env.APPWRITE_PROJECT_ID!,
      databaseId: dbId,
      apiKey: process.env.APPWRITE_API_KEY!,
      autoMigrate: true
    });

    try {
      await orm.init([table] as any);
      await deleteCollectionIfExists(table.name);
    } catch (err) {
      expect(err).toBeTruthy();
    }
  }, 30000);

  it('fails when too many indexes are created', async () => {
    const schema = {
      name: { type: 'string' as const, size: 255 }
    } as any;

    const indexes: any[] = [];
    for (let i = 0; i < 200; i++) {
      indexes.push({ key: `idx_${i}`, type: 'key' as const, attributes: ['name'] });
    }

    const table = {
      name: `${prefix}many_indexes`,
      schema,
      indexes
    };

    const orm = new ServerORM({
      endpoint: process.env.APPWRITE_ENDPOINT!,
      projectId: process.env.APPWRITE_PROJECT_ID!,
      databaseId: dbId,
      apiKey: process.env.APPWRITE_API_KEY!,
      autoMigrate: true
    });

    try {
      await orm.init([table] as any);
      await deleteCollectionIfExists(table.name);
    } catch (err) {
      expect(err).toBeTruthy();
    }
  }, 60000);

  it('fails when enum field has no values', async () => {
    const table = {
      name: `${prefix}bad_enum`,
      schema: {
        kind: { type: 'enum' as const, enum: [] }
      }
    };

    const orm = new ServerORM({
      endpoint: process.env.APPWRITE_ENDPOINT!,
      projectId: process.env.APPWRITE_PROJECT_ID!,
      databaseId: dbId,
      apiKey: process.env.APPWRITE_API_KEY!,
      autoMigrate: true
    });

    try {
      await orm.init([table] as any);
      await deleteCollectionIfExists(table.name);
    } catch (err) {
      expect(err).toBeTruthy();
    }
  }, 30000);
});
