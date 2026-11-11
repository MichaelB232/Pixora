import { NextRequest } from "next/server";
import { ExportController } from "@/server/controllers/export.controller";

export async function POST(request: NextRequest) {
  return ExportController.generateReport(request);
}
