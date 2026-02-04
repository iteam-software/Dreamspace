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
   * Gets all user profiles
   * @returns Array of user profiles
   */
  async getAllUsers(): Promise<UserProfile[]> {
    const container = this.getContainer('users');
    
    try {
      const query = {
        query: 'SELECT * FROM c',
      };
      
      const { resources } = await container.items.query<UserProfile>(query).fetchAll();
      return resources;
    } catch (error) {
      console.error('Error fetching all users:', error);
      return [];
    }
  }

  /**
   * Gets multiple user profiles by user IDs
   * @param userIds - Array of user IDs
   * @returns Array of user profiles
   */
  async getUsersByIds(userIds: string[]): Promise<UserProfile[]> {
    if (userIds.length === 0) {
      return [];
    }

    const container = this.getContainer('users');
    
    try {
      const query = {
        query: `SELECT * FROM c WHERE c.userId IN (${userIds.map((_, i) => `@userId${i}`).join(', ')})`,
        parameters: userIds.map((id: string, i: number) => ({ name: `@userId${i}`, value: id }))
      };
      
      const { resources } = await container.items.query<UserProfile>(query).fetchAll();
      return resources;
    } catch (error) {
      console.error('Error fetching users by IDs:', error);
      return [];
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

  /**
   * Updates a user profile by ID
   * @param userId - User ID
   * @param profileData - User profile data to update
   * @returns Updated user profile
   */
  async updateUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<UserProfile> {
    const container = this.getContainer('users');
    
    const document: UserProfile = {
      ...profileData,
      id: userId,
      userId,
    } as UserProfile;

    this.addTimestamps(document, !profileData.createdAt);

    const { resource } = await container.item(userId, userId).replace(document);
    
    if (!resource) {
      throw new Error('Failed to update user profile');
    }
    
    return this.castResource<UserProfile>(resource);
  }
}
