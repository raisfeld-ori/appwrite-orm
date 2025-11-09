# Migration Examples

Learn how to manage database schema changes and migrations effectively with the Appwrite ORM's migration system.

## Basic Migration Scenarios

### Adding New Fields to Existing Schema

```typescript
import { ServerORM, TableDefinition, Migration } from 'appwrite-orm/server';

// Original user schema (Version 1)
const userTableV1: TableDefinition = {
  name: 'users',
  schema: {
    name: { type: 'string', required: true },
    email: { type: 'string', required: true }
  }
};

// Updated user schema (Version 2) - Adding new fields
const userTableV2: TableDefinition = {
  name: 'users',
  schema: {
    name: { type: 'string', required: true },
    email: { type: 'string', required: true },
    // New optional fields
    phone: { type: 'string', size: 20 },
    birthDate: { type: 'Date' },
    isVerified: { type: 'boolean', default: false },
    preferences: { type: 'string' }, // JSON string for user preferences
    createdAt: { type: 'Date', default: new Date() }
  }
};

class UserMigrationService {
  private static orm: ServerORM;
  private static db: any;

  static async initialize() {
    this.orm = new ServerORM({
      endpoint: process.env.APPWRITE_ENDPOINT!,
      projectId: process.env.APPWRITE_PROJECT_ID!,
      databaseId: process.env.APPWRITE_DATABASE_ID!,
      apiKey: process.env.APPWRITE_API_KEY!,
      autoMigrate: false // Manual migration control
    });
  }

  // Migration from V1 to V2
  static async migrateToV2() {
    console.log('Starting migration from V1 to V2...');

    try {
      // Initialize with new schema
      this.db = await this.orm.init([userTableV2]);
      
      console.log('✓ Schema updated successfully');
      
      // Migrate existing data
      await this.migrateExistingUserData();
      
      console.log('✓ Migration completed successfully');
    } catch (error) {
      console.error('✗ Migration failed:', error);
      throw error;
    }
  }

  private static async migrateExistingUserData() {
    console.log('Migrating existing user data...');
    
    const batchSize = 50;
    let offset = 0;
    let migratedCount = 0;

    while (true) {
      // Get users in batches
      const users = await this.db.users.all({
        limit: batchSize,
        offset,
        orderBy: ['$id']
      });

      if (users.length === 0) {
        break;
      }

      // Update users with default values for new fields
      const updatePromises = users.map(async (user: any) => {
        // Only update if new fields are missing
        if (!user.hasOwnProperty('isVerified')) {
          await this.db.users.update(user.$id, {
            isVerified: false,
            preferences: JSON.stringify({
              theme: 'light',
              notifications: true,
              language: 'en'
            }),
            createdAt: new Date() // Set to current date for existing users
          });
          return true;
        }
        return false;
      });

      const results = await Promise.all(updatePromises);
      const updatedInBatch = results.filter(Boolean).length;
      migratedCount += updatedInBatch;

      console.log(`Processed batch: ${updatedInBatch}/${users.length} users updated`);
      
      offset += batchSize;
    }

    console.log(`✓ Migrated ${migratedCount} users`);
  }
}

// Usage
async function runUserMigration() {
  await UserMigrationService.initialize();
  await UserMigrationService.migrateToV2();
}
```

### Schema Evolution with Breaking Changes

```typescript
// When you need to handle breaking changes (like changing field types)
// Since Appwrite doesn't allow type changes, we create new fields

// Original product schema
const productTableV1: TableDefinition = {
  name: 'products',
  schema: {
    name: { type: 'string', required: true },
    price: { type: 'string', required: true }, // Originally stored as string
    category: { type: 'string', required: true }
  }
};

// Updated schema with proper types
const productTableV2: TableDefinition = {
  name: 'products',
  schema: {
    name: { type: 'string', required: true },
    price: { type: 'string', required: true }, // Keep old field for compatibility
    priceNumber: { type: 'number', required: true, min: 0 }, // New field with correct type
    category: { type: 'string', required: true },
    // New fields
    description: { type: 'string', size: 2000 },
    inStock: { type: 'boolean', default: true },
    tags: { type: 'string' } // JSON array of tags
  }
};

class ProductMigrationService {
  private static db: any;

  static async migrateProductSchema() {
    console.log('Starting product schema migration...');

    const orm = new ServerORM({
      endpoint: process.env.APPWRITE_ENDPOINT!,
      projectId: process.env.APPWRITE_PROJECT_ID!,
      databaseId: process.env.APPWRITE_DATABASE_ID!,
      apiKey: process.env.APPWRITE_API_KEY!,
      autoMigrate: false
    });

    this.db = await orm.init([productTableV2]);

    // Migrate data from string price to number price
    await this.migrateProductPrices();
    
    console.log('✓ Product migration completed');
  }

  private static async migrateProductPrices() {
    console.log('Converting price strings to numbers...');
    
    const products = await this.db.products.all();
    let successCount = 0;
    let errorCount = 0;

    for (const product of products) {
      try {
        // Convert string price to number
        const priceNumber = parseFloat(product.price.replace(/[^0-9.-]+/g, ''));
        
        if (!isNaN(priceNumber)) {
          await this.db.products.update(product.$id, {
            priceNumber,
            description: product.description || '',
            inStock: true, // Default value
            tags: JSON.stringify([]) // Empty tags array
          });
          successCount++;
        } else {
          console.warn(`Invalid price for product ${product.$id}: ${product.price}`);
          errorCount++;
        }
      } catch (error) {
        console.error(`Error migrating product ${product.$id}:`, error);
        errorCount++;
      }
    }

    console.log(`✓ Migrated ${successCount} products, ${errorCount} errors`);
  }
}
```

## Complex Migration Scenarios

### Multi-Table Schema Changes

```typescript
// Blog system migration: Adding relationships and new features

// Original schemas
const authorTableV1: TableDefinition = {
  name: 'authors',
  schema: {
    name: { type: 'string', required: true },
    email: { type: 'string', required: true }
  }
};

const postTableV1: TableDefinition = {
  name: 'posts',
  schema: {
    title: { type: 'string', required: true },
    content: { type: 'string', required: true },
    authorEmail: { type: 'string', required: true } // Using email as reference
  }
};

// Updated schemas with proper relationships
const authorTableV2: TableDefinition = {
  name: 'authors',
  schema: {
    name: { type: 'string', required: true },
    email: { type: 'string', required: true },
    bio: { type: 'string', size: 1000 },
    avatar: { type: 'string' },
    socialLinks: { type: 'string' }, // JSON object
    isActive: { type: 'boolean', default: true },
    createdAt: { type: 'Date', default: new Date() }
  }
};

const postTableV2: TableDefinition = {
  name: 'posts',
  schema: {
    title: { type: 'string', required: true },
    content: { type: 'string', required: true },
    authorEmail: { type: 'string', required: true }, // Keep for migration
    authorId: { type: 'string', required: true }, // New proper reference
    slug: { type: 'string', required: true },
    status: {
      type: ['draft', 'published', 'archived'],
      enum: ['draft', 'published', 'archived'],
      default: 'draft'
    },
    publishedAt: { type: 'Date' },
    tags: { type: 'string' }, // JSON array
    viewCount: { type: 'number', default: 0, min: 0 },
    createdAt: { type: 'Date', default: new Date() }
  }
};

// New table for comments
const commentTableV2: TableDefinition = {
  name: 'comments',
  schema: {
    postId: { type: 'string', required: true },
    authorName: { type: 'string', required: true },
    authorEmail: { type: 'string', required: true },
    content: { type: 'string', required: true, size: 1000 },
    isApproved: { type: 'boolean', default: false },
    parentCommentId: { type: 'string' }, // For nested comments
    createdAt: { type: 'Date', default: new Date() }
  }
};

class BlogMigrationService {
  private static db: any;

  static async migrateBlogSystem() {
    console.log('Starting blog system migration...');

    const orm = new ServerORM({
      endpoint: process.env.APPWRITE_ENDPOINT!,
      projectId: process.env.APPWRITE_PROJECT_ID!,
      databaseId: process.env.APPWRITE_DATABASE_ID!,
      apiKey: process.env.APPWRITE_API_KEY!,
      autoMigrate: false
    });

    // Initialize with new schemas
    this.db = await orm.init([authorTableV2, postTableV2, commentTableV2]);

    // Run migrations in order
    await this.migrateAuthors();
    await this.migratePosts();
    await this.createSlugsForPosts();
    
    console.log('✓ Blog system migration completed');
  }

  private static async migrateAuthors() {
    console.log('Migrating authors...');
    
    const authors = await this.db.authors.all();
    
    for (const author of authors) {
      // Add default values for new fields
      if (!author.bio) {
        await this.db.authors.update(author.$id, {
          bio: '',
          avatar: '',
          socialLinks: JSON.stringify({}),
          isActive: true,
          createdAt: new Date()
        });
      }
    }
    
    console.log(`✓ Migrated ${authors.length} authors`);
  }

  private static async migratePosts() {
    console.log('Migrating posts and creating author relationships...');
    
    const posts = await this.db.posts.all();
    const authors = await this.db.authors.all();
    
    // Create email to ID mapping
    const emailToIdMap = new Map();
    authors.forEach((author: any) => {
      emailToIdMap.set(author.email, author.$id);
    });

    for (const post of posts) {
      const authorId = emailToIdMap.get(post.authorEmail);
      
      if (authorId) {
        const slug = this.generateSlug(post.title);
        
        await this.db.posts.update(post.$id, {
          authorId,
          slug,
          status: 'published', // Assume existing posts are published
          publishedAt: new Date(),
          tags: JSON.stringify([]),
          viewCount: 0,
          createdAt: new Date()
        });
      } else {
        console.warn(`Author not found for post ${post.$id} with email ${post.authorEmail}`);
      }
    }
    
    console.log(`✓ Migrated ${posts.length} posts`);
  }

  private static async createSlugsForPosts() {
    console.log('Ensuring unique slugs...');
    
    const posts = await this.db.posts.all();
    const slugCounts = new Map();

    for (const post of posts) {
      let baseSlug = this.generateSlug(post.title);
      let finalSlug = baseSlug;
      
      // Ensure uniqueness
      const count = slugCounts.get(baseSlug) || 0;
      if (count > 0) {
        finalSlug = `${baseSlug}-${count}`;
      }
      slugCounts.set(baseSlug, count + 1);

      if (post.slug !== finalSlug) {
        await this.db.posts.update(post.$id, { slug: finalSlug });
      }
    }
    
    console.log('✓ Slug generation completed');
  }

  private static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}
```

## Data Transformation Migrations

### User Profile Enhancement Migration

```typescript
// Migration to enhance user profiles with computed fields and data normalization

class UserProfileMigration {
  private static db: any;

  static async enhanceUserProfiles() {
    console.log('Starting user profile enhancement migration...');

    const orm = new ServerORM({
      endpoint: process.env.APPWRITE_ENDPOINT!,
      projectId: process.env.APPWRITE_PROJECT_ID!,
      databaseId: process.env.APPWRITE_DATABASE_ID!,
      apiKey: process.env.APPWRITE_API_KEY!,
      autoMigrate: false
    });

    this.db = await orm.init([enhancedUserTable]);

    await this.normalizeUserData();
    await this.calculateUserStats();
    await this.generateUserSlugs();
    
    console.log('✓ User profile enhancement completed');
  }

  private static async normalizeUserData() {
    console.log('Normalizing user data...');
    
    const users = await this.db.users.all();
    
    for (const user of users) {
      const updates: any = {};
      
      // Normalize email to lowercase
      if (user.email !== user.email.toLowerCase()) {
        updates.email = user.email.toLowerCase();
      }
      
      // Normalize name (title case)
      if (user.name) {
        const normalizedName = user.name
          .split(' ')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
        
        if (user.name !== normalizedName) {
          updates.name = normalizedName;
        }
      }
      
      // Parse and normalize phone numbers
      if (user.phone) {
        const normalizedPhone = this.normalizePhoneNumber(user.phone);
        if (normalizedPhone !== user.phone) {
          updates.phone = normalizedPhone;
        }
      }
      
      // Set default values for new fields
      if (!user.displayName) {
        updates.displayName = user.name || user.email.split('@')[0];
      }
      
      if (!user.timezone) {
        updates.timezone = 'UTC';
      }
      
      if (Object.keys(updates).length > 0) {
        await this.db.users.update(user.$id, updates);
      }
    }
    
    console.log(`✓ Normalized ${users.length} user records`);
  }

  private static async calculateUserStats() {
    console.log('Calculating user statistics...');
    
    const users = await this.db.users.all();
    
    for (const user of users) {
      // Calculate user statistics
      const [postCount, commentCount, likeCount] = await Promise.all([
        this.db.posts ? this.db.posts.count({ authorId: user.$id }) : 0,
        this.db.comments ? this.db.comments.count({ authorEmail: user.email }) : 0,
        this.db.likes ? this.db.likes.count({ userId: user.$id }) : 0
      ]);
      
      const stats = {
        postsCount: postCount,
        commentsCount: commentCount,
        likesGiven: likeCount,
        joinedAt: user.createdAt || new Date(),
        lastActiveAt: user.lastActiveAt || new Date()
      };
      
      await this.db.users.update(user.$id, {
        stats: JSON.stringify(stats),
        reputation: this.calculateReputation(stats)
      });
    }
    
    console.log(`✓ Calculated stats for ${users.length} users`);
  }

  private static async generateUserSlugs() {
    console.log('Generating user slugs...');
    
    const users = await this.db.users.all();
    const slugCounts = new Map();
    
    for (const user of users) {
      if (!user.slug) {
        let baseSlug = this.generateSlugFromName(user.displayName || user.name || user.email);
        let finalSlug = baseSlug;
        
        // Ensure uniqueness
        const count = slugCounts.get(baseSlug) || 0;
        if (count > 0) {
          finalSlug = `${baseSlug}-${count}`;
        }
        slugCounts.set(baseSlug, count + 1);
        
        await this.db.users.update(user.$id, { slug: finalSlug });
      }
    }
    
    console.log('✓ Generated slugs for all users');
  }

  private static normalizePhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Format as international number if it looks like a US number
    if (digits.length === 10) {
      return `+1${digits}`;
    } else if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    }
    
    return phone; // Return original if we can't normalize
  }

  private static calculateReputation(stats: any): number {
    // Simple reputation calculation
    return (stats.postsCount * 10) + (stats.commentsCount * 2) + (stats.likesGiven * 1);
  }

  private static generateSlugFromName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}

const enhancedUserTable: TableDefinition = {
  name: 'users',
  schema: {
    // Existing fields
    name: { type: 'string', required: true },
    email: { type: 'string', required: true },
    phone: { type: 'string' },
    
    // Enhanced fields
    displayName: { type: 'string', size: 100 },
    slug: { type: 'string', size: 100 },
    timezone: { type: 'string', default: 'UTC' },
    stats: { type: 'string' }, // JSON object with user statistics
    reputation: { type: 'number', default: 0, min: 0 },
    
    // Existing fields
    isActive: { type: 'boolean', default: true },
    createdAt: { type: 'Date', default: new Date() },
    lastActiveAt: { type: 'Date' }
  }
};
```

## Migration Rollback Strategies

### Safe Migration with Rollback Support

```typescript
class SafeMigrationService {
  private static db: any;
  private static backupData: Map<string, any[]> = new Map();

  static async performSafeMigration() {
    console.log('Starting safe migration with rollback support...');

    try {
      // Step 1: Backup critical data
      await this.backupCriticalData();
      
      // Step 2: Perform migration
      await this.runMigration();
      
      // Step 3: Validate migration
      await this.validateMigration();
      
      console.log('✓ Migration completed successfully');
      
      // Clean up backups after successful migration
      this.backupData.clear();
      
    } catch (error) {
      console.error('✗ Migration failed:', error);
      
      // Attempt rollback
      await this.rollbackMigration();
      
      throw error;
    }
  }

  private static async backupCriticalData() {
    console.log('Creating data backup...');
    
    // Backup users
    const users = await this.db.users.all();
    this.backupData.set('users', users);
    
    // Backup posts
    const posts = await this.db.posts.all();
    this.backupData.set('posts', posts);
    
    console.log(`✓ Backed up ${users.length} users and ${posts.length} posts`);
  }

  private static async runMigration() {
    console.log('Running migration...');
    
    // Your migration logic here
    const users = await this.db.users.all();
    
    for (const user of users) {
      // Simulate a migration that might fail
      if (user.email.includes('invalid')) {
        throw new Error(`Invalid user data: ${user.email}`);
      }
      
      await this.db.users.update(user.$id, {
        migrationVersion: 2,
        migratedAt: new Date()
      });
    }
  }

  private static async validateMigration() {
    console.log('Validating migration...');
    
    // Check that all users have been migrated
    const unmigratedUsers = await this.db.users.query({
      migrationVersion: { $ne: 2 }
    });
    
    if (unmigratedUsers.length > 0) {
      throw new Error(`${unmigratedUsers.length} users were not migrated properly`);
    }
    
    // Additional validation checks
    const totalUsers = await this.db.users.count();
    const originalUserCount = this.backupData.get('users')?.length || 0;
    
    if (totalUsers !== originalUserCount) {
      throw new Error(`User count mismatch: expected ${originalUserCount}, got ${totalUsers}`);
    }
    
    console.log('✓ Migration validation passed');
  }

  private static async rollbackMigration() {
    console.log('Rolling back migration...');
    
    try {
      // Restore users from backup
      const backedUpUsers = this.backupData.get('users') || [];
      
      for (const user of backedUpUsers) {
        await this.db.users.update(user.$id, {
          // Restore original fields, remove migration fields
          name: user.name,
          email: user.email,
          // Remove migration-specific fields
          migrationVersion: undefined,
          migratedAt: undefined
        });
      }
      
      console.log('✓ Rollback completed successfully');
      
    } catch (rollbackError) {
      console.error('✗ Rollback failed:', rollbackError);
      console.error('Manual intervention required!');
      
      // Log backup data for manual recovery
      console.log('Backup data:', JSON.stringify(Array.from(this.backupData.entries()), null, 2));
    }
  }
}
```

## Production Migration Scripts

### Complete Migration Workflow

```typescript
// production-migration.ts
import { ServerORM } from 'appwrite-orm/server';
import { readFileSync, writeFileSync } from 'fs';

class ProductionMigrationRunner {
  private static config: any;
  private static db: any;
  private static migrationLog: any[] = [];

  static async runProductionMigration() {
    console.log('=== PRODUCTION MIGRATION STARTED ===');
    console.log(`Timestamp: ${new Date().toISOString()}`);
    
    try {
      await this.initialize();
      await this.preflightChecks();
      await this.runMigrations();
      await this.postMigrationValidation();
      await this.generateMigrationReport();
      
      console.log('=== MIGRATION COMPLETED SUCCESSFULLY ===');
      
    } catch (error) {
      console.error('=== MIGRATION FAILED ===');
      console.error(error);
      
      await this.generateErrorReport(error);
      process.exit(1);
    }
  }

  private static async initialize() {
    this.config = {
      endpoint: process.env.APPWRITE_ENDPOINT!,
      projectId: process.env.APPWRITE_PROJECT_ID!,
      databaseId: process.env.APPWRITE_DATABASE_ID!,
      apiKey: process.env.APPWRITE_API_KEY!,
      autoMigrate: false
    };

    const orm = new ServerORM(this.config);
    this.db = await orm.init([/* your table definitions */]);
    
    this.log('Migration environment initialized');
  }

  private static async preflightChecks() {
    this.log('Running preflight checks...');
    
    // Check database connectivity
    const userCount = await this.db.users.count();
    this.log(`Database connected. Found ${userCount} users.`);
    
    // Check available disk space (if needed)
    // Check backup status
    // Check system resources
    
    this.log('Preflight checks passed');
  }

  private static async runMigrations() {
    const migrations = [
      { name: 'Add user profiles', fn: this.migrateUserProfiles },
      { name: 'Update post schema', fn: this.migratePostSchema },
      { name: 'Create comment system', fn: this.createCommentSystem }
    ];

    for (const migration of migrations) {
      this.log(`Starting: ${migration.name}`);
      const startTime = Date.now();
      
      try {
        await migration.fn.call(this);
        const duration = Date.now() - startTime;
        this.log(`Completed: ${migration.name} (${duration}ms)`);
      } catch (error) {
        this.log(`Failed: ${migration.name} - ${error.message}`);
        throw error;
      }
    }
  }

  private static async migrateUserProfiles() {
    // Implementation here
    const users = await this.db.users.all();
    this.log(`Migrating ${users.length} user profiles`);
    
    // Migration logic...
  }

  private static async migratePostSchema() {
    // Implementation here
    this.log('Updating post schema');
    
    // Migration logic...
  }

  private static async createCommentSystem() {
    // Implementation here
    this.log('Creating comment system');
    
    // Migration logic...
  }

  private static async postMigrationValidation() {
    this.log('Running post-migration validation...');
    
    // Validate data integrity
    const userCount = await this.db.users.count();
    const postCount = await this.db.posts.count();
    
    this.log(`Validation: ${userCount} users, ${postCount} posts`);
    
    // Additional validation checks...
    
    this.log('Post-migration validation passed');
  }

  private static async generateMigrationReport() {
    const report = {
      timestamp: new Date().toISOString(),
      status: 'success',
      duration: Date.now() - this.migrationLog[0]?.timestamp || 0,
      logs: this.migrationLog,
      statistics: {
        usersProcessed: await this.db.users.count(),
        postsProcessed: await this.db.posts.count()
      }
    };

    writeFileSync(
      `migration-report-${Date.now()}.json`,
      JSON.stringify(report, null, 2)
    );
    
    console.log('Migration report generated');
  }

  private static async generateErrorReport(error: any) {
    const errorReport = {
      timestamp: new Date().toISOString(),
      status: 'failed',
      error: {
        message: error.message,
        stack: error.stack
      },
      logs: this.migrationLog
    };

    writeFileSync(
      `migration-error-${Date.now()}.json`,
      JSON.stringify(errorReport, null, 2)
    );
  }

  private static log(message: string) {
    const logEntry = {
      timestamp: Date.now(),
      message,
      time: new Date().toISOString()
    };
    
    this.migrationLog.push(logEntry);
    console.log(`[${logEntry.time}] ${message}`);
  }
}

// Run migration
if (require.main === module) {
  ProductionMigrationRunner.runProductionMigration()
    .catch(console.error);
}
```

### Package.json Scripts for Migrations

```json
{
  "scripts": {
    "migrate": "ts-node scripts/migration.ts",
    "migrate:dry-run": "DRY_RUN=true ts-node scripts/migration.ts",
    "migrate:rollback": "ts-node scripts/rollback.ts",
    "migrate:status": "ts-node scripts/migration-status.ts"
  }
}
```

These migration examples demonstrate:

1. **Basic Migrations**: Adding fields and handling schema evolution
2. **Complex Migrations**: Multi-table changes and relationship updates
3. **Data Transformation**: Normalizing and enhancing existing data
4. **Safety Measures**: Backup, validation, and rollback strategies
5. **Production Workflows**: Complete migration scripts with logging and reporting

Each migration pattern can be adapted for your specific use case and requirements. Always test migrations thoroughly in a development environment before running them in production.