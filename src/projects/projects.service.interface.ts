import { ProjectModel } from '@prisma/client';
import { CreateProjectsDto } from './dto/create-projects.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectEntity } from './entity/project.entity';
import { IResponseProjectsRepository } from './types';

export interface IProjectsService {
	create(project: CreateProjectsDto, userId: number): Promise<ProjectEntity>;
	getAllProjectsByUserId(userId: number): Promise<IResponseProjectsRepository[]>;
	getProjectByUserId(projectId: number, userId: number): Promise<ProjectEntity>;
	update(userId: number, projectId: number, { name, description }: UpdateProjectDto): Promise<void>;
	remove(projectId: number, userId: number): Promise<void>;
	getProjectOrThrow(projectId: number, message: string, errorPath?: string): Promise<ProjectModel>;
}
