import 'reflect-metadata';
import { ProjectModel } from '@prisma/client';
import { IProjectsRepository } from './projects.repository.interface';
import { inject, injectable } from 'inversify';
import { TYPES } from '../common/types/types';
import { PrismaService } from '../common/database/prisma.service';
import { IProjectRequestModel, IProjectRequestUpdate, IResponseProjectsRepository } from './types';

@injectable()
export class ProjectsRepository implements IProjectsRepository {
	constructor(@inject(TYPES.PrismaService) private readonly prismaService: PrismaService) {}

	async getAllProjectsByUserId(userId: number): Promise<IResponseProjectsRepository[]> {
		return await this.prismaService.client.projectModel.findMany({
			where: {
				userId,
			},
			include: {
				tasks: {
					select: {
						status: true,
						executor: {
							select: {
								name: true,
							},
						},
					},
				},
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

	async update(projectId: number, data: IProjectRequestUpdate): Promise<void> {
		try {
			await this.prismaService.client.projectModel.update({
				where: {
					id: projectId,
				},
				data: {
					name: data.name,
					description: data.description,
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
