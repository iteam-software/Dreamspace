import type { Database } from '@azure/cosmos';
import { BaseRepository, type ContainerConfig } from './BaseRepository';

/**
 * Repository for item operations.
 * Handles generic item records.
 * NOTE: This is largely deprecated in favor of dedicated repositories
 * (dreams, connects, etc.) but kept for backward compatibility.
 */
export class ItemsRepository extends BaseRepository {
  constructor(database: Database, containerConfig: ContainerConfig) {
    super(database, containerConfig);
  }

  /**
   * Gets items for a user with optional filtering
   * @param userId - User ID
   * @param type - Optional item type filter
   * @param weekId - Optional week ID filter
   * @returns Array of items matching criteria
   */
  async getItems(userId: string, type?: string, weekId?: string): Promise<any[]> {
    const container = this.getContainer('items');
    
    try {
      let query: string;
      const parameters: Array<{ name: string; value: any }> = [];
      
      if (type && weekId) {
        query = 'SELECT * FROM c WHERE c.userId = @userId AND c.type = @type AND c.weekId = @weekId';
        parameters.push(
          { name: '@userId', value: userId },
          { name: '@type', value: type },
          { name: '@weekId', value: weekId }
        );
      } else if (type) {
        query = 'SELECT * FROM c WHERE c.userId = @userId AND c.type = @type';
        parameters.push(
          { name: '@userId', value: userId },
          { name: '@type', value: type }
        );
      } else if (weekId) {
        query = 'SELECT * FROM c WHERE c.userId = @userId AND c.weekId = @weekId';
        parameters.push(
          { name: '@userId', value: userId },
          { name: '@weekId', value: weekId }
        );
      } else {
        query = 'SELECT * FROM c WHERE c.userId = @userId';
        parameters.push({ name: '@userId', value: userId });
      }
      
      const { resources } = await container.items.query<any>({ query, parameters }).fetchAll();
      return resources;
    } catch (error) {
      console.error('Error fetching items:', error);
      return [];
    }
  }

  /**
   * Deletes an item
   * @param itemId - Item ID
   * @param userId - User ID (partition key)
   */
  async deleteItem(itemId: string, userId: string): Promise<void> {
    const container = this.getContainer('items');
    await container.item(itemId, userId).delete();
  }
}
