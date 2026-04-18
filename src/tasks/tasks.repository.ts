import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { ITasksRepository } from './tasks.reposotory.interface';
import { ICreateTaskData, IUpdateAssignUserRepository, IUpdateStatusRepository, IUpdateTaskData } from './types';
import { TYPES } from '../common/types/types';
import { PrismaService } from '../common/database/prisma.service';
import { TaskModel } from '@prisma/client';

@injectable()
export class TasksRepository implements ITasksRepository {
	constructor(@inject(TYPES.PrismaService) private readonly prismaService: PrismaService) { }

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

	async update(taskId: number, data: IUpdateTaskData): Promise<void> {
		try {
			await this.prismaService.client.taskModel.update({
				where: {
					id: taskId,
				},
				data: {
					title: data.title,
					description: data.description,
					dueDate: data.dueDate,
					status: data.status,
					executorUserId: data.executorUserId,
				},
			});
		} catch (error) {
			throw error;
		}
	}

	async remove(taskId: number): Promise<void> {
		await this.prismaService.client.taskModel.delete({
			where: { id: taskId },
		});
	}

	async assignTaskUser(data: IUpdateAssignUserRepository): Promise<void> {
		try {
			await this.prismaService.client.taskModel.update({
				where: { id: data.taskId },
				data: {
					executorUserId: data.executorUserId,
				},
			});
		} catch (error) {
			throw error;
		}
	}

	async installStatusTask(data: IUpdateStatusRepository): Promise<void> {
		try {
			await this.prismaService.client.taskModel.update({
				where: { id: data.taskId },
				data: {
					status: data.status,
					completedAt: data.completedAt
				},
			});
		} catch (error) {
			throw error;
		}
	}

}
