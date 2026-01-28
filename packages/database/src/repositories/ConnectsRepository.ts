import type { Database } from '@azure/cosmos';
import type { ConnectDocument } from '@dreamspace/shared';
import { BaseRepository, type ContainerConfig } from './BaseRepository';

/**
 * Repository for connect operations.
 * Handles individual connect records.
 */
export class ConnectsRepository extends BaseRepository {
  constructor(database: Database, containerConfig: ContainerConfig) {
    super(database, containerConfig);
  }

  /**
   * Gets all connects for a user
   * @param userId - User ID
   * @returns Array of connect documents
   */
  async getConnects(userId: string): Promise<ConnectDocument[]> {
    const container = this.getContainer('connects');
    
    try {
      const query = {
        query: 'SELECT * FROM c WHERE c.userId = @userId ORDER BY c.connectDate DESC',
        parameters: [{ name: '@userId', value: userId }],
      };
      
      const { resources } = await container.items.query<ConnectDocument>(query).fetchAll();
      return resources;
    } catch (error) {
      console.error('Error fetching connects:', error);
      return [];
    }
  }

  /**
   * Gets a single connect by ID
   * @param connectId - Connect ID
   * @param userId - User ID (partition key)
   * @returns Connect document or null if not found
   */
  async getConnect(connectId: string, userId: string): Promise<ConnectDocument | null> {
    const container = this.getContainer('connects');
    
    try {
      const { resource } = await container.item(connectId, userId).read<ConnectDocument>();
      return resource ?? null;
    } catch (error) {
      return this.handleReadError<ConnectDocument>(error);
    }
  }

  /**
   * Creates a new connect
   * @param connectData - Connect data
   * @returns Saved connect document
   */
  async createConnect(connectData: Omit<ConnectDocument, 'id'>): Promise<ConnectDocument> {
    const container = this.getContainer('connects');
    
    const document: ConnectDocument = {
      ...connectData,
      id: `connect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    } as ConnectDocument;

    this.addTimestamps(document, true);

    const { resource } = await container.items.create(document);
    
    if (!resource) {
      throw new Error('Failed to create connect');
    }
    
    return resource;
  }

  /**
   * Deletes a connect
   * @param connectId - Connect ID
   * @param userId - User ID (partition key)
   */
  async deleteConnect(connectId: string, userId: string): Promise<void> {
    const container = this.getContainer('connects');
    await container.item(connectId, userId).delete();
  }
}
