import { NextRequest, NextResponse } from "next/server";
import { presetService } from "../services/preset.service";
import {
  createPresetSchema,
  listPresetsSchema,
  presetIdSchema,
} from "../schemas/preset.schema";

export class PresetController {
  static async list(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url);
      const moduleParam = searchParams.get("module") || undefined;

      const validation = listPresetsSchema.safeParse({ module: moduleParam });
      if (!validation.success) {
        return NextResponse.json(
          {
            success: false,
            error: "Validation failed",
            details: validation.error.flatten(),
          },
          { status: 400 }
        );
      }

      const presets = await presetService.getAllPresets(validation.data.module);
      return NextResponse.json({ success: true, data: presets });
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || "Failed to fetch presets" },
        { status: 500 }
      );
    }
  }

  static async create(request: NextRequest) {
    try {
      const body = await request.json();
      const validation = createPresetSchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json(
          {
            success: false,
            error: "Validation failed",
            details: validation.error.flatten(),
          },
          { status: 400 }
        );
      }

      const preset = await presetService.createPreset(validation.data);
      return NextResponse.json({ success: true, data: preset }, { status: 201 });
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || "Failed to create preset" },
        { status: 400 }
      );
    }
  }

  static async delete(id: string) {
    try {
      const validation = presetIdSchema.safeParse({ id });
      if (!validation.success) {
        return NextResponse.json(
          {
            success: false,
            error: "Validation failed",
            details: validation.error.flatten(),
          },
          { status: 400 }
        );
      }

      await presetService.deletePreset(validation.data.id);
      return NextResponse.json({
        success: true,
        message: "Preset deleted successfully",
      });
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || "Failed to delete preset" },
        { status: 500 }
      );
    }
  }
}
