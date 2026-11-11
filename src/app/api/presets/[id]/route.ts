import { NextRequest } from "next/server";
import { PresetController } from "@/server/controllers/preset.controller";

interface Params {
  params: { id: string };
}

export async function DELETE(request: NextRequest, { params }: Params) {
  return PresetController.delete(params.id);
}
