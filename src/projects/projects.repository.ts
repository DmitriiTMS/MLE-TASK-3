import 'reflect-metadata';
import { ProjectModel } from '@prisma/client';
import { IProjectsRepository } from './projects.repository.interface';
import { inject, injectable } from 'inversify';
import { TYPES } from '../common/types/types';
import { PrismaService } from '../common/database/prisma.service';
import { IProjectRequestModel } from './types';

@injectable()
export class ProjectsRepository implements IProjectsRepository {
	constructor(@inject(TYPES.PrismaService) private readonly prismaService: PrismaService) {}

	async getAllProjectsByUserId(userId: number): Promise<ProjectModel[]> {
		return await this.prismaService.client.projectModel.findMany({
			where: {
				userId,
			},
		});
	}

	async findById(projectId: number): Promise<ProjectModel | null> {
		return this.prismaService.client.projectModel.findUnique({
			where: { id: projectId },
		});
	}

	async create(data: IProjectRequestModel): Promise<ProjectModel> {
		try {
			return await this.prismaService.client.projectModel.create({
				data: {
					name: data.name,
					description: data.description,
					userId: data.userId,
				},
			});
		} catch (error) {
			throw error;
		}
	}

	async remove(projectId: number): Promise<void> {
		await this.prismaService.client.projectModel.delete({
			where: { id: projectId },
		});
	}
}
