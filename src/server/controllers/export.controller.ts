import { NextRequest, NextResponse } from "next/server";
import { exportService } from "../services/export.service";
import {
  logExportSchema,
  generateReportSchema,
} from "../schemas/export.schema";

export class ExportController {
  static async log(request: NextRequest) {
    try {
      const body = await request.json();
      const validation = logExportSchema.safeParse(body);

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

      const log = await exportService.logExport(validation.data);
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
      const validation = generateReportSchema.safeParse(body);

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

      const report = exportService.generateProcessingReport(validation.data);
      return NextResponse.json({ success: true, data: report });
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || "Failed to generate report" },
        { status: 500 }
      );
    }
  }
}
