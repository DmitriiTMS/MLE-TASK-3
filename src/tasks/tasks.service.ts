import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { ITasksService } from './tasks.service.interface';
import { TYPES } from '../common/types/types';
import { ITasksRepository } from './tasks.reposotory.interface';
import { ICreateTaskData } from './types';
import { TaskEntity } from './entity/task.entity';
import { IUserService } from '../users/user.service.interface';
import { PROJECTS_MESSAGES, PROJECTS_PATH } from '../projects/constants';
import { IProjectsService } from '../projects/projects.service.interface';
import { USERS_MESSAGES } from '../users/constants';

@injectable()
export class TasksService implements ITasksService {
	constructor(
		@inject(TYPES.IUserService) private readonly userService: IUserService,
		@inject(TYPES.IProjectsService) private readonly projectsService: IProjectsService,
		@inject(TYPES.ITasksRepository) private readonly tasksRepository: ITasksRepository,
	) {}

	async createTask(data: ICreateTaskData): Promise<TaskEntity> {
		await this.userService.getUserOrThrow(
			data.createUserId,
			USERS_MESSAGES.USER_NOT_FOUND_CREATER,
			PROJECTS_PATH.CREATE_TASKS_FOR_PROJECT,
		);
		if (data.executorUserId) {
			await this.userService.getUserOrThrow(
				data.executorUserId,
				USERS_MESSAGES.USER_NOT_FOUND_EXECUTOR,
				PROJECTS_PATH.CREATE_TASKS_FOR_PROJECT,
			);
		}

		await this.projectsService.getProjectOrThrow(
			data.projectId,
			PROJECTS_MESSAGES.PROJECT_NOT_FOUND,
			PROJECTS_PATH.CREATE_TASKS_FOR_PROJECT,
		);

		const task = new TaskEntity(
			data.title,
			data.dueDate,
			data.projectId,
			data.createUserId,
			data.description,
			data.executorUserId,
			data.status,
		);

		const savedTask = await this.tasksRepository.create({
			title: task.title,
			description: task.description,
			dueDate: task.dueDate,
			status: task.status,
			projectId: task.projectId,
			createUserId: task.createUserId,
			executorUserId: task.executorUserId,
		});

		return TaskEntity.fromDatabase(savedTask);
	}
}
