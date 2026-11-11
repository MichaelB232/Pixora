import { NextRequest, NextResponse } from "next/server";
import { historyService } from "../services/history.service";

export class HistoryController {
  static async getByProject(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url);
      const projectId = searchParams.get("projectId");

      if (!projectId) {
        return NextResponse.json(
          { success: false, error: "projectId is required" },
          { status: 400 }
        );
      }

      const history = await historyService.getHistoryByProject(projectId);
      return NextResponse.json({ success: true, data: history });
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || "Failed to fetch history" },
        { status: 500 }
      );
    }
  }

  static async record(request: NextRequest) {
    try {
      const body = await request.json();
      if (!body.projectId || body.stepIndex === undefined || !body.module || !body.algorithm) {
        return NextResponse.json(
          { success: false, error: "Missing required history fields" },
          { status: 400 }
        );
      }

      const step = await historyService.recordStep(body);
      return NextResponse.json({ success: true, data: step }, { status: 201 });
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || "Failed to record history step" },
        { status: 400 }
      );
    }
  }

  static async clear(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url);
      const projectId = searchParams.get("projectId");

      if (!projectId) {
        return NextResponse.json(
          { success: false, error: "projectId is required" },
          { status: 400 }
        );
      }

      await historyService.clearProjectHistory(projectId);
      return NextResponse.json({ success: true, message: "History cleared successfully" });
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || "Failed to clear history" },
        { status: 500 }
      );
    }
  }
}
