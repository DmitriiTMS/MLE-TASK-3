import { ProjectModel } from '@prisma/client';
import { IProjectRequestModel, IProjectRequestUpdate, IResponseProjectsRepository } from './types';

export interface IProjectsRepository {
	create(project: IProjectRequestModel): Promise<ProjectModel>;
	getAllProjectsByUserId(userId: number): Promise<IResponseProjectsRepository[]>;
	findById(projectId: number): Promise<ProjectModel | null>;
	update(projectId: number, data: IProjectRequestUpdate): Promise<void>;
	remove(projectId: number): Promise<void>;
}
