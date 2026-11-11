import { NextRequest } from "next/server";
import { HistoryController } from "@/server/controllers/history.controller";

export async function GET(request: NextRequest) {
  return HistoryController.getByProject(request);
}

export async function POST(request: NextRequest) {
  return HistoryController.record(request);
}

export async function DELETE(request: NextRequest) {
  return HistoryController.clear(request);
}
