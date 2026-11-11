import { db } from "../db";

export interface RecordStepInput {
  projectId: string;
  stepIndex: number;
  module: string;
  algorithm: string;
  label: string;
  parameters: Record<string, unknown> | string;
}

export class HistoryService {
  async getHistoryByProject(projectId: string) {
    return await db.historyStep.findMany({
      where: { projectId },
      orderBy: { stepIndex: "asc" },
    });
  }

  async recordStep(input: RecordStepInput) {
    const paramsString =
      typeof input.parameters === "string"
        ? input.parameters
        : JSON.stringify(input.parameters);

    return await db.historyStep.create({
      data: {
        projectId: input.projectId,
        stepIndex: input.stepIndex,
        module: input.module,
        algorithm: input.algorithm,
        label: input.label,
        parameters: paramsString,
      },
    });
  }

  async clearProjectHistory(projectId: string) {
    return await db.historyStep.deleteMany({
      where: { projectId },
    });
  }
}

export const historyService = new HistoryService();
