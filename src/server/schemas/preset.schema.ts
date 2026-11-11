import { z } from "zod";

export const createPresetSchema = z.object({
  projectId: z.string().optional(),
  name: z.string().trim().min(1, "Preset name is required"),
  description: z.string().optional(),
  module: z.string().trim().min(1, "Module identifier is required"),
  algorithm: z.string().trim().min(1, "Algorithm identifier is required"),
  parameters: z.union([z.record(z.string(), z.any()), z.string()]).default({}),
});

export const listPresetsSchema = z.object({
  module: z.string().optional(),
});

export const presetIdSchema = z.object({
  id: z.string().min(1, "Preset ID is required"),
});

export type CreatePresetInput = z.infer<typeof createPresetSchema>;
export type ListPresetsInput = z.infer<typeof listPresetsSchema>;
export type PresetIdInput = z.infer<typeof presetIdSchema>;
