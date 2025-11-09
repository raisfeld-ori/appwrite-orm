import { WebORM, ServerORM } from '../src';

describe('Environment Variables Support', () => {
  it('should load environment variables from .env.test', () => {
    // These values should be loaded from .env.test by our setup
    expect(process.env.APPWRITE_ENDPOINT).toBe('https://test.appwrite.io/v1');
    expect(process.env.APPWRITE_PROJECT_ID).toBe('test-project-id');
    expect(process.env.APPWRITE_DATABASE_ID).toBe('test-database-id');
    expect(process.env.APPWRITE_API_KEY).toBe('test-api-key-for-server');
  });

  it('should use environment variables in ORM configuration', () => {
    const webOrm = new WebORM({
      endpoint: process.env.APPWRITE_ENDPOINT!,
      projectId: process.env.APPWRITE_PROJECT_ID!,
      databaseId: process.env.APPWRITE_DATABASE_ID!
    });

    expect(webOrm).toBeDefined();
  });

  it('should use environment variables in ServerORM configuration', () => {
    const serverOrm = new ServerORM({
      endpoint: process.env.APPWRITE_ENDPOINT!,
      projectId: process.env.APPWRITE_PROJECT_ID!,
      databaseId: process.env.APPWRITE_DATABASE_ID!,
      apiKey: process.env.APPWRITE_API_KEY!,
      autoMigrate: false
    });

    expect(serverOrm).toBeDefined();
  });
});