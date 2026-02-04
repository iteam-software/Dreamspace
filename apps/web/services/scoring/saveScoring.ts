'use server';

import { withAuth, createActionSuccess, handleActionError } from '@/lib/actions';
import { getDatabaseClient } from '@dreamspace/database';

interface SaveScoringInput {
  userId: string;
  year: number;
  entry: {
    id?: string;
    date?: string;
    source: string;
    dreamId?: string;
    weekId?: string;
    connectId?: string;
    points: number;
    activity: string;
    createdAt?: string;
  };
}

/**
 * Saves a scoring entry for a user.
 * Adds the entry to the user's scoring document and updates the total score.
 * 
 * @param input - Contains userId, year, and entry data
 * @returns Success response with entry ID and updated total score
 */
export const saveScoring = withAuth(async (user, input: SaveScoringInput) => {
  try {
    const { userId, year, entry } = input;
    
    if (!userId || !year || !entry) {
      throw new Error('userId, year, and entry are required');
    }
    
    // Only allow users to save their own scoring
    if (user.id !== userId) {
      throw new Error('Forbidden');
    }
    
    const db = getDatabaseClient();
    const documentId = `${userId}_${year}_scoring`;
    
    // Try to read existing document
    let existingDoc;
    try {
      existingDoc = await db.scoring.getScoringDocument(userId, year);
    } catch (error: any) {
      if (error.code !== 404) {
        throw error;
      }
      // Document doesn't exist yet, will create new one
    }
    
    // Prepare the new entry
    const newEntry = {
      id: entry.id || `score_${crypto.randomUUID()}`,
      date: entry.date || new Date().toISOString().split('T')[0],
      source: entry.source,
      dreamId: entry.dreamId,
      weekId: entry.weekId,
      connectId: entry.connectId,
      points: entry.points,
      activity: entry.activity,
      createdAt: entry.createdAt || new Date().toISOString()
    };
    
    let document;
    if (existingDoc) {
      // Update existing document - add entry and update total
      document = {
        ...existingDoc,
        totalScore: (existingDoc.totalScore || 0) + newEntry.points,
        entries: [...(existingDoc.entries || []), newEntry],
        updatedAt: new Date().toISOString()
      };
    } else {
      // Create new document
      document = {
        id: documentId,
        userId,
        year,
        totalScore: newEntry.points,
        entries: [newEntry],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    
    await db.scoring.upsertScoring(userId, year, document);
    
    return createActionSuccess({
      id: documentId,
      entryId: newEntry.id,
      totalScore: document.totalScore
    });
  } catch (error) {
    console.error('Failed to save scoring:', error);
    return handleActionError(error, 'Failed to save scoring');
  }
});
