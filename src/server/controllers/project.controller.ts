import { NextRequest, NextResponse } from "next/server";
import { projectService } from "../services/project.service";
import {
  createProjectSchema,
  updateProjectSchema,
  projectIdSchema,
} from "../schemas/project.schema";

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
      const idValidation = projectIdSchema.safeParse({ id });
      if (!idValidation.success) {
        return NextResponse.json(
          {
            success: false,
            error: "Validation failed",
            details: idValidation.error.flatten(),
          },
          { status: 400 }
        );
      }

      const project = await projectService.getProjectById(idValidation.data.id);
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
      const validation = createProjectSchema.safeParse(body);

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

      const project = await projectService.createProject(validation.data);
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
      const idValidation = projectIdSchema.safeParse({ id });
      if (!idValidation.success) {
        return NextResponse.json(
          {
            success: false,
            error: "Validation failed",
            details: idValidation.error.flatten(),
          },
          { status: 400 }
        );
      }

      const body = await request.json();
      const bodyValidation = updateProjectSchema.safeParse(body);

      if (!bodyValidation.success) {
        return NextResponse.json(
          {
            success: false,
            error: "Validation failed",
            details: bodyValidation.error.flatten(),
          },
          { status: 400 }
        );
      }

      const updated = await projectService.updateProject(
        idValidation.data.id,
        bodyValidation.data
      );
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
      const idValidation = projectIdSchema.safeParse({ id });
      if (!idValidation.success) {
        return NextResponse.json(
          {
            success: false,
            error: "Validation failed",
            details: idValidation.error.flatten(),
          },
          { status: 400 }
        );
      }

      await projectService.deleteProject(idValidation.data.id);
      return NextResponse.json({
        success: true,
        message: "Project deleted successfully",
      });
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || "Failed to delete project" },
        { status: 500 }
      );
    }
  }
}
