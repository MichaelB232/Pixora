import { db } from "../db";

export interface LogExportInput {
  fileName: string;
  format: string;
  quality?: number;
  dimensions: string;
  stepsCount: number;
}

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

  generateProcessingReport(data: {
    projectName: string;
    imageName: string;
    dimensions: string;
    format: string;
    history: Array<{
      stepIndex: number;
      module: string;
      algorithm: string;
      label: string;
      parameters: any;
      appliedAt: string;
    }>;
  }) {
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
