'use server';

import { withAuth, createActionSuccess, handleActionError } from '@/lib/actions';
import { BlobServiceClient } from '@azure/storage-blob';

const CONTAINER_NAME = 'user-backgrounds';

interface UploadBackgroundImageInput {
  userId: string;
  imageUrl?: string;
  imageData?: string | Buffer;
}

/**
 * Uploads a user background image to Azure Blob Storage.
 * Supports both direct upload and fetching from URL (DALL-E, Unsplash).
 * 
 * @param input - Contains userId and either imageUrl or imageData
 * @returns URL of uploaded image
 */
export const uploadUserBackgroundImage = withAuth(async (user, input: UploadBackgroundImageInput) => {
  try {
    const { userId, imageUrl, imageData } = input;
    
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    // Only allow users to upload their own background image
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
    
    let imageBuffer: Buffer;
    let contentType = 'image/jpeg';
    
    if (imageUrl) {
      // Fetch image from URL (for DALL-E or Unsplash images)
      if (imageUrl.startsWith('data:')) {
        // Base64 data URL
        const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (!matches) {
          throw new Error('Invalid data URL format');
        }
        contentType = matches[1];
        imageBuffer = Buffer.from(matches[2], 'base64');
      } else {
        // Fetch from external URL
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
        
        // Detect content type from URL
        if (imageUrl.includes('.png')) {
          contentType = 'image/png';
        } else if (imageUrl.includes('.webp')) {
          contentType = 'image/webp';
        }
      }
    } else if (imageData) {
      // Direct image data upload
      if (typeof imageData === 'string') {
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        imageBuffer = Buffer.from(base64Data, 'base64');
      } else {
        imageBuffer = imageData;
      }
    } else {
      throw new Error('Either imageUrl or imageData is required');
    }
    
    if (!imageBuffer || imageBuffer.length === 0) {
      throw new Error('Image data is required');
    }
    
    // Detect content type from buffer if not already set
    if (imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50) {
      contentType = 'image/png';
    } else if (imageBuffer[0] === 0x47 && imageBuffer[1] === 0x49) {
      contentType = 'image/gif';
    } else if (imageBuffer[0] === 0x52 && imageBuffer[1] === 0x49) {
      contentType = 'image/webp';
    }
    
    // Get container client
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
    
    // Ensure container exists
    await containerClient.createIfNotExists({
      access: 'blob' // Public read access
    });
    
    // Create safe filename with timestamp
    const safeUserId = userId.replace(/[^a-zA-Z0-9-_@.]/g, '_');
    const timestamp = Date.now();
    const extensionMap: Record<string, string> = { 
      'image/webp': 'webp', 
      'image/jpeg': 'jpg', 
      'image/png': 'png' 
    };
    const extension = extensionMap[contentType] || 'jpg';
    const blobName = `${safeUserId}_${timestamp}.${extension}`;
    
    // Get blob client
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    // Upload the image
    await blockBlobClient.upload(imageBuffer, imageBuffer.length, {
      blobHTTPHeaders: {
        blobContentType: contentType
      }
    });
    
    const blobUrl = blockBlobClient.url;
    
    return createActionSuccess({
      url: blobUrl,
      message: 'User background image uploaded successfully'
    });
  } catch (error) {
    console.error('Failed to upload user background image:', error);
    return handleActionError(error, 'Failed to upload user background image');
  }
});
