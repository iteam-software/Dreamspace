import type { Database } from '@azure/cosmos';
import type { DreamsDocument } from '@dreamspace/shared';
import { BaseRepository, type ContainerConfig } from './BaseRepository';

/**
 * Repository for dreams document operations.
 * Handles aggregated dreamBook and weekly goal templates.
 */
export class DreamsRepository extends BaseRepository {
  constructor(database: Database, containerConfig: ContainerConfig) {
    super(database, containerConfig);
  }

  /**
   * Gets dreams document (aggregated format)
   * @param userId - User ID
   * @returns Dreams document or null if not found
   */
  async getDreamsDocument(userId: string): Promise<DreamsDocument | null> {
    const container = this.getContainer('dreams');
    
    try {
      const { resource } = await container.item(userId, userId).read<DreamsDocument>();
      return resource ?? null;
    } catch (error) {
      return this.handleReadError<DreamsDocument>(error);
    }
  }

  /**
   * Upserts dreams document
   * @param userId - User ID
   * @param dreamsData - Dreams data (dreamBook, weeklyGoalTemplates)
   * @returns Saved dreams document
   */
  async upsertDreamsDocument(
    userId: string,
    dreamsData: Partial<DreamsDocument>
  ): Promise<DreamsDocument> {
    const container = this.getContainer('dreams');
    
    const document: DreamsDocument = {
      id: userId,
      userId,
      ...dreamsData,
    } as DreamsDocument;

    // Add timestamps
    this.addTimestamps(document, !dreamsData.createdAt);

    const { resource } = await container.items.upsert(document);
    
    if (!resource) {
      throw new Error('Failed to upsert dreams document');
    }
    
    return this.castResource<DreamsDocument>(resource);
  }
}
