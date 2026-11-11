import { NextRequest } from "next/server";
import { ExportController } from "@/server/controllers/export.controller";

export async function GET() {
  return ExportController.list();
}

export async function POST(request: NextRequest) {
  return ExportController.log(request);
}
