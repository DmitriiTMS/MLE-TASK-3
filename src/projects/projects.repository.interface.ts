import { ProjectModel } from "@prisma/client";
import { IProjectRequestModel } from "./types";

export interface IProjectsRepository {
    create(project: IProjectRequestModel): Promise<ProjectModel>;
    getAllProjectsByUserId(userId: number): Promise<ProjectModel[]>;
}
