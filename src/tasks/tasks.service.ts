import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { ITasksService } from './tasks.service.interface';
import { TYPES } from '../common/types/types';
import { ITasksRepository } from './tasks.reposotory.interface';
import { ICreateTaskData, IUpdateAssignUserService, IUpdateStatusService } from './types';
import { TaskEntity } from './entity/task.entity';
import { IUserService } from '../users/user.service.interface';
import { PROJECTS_MESSAGES, PROJECTS_PATH } from '../projects/constants';
import { IProjectsService } from '../projects/projects.service.interface';
import { USERS_MESSAGES } from '../users/constants';
import { TaskModel, TaskStatus } from '@prisma/client';
import { HttpError } from '../common/error/http-error';
import { HttpErrorCode, HttpErrorMessages } from '../common/error/constants';
import { TASKS_MESSAGES, TASKS_PATHS } from './constants';
import { UpdateTaskDto } from './dto/update-task.dto';

@injectable()
export class TasksService implements ITasksService {
	constructor(
		@inject(TYPES.IUserService) private readonly userService: IUserService,
		@inject(TYPES.IProjectsService) private readonly projectsService: IProjectsService,
		@inject(TYPES.ITasksRepository) private readonly tasksRepository: ITasksRepository,
	) { }

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
		try {
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
		} catch (error) {
			throw new HttpError(
				HttpErrorCode.INTERNAL_SERVER_ERROR,
				HttpErrorMessages[HttpErrorCode.INTERNAL_SERVER_ERROR],
				PROJECTS_PATH.CREATE_TASKS_FOR_PROJECT,
			);
		}
	}

	async getOneTask(userId: number, taskId: number): Promise<TaskEntity> {
		await this.userService.getUserOrThrow(
			userId,
			USERS_MESSAGES.USER_NOT_FOUND,
			TASKS_PATHS.GET_ONE_TASK,
		);
		const taskData = await this.getTaskOrThrow(
			taskId,
			TASKS_MESSAGES.TASK_NOT_FOUND,
			TASKS_PATHS.GET_ONE_TASK,
		);
		const task = TaskEntity.fromDatabase(taskData);
		const hasAccess = task.isCreatorUser(userId) || task.isExecutorUser(userId);
		if (!hasAccess) {
			throw new HttpError(
				HttpErrorCode.FORBIDDEN,
				TASKS_MESSAGES.TASK_BAN_ON_VIEWING,
				TASKS_PATHS.GET_ONE_TASK,
			);
		}
		return task;
	}

	async updateTask(userId: number, taskId: number, data: UpdateTaskDto): Promise<void> {
		const { title, description, dueDate, executorUserId, status } = data;
		await this.userService.getUserOrThrow(
			userId,
			USERS_MESSAGES.USER_NOT_FOUND,
			TASKS_PATHS.UPDATE_TASK,
		);
		const taskData = await this.getTaskOrThrow(
			taskId,
			TASKS_MESSAGES.TASK_NOT_FOUND,
			TASKS_PATHS.UPDATE_TASK,
		);
		const task = TaskEntity.fromDatabase(taskData);
		if (!task.isCreatorUser(userId)) {
			throw new HttpError(
				HttpErrorCode.FORBIDDEN,
				TASKS_MESSAGES.TASK_BAN_ON_UPDATE,
				TASKS_PATHS.UPDATE_TASK,
			);
		}
		const updatedTask = task.updateFields({ title, description, dueDate, executorUserId, status });
		try {
			await this.tasksRepository.update(taskId, {
				title: updatedTask.title,
				description: updatedTask.description,
				dueDate: updatedTask.dueDate,
				status: updatedTask.status,
				executorUserId: updatedTask.executorUserId,
			});
		} catch (error) {
			throw new HttpError(
				HttpErrorCode.INTERNAL_SERVER_ERROR,
				HttpErrorMessages[HttpErrorCode.INTERNAL_SERVER_ERROR],
				TASKS_PATHS.UPDATE_TASK,
			);
		}
	}

	async remove(taskId: number, userId: number): Promise<void> {
		await this.userService.getUserOrThrow(
			userId,
			USERS_MESSAGES.USER_NOT_FOUND,
			TASKS_PATHS.DELETE_TASK,
		);
		const taskData = await this.getTaskOrThrow(
			taskId,
			TASKS_MESSAGES.TASK_NOT_FOUND,
			TASKS_PATHS.DELETE_TASK,
		);
		const task = TaskEntity.fromDatabase(taskData);
		if (!task.isCreatorUser(userId)) {
			throw new HttpError(
				HttpErrorCode.FORBIDDEN,
				TASKS_MESSAGES.TASK_BAN_ON_DELETE,
				TASKS_PATHS.DELETE_TASK,
			);
		}

		await this.tasksRepository.remove(taskId);
	}

	async assignTaskUser(data: IUpdateAssignUserService): Promise<void> {
		await this.userService.getUserOrThrow(
			data.userId,
			USERS_MESSAGES.USER_NOT_FOUND_CREATER,
			TASKS_PATHS.ASSIGN_TASK_USER,
		);
		await this.userService.getUserOrThrow(
			data.info.executorUserId,
			USERS_MESSAGES.USER_NOT_FOUND_EXECUTOR,
			TASKS_PATHS.ASSIGN_TASK_USER,
		);

		const taskData = await this.getTaskOrThrow(
			data.info.taskId,
			TASKS_MESSAGES.TASK_NOT_FOUND,
			TASKS_PATHS.ASSIGN_TASK_USER,
		);

		const task = TaskEntity.fromDatabase(taskData);

		if (!task.isCreatorUser(data.userId) && data.userId === data.info.executorUserId) {
			throw new HttpError(
				HttpErrorCode.FORBIDDEN,
				TASKS_MESSAGES.BAN_ON_ASSIGN_TASK_USER,
				TASKS_PATHS.ASSIGN_TASK_USER,
			);
		}
		try {
			await this.tasksRepository.assignTaskUser(data.info);
		} catch (error) {
			throw new HttpError(
				HttpErrorCode.INTERNAL_SERVER_ERROR,
				HttpErrorMessages[HttpErrorCode.INTERNAL_SERVER_ERROR],
				TASKS_PATHS.ASSIGN_TASK_USER,
			);
		}

	}

	async installStatusTask(data: IUpdateStatusService): Promise<void> {
		await this.userService.getUserOrThrow(
			data.userId,
			USERS_MESSAGES.USER_NOT_FOUND,
			TASKS_PATHS.STATUS_TASK_USER,
		);

		const taskData = await this.getTaskOrThrow(
			data.dataInfo.taskId,
			TASKS_MESSAGES.TASK_NOT_FOUND,
			TASKS_PATHS.STATUS_TASK_USER,
		);

		const task = TaskEntity.fromDatabase(taskData);

		if (!task.isExecutorUser(data.userId)) {
			throw new HttpError(
				HttpErrorCode.FORBIDDEN,
				TASKS_MESSAGES.TASK_BAN_ON_STATUS,
				TASKS_PATHS.STATUS_TASK_USER,
			);
		}

		if (data.dataInfo.status === TaskStatus.COMPLETED) {
			await this.tasksRepository.installStatusTask({
				taskId: data.dataInfo.taskId,
				status: data.dataInfo.status,
				completedAt: new Date()
			})
		} else {
			await this.tasksRepository.installStatusTask({
				taskId: data.dataInfo.taskId,
				status: data.dataInfo.status,
				completedAt: null
			})
		}
	}

	async getTaskOrThrow(taskId: number, message: string, errorPath?: string): Promise<TaskModel> {
		const task = await this.tasksRepository.findById(taskId);
		if (!task) {
			throw new HttpError(HttpErrorCode.NOT_FOUND, message, errorPath);
		}
		return task;
	}
}
