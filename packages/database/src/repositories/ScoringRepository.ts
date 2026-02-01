import type { Database } from '@azure/cosmos';
import type { ScoringDocument } from '@dreamspace/shared';
import { BaseRepository, type ContainerConfig } from './BaseRepository';

/**
 * Repository for scoring operations.
 * Handles yearly scoring rollups.
 */
export class ScoringRepository extends BaseRepository {
  constructor(database: Database, containerConfig: ContainerConfig) {
    super(database, containerConfig);
  }

  /**
   * Gets scoring document for a specific year
   * @param userId - User ID
   * @param year - Year
   * @returns Scoring document or null if not found
   */
  async getScoring(userId: string, year: number): Promise<ScoringDocument | null> {
    const container = this.getContainer('scoring');
    const id = `${userId}_${year}`;
    
    try {
      const { resource } = await container.item(id, userId).read<ScoringDocument>();
      return resource ?? null;
    } catch (error) {
      return this.handleReadError<ScoringDocument>(error);
    }
  }

  /**
   * Gets all scoring documents for a user
   * @param userId - User ID
   * @returns Array of scoring documents
   */
  async getAllYearsScoring(userId: string): Promise<ScoringDocument[]> {
    const container = this.getContainer('scoring');
    
    try {
      const query = {
        query: 'SELECT * FROM c WHERE c.userId = @userId ORDER BY c.year DESC',
        parameters: [{ name: '@userId', value: userId }],
      };
      
      const { resources } = await container.items.query<ScoringDocument>(query).fetchAll();
      return resources;
    } catch (error) {
      console.error('Error fetching all years scoring:', error);
      return [];
    }
  }

  /**
   * Upserts scoring document
   * @param userId - User ID
   * @param year - Year
   * @param scoringData - Scoring data
   * @returns Saved scoring document
   */
  async upsertScoring(
    userId: string,
    year: number,
    scoringData: Partial<ScoringDocument>
  ): Promise<ScoringDocument> {
    const container = this.getContainer('scoring');
    
    const document: ScoringDocument = {
      id: `${userId}_${year}`,
      userId,
      year,
      ...scoringData,
    } as ScoringDocument;

    this.addTimestamps(document, !scoringData.createdAt);

    const { resource } = await container.items.upsert(document);
    
    if (!resource) {
      throw new Error('Failed to upsert scoring');
    }
    
    return this.castResource<ScoringDocument>(resource);
  }
}
