/**
 * Fake database implementation using browser cookies for development mode
 * This allows developers to test the ORM without an actual Appwrite backend
 */

import { DatabaseSchema } from '../shared/types';
import { Validator } from '../shared/utils';

interface Document {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  [key: string]: any;
}

interface Collection {
  documents: Document[];
}

interface FakeDatabase {
  [collectionId: string]: Collection;
}

export class FakeDatabaseClient {
  private static readonly COOKIE_PREFIX = 'appwrite_orm_dev_';
  private static readonly MAX_COOKIE_SIZE = 4000; // Stay under 4KB cookie limit

  constructor(private databaseId: string) {}

  /**
   * Get the database from cookies
   */
  private getDatabase(): FakeDatabase {
    if (typeof document === 'undefined') {
      return {}; // Not in browser environment
    }

    const cookieName = `${FakeDatabaseClient.COOKIE_PREFIX}${this.databaseId}`;
    const cookies = document.cookie.split(';');
    
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === cookieName) {
        try {
          return JSON.parse(decodeURIComponent(value));
        } catch {
          return {};
        }
      }
    }
    
    return {};
  }

  /**
   * Save the database to cookies
   */
  private saveDatabase(db: FakeDatabase): void {
    if (typeof document === 'undefined') {
      return; // Not in browser environment
    }

    const cookieName = `${FakeDatabaseClient.COOKIE_PREFIX}${this.databaseId}`;
    const serialized = JSON.stringify(db);
    
    // Check size and warn if too large
    if (serialized.length > FakeDatabaseClient.MAX_COOKIE_SIZE) {
      console.warn(
        `[AppwriteORM Development Mode] Database size (${serialized.length} bytes) exceeds recommended cookie size. ` +
        `Consider using localStorage or reduce test data.`
      );
    }

    // Set cookie with 1 day expiry
    const expires = new Date(Date.now() + 86400000).toUTCString();
    document.cookie = `${cookieName}=${encodeURIComponent(serialized)}; expires=${expires}; path=/; SameSite=Strict`;
  }

  /**
   * Get collection from database
   */
  private getCollection(collectionId: string): Collection {
    const db = this.getDatabase();
    if (!db[collectionId]) {
      db[collectionId] = { documents: [] };
      this.saveDatabase(db);
    }
    return db[collectionId];
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `dev_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Create a document
   */
  createDocument(
    collectionId: string,
    data: Partial<Document>,
    schema?: DatabaseSchema
  ): Document {
    const db = this.getDatabase();
    const collection = db[collectionId] || { documents: [] };
    
    const now = new Date().toISOString();
    const document: Document = {
      $id: data.$id || this.generateId(),
      $createdAt: now,
      $updatedAt: now,
      ...data
    };

    // Validate if schema provided
    if (schema) {
      this.validateDocument(document, schema);
    }

    collection.documents.push(document);
    db[collectionId] = collection;
    this.saveDatabase(db);
    
    return document;
  }

  /**
   * Get document by ID
   */
  getDocument(collectionId: string, documentId: string): Document | null {
    const collection = this.getCollection(collectionId);
    return collection.documents.find(doc => doc.$id === documentId) || null;
  }

  /**
   * List documents with optional filters
   */
  listDocuments(
    collectionId: string,
    filters?: Record<string, any>
  ): { documents: Document[]; total: number } {
    const collection = this.getCollection(collectionId);
    let documents = [...collection.documents];

    // Apply filters if provided
    if (filters) {
      documents = documents.filter(doc => {
        return Object.entries(filters).every(([key, value]) => {
          if (value === undefined || value === null) return true;
          
          // Handle array values (OR condition)
          if (Array.isArray(value)) {
            return value.includes(doc[key]);
          }
          
          return doc[key] === value;
        });
      });
    }

    return {
      documents,
      total: documents.length
    };
  }

  /**
   * Update a document
   */
  updateDocument(
    collectionId: string,
    documentId: string,
    data: Partial<Document>,
    schema?: DatabaseSchema
  ): Document {
    const db = this.getDatabase();
    const collection = db[collectionId] || { documents: [] };
    
    const docIndex = collection.documents.findIndex(doc => doc.$id === documentId);
    if (docIndex === -1) {
      throw new Error(`Document ${documentId} not found`);
    }

    const updatedDoc: Document = {
      ...collection.documents[docIndex],
      ...data,
      $id: documentId, // Preserve ID
      $updatedAt: new Date().toISOString()
    };

    // Validate if schema provided
    if (schema) {
      this.validateDocument(updatedDoc, schema);
    }

    collection.documents[docIndex] = updatedDoc;
    db[collectionId] = collection;
    this.saveDatabase(db);
    
    return updatedDoc;
  }

  /**
   * Delete a document
   */
  deleteDocument(collectionId: string, documentId: string): void {
    const db = this.getDatabase();
    const collection = db[collectionId] || { documents: [] };
    
    collection.documents = collection.documents.filter(doc => doc.$id !== documentId);
    db[collectionId] = collection;
    this.saveDatabase(db);
  }

  /**
   * Clear all data (for testing)
   */
  clearDatabase(): void {
    if (typeof document === 'undefined') {
      return;
    }

    const cookieName = `${FakeDatabaseClient.COOKIE_PREFIX}${this.databaseId}`;
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }

  /**
   * Validate document against schema
   */
  private validateDocument(doc: Document, schema: DatabaseSchema): void {
    const errors: string[] = [];

    for (const [fieldName, fieldConfig] of Object.entries(schema)) {
      const value = doc[fieldName];
      const fieldErrors = Validator.validateField(value, fieldConfig, fieldName);
      
      if (fieldErrors.length > 0) {
        errors.push(...fieldErrors.map(e => e.message));
      }
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }
}
