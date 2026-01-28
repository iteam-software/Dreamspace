import type { Database } from '@azure/cosmos';
import type { PromptDocument } from '@dreamspace/shared';
import { BaseRepository, type ContainerConfig } from './BaseRepository';

/**
 * Repository for prompt operations.
 * Handles AI prompt configurations and history.
 */
export class PromptsRepository extends BaseRepository {
  constructor(database: Database, containerConfig: ContainerConfig) {
    super(database, containerConfig);
  }

  /**
   * Gets active prompts by type
   * @param promptType - Type of prompt
   * @returns Array of active prompt documents
   */
  async getActivePrompts(promptType: string): Promise<PromptDocument[]> {
    const container = this.getContainer('prompts');
    
    try {
      const query = {
        query:
          'SELECT * FROM c WHERE c.promptType = @promptType AND c.isActive = true ORDER BY c.version DESC',
        parameters: [{ name: '@promptType', value: promptType }],
      };
      
      const { resources } = await container.items.query<PromptDocument>(query).fetchAll();
      return resources;
    } catch (error) {
      console.error('Error fetching active prompts:', error);
      return [];
    }
  }

  /**
   * Gets prompt by ID
   * @param promptId - Prompt ID
   * @param partitionKey - Partition key
   * @returns Prompt document or null if not found
   */
  async getPrompt(promptId: string, partitionKey: string): Promise<PromptDocument | null> {
    const container = this.getContainer('prompts');
    
    try {
      const { resource } = await container.item(promptId, partitionKey).read<PromptDocument>();
      return resource ?? null;
    } catch (error) {
      return this.handleReadError<PromptDocument>(error);
    }
  }

  /**
   * Creates a new prompt
   * @param promptData - Prompt data
   * @returns Saved prompt document
   */
  async createPrompt(promptData: Omit<PromptDocument, 'id'>): Promise<PromptDocument> {
    const container = this.getContainer('prompts');
    
    const document: PromptDocument = {
      ...promptData,
      id: `prompt_${promptData.promptType}_${Date.now()}`,
    } as PromptDocument;

    this.addTimestamps(document, true);

    const { resource } = await container.items.create(document);
    
    if (!resource) {
      throw new Error('Failed to create prompt');
    }
    
    return resource;
  }

  /**
   * Upserts a prompt
   * @param promptData - Prompt data
   * @returns Saved prompt document
   */
  async upsertPrompt(promptData: Partial<PromptDocument>): Promise<PromptDocument> {
    const container = this.getContainer('prompts');
    
    const document: PromptDocument = {
      ...promptData,
    } as PromptDocument;

    this.addTimestamps(document, !promptData.createdAt);

    const { resource } = await container.items.upsert(document);
    
    if (!resource) {
      throw new Error('Failed to upsert prompt');
    }
    
    return this.castResource<PromptDocument>(resource);
  }
}
