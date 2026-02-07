/**
 * Connect data type
 */
export type Connect = {
  id: string;
  userId: string;
  dreamId?: string;
  withWhom: string;
  withWhomId: string;
  when?: string;
  notes?: string;
  status?: "pending" | "completed";
  agenda?: string;
  proposedWeeks?: string[];
  schedulingMethod?: string;
  createdAt?: string;
  updatedAt?: string;
};
