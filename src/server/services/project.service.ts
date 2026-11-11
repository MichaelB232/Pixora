import { db } from "../db";
import { CreateProjectInput, UpdateProjectInput } from "../schemas/project.schema";

export class ProjectService {
  async getAllProjects() {
    return await db.project.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        history: {
          orderBy: { stepIndex: "asc" },
        },
      },
    });
  }

  async getProjectById(id: string) {
    return await db.project.findUnique({
      where: { id },
      include: {
        history: {
          orderBy: { stepIndex: "asc" },
        },
        presets: true,
      },
    });
  }

  async createProject(input: CreateProjectInput) {
    return await db.project.create({
      data: {
        name: input.name,
        imageName: input.imageName,
        width: input.width,
        height: input.height,
        format: input.format,
      },
    });
  }

  async updateProject(id: string, input: UpdateProjectInput) {
    return await db.project.update({
      where: { id },
      data: input,
    });
  }

  async deleteProject(id: string) {
    return await db.project.delete({
      where: { id },
    });
  }
}

export const projectService = new ProjectService();
