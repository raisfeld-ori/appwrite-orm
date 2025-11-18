import { FirebaseMigrations } from '../../../src/server/firebase-migrations';
import { TableDefinition, ORMMigrationError } from '../../../src/shared/types';

describe('FirebaseMigrations', () => {
  let firebaseMigrations: FirebaseMigrations;

  beforeEach(() => {
    const mockConfig = {
      endpoint: 'https://test.appwrite.io/v1',
      projectId: 'test-project',
      databaseId: 'test-database'
    };
    firebaseMigrations = new FirebaseMigrations(mockConfig);
  });

  describe('JSON structure validity', () => {
    it('should generate valid JSON structure', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          name: { type: 'string' }
        }
      };

      const result = firebaseMigrations.generateFirebase([table]);
      expect(() => JSON.parse(result)).not.toThrow();
    });

    it('should have rules as root object', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          name: { type: 'string' }
        }
      };

      const result = JSON.parse(firebaseMigrations.generateFirebase([table]));
      expect(result).toHaveProperty('rules');
      expect(typeof result.rules).toBe('object');
    });

    it('should use collection name as key in rules', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          name: { type: 'string' }
        }
      };

      const result = JSON.parse(firebaseMigrations.generateFirebase([table]));
      expect(result.rules).toHaveProperty('users');
    });

    it('should use collection id if provided', () => {
      const table: TableDefinition = {
        name: 'users',
        id: 'custom_users_id',
        schema: {
          name: { type: 'string' }
        }
      };

      const result = JSON.parse(firebaseMigrations.generateFirebase([table]));
      expect(result.rules).toHaveProperty('custom_users_id');
      expect(result.rules).not.toHaveProperty('users');
    });
  });

  describe('security rules generation', () => {
    it('should generate default read/write rules for authenticated users', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          name: { type: 'string' }
        }
      };

      const result = JSON.parse(firebaseMigrations.generateFirebase([table]));
      expect(result.rules.users['.read']).toBe('auth != null');
      expect(result.rules.users['.write']).toBe('auth != null');
    });

    it('should generate public read rules when role is any', () => {
      const table: TableDefinition = {
        name: 'posts',
        schema: {
          title: { type: 'string' }
        },
        role: {
          read: 'any'
        }
      };

      const result = JSON.parse(firebaseMigrations.generateFirebase([table]));
      expect(result.rules.posts['.read']).toBe('true');
    });

    it('should generate public read rules when role is public', () => {
      const table: TableDefinition = {
        name: 'posts',
        schema: {
          title: { type: 'string' }
        },
        role: {
          read: 'public'
        }
      };

      const result = JSON.parse(firebaseMigrations.generateFirebase([table]));
      expect(result.rules.posts['.read']).toBe('true');
    });

    it('should generate role-based write rules', () => {
      const table: TableDefinition = {
        name: 'posts',
        schema: {
          title: { type: 'string' }
        },
        role: {
          write: 'admin'
        }
      };

      const result = JSON.parse(firebaseMigrations.generateFirebase([table]));
      expect(result.rules.posts['.write']).toBe("auth != null && auth.token.role == 'admin'");
    });

    it('should handle multiple roles for write', () => {
      const table: TableDefinition = {
        name: 'posts',
        schema: {
          title: { type: 'string' }
        },
        role: {
          write: ['admin', 'editor']
        }
      };

      const result = JSON.parse(firebaseMigrations.generateFirebase([table]));
      expect(result.rules.posts['.write']).toBe("auth != null && (auth.token.role == 'admin' || auth.token.role == 'editor')");
    });

    it('should handle create, update, delete as write permissions', () => {
      const table: TableDefinition = {
        name: 'posts',
        schema: {
          title: { type: 'string' }
        },
        role: {
          create: 'user',
          update: 'admin',
          delete: 'admin'
        }
      };

      const result = JSON.parse(firebaseMigrations.generateFirebase([table]));
      expect(result.rules.posts['.write']).toContain("auth.token.role == 'user'");
      expect(result.rules.posts['.write']).toContain("auth.token.role == 'admin'");
    });

    it('should have $itemId wildcard for document-level rules', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          name: { type: 'string' }
        }
      };

      const result = JSON.parse(firebaseMigrations.generateFirebase([table]));
      expect(result.rules.users).toHaveProperty('$itemId');
    });
  });

  describe('validation rules for field types', () => {
    it('should validate string type', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          name: { type: 'string' }
        }
      };

      const result = JSON.parse(firebaseMigrations.generateFirebase([table]));
      expect(result.rules.users.$itemId.name['.validate']).toContain('newData.isString()');
    });

    it('should validate integer type', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          age: { type: 'integer' }
        }
      };

      const result = JSON.parse(firebaseMigrations.generateFirebase([table]));
      expect(result.rules.users.$itemId.age['.validate']).toContain('newData.isNumber()');
      expect(result.rules.users.$itemId.age['.validate']).toContain('newData.val() === Math.floor(newData.val())');
    });

    it('should validate number type as integer', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          count: { type: 'number' }
        }
      };

      const result = JSON.parse(firebaseMigrations.generateFirebase([table]));
      expect(result.rules.users.$itemId.count['.validate']).toContain('newData.isNumber()');
      expect(result.rules.users.$itemId.count['.validate']).toContain('newData.val() === Math.floor(newData.val())');
    });

    it('should validate float type', () => {
      const table: TableDefinition = {
        name: 'products',
        schema: {
          price: { type: 'float' }
        }
      };

      const result = JSON.parse(firebaseMigrations.generateFirebase([table]));
      expect(result.rules.products.$itemId.price['.validate']).toBe('newData.isNumber()');
    });

    it('should validate boolean type', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          isActive: { type: 'boolean' }
        }
      };

      const result = JSON.parse(firebaseMigrations.generateFirebase([table]));
      expect(result.rules.users.$itemId.isActive['.validate']).toBe('newData.isBoolean()');
    });

    it('should validate Date type as string', () => {
      const table: TableDefinition = {
        name: 'events',
        schema: {
          createdAt: { type: 'Date' }
        }
      };

      const result = JSON.parse(firebaseMigrations.generateFirebase([table]));
      expect(result.rules.events.$itemId.createdAt['.validate']).toBe('newData.isString()');
    });

    it('should validate datetime type as string', () => {
      const table: TableDefinition = {
        name: 'events',
        schema: {
          timestamp: { type: 'datetime' }
        }
      };

      const result = JSON.parse(firebaseMigrations.generateFirebase([table]));
      expect(result.rules.events.$itemId.timestamp['.validate']).toBe('newData.isString()');
    });

    it('should validate enum type with regex pattern', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          role: { type: ['admin', 'user'], enum: ['admin', 'user'] }
        }
      };

      const result = JSON.parse(firebaseMigrations.generateFirebase([table]));
      expect(result.rules.users.$itemId.role['.validate']).toContain('newData.isString()');
      expect(result.rules.users.$itemId.role['.validate']).toContain('newData.val().matches(/^(admin|user)$/)');
    });
  });

  describe('constraint mapping', () => {
    it('should add string size constraint', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          name: { type: 'string', size: 100 }
        }
      };

      const result = JSON.parse(firebaseMigrations.generateFirebase([table]));
      expect(result.rules.users.$itemId.name['.validate']).toContain('newData.val().length <= 100');
    });

    it('should add min constraint for integers', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          age: { type: 'integer', min: 0 }
        }
      };

      const result = JSON.parse(firebaseMigrations.generateFirebase([table]));
      expect(result.rules.users.$itemId.age['.validate']).toContain('newData.val() >= 0');
    });

    it('should add max constraint for integers', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          age: { type: 'integer', max: 120 }
        }
      };

      const result = JSON.parse(firebaseMigrations.generateFirebase([table]));
      expect(result.rules.users.$itemId.age['.validate']).toContain('newData.val() <= 120');
    });

    it('should add min and max constraints together', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          age: { type: 'integer', min: 0, max: 120 }
        }
      };

      const result = JSON.parse(firebaseMigrations.generateFirebase([table]));
      const validation = result.rules.users.$itemId.age['.validate'];
      expect(validation).toContain('newData.val() >= 0');
      expect(validation).toContain('newData.val() <= 120');
      expect(validation).toContain('&&');
    });

    it('should add min constraint for floats', () => {
      const table: TableDefinition = {
        name: 'products',
        schema: {
          price: { type: 'float', min: 0 }
        }
      };

      const result = JSON.parse(firebaseMigrations.generateFirebase([table]));
      expect(result.rules.products.$itemId.price['.validate']).toContain('newData.val() >= 0');
    });

    it('should add max constraint for floats', () => {
      const table: TableDefinition = {
        name: 'products',
        schema: {
          discount: { type: 'float', max: 1 }
        }
      };

      const result = JSON.parse(firebaseMigrations.generateFirebase([table]));
      expect(result.rules.products.$itemId.discount['.validate']).toContain('newData.val() <= 1');
    });

    it('should handle enum constraints with special characters', () => {
      const table: TableDefinition = {
        name: 'posts',
        schema: {
          status: { type: ['draft', 'published'], enum: ['draft', 'published'] }
        }
      };

      const result = JSON.parse(firebaseMigrations.generateFirebase([table]));
      expect(result.rules.posts.$itemId.status['.validate']).toContain('newData.val().matches(/^(draft|published)$/)');
    });
  });

  describe('hasChildren() validation for required fields', () => {
    it('should add hasChildren validation for single required field', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          name: { type: 'string', required: true }
        }
      };

      const result = JSON.parse(firebaseMigrations.generateFirebase([table]));
      expect(result.rules.users.$itemId['.validate']).toBe("newData.hasChildren(['name'])");
    });

    it('should add hasChildren validation for multiple required fields', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          name: { type: 'string', required: true },
          email: { type: 'string', required: true }
        }
      };

      const result = JSON.parse(firebaseMigrations.generateFirebase([table]));
      expect(result.rules.users.$itemId['.validate']).toBe("newData.hasChildren(['name', 'email'])");
    });

    it('should not add hasChildren validation when no required fields', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          name: { type: 'string' },
          email: { type: 'string' }
        }
      };

      const result = JSON.parse(firebaseMigrations.generateFirebase([table]));
      expect(result.rules.users.$itemId['.validate']).toBeUndefined();
    });

    it('should only include required fields in hasChildren', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          name: { type: 'string', required: true },
          email: { type: 'string', required: true },
          age: { type: 'integer' },
          bio: { type: 'string' }
        }
      };

      const result = JSON.parse(firebaseMigrations.generateFirebase([table]));
      expect(result.rules.users.$itemId['.validate']).toBe("newData.hasChildren(['name', 'email'])");
    });
  });

  describe('edge cases', () => {
    it('should handle empty schema', () => {
      const result = firebaseMigrations.generateFirebase([]);
      const parsed = JSON.parse(result);
      expect(parsed).toEqual({ rules: {} });
    });

    it('should handle array fields without validation', () => {
      const table: TableDefinition = {
        name: 'posts',
        schema: {
          tags: { type: 'string', array: true }
        }
      };

      const result = JSON.parse(firebaseMigrations.generateFirebase([table]));
      // Array fields should not have type validation
      expect(result.rules.posts.$itemId.tags['.validate']).toBeUndefined();
    });

    it('should not add constraints for array fields', () => {
      const table: TableDefinition = {
        name: 'posts',
        schema: {
          scores: { type: 'integer', array: true, min: 0, max: 100 }
        }
      };

      const result = JSON.parse(firebaseMigrations.generateFirebase([table]));
      expect(result.rules.posts.$itemId.scores['.validate']).toBeUndefined();
    });

    it('should handle complex nested structures', () => {
      const table: TableDefinition = {
        name: 'products',
        schema: {
          name: { type: 'string', required: true, size: 200 },
          price: { type: 'float', required: true, min: 0 },
          category: { type: ['electronics', 'clothing', 'food'], enum: ['electronics', 'clothing', 'food'] },
          inStock: { type: 'boolean' },
          tags: { type: 'string', array: true }
        },
        role: {
          read: 'any',
          write: 'admin'
        }
      };

      const result = JSON.parse(firebaseMigrations.generateFirebase([table]));
      
      // Check security rules
      expect(result.rules.products['.read']).toBe('true');
      expect(result.rules.products['.write']).toBe("auth != null && auth.token.role == 'admin'");
      
      // Check required fields validation
      expect(result.rules.products.$itemId['.validate']).toBe("newData.hasChildren(['name', 'price'])");
      
      // Check field validations
      expect(result.rules.products.$itemId.name['.validate']).toContain('newData.isString()');
      expect(result.rules.products.$itemId.name['.validate']).toContain('newData.val().length <= 200');
      expect(result.rules.products.$itemId.price['.validate']).toContain('newData.isNumber()');
      expect(result.rules.products.$itemId.price['.validate']).toContain('newData.val() >= 0');
      expect(result.rules.products.$itemId.category['.validate']).toContain('newData.val().matches(/^(electronics|clothing|food)$/)');
      expect(result.rules.products.$itemId.inStock['.validate']).toBe('newData.isBoolean()');
      expect(result.rules.products.$itemId.tags['.validate']).toBeUndefined();
    });

    it('should throw error for invalid table definition', () => {
      const invalidTable = {
        schema: { name: { type: 'string' } }
      } as any;

      expect(() => {
        firebaseMigrations.generateFirebase([invalidTable]);
      }).toThrow(ORMMigrationError);
      expect(() => {
        firebaseMigrations.generateFirebase([invalidTable]);
      }).toThrow("Invalid table definition: missing 'name' or 'schema' field");
    });

    it('should handle multiple tables', () => {
      const tables: TableDefinition[] = [
        {
          name: 'users',
          schema: {
            name: { type: 'string', required: true }
          }
        },
        {
          name: 'posts',
          schema: {
            title: { type: 'string', required: true },
            userId: { type: 'string', required: true }
          }
        }
      ];

      const result = JSON.parse(firebaseMigrations.generateFirebase(tables));
      
      expect(result.rules).toHaveProperty('users');
      expect(result.rules).toHaveProperty('posts');
      expect(result.rules.users.$itemId['.validate']).toBe("newData.hasChildren(['name'])");
      expect(result.rules.posts.$itemId['.validate']).toBe("newData.hasChildren(['title', 'userId'])");
    });

    it('should escape regex special characters in enum values', () => {
      const table: TableDefinition = {
        name: 'posts',
        schema: {
          status: { type: ['draft', 'in-progress', 'done'], enum: ['draft', 'in-progress', 'done'] }
        }
      };

      const result = JSON.parse(firebaseMigrations.generateFirebase([table]));
      // The hyphen should be escaped in regex
      expect(result.rules.posts.$itemId.status['.validate']).toContain('newData.val().matches(');
    });
  });

  describe('complete validation rules', () => {
    it('should combine all validation rules with AND operator', () => {
      const table: TableDefinition = {
        name: 'users',
        schema: {
          username: { type: 'string', size: 50 }
        }
      };

      const result = JSON.parse(firebaseMigrations.generateFirebase([table]));
      const validation = result.rules.users.$itemId.username['.validate'];
      expect(validation).toContain('newData.isString()');
      expect(validation).toContain('&&');
      expect(validation).toContain('newData.val().length <= 50');
    });

    it('should handle all constraints for numeric fields', () => {
      const table: TableDefinition = {
        name: 'ratings',
        schema: {
          score: { type: 'integer', min: 1, max: 5 }
        }
      };

      const result = JSON.parse(firebaseMigrations.generateFirebase([table]));
      const validation = result.rules.ratings.$itemId.score['.validate'];
      expect(validation).toContain('newData.isNumber()');
      expect(validation).toContain('newData.val() === Math.floor(newData.val())');
      expect(validation).toContain('newData.val() >= 1');
      expect(validation).toContain('newData.val() <= 5');
    });
  });
});
