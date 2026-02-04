'use server';

import { withAuth, createActionSuccess, handleActionError } from '@/lib/actions';
import { getDatabaseClient } from '@dreamspace/database';

interface SaveConnectInput {
  userId: string;
  connectData: {
    id?: string;
    userId?: string;
    type?: string;
    withWhom: string;
    withWhomId: string;
    when: string;
    notes?: string;
    status?: string;
    agenda?: string;
    proposedWeeks?: string[];
    schedulingMethod?: string;
    dreamId?: string;
    name?: string;
    category?: string;
    avatar?: string;
    office?: string;
    createdAt?: string;
  };
}

/**
 * Saves a connect (Dream Connect) for a user.
 * Uses sender's userId as partition key to keep connects in correct partition.
 * 
 * @param input - Contains userId and connectData
 * @returns Saved connect document
 */
export const saveConnect = withAuth(async (user, input: SaveConnectInput) => {
  try {
    const { userId, connectData } = input;
    
    if (!connectData) {
      throw new Error('connectData is required');
    }
    
    // Use the connect's userId (sender's ID) as partition key
    const partitionUserId = connectData.userId || userId;
    
    if (!partitionUserId) {
      throw new Error('userId is required in connectData');
    }
    
    const db = getDatabaseClient();
    
    // Create the connect document
    const connectId = connectData.id 
      ? String(connectData.id) 
      : `connect_${partitionUserId}_${Date.now()}`;
    
    const document = {
      id: connectId,
      userId: partitionUserId, // Always use sender's userId as partition key
      type: connectData.type || 'connect',
      withWhom: connectData.withWhom,
      withWhomId: connectData.withWhomId,
      when: connectData.when,
      notes: connectData.notes || '',
      status: connectData.status || 'pending',
      agenda: connectData.agenda,
      proposedWeeks: connectData.proposedWeeks || [],
      schedulingMethod: connectData.schedulingMethod,
      dreamId: connectData.dreamId || undefined,
      name: connectData.name,
      category: connectData.category,
      avatar: connectData.avatar,
      office: connectData.office,
      createdAt: connectData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await db.connects.upsertConnect(partitionUserId, document);
    
    return createActionSuccess({
      id: connectId,
      connect: document
    });
  } catch (error) {
    console.error('Failed to save connect:', error);
    return handleActionError(error, 'Failed to save connect');
  }
});
