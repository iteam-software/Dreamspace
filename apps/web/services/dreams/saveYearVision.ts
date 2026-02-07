"use server";

import {
  withAuth,
  createActionSuccess,
  handleActionError,
} from "@/lib/actions";
import { getDatabaseClient } from "@dreamspace/database";

interface SaveYearVisionInput {
  userId: string;
  yearVision: string;
}

/**
 * Saves the year vision for a user.
 * Year vision is stored in the dreams document.
 *
 * @param input - Contains userId and yearVision text
 * @returns Success response
 */
export const saveYearVision = withAuth(
  async (user, input: SaveYearVisionInput) => {
    try {
      const { userId, yearVision } = input;

      if (!userId) {
        throw new Error("userId is required");
      }

      // Only allow users to save their own year vision
      if (user.id !== userId) {
        throw new Error("Forbidden");
      }

      const db = getDatabaseClient();

      // Get existing dreams document or create new one
      const existingDoc = await db.dreams.getDreamsDocument(userId);

      const document = {
        ...existingDoc,
        id: userId,
        userId: userId,
        dreams: existingDoc?.dreams || [],
        weeklyGoalTemplates: existingDoc?.weeklyGoalTemplates || [],
        yearVision: yearVision,
        createdAt: existingDoc?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.dreams.upsertDreamsDocument(userId, document);

      return createActionSuccess({
        id: userId,
        message: "Year vision saved successfully",
      });
    } catch (error) {
      console.error("Failed to save year vision:", error);
      return handleActionError(error, "Failed to save year vision");
    }
  },
);
