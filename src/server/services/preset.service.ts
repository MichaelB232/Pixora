import { db } from "../db";
import { CreatePresetInput } from "../schemas/preset.schema";

export class PresetService {
  async getAllPresets(module?: string) {
    if (module) {
      return await db.preset.findMany({
        where: { module },
        orderBy: { createdAt: "desc" },
      });
    }
    return await db.preset.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async createPreset(input: CreatePresetInput) {
    const paramsString =
      typeof input.parameters === "string"
        ? input.parameters
        : JSON.stringify(input.parameters);

    return await db.preset.create({
      data: {
        projectId: input.projectId,
        name: input.name,
        description: input.description,
        module: input.module,
        algorithm: input.algorithm,
        parameters: paramsString,
      },
    });
  }

  async deletePreset(id: string) {
    return await db.preset.delete({
      where: { id },
    });
  }
}

export const presetService = new PresetService();
