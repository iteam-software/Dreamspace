import type { Database } from '@azure/cosmos';
import type { CurrentWeekDocument, PastWeeksDocument } from '@dreamspace/shared';
import { BaseRepository, type ContainerConfig } from './BaseRepository';

/**
 * Repository for week-related operations.
 * Handles current week and past weeks documents.
 */
export class WeeksRepository extends BaseRepository {
  constructor(database: Database, containerConfig: ContainerConfig) {
    super(database, containerConfig);
  }

  /**
   * Gets current week document
   * @param userId - User ID
   * @returns Current week document or null if not found
   */
  async getCurrentWeek(userId: string): Promise<CurrentWeekDocument | null> {
    const container = this.getContainer('currentWeek');
    
    try {
      const { resource } = await container.item(userId, userId).read<CurrentWeekDocument>();
      return resource ?? null;
    } catch (error) {
      return this.handleReadError<CurrentWeekDocument>(error);
    }
  }

  /**
   * Upserts current week document
   * @param userId - User ID
   * @param weekData - Week data
   * @returns Saved current week document
   */
  async upsertCurrentWeek(
    userId: string,
    weekData: Partial<CurrentWeekDocument>
  ): Promise<CurrentWeekDocument> {
    const container = this.getContainer('currentWeek');
    
    const document: CurrentWeekDocument = {
      id: userId,
      userId,
      ...weekData,
    } as CurrentWeekDocument;

    this.addTimestamps(document, !weekData.createdAt);

    const { resource } = await container.items.upsert(document);
    
    if (!resource) {
      throw new Error('Failed to upsert current week');
    }
    
    return this.castResource<CurrentWeekDocument>(resource);
  }

  /**
   * Gets past weeks document
   * @param userId - User ID
   * @returns Past weeks document or null if not found
   */
  async getPastWeeks(userId: string): Promise<PastWeeksDocument | null> {
    const container = this.getContainer('pastWeeks');
    
    try {
      const { resource } = await container.item(userId, userId).read<PastWeeksDocument>();
      return resource ?? null;
    } catch (error) {
      return this.handleReadError<PastWeeksDocument>(error);
    }
  }

  /**
   * Upserts past weeks document
   * @param userId - User ID
   * @param weeksData - Past weeks data
   * @returns Saved past weeks document
   */
  async upsertPastWeeks(
    userId: string,
    weeksData: Partial<PastWeeksDocument>
  ): Promise<PastWeeksDocument> {
    const container = this.getContainer('pastWeeks');
    
    const document: PastWeeksDocument = {
      id: userId,
      userId,
      ...weeksData,
    } as PastWeeksDocument;

    this.addTimestamps(document, !weeksData.createdAt);

    const { resource } = await container.items.upsert(document);
    
    if (!resource) {
      throw new Error('Failed to upsert past weeks');
    }
    
    return this.castResource<PastWeeksDocument>(resource);
  }
}
