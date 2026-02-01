import type { Database } from '@azure/cosmos';
import type { UserProfile } from '@dreamspace/shared';
import { BaseRepository, type ContainerConfig } from './BaseRepository';

/**
 * Repository for user profile operations.
 * Handles CRUD operations for user documents in Cosmos DB.
 */
export class UserRepository extends BaseRepository {
  constructor(database: Database, containerConfig: ContainerConfig) {
    super(database, containerConfig);
  }

  /**
   * Reads a user profile by user ID
   * @param userId - User ID
   * @returns User profile or null if not found
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const container = this.getContainer('users');
    
    try {
      const { resource } = await container.item(userId, userId).read<UserProfile>();
      return resource ?? null;
    } catch (error) {
      return this.handleReadError<UserProfile>(error);
    }
  }

  /**
   * Upserts a user profile
   * @param userId - User ID
   * @param profile - User profile data
   * @returns Saved user profile
   */
  async upsertUserProfile(userId: string, profile: Partial<UserProfile>): Promise<UserProfile> {
    const container = this.getContainer('users');
    
    const document: UserProfile = {
      ...profile,
      id: userId,
      userId,
    } as UserProfile;

    // Add timestamps
    this.addTimestamps(document, !profile.createdAt);

    const { resource } = await container.items.upsert(document);
    
    if (!resource) {
      throw new Error('Failed to upsert user profile');
    }
    
    return this.castResource<UserProfile>(resource);
  }
}
