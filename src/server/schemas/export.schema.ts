import { z } from "zod";

export const logExportSchema = z.object({
  fileName: z.string().trim().min(1, "File name is required"),
  format: z.string().trim().min(1, "Format is required"),
  quality: z.number().int().min(1).max(100).optional(),
  dimensions: z.string().trim().min(1, "Dimensions are required"),
  stepsCount: z.number().int().min(0).default(0),
});

export const reportStepItemSchema = z.object({
  stepIndex: z.number().int().min(0),
  module: z.string(),
  algorithm: z.string(),
  label: z.string(),
  parameters: z.any().optional(),
  appliedAt: z.string(),
});

export const generateReportSchema = z.object({
  projectName: z.string().trim().min(1, "Project name is required"),
  imageName: z.string().trim().min(1, "Image name is required"),
  dimensions: z.string().trim().min(1, "Dimensions are required"),
  format: z.string().trim().min(1, "Format is required"),
  history: z.array(reportStepItemSchema).default([]),
});

export type LogExportInput = z.infer<typeof logExportSchema>;
export type ReportStepItem = z.infer<typeof reportStepItemSchema>;
export type GenerateReportInput = z.infer<typeof generateReportSchema>;
