import { ProjectModel } from '@prisma/client';
import { IProjectRequestModel, IProjectRequestUpdate } from './types';

export interface IProjectsRepository {
	create(project: IProjectRequestModel): Promise<ProjectModel>;
	getAllProjectsByUserId(userId: number): Promise<ProjectModel[]>;
	findById(projectId: number): Promise<ProjectModel | null>;
	update(projectId: number, data: IProjectRequestUpdate): Promise<void>;
	remove(projectId: number): Promise<void>;
}
