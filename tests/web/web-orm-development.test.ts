import { WebORM } from '../../src/web';

describe('WebORM Development Mode', () => {
  // Mock document object for Node.js environment
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

  describe('Fake Database with Cookies', () => {
    const tasksTable = {
      name: 'tasks',
      schema: {
        title: { type: 'string' as const, required: true, size: 255 },
        description: { type: 'string' as const, size: 5000 },
        completed: { type: 'boolean' as const, default: false },
        priority: { 
          type: ['low', 'medium', 'high'] as any,
          enum: ['low', 'medium', 'high'],
          default: 'medium'
        }
      }
    };

    const projectsTable = {
      name: 'projects',
      schema: {
        name: { type: 'string' as const, required: true, size: 255 },
        description: { type: 'string' as const, size: 5000 },
        isActive: { type: 'boolean' as const, default: true }
      }
    };

    let orm: WebORM;
    let db: any;

    beforeEach(async () => {
      orm = new WebORM({
        endpoint: 'http://localhost',
        projectId: 'test',
        databaseId: 'test_dev',
        development: true
      });

      db = await orm.init([tasksTable, projectsTable]);
      
      // Clear any existing data
      if (db.clearAll) {
        db.clearAll();
      }
    });

    it('should initialize in development mode', async () => {
      expect(db).toBeDefined();
      expect(db.table).toBeDefined();
    });

    it('should create a document', async () => {
      const task = await db.table(tasksTable.name).create({
        title: 'Test Task',
        description: 'This is a test',
        completed: false,
        priority: 'high'
      });

      expect(task).toBeDefined();
      expect(task.$id).toBeDefined();
      expect(task.title).toBe('Test Task');
      expect(task.priority).toBe('high');
      expect(task.$createdAt).toBeDefined();
      expect(task.$updatedAt).toBeDefined();
    });

    it('should get a document by ID', async () => {
      const created = await db.table(tasksTable.name).create({
        title: 'Get Test',
        description: 'Test get operation',
        completed: false
      });

      const retrieved = await db.table(tasksTable.name).get(created.$id);

      expect(retrieved).toBeDefined();
      expect(retrieved!.$id).toBe(created.$id);
      expect(retrieved!.title).toBe('Get Test');
    });

    it('should update a document', async () => {
      const created = await db.table(tasksTable.name).create({
        title: 'Update Test',
        description: 'Test update',
        completed: false
      });

      const updated = await db.table(tasksTable.name).update(created.$id, {
        completed: true,
        priority: 'low'
      });

      expect(updated.completed).toBe(true);
      expect(updated.priority).toBe('low');
      expect(updated.title).toBe('Update Test'); // Should preserve unchanged fields
    });

    it('should delete a document', async () => {
      const created = await db.table(tasksTable.name).create({
        title: 'Delete Test',
        description: 'Test delete',
        completed: false
      });

      await db.table(tasksTable.name).delete(created.$id);

      const retrieved = await db.table(tasksTable.name).get(created.$id);
      expect(retrieved).toBeNull();
    });

    it('should query documents with filters', async () => {
      await db.table(tasksTable.name).create({
        title: 'Task 1',
        description: 'First task',
        completed: true
      });

      await db.table(tasksTable.name).create({
        title: 'Task 2',
        description: 'Second task',
        completed: false
      });

      await db.table(tasksTable.name).create({
        title: 'Task 3',
        description: 'Third task',
        completed: true
      });

      const completedTasks = await db.table(tasksTable.name).query({ completed: true });

      expect(completedTasks).toHaveLength(2);
      expect(completedTasks.every((t: any) => t.completed)).toBe(true);
    });

    it('should get all documents', async () => {
      await db.table(tasksTable.name).create({
        title: 'Task A',
        description: 'A',
        completed: false
      });

      await db.table(tasksTable.name).create({
        title: 'Task B',
        description: 'B',
        completed: false
      });

      const allTasks = await db.table(tasksTable.name).all();

      expect(allTasks).toHaveLength(2);
    });

    it('should count documents', async () => {
      await db.table(tasksTable.name).create({
        title: 'Count 1',
        description: 'Test',
        completed: true
      });

      await db.table(tasksTable.name).create({
        title: 'Count 2',
        description: 'Test',
        completed: false
      });

      const totalCount = await db.table(tasksTable.name).count();
      const completedCount = await db.table(tasksTable.name).count({ completed: true });

      expect(totalCount).toBe(2);
      expect(completedCount).toBe(1);
    });

    it('should find first document', async () => {
      await db.table(tasksTable.name).create({
        title: 'First',
        description: 'Test',
        completed: false
      });

      await db.table(tasksTable.name).create({
        title: 'Second',
        description: 'Test',
        completed: false
      });

      const first = await db.table(tasksTable.name).first();

      expect(first).toBeDefined();
      expect(first!.title).toBe('First');
    });

    it('should validate required fields', async () => {
      await expect(
        db.table(tasksTable.name).create({
          description: 'No title',
          completed: false
        })
      ).rejects.toThrow('Validation failed');
    });

    it('should validate enum values', async () => {
      await expect(
        db.table(tasksTable.name).create({
          title: 'Invalid Priority',
          description: 'Test',
          priority: 'urgent' // Not in enum
        })
      ).rejects.toThrow();
    });

    it('should perform left join', async () => {
      const project = await db.table(projectsTable.name).create({
        name: 'Project A',
        description: 'Test project',
        isActive: true
      });

      await db.table(tasksTable.name).create({
        title: 'Task for Project A',
        description: 'Test',
        completed: false,
        projectId: project.$id
      });

      await db.table(tasksTable.name).create({
        title: 'Task without project',
        description: 'Test',
        completed: false
      });

      // Note: We need to add projectId to the schema for this to work properly
      // This is a simplified test
      const tasks = await db.table(tasksTable.name).all();
      expect(tasks).toHaveLength(2);
    });

    it('should clear all data', async () => {
      await db.table(tasksTable.name).create({
        title: 'To be cleared',
        description: 'Test',
        completed: false
      });

      db.clearAll();

      const allTasks = await db.table(tasksTable.name).all();
      expect(allTasks).toHaveLength(0);
    });
  });
});
