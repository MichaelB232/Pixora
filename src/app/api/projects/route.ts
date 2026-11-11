import { NextRequest } from "next/server";
import { ProjectController } from "@/server/controllers/project.controller";

export async function GET() {
  return ProjectController.list();
}

export async function POST(request: NextRequest) {
  return ProjectController.create(request);
}
