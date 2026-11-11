import { NextRequest, NextResponse } from "next/server";
import { projectService } from "../services/project.service";

export class ProjectController {
  static async list() {
    try {
      const projects = await projectService.getAllProjects();
      return NextResponse.json({ success: true, data: projects });
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || "Failed to fetch projects" },
        { status: 500 }
      );
    }
  }

  static async get(id: string) {
    try {
      const project = await projectService.getProjectById(id);
      if (!project) {
        return NextResponse.json(
          { success: false, error: "Project not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: project });
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || "Failed to fetch project" },
        { status: 500 }
      );
    }
  }

  static async create(request: NextRequest) {
    try {
      const body = await request.json();
      const project = await projectService.createProject(body);
      return NextResponse.json({ success: true, data: project }, { status: 201 });
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || "Failed to create project" },
        { status: 400 }
      );
    }
  }

  static async update(id: string, request: NextRequest) {
    try {
      const body = await request.json();
      const updated = await projectService.updateProject(id, body);
      return NextResponse.json({ success: true, data: updated });
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || "Failed to update project" },
        { status: 400 }
      );
    }
  }

  static async delete(id: string) {
    try {
      await projectService.deleteProject(id);
      return NextResponse.json({ success: true, message: "Project deleted successfully" });
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || "Failed to delete project" },
        { status: 500 }
      );
    }
  }
}
