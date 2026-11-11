import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Project name cannot be empty").default("Untitled Project"),
  imageName: z.string().trim().default("cosmos.jpg"),
  width: z.number().int().positive("Width must be a positive integer").default(2400),
  height: z.number().int().positive("Height must be a positive integer").default(1800),
  format: z.string().trim().default("JPG"),
});

export const updateProjectSchema = createProjectSchema.partial();

export const projectIdSchema = z.object({
  id: z.string().min(1, "Project ID is required"),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectIdInput = z.infer<typeof projectIdSchema>;
