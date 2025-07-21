import { drizzle } from 'drizzle-orm/d1';
import { logger } from '@/lib/logger';
import * as schema from './schema';

// Database client factory
export function createDatabaseClient(database: D1Database) {
  const db = drizzle(database, { 
    schema,
    logger: {
      logQuery: (query: string, params: unknown[]) => {
        logger.debug('Database query executed', {
          query: query.substring(0, 200), // Truncate long queries
          paramCount: params.length,
          component: 'database'
        });
      }
    }
  });

  return db;
}

// Database connection wrapper with error handling
export async function withDatabase<T>(
  database: D1Database,
  operation: (db: ReturnType<typeof createDatabaseClient>) => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const db = createDatabaseClient(database);
    const result = await operation(db);
    
    const duration = Date.now() - startTime;
    logger.debug('Database operation completed', {
      duration,
      component: 'database'
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Database operation failed', {
      error: (error as Error).message,
      stack: (error as Error).stack,
      duration,
      component: 'database'
    });
    throw error;
  }
}

// Utility function for generating secure IDs
export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const randomBytes = new Uint8Array(8);
  crypto.getRandomValues(randomBytes);
  const randomString = Array.from(randomBytes, byte => byte.toString(36)).join('');
  return `${timestamp}_${randomString}`;
}

// Utility function for hashing auth tokens
export async function hashAuthToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Utility function for generating secure auth tokens
export function generateAuthToken(): string {
  const buffer = new Uint8Array(32);
  crypto.getRandomValues(buffer);
  return Array.from(buffer)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Type definitions for database operations
export type DatabaseClient = ReturnType<typeof createDatabaseClient>;

// Common database patterns
export const DatabasePatterns = {
  // Pagination helper
  paginate: <T>(query: T, page: number = 1, limit: number = 10) => {
    const offset = (page - 1) * limit;
    // @ts-ignore - Drizzle query methods
    return query.limit(limit).offset(offset);
  },

  // Date range filter helper
  dateRange: (column: any, startDate: string, endDate: string) => {
    // @ts-ignore - Drizzle SQL operations
    return sql`${column} >= ${startDate} AND ${column} <= ${endDate}`;
  }
}; 