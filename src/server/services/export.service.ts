import { db } from "../db";
import { LogExportInput, GenerateReportInput } from "../schemas/export.schema";

export class ExportService {
  async logExport(input: LogExportInput) {
    return await db.exportLog.create({
      data: {
        fileName: input.fileName,
        format: input.format,
        quality: input.quality,
        dimensions: input.dimensions,
        stepsCount: input.stepsCount,
      },
    });
  }

  async getExportLogs() {
    return await db.exportLog.findMany({
      orderBy: { exportedAt: "desc" },
      take: 20,
    });
  }

  generateProcessingReport(data: GenerateReportInput) {
    const timestamp = new Date().toISOString();
    return {
      title: "PIXORA Processing Audit Report",
      generatedAt: timestamp,
      project: {
        name: data.projectName,
        sourceImage: data.imageName,
        dimensions: data.dimensions,
        targetFormat: data.format,
      },
      totalStepsApplied: data.history.length,
      pipeline: data.history.map((step, idx) => ({
        step: idx + 1,
        label: step.label,
        module: step.module,
        algorithm: step.algorithm,
        parameters: step.parameters,
        timestamp: step.appliedAt,
      })),
      note: "Generated with PIXORA Studio — Transforming Images Through Intelligent Processing.",
    };
  }
}

export const exportService = new ExportService();
