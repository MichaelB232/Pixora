import { NextRequest } from "next/server";
import { PresetController } from "@/server/controllers/preset.controller";

export async function GET(request: NextRequest) {
  return PresetController.list(request);
}

export async function POST(request: NextRequest) {
  return PresetController.create(request);
}
