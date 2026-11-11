import { NextRequest } from "next/server";
import { ProjectController } from "@/server/controllers/project.controller";

interface Params {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: Params) {
  return ProjectController.get(params.id);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  return ProjectController.update(params.id, request);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  return ProjectController.delete(params.id);
}
