'use server';

import { createActionSuccess, handleActionError } from '@/lib/actions';

/**
 * Health check endpoint for the API.
 * 
 * @returns Health status
 */
export const health = async () => {
  try {
    return createActionSuccess({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return handleActionError(error, 'Health check failed');
  }
};
