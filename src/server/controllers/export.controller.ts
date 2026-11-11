import { NextRequest, NextResponse } from "next/server";
import { exportService } from "../services/export.service";

export class ExportController {
  static async log(request: NextRequest) {
    try {
      const body = await request.json();
      if (!body.fileName || !body.format || !body.dimensions) {
        return NextResponse.json(
          { success: false, error: "Missing required export parameters" },
          { status: 400 }
        );
      }

      const log = await exportService.logExport({
        fileName: body.fileName,
        format: body.format,
        quality: body.quality,
        dimensions: body.dimensions,
        stepsCount: body.stepsCount || 0,
      });

      return NextResponse.json({ success: true, data: log }, { status: 201 });
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || "Failed to log export" },
        { status: 500 }
      );
    }
  }

  static async list() {
    try {
      const logs = await exportService.getExportLogs();
      return NextResponse.json({ success: true, data: logs });
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || "Failed to fetch export logs" },
        { status: 500 }
      );
    }
  }

  static async generateReport(request: NextRequest) {
    try {
      const body = await request.json();
      const report = exportService.generateProcessingReport(body);
      return NextResponse.json({ success: true, data: report });
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || "Failed to generate report" },
        { status: 500 }
      );
    }
  }
}
