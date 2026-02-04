'use server';

import { withAuth, createActionSuccess, handleActionError } from '@/lib/actions';
import { BlobServiceClient } from '@azure/storage-blob';

const CONTAINER_NAME = 'profile-pictures';

/**
 * Uploads a profile picture to Azure Blob Storage.
 * 
 * @param userId - User ID
 * @param imageData - Base64 encoded image data or Buffer
 * @returns URL of uploaded image
 */
export const uploadProfilePicture = withAuth(async (user, userId: string, imageData: string | Buffer) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    // Only allow users to upload their own profile picture
    if (user.id !== userId) {
      throw new Error('Forbidden');
    }
    
    // Check if Blob Storage is configured
    if (!process.env.AZURE_STORAGE_CONNECTION_STRING) {
      throw new Error('Blob storage not configured - missing AZURE_STORAGE_CONNECTION_STRING');
    }
    
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING
    );
    
    // Convert imageData to Buffer if it's a base64 string
    let imageBuffer: Buffer;
    if (typeof imageData === 'string') {
      // Remove data URL prefix if present
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else {
      imageBuffer = imageData;
    }
    
    if (!imageBuffer || imageBuffer.length === 0) {
      throw new Error('Image data is required');
    }
    
    // Get container client
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
    
    // Ensure container exists
    await containerClient.createIfNotExists({
      access: 'blob' // Public read access
    });
    
    // Create safe filename
    const safeUserId = userId.replace(/[^a-zA-Z0-9-_@.]/g, '_');
    const blobName = `${safeUserId}.jpg`;
    
    // Get blob client
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    // Detect content type
    let contentType = 'image/jpeg';
    if (imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50) {
      contentType = 'image/png';
    } else if (imageBuffer[0] === 0x47 && imageBuffer[1] === 0x49) {
      contentType = 'image/gif';
    } else if (imageBuffer[0] === 0x52 && imageBuffer[1] === 0x49) {
      contentType = 'image/webp';
    }
    
    // Upload the image
    await blockBlobClient.upload(imageBuffer, imageBuffer.length, {
      blobHTTPHeaders: {
        blobContentType: contentType
      }
    });
    
    const blobUrl = blockBlobClient.url;
    
    return createActionSuccess({
      url: blobUrl,
      message: 'Profile picture uploaded successfully'
    });
  } catch (error) {
    console.error('Failed to upload profile picture:', error);
    return handleActionError(error, 'Failed to upload profile picture');
  }
});
