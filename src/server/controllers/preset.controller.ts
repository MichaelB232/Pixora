import { NextRequest, NextResponse } from "next/server";
import { presetService } from "../services/preset.service";

export class PresetController {
  static async list(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url);
      const module = searchParams.get("module") || undefined;
      const presets = await presetService.getAllPresets(module);
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
      if (!body.name || !body.module || !body.algorithm || !body.parameters) {
        return NextResponse.json(
          { success: false, error: "Missing required fields" },
          { status: 400 }
        );
      }

      const preset = await presetService.createPreset(body);
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
      await presetService.deletePreset(id);
      return NextResponse.json({ success: true, message: "Preset deleted successfully" });
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || "Failed to delete preset" },
        { status: 500 }
      );
    }
  }
}
