import { db } from "../db";

export interface CreateProjectInput {
  name?: string;
  imageName?: string;
  width?: number;
  height?: number;
  format?: string;
}

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
        name: input.name || "Untitled Project",
        imageName: input.imageName || "cosmos.jpg",
        width: input.width || 2400,
        height: input.height || 1800,
        format: input.format || "JPG",
      },
    });
  }

  async updateProject(id: string, input: Partial<CreateProjectInput>) {
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
