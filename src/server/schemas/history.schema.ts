import { z } from "zod";

export const recordHistoryStepSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  stepIndex: z.number().int().min(0, "Step index must be a non-negative integer"),
  module: z.string().min(1, "Module name is required"),
  algorithm: z.string().min(1, "Algorithm identifier is required"),
  label: z.string().min(1, "Step label is required"),
  parameters: z.union([z.record(z.string(), z.any()), z.string()]).default({}),
});

export const getHistorySchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
});

export const clearHistorySchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
});

export type RecordHistoryStepInput = z.infer<typeof recordHistoryStepSchema>;
export type GetHistoryInput = z.infer<typeof getHistorySchema>;
export type ClearHistoryInput = z.infer<typeof clearHistorySchema>;
