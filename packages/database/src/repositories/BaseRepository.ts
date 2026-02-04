import type { Container, Database } from '@azure/cosmos';

/**
 * Container configuration mapping
 */
export interface ContainerConfig {
  [key: string]: {
    name: string;
    partitionKey: string;
  };
}

/**
 * Base repository class for Cosmos DB operations.
 * Provides shared utilities and common patterns for all repositories.
 */
export class BaseRepository {
  protected database: Database;
  protected containerConfig: ContainerConfig;
  protected containers: Map<string, Container>;

  /**
   * Creates a new BaseRepository instance
   * @param database - Cosmos DB database instance
   * @param containerConfig - Container configuration object
   */
  constructor(database: Database, containerConfig: ContainerConfig) {
    if (!database) {
      throw new Error('Database instance is required');
    }
    this.database = database;
    this.containerConfig = containerConfig;
    this.containers = new Map();
  }

  /**
   * Gets a container reference by logical name
   * @param name - Container name from configuration
   * @returns Cosmos DB container instance
   */
  protected getContainer(name: string): Container {
    // Cache container references
    let container = this.containers.get(name);
    
    if (!container) {
      const config = this.containerConfig[name];
      if (!config) {
        throw new Error(`Container '${name}' not found in configuration`);
      }
      container = this.database.container(config.name);
      this.containers.set(name, container);
    }
    
    return container;
  }

  /**
   * Removes Cosmos DB internal metadata from documents
   * @param doc - Document with Cosmos metadata
   * @returns Document without Cosmos metadata
   */
  protected cleanMetadata<T>(doc: T & Record<string, unknown>): T {
    if (!doc) {
      return doc;
    }
    
    const { _rid, _self, _etag, _attachments, _ts, ...clean } = doc;
    return clean as T;
  }

  /**
   * Logs write operations for debugging and monitoring
   * @param containerName - Container name
   * @param partitionKey - Partition key value
   * @param id - Document ID
   * @param operation - Operation type (upsert, delete, etc.)
   * @param metadata - Additional metadata to log
   */
  protected logWrite(
    containerName: string,
    partitionKey: string,
    id: string,
    operation: string,
    metadata: Record<string, unknown> = {}
  ): void {
    console.log('💾 WRITE:', {
      container: containerName,
      partitionKey,
      id,
      operation,
      ...metadata,
    });
  }

  /**
   * Handles common read errors (404 = not found)
   * @param error - Error from Cosmos DB
   * @param defaultValue - Value to return if not found
   * @returns Default value if 404, otherwise throws
   */
  protected handleReadError<T>(error: unknown, defaultValue: T | null = null): T | null {
    if (
      typeof error === 'object' &&
      error !== null &&
      ('code' in error && (error.code === 404 || error.code === 'NotFound'))
    ) {
      return defaultValue;
    }
    throw error;
  }

  /**
   * Adds timestamp fields to a document
   * @param doc - Document to add timestamps to
   * @param isNew - Whether this is a new document (adds createdAt)
   * @returns Document with timestamps
   */
  protected addTimestamps<T extends { createdAt?: string; updatedAt?: string }>(
    doc: T,
    isNew = false
  ): T {
    const now = new Date().toISOString();
    
    if (isNew) {
      doc.createdAt = now;
    }
    doc.updatedAt = now;
    
    return doc;
  }

  /**
   * Safely casts Cosmos DB resource to a typed document
   * @param resource - Resource from Cosmos DB
   * @returns Typed document
   */
  protected castResource<T>(resource: unknown): T {
    return resource as unknown as T;
  }
}
