import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { ITasksRepository } from './tasks.reposotory.interface';
import { ICreateTaskData } from './types';
import { TYPES } from '../common/types/types';
import { PrismaService } from '../common/database/prisma.service';
import { TaskModel } from '@prisma/client';

@injectable()
export class TasksRepository implements ITasksRepository {
	constructor(@inject(TYPES.PrismaService) private readonly prismaService: PrismaService) {}

	async create(data: ICreateTaskData): Promise<TaskModel> {
		try {
			return await this.prismaService.client.taskModel.create({
				data: {
					createUserId: data.createUserId,
					projectId: data.projectId,
					description: data.description,
					completedAt: data.completedAt,
					executorUserId: data.executorUserId,
					status: data.status,
					title: data.title,
					dueDate: data.dueDate,
				},
			});
		} catch (error) {
			throw error;
		}
	}

	async findById(taskId: number): Promise<TaskModel | null> {
		return this.prismaService.client.taskModel.findUnique({
			where: { id: taskId },
			include: {
				project: {
					select: {
						name: true,
						description: true,
					},
				},
			},
		});
	}
}
