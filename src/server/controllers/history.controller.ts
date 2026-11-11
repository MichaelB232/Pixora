import { NextRequest, NextResponse } from "next/server";
import { historyService } from "../services/history.service";
import {
  recordHistoryStepSchema,
  getHistorySchema,
  clearHistorySchema,
} from "../schemas/history.schema";

export class HistoryController {
  static async getByProject(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url);
      const projectId = searchParams.get("projectId") || "";

      const validation = getHistorySchema.safeParse({ projectId });
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

      const history = await historyService.getHistoryByProject(validation.data.projectId);
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
      const validation = recordHistoryStepSchema.safeParse(body);

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

      const step = await historyService.recordStep(validation.data);
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
      const projectId = searchParams.get("projectId") || "";

      const validation = clearHistorySchema.safeParse({ projectId });
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

      await historyService.clearProjectHistory(validation.data.projectId);
      return NextResponse.json({
        success: true,
        message: "History cleared successfully",
      });
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || "Failed to clear history" },
        { status: 500 }
      );
    }
  }
}
