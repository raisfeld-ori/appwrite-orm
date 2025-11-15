"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Database, Plus, Search, Trash2, Edit, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { CursorEffect } from "../components/cursor-effect";
import { WebORM } from "appwrite-orm/web";
import { cn } from "@/lib/utils";

interface Task {
  $id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

export default function DemoPage() {
  const [db, setDb] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium' as const });

  // Initialize ORM in development mode
  useEffect(() => {
    const initOrm = async () => {
      try {
        // Development mode - no real Appwrite credentials needed
        const orm = new WebORM({
          endpoint: 'http://localhost',
          projectId: 'demo-project',
          databaseId: 'demo-database',
          development: true // Enable development mode
        });

        const database = await orm.init([{
          name: 'tasks',
          schema: {
            title: { type: 'string', required: true },
            description: { type: 'string', required: false },
            completed: { type: 'boolean', default: false },
            priority: { type: ['low', 'medium', 'high'], enum: ['low', 'medium', 'high'], default: 'medium' },
            createdAt: { type: 'string', required: true }
          }
        }]);

        setDb(database);

        // Add mock data if empty
        const existingTasks = await database.table('tasks').all() as Task[];
        if (existingTasks.length === 0) {
          await addMockData(database);
        }
        setTasks(existingTasks);
      } catch (error) {
        console.error('Failed to initialize ORM:', error);
        showMessage('error', 'Failed to initialize database');
      }
    };

    initOrm();
  }, []);

  const addMockData = async (database: any) => {
    const mockTasks = [
      { title: 'Setup Appwrite ORM', description: 'Initialize the ORM with schema definitions', completed: true, priority: 'high', createdAt: new Date().toISOString() },
      { title: 'Create CRUD operations', description: 'Implement create, read, update, delete functions', completed: true, priority: 'high', createdAt: new Date().toISOString() },
      { title: 'Test queries', description: 'Test different query patterns and filters', completed: false, priority: 'medium', createdAt: new Date().toISOString() },
      { title: 'Add validation', description: 'Implement schema validation for data integrity', completed: false, priority: 'low', createdAt: new Date().toISOString() }
    ];

    for (const task of mockTasks) {
      await database.table('tasks').create(task);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const refreshTasks = async () => {
    if (!db) return;
    setLoading(true);
    try {
      // db.table('tasks').all() - Fetch all documents from the tasks collection
      const allTasks = await db.table('tasks').all() as Task[];
      setTasks(allTasks);
      showMessage('success', 'Tasks refreshed successfully');
    } catch (error) {
      showMessage('error', 'Failed to refresh tasks');
    } finally {
      setLoading(false);
    }
  };

  const addTask = async () => {
    if (!db || !newTask.title.trim()) return;
    setLoading(true);
    try {
      // db.table('tasks').create({...}) - Insert a new document into the tasks collection
      await db.table('tasks').create({
        ...newTask,
        completed: false,
        createdAt: new Date().toISOString()
      });
      setNewTask({ title: '', description: '', priority: 'medium' });
      await refreshTasks();
      showMessage('success', 'Task added successfully');
    } catch (error) {
      showMessage('error', 'Failed to add task');
    } finally {
      setLoading(false);
    }
  };

  const toggleComplete = async (taskId: string, currentState: boolean) => {
    if (!db) return;
    setLoading(true);
    try {
      // db.table('tasks').update(id, data) - Update a specific document by ID
      await db.table('tasks').update(taskId, { completed: !currentState });
      await refreshTasks();
      showMessage('success', 'Task updated successfully');
    } catch (error) {
      showMessage('error', 'Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!db) return;
    setLoading(true);
    try {
      // db.table('tasks').delete(id) - Delete a specific document by ID
      await db.table('tasks').delete(taskId);
      await refreshTasks();
      showMessage('success', 'Task deleted successfully');
    } catch (error) {
      showMessage('error', 'Failed to delete task');
    } finally {
      setLoading(false);
    }
  };

  const filterByPriority = async (priority: 'low' | 'medium' | 'high') => {
    if (!db) return;
    setLoading(true);
    try {
      // db.table('tasks').query({field: value}) - Query documents with specific criteria
      const filtered = await db.table('tasks').query({ priority }) as Task[];
      setTasks(filtered);
      showMessage('success', `Filtered by ${priority} priority`);
    } catch (error) {
      showMessage('error', 'Failed to filter tasks');
    } finally {
      setLoading(false);
    }
  };

  const clearAll = async () => {
    if (!db) return;
    setLoading(true);
    try {
      // Clear all tasks from database
      const allTasks = await db.table('tasks').all() as Task[];
      for (const task of allTasks) {
        await db.table('tasks').delete(task.$id);
      }
      setTasks([]);
      showMessage('success', 'All tasks cleared');
    } catch (error) {
      showMessage('error', 'Failed to clear tasks');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden cursor-none bg-white dark:bg-gray-950">
      <CursorEffect />

      {/* Wavy Gradient Background */}
      <div className="absolute inset-0 bg-white dark:bg-gray-950 overflow-hidden">
        <svg
          className="absolute inset-0 w-full h-full opacity-30 dark:opacity-20"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path
            fill="none"
            stroke="url(#gradient1)"
            strokeWidth="0.5"
            d="M0,50 C20,60 40,40 60,50 C80,60 100,40 100,50 L100,100 L0,100 Z"
          />
          <path
            fill="none"
            stroke="url(#gradient2)"
            strokeWidth="0.5"
            d="M0,60 C30,70 70,30 100,60 L100,100 L0,100 Z"
          />
          <path
            fill="none"
            stroke="url(#gradient3)"
            strokeWidth="0.5"
            d="M0,70 C20,80 80,20 100,70 L100,100 L0,100 Z"
          />
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white/0 to-white dark:from-gray-950 dark:via-gray-950/0 dark:to-gray-950" />
      </div>

      <div className="relative z-10 container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Image 
              src="/logo-icon.png" 
              alt="Appwrite ORM Logo" 
              width={32} 
              height={32}
              className="h-8 w-8"
            />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Appwrite ORM Demo</h1>
          </div>
          <Link
            href="/"
            className="px-4 py-2 rounded-lg bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-300 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-900 transition-all"
          >
            ← Back
          </Link>
        </div>

        {/* Message Toast */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={cn(
              "fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-xl backdrop-blur-sm flex items-center gap-2",
              message.type === 'success' 
                ? "bg-green-500/95 text-white border border-green-400/50" 
                : "bg-red-500/95 text-white border border-red-400/50"
            )}
          >
            {message.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            {message.text}
          </motion.div>
        )}

        {/* Database Setup Info */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8 p-6 rounded-xl bg-white/20 dark:bg-gray-900/20 backdrop-blur-xl border border-white/30 dark:border-gray-800/30"
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Database className="h-5 w-5 text-red-500" />
            Database Configuration
          </h2>
          <div className="space-y-3 font-mono text-sm">
            <div className="bg-white/20 dark:bg-gray-900/20 p-4 rounded-lg backdrop-blur-sm border border-white/20 dark:border-gray-800/20">
              <p className="text-gray-600 dark:text-gray-400 mb-2">// Initialize ORM in development mode (no real Appwrite needed)</p>
              <code className="text-black dark:text-white">
                const orm = new WebORM({'{'}<br/>
                &nbsp;&nbsp;endpoint: 'http://localhost',<br/>
                &nbsp;&nbsp;projectId: 'demo-project',<br/>
                &nbsp;&nbsp;databaseId: 'demo-database',<br/>
                &nbsp;&nbsp;development: true <span className="text-gray-500">// Data stored in browser cookies</span><br/>
                {'}'});
              </code>
            </div>
            <div className="bg-white/20 dark:bg-gray-900/20 p-4 rounded-lg backdrop-blur-sm border border-white/20 dark:border-gray-800/20">
              <p className="text-gray-600 dark:text-gray-400 mb-2">// Define schema with validation rules</p>
              <code className="text-black dark:text-white">
                const db = await orm.init([{'{'}<br/>
                &nbsp;&nbsp;name: 'tasks',<br/>
                &nbsp;&nbsp;schema: {'{'}<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;title: {'{'} type: 'string', required: true {'}'},<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;description: {'{'} type: 'string' {'}'},<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;completed: {'{'} type: 'boolean', default: false {'}'},<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;priority: {'{'} type: ['low','medium','high'], enum: [...] {'}'}<br/>
                &nbsp;&nbsp;{'}'}<br/>
                {'}'}]);
              </code>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Add New Task */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-xl bg-white/20 dark:bg-gray-900/20 backdrop-blur-xl border border-white/30 dark:border-gray-800/30"
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-red-500" />
              Create New Task
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title *</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Enter task title"
                  className="w-full px-4 py-2 rounded-lg bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-300/50 dark:border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Enter task description"
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-300/50 dark:border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Priority</label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                  className="w-full px-4 py-2 rounded-lg bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-300/50 dark:border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <button
                onClick={addTask}
                disabled={loading || !newTask.title.trim()}
                className="w-full px-6 py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <span className="flex items-center justify-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Task
                </span>
              </button>
              <p className="text-xs text-gray-500 font-mono">
                // db.table('tasks').create({'{...}'})
              </p>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-xl bg-white/20 dark:bg-gray-900/20 backdrop-blur-xl border border-white/30 dark:border-gray-800/30"
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Search className="h-5 w-5 text-red-500" />
              Query Operations
            </h2>
            <div className="space-y-3">
              <button
                onClick={refreshTasks}
                disabled={loading}
                className="w-full px-4 py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh All Tasks
              </button>
              <p className="text-xs text-gray-500 font-mono">// db.table('tasks').all()</p>

              <div className="pt-2">
                <p className="text-sm font-medium mb-2">Filter by Priority:</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => filterByPriority('low')}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium disabled:opacity-50 transition-all text-sm shadow-sm"
                  >
                    Low
                  </button>
                  <button
                    onClick={() => filterByPriority('medium')}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white font-medium disabled:opacity-50 transition-all text-sm shadow-sm"
                  >
                    Medium
                  </button>
                  <button
                    onClick={() => filterByPriority('high')}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium disabled:opacity-50 transition-all text-sm shadow-sm"
                  >
                    High
                  </button>
                </div>
                <p className="text-xs text-gray-500 font-mono mt-2">// db.table('tasks').query({'{priority}'}) </p>
              </div>

              <button
                onClick={clearAll}
                disabled={loading}
                className="w-full px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Trash2 className="h-4 w-4" />
                Clear All Tasks
              </button>
              <p className="text-xs text-gray-500 font-mono">// db.table('tasks').delete(id)</p>
            </div>
          </motion.div>
        </div>

        {/* Tasks List */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 p-6 rounded-xl bg-white/20 dark:bg-gray-900/20 backdrop-blur-xl border border-white/30 dark:border-gray-800/30"
        >
          <h2 className="text-xl font-bold mb-4">
            Tasks ({tasks.length})
          </h2>
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No tasks found. Add one above!</p>
            ) : (
              tasks.map((task) => (
                <motion.div
                  key={task.$id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-lg bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-800/50 flex items-start justify-between gap-4 hover:bg-white/70 dark:hover:bg-gray-900/70 transition-all"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <button
                      onClick={() => toggleComplete(task.$id, task.completed)}
                      className="mt-1"
                    >
                      <div className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                        task.completed 
                          ? "bg-green-500 border-green-500" 
                          : "border-gray-300 dark:border-gray-600"
                      )}>
                        {task.completed && <CheckCircle2 className="h-4 w-4 text-white" />}
                      </div>
                    </button>
                    <div className="flex-1">
                      <h3 className={cn(
                        "font-semibold",
                        task.completed && "line-through text-gray-500"
                      )}>
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className={cn(
                          "text-xs px-2 py-1 rounded",
                          task.priority === 'high' && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                          task.priority === 'medium' && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                          task.priority === 'low' && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        )}>
                          {task.priority}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(task.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteTask(task.$id)}
                    className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 p-4 rounded-lg bg-[--color-primary-100]/50 dark:bg-[--color-primary-600]/20 border border-[--color-primary-200] dark:border-[--color-primary-600]/50"
        >
          <p className="text-sm text-[--color-primary-800] dark:text-[--color-primary-300]">
            <strong>Development Mode:</strong> This demo uses Appwrite ORM's development mode. All data is stored locally in browser cookies. 
            No real Appwrite server is needed, making it perfect for testing and prototyping!
          </p>
        </motion.div>
      </div>
    </div>
  );
}
