import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import 'reflect-metadata';
import { IUserService } from '../users/user.service.interface';
import { IProjectsService } from '../projects/projects.service.interface';
import { ITasksRepository } from './tasks.reposotory.interface';
import { Container } from 'inversify';
import { ITasksService } from './tasks.service.interface';
import { TYPES } from '../common/types/types';
import { TasksService } from './tasks.service';
import { ICreateTaskData } from './types';
import { TaskModel, TaskStatus } from '@prisma/client';
import { USERS_MESSAGES } from '../users/constants';
import { PROJECTS_MESSAGES, PROJECTS_PATH } from '../projects/constants';
import { HttpErrorCode, HttpErrorMessages } from '../common/error/constants';
import { TaskEntity } from './entity/task.entity';
import { TASKS_MESSAGES, TASKS_PATHS } from './constants';
import { HttpError } from '../common/error/http-error';

// npm run test -- src/tasks/tasks.service.spec.ts

const UserServiceMock = {
	createUser: jest.fn(),
	getUserOrThrow: jest.fn(),
} as jest.Mocked<IUserService>;

const ProjectsServiceMock = {
	create: jest.fn(),
	getAllProjectsByUserId: jest.fn(),
	getProjectByUserId: jest.fn(),
	getProjectOrThrow: jest.fn(),
	remove: jest.fn(),
	update: jest.fn(),
} as jest.Mocked<IProjectsService>;

const TasksRepositoryMock = {
	create: jest.fn(),
	findById: jest.fn(),
	update: jest.fn(),
	remove: jest.fn(),
	assignTaskUser: jest.fn(),
	installStatusTask: jest.fn()
} as jest.Mocked<ITasksRepository>;

describe('TasksService', () => {
	let tasksService: ITasksService;

	beforeEach(() => {
		const container = new Container();
		container.bind<ITasksService>(TYPES.ITasksService).to(TasksService);
		container.bind<IUserService>(TYPES.IUserService).toConstantValue(UserServiceMock);
		container.bind<IProjectsService>(TYPES.IProjectsService).toConstantValue(ProjectsServiceMock);
		container.bind<ITasksRepository>(TYPES.ITasksRepository).toConstantValue(TasksRepositoryMock);

		tasksService = container.get<ITasksService>(TYPES.ITasksService);

		jest.clearAllMocks();
	});

	describe('createTask', () => {
		const createTaskData: ICreateTaskData = {
			title: 'task-title',
			description: 'task-description',
			dueDate: new Date('2024-12-31'),
			status: TaskStatus.CREATED,
			projectId: 10,
			createUserId: 1,
			executorUserId: 2,
		};

		const mockCreatorUser = {
			id: 1,
			name: 'creator',
			email: 'creator@bk.ru',
			hasPassword: 'hashedPassword',
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const mockExecutorUser = {
			id: 2,
			name: 'executor',
			email: 'executor@bk.ru',
			hasPassword: 'hashedPassword',
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const mockProject = {
			id: 10,
			name: 'project-name',
			description: 'project-description',
			userId: 1,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const mockSavedTask: TaskModel = {
			id: 100,
			title: 'task-title',
			description: 'task-description',
			dueDate: new Date('2024-12-31'),
			status: TaskStatus.CREATED,
			completedAt: null,
			projectId: 10,
			createUserId: 1,
			executorUserId: 2,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		it('should successfully create a task when creator, executor and project exist', async () => {
			UserServiceMock.getUserOrThrow.mockResolvedValueOnce(mockCreatorUser);
			UserServiceMock.getUserOrThrow.mockResolvedValueOnce(mockExecutorUser);
			ProjectsServiceMock.getProjectOrThrow.mockResolvedValue(mockProject);
			TasksRepositoryMock.create.mockResolvedValue(mockSavedTask);

			const result = await tasksService.createTask(createTaskData);

			expect(UserServiceMock.getUserOrThrow).toHaveBeenNthCalledWith(
				1,
				createTaskData.createUserId,
				USERS_MESSAGES.USER_NOT_FOUND_CREATER,
				PROJECTS_PATH.CREATE_TASKS_FOR_PROJECT,
			);
			expect(UserServiceMock.getUserOrThrow).toHaveBeenNthCalledWith(
				2,
				createTaskData.executorUserId as number,
				USERS_MESSAGES.USER_NOT_FOUND_EXECUTOR,
				PROJECTS_PATH.CREATE_TASKS_FOR_PROJECT,
			);
			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledTimes(2);
			expect(ProjectsServiceMock.getProjectOrThrow).toHaveBeenCalledWith(
				createTaskData.projectId,
				PROJECTS_MESSAGES.PROJECT_NOT_FOUND,
				PROJECTS_PATH.CREATE_TASKS_FOR_PROJECT,
			);
			expect(ProjectsServiceMock.getProjectOrThrow).toHaveBeenCalledTimes(1);
			expect(TasksRepositoryMock.create).toHaveBeenCalledWith({
				title: createTaskData.title,
				description: createTaskData.description,
				dueDate: createTaskData.dueDate,
				status: createTaskData.status,
				projectId: createTaskData.projectId,
				createUserId: createTaskData.createUserId,
				executorUserId: createTaskData.executorUserId,
			});
			expect(TasksRepositoryMock.create).toHaveBeenCalledTimes(1);
			expect(result).toBeInstanceOf(TaskEntity);
			expect(result.id).toBe(mockSavedTask.id);
			expect(result.title).toBe(mockSavedTask.title);
			expect(result.description).toBe(mockSavedTask.description);
			expect(result.dueDate).toBe(mockSavedTask.dueDate);
			expect(result.status).toBe(mockSavedTask.status);
			expect(result.createdAt).toBe(mockSavedTask.createdAt);
			expect(result.updatedAt).toBe(mockSavedTask.updatedAt);
		});

		it('should successfully create a task without executor (executorUserId is optional)', async () => {
			const taskDataWithoutExecutor: ICreateTaskData = {
				...createTaskData,
				executorUserId: undefined,
			};

			const mockSavedTaskWithoutExecutor: TaskModel = {
				...mockSavedTask,
				executorUserId: null,
				completedAt: null,
			};

			UserServiceMock.getUserOrThrow.mockResolvedValueOnce(mockCreatorUser);
			ProjectsServiceMock.getProjectOrThrow.mockResolvedValue(mockProject);
			TasksRepositoryMock.create.mockResolvedValue(mockSavedTaskWithoutExecutor);

			const result = await tasksService.createTask(taskDataWithoutExecutor);

			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledTimes(1);
			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledWith(
				taskDataWithoutExecutor.createUserId,
				USERS_MESSAGES.USER_NOT_FOUND_CREATER,
				PROJECTS_PATH.CREATE_TASKS_FOR_PROJECT,
			);
			expect(ProjectsServiceMock.getProjectOrThrow).toHaveBeenCalledTimes(1);
			expect(TasksRepositoryMock.create).toHaveBeenCalledWith({
				title: taskDataWithoutExecutor.title,
				description: taskDataWithoutExecutor.description,
				dueDate: taskDataWithoutExecutor.dueDate,
				status: taskDataWithoutExecutor.status,
				projectId: taskDataWithoutExecutor.projectId,
				createUserId: taskDataWithoutExecutor.createUserId,
				executorUserId: null, // Исправлено: undefined -> null
			});
			expect(result.executorUserId).toBeNull();
		});

		it('should throw error when creator user does not exist', async () => {
			UserServiceMock.getUserOrThrow.mockRejectedValueOnce(
				new Error(HttpErrorMessages[HttpErrorCode.NOT_FOUND]),
			);

			await expect(tasksService.createTask(createTaskData)).rejects.toThrow();

			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledWith(
				createTaskData.createUserId,
				USERS_MESSAGES.USER_NOT_FOUND_CREATER,
				PROJECTS_PATH.CREATE_TASKS_FOR_PROJECT,
			);
			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledTimes(1);
			expect(ProjectsServiceMock.getProjectOrThrow).not.toHaveBeenCalled();
			expect(TasksRepositoryMock.create).not.toHaveBeenCalled();
		});

		it('should throw error when executor user does not exist', async () => {
			UserServiceMock.getUserOrThrow.mockResolvedValueOnce(mockCreatorUser);
			UserServiceMock.getUserOrThrow.mockRejectedValueOnce(
				new Error(HttpErrorMessages[HttpErrorCode.NOT_FOUND]),
			);

			await expect(tasksService.createTask(createTaskData)).rejects.toThrow();

			expect(UserServiceMock.getUserOrThrow).toHaveBeenNthCalledWith(
				1,
				createTaskData.createUserId,
				USERS_MESSAGES.USER_NOT_FOUND_CREATER,
				PROJECTS_PATH.CREATE_TASKS_FOR_PROJECT,
			);
			expect(UserServiceMock.getUserOrThrow).toHaveBeenNthCalledWith(
				2,
				createTaskData.executorUserId as number,
				USERS_MESSAGES.USER_NOT_FOUND_EXECUTOR,
				PROJECTS_PATH.CREATE_TASKS_FOR_PROJECT,
			);
			expect(ProjectsServiceMock.getProjectOrThrow).not.toHaveBeenCalled();
			expect(TasksRepositoryMock.create).not.toHaveBeenCalled();
		});

		it('should throw error when project does not exist', async () => {
			UserServiceMock.getUserOrThrow.mockResolvedValueOnce(mockCreatorUser);
			UserServiceMock.getUserOrThrow.mockResolvedValueOnce(mockExecutorUser);
			ProjectsServiceMock.getProjectOrThrow.mockRejectedValue(
				new Error(HttpErrorMessages[HttpErrorCode.NOT_FOUND]),
			);

			await expect(tasksService.createTask(createTaskData)).rejects.toThrow();

			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledTimes(2);
			expect(ProjectsServiceMock.getProjectOrThrow).toHaveBeenCalledWith(
				createTaskData.projectId,
				PROJECTS_MESSAGES.PROJECT_NOT_FOUND,
				PROJECTS_PATH.CREATE_TASKS_FOR_PROJECT,
			);
			expect(TasksRepositoryMock.create).not.toHaveBeenCalled();
		});

		it('should create task without description (field missing)', async () => {
			const taskDataWithoutDescription: ICreateTaskData = {
				...createTaskData,
				description: undefined,
			};

			const mockSavedTaskWithoutDescription: TaskModel = {
				...mockSavedTask,
				description: null,
				completedAt: null,
			};

			UserServiceMock.getUserOrThrow.mockResolvedValueOnce(mockCreatorUser);
			UserServiceMock.getUserOrThrow.mockResolvedValueOnce(mockExecutorUser);
			ProjectsServiceMock.getProjectOrThrow.mockResolvedValue(mockProject);
			TasksRepositoryMock.create.mockResolvedValue(mockSavedTaskWithoutDescription);

			const result = await tasksService.createTask(taskDataWithoutDescription);

			expect(TasksRepositoryMock.create).toHaveBeenCalledWith({
				title: taskDataWithoutDescription.title,
				description: null,
				dueDate: taskDataWithoutDescription.dueDate,
				status: taskDataWithoutDescription.status,
				projectId: taskDataWithoutDescription.projectId,
				createUserId: taskDataWithoutDescription.createUserId,
				executorUserId: taskDataWithoutDescription.executorUserId,
			});
			expect(result.description).toBeNull();
		});
	});

	describe('getOneTask', () => {
		const userId = 1;
		const taskId = 100;

		const mockUser = {
			id: 1,
			name: 'user',
			email: 'user@bk.ru',
			hasPassword: 'hashedPassword',
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const mockTaskData: TaskModel = {
			id: 100,
			title: 'task-title',
			description: 'task-description',
			dueDate: new Date('2024-12-31'),
			status: TaskStatus.CREATED,
			completedAt: null,
			projectId: 10,
			createUserId: 1,
			executorUserId: 2,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		it('should successfully get a task when user is creator', async () => {
			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			TasksRepositoryMock.findById.mockResolvedValue(mockTaskData);

			const result = await tasksService.getOneTask(userId, taskId);

			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledWith(
				userId,
				USERS_MESSAGES.USER_NOT_FOUND,
				TASKS_PATHS.GET_ONE_TASK,
			);
			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledTimes(1);
			expect(TasksRepositoryMock.findById).toHaveBeenCalledWith(taskId);
			expect(TasksRepositoryMock.findById).toHaveBeenCalledTimes(1);
			expect(result).toBeInstanceOf(TaskEntity);
			expect(result.id).toBe(mockTaskData.id);
			expect(result.title).toBe(mockTaskData.title);
			expect(result.description).toBe(mockTaskData.description);
			expect(result.dueDate).toBe(mockTaskData.dueDate);
			expect(result.status).toBe(mockTaskData.status);
			expect(result.projectId).toBe(mockTaskData.projectId);
			expect(result.createUserId).toBe(mockTaskData.createUserId);
			expect(result.executorUserId).toBe(mockTaskData.executorUserId);
		});

		it('should successfully get a task when user is executor', async () => {
			const taskWhereUserIsExecutor: TaskModel = {
				...mockTaskData,
				createUserId: 99,
				executorUserId: userId,
			};

			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			TasksRepositoryMock.findById.mockResolvedValue(taskWhereUserIsExecutor);

			const result = await tasksService.getOneTask(userId, taskId);

			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledTimes(1);
			expect(TasksRepositoryMock.findById).toHaveBeenCalledWith(taskId);
			expect(result).toBeInstanceOf(TaskEntity);
			expect(result.createUserId).toBe(99);
			expect(result.executorUserId).toBe(userId);
		});

		it('should throw error when user does not exist', async () => {
			UserServiceMock.getUserOrThrow.mockRejectedValue(
				new Error(HttpErrorMessages[HttpErrorCode.NOT_FOUND]),
			);

			await expect(tasksService.getOneTask(userId, taskId)).rejects.toThrow();

			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledWith(
				userId,
				USERS_MESSAGES.USER_NOT_FOUND,
				TASKS_PATHS.GET_ONE_TASK,
			);
			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledTimes(1);
			expect(TasksRepositoryMock.findById).not.toHaveBeenCalled();
		});

		it('should throw error when task does not exist', async () => {
			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			TasksRepositoryMock.findById.mockResolvedValue(null);

			await expect(tasksService.getOneTask(userId, taskId)).rejects.toThrow();

			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledTimes(1);
			expect(TasksRepositoryMock.findById).toHaveBeenCalledWith(taskId);
			expect(TasksRepositoryMock.findById).toHaveBeenCalledTimes(1);
		});

		it('should throw error when user is not creator and not executor', async () => {
			const taskWithDifferentUser: TaskModel = {
				...mockTaskData,
				createUserId: 99,
				executorUserId: 98,
			};

			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			TasksRepositoryMock.findById.mockResolvedValue(taskWithDifferentUser);

			await expect(tasksService.getOneTask(userId, taskId)).rejects.toThrow();

			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledTimes(1);
			expect(TasksRepositoryMock.findById).toHaveBeenCalledWith(taskId);
			expect(TasksRepositoryMock.findById).toHaveBeenCalledTimes(1);
		});

		it('should successfully get task when user is both creator and executor', async () => {
			const taskWhereUserIsBoth: TaskModel = {
				...mockTaskData,
				createUserId: userId,
				executorUserId: userId,
			};

			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			TasksRepositoryMock.findById.mockResolvedValue(taskWhereUserIsBoth);

			const result = await tasksService.getOneTask(userId, taskId);

			expect(result).toBeInstanceOf(TaskEntity);
			expect(result.createUserId).toBe(userId);
			expect(result.executorUserId).toBe(userId);
		});

		it('should return task with project data when project is included', async () => {
			const taskWithProject = {
				...mockTaskData,
				project: {
					id: 10,
					name: 'project-name',
					description: 'project-description',
					userId: 1,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			};

			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			TasksRepositoryMock.findById.mockResolvedValue(taskWithProject);

			const result = await tasksService.getOneTask(userId, taskId);

			expect(result).toBeInstanceOf(TaskEntity);
			expect(result.project).toBeDefined();
			expect(result.project?.name).toBe('project-name');
		});
	});

	describe('updateTask', () => {
		const userId = 1;
		const taskId = 100;
		const updateTaskData = {
			title: 'Updated task title',
			description: 'Updated description',
			dueDate: '2025-12-31',
			executorUserId: 3,
			status: TaskStatus.IN_PROGRESS,
		};

		const mockCreatorUser = {
			id: 1,
			name: 'creator',
			email: 'creator@bk.ru',
			hasPassword: 'hashedPassword',
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const mockExistingTask: TaskModel = {
			id: taskId,
			title: 'Original title',
			description: 'Original description',
			dueDate: new Date('2024-12-31'),
			status: TaskStatus.CREATED,
			completedAt: null,
			projectId: 10,
			createUserId: userId,
			executorUserId: 2,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		it('should successfully update task when user is creator', async () => {
			UserServiceMock.getUserOrThrow.mockResolvedValue(mockCreatorUser);
			TasksRepositoryMock.findById.mockResolvedValue(mockExistingTask);
			TasksRepositoryMock.update.mockResolvedValue(undefined);

			await tasksService.updateTask(userId, taskId, updateTaskData);

			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledWith(
				userId,
				USERS_MESSAGES.USER_NOT_FOUND,
				TASKS_PATHS.UPDATE_TASK,
			);
			expect(TasksRepositoryMock.findById).toHaveBeenCalledWith(taskId);
			expect(TasksRepositoryMock.update).toHaveBeenCalledWith(taskId, {
				title: updateTaskData.title,
				description: updateTaskData.description,
				dueDate: updateTaskData.dueDate,
				status: updateTaskData.status,
				executorUserId: updateTaskData.executorUserId,
			});
		});

		it('should successfully update task when executorUserId is set to undefined', async () => {
			const updateDataWithUndefinedExecutor = {
				...updateTaskData,
				executorUserId: undefined,
			};

			UserServiceMock.getUserOrThrow.mockResolvedValue(mockCreatorUser);
			TasksRepositoryMock.findById.mockResolvedValue(mockExistingTask);
			TasksRepositoryMock.update.mockResolvedValue(undefined);

			await tasksService.updateTask(userId, taskId, updateDataWithUndefinedExecutor);

			expect(TasksRepositoryMock.update).toHaveBeenCalledWith(taskId, {
				title: updateDataWithUndefinedExecutor.title,
				description: updateDataWithUndefinedExecutor.description,
				dueDate: updateDataWithUndefinedExecutor.dueDate,
				status: updateDataWithUndefinedExecutor.status,
				executorUserId: undefined,
			});
		});

		it('should update task without changing optional fields when they are not provided', async () => {
			const minimalUpdateData = {
				title: 'Only title updated',
			};

			UserServiceMock.getUserOrThrow.mockResolvedValue(mockCreatorUser);
			TasksRepositoryMock.findById.mockResolvedValue(mockExistingTask);
			TasksRepositoryMock.update.mockResolvedValue(undefined);

			await tasksService.updateTask(userId, taskId, minimalUpdateData);

			expect(TasksRepositoryMock.update).toHaveBeenCalledWith(taskId, {
				title: 'Only title updated',
				description: undefined,
				dueDate: undefined,
				status: undefined,
				executorUserId: undefined,
			});
		});

		it('should throw error when user does not exist', async () => {
			UserServiceMock.getUserOrThrow.mockRejectedValueOnce(
				new HttpError(
					HttpErrorCode.NOT_FOUND,
					USERS_MESSAGES.USER_NOT_FOUND,
					TASKS_PATHS.UPDATE_TASK,
				),
			);

			await expect(tasksService.updateTask(userId, taskId, updateTaskData)).rejects.toThrow(
				HttpError,
			);

			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledWith(
				userId,
				USERS_MESSAGES.USER_NOT_FOUND,
				TASKS_PATHS.UPDATE_TASK,
			);
			expect(TasksRepositoryMock.findById).not.toHaveBeenCalled();
			expect(TasksRepositoryMock.update).not.toHaveBeenCalled();
		});

		it('should throw error when task does not exist', async () => {
			UserServiceMock.getUserOrThrow.mockResolvedValue(mockCreatorUser);
			TasksRepositoryMock.findById.mockResolvedValue(null);

			await expect(tasksService.updateTask(userId, taskId, updateTaskData)).rejects.toThrow(
				HttpError,
			);

			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalled();
			expect(TasksRepositoryMock.findById).toHaveBeenCalledWith(taskId);
			expect(TasksRepositoryMock.update).not.toHaveBeenCalled();
		});

		it('should throw error when user is not the creator of the task', async () => {
			const anotherUserId = 99;
			const taskWithDifferentCreator: TaskModel = {
				...mockExistingTask,
				createUserId: 50,
			};

			UserServiceMock.getUserOrThrow.mockResolvedValue(mockCreatorUser);
			TasksRepositoryMock.findById.mockResolvedValue(taskWithDifferentCreator);

			await expect(tasksService.updateTask(anotherUserId, taskId, updateTaskData)).rejects.toThrow(
				HttpError,
			);

			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledWith(
				anotherUserId,
				USERS_MESSAGES.USER_NOT_FOUND,
				TASKS_PATHS.UPDATE_TASK,
			);
			expect(TasksRepositoryMock.findById).toHaveBeenCalledWith(taskId);
			expect(TasksRepositoryMock.update).not.toHaveBeenCalled();
		});

		it('should throw error when repository update fails', async () => {
			UserServiceMock.getUserOrThrow.mockResolvedValue(mockCreatorUser);
			TasksRepositoryMock.findById.mockResolvedValue(mockExistingTask);
			TasksRepositoryMock.update.mockRejectedValue(new Error('Database error'));

			await expect(tasksService.updateTask(userId, taskId, updateTaskData)).rejects.toThrow(
				HttpError,
			);

			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalled();
			expect(TasksRepositoryMock.findById).toHaveBeenCalled();
			expect(TasksRepositoryMock.update).toHaveBeenCalled();
		});
	});

	describe('remove', () => {
		const userId = 1;
		const taskId = 100;

		const mockUser = {
			id: 1,
			name: 'user',
			email: 'user@bk.ru',
			hasPassword: 'hashedPassword',
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const mockTaskData: TaskModel = {
			id: taskId,
			title: 'task-title',
			description: 'task-description',
			dueDate: new Date('2024-12-31'),
			status: TaskStatus.CREATED,
			completedAt: null,
			projectId: 10,
			createUserId: userId,
			executorUserId: 2,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		it('should successfully remove task when user is creator', async () => {
			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			TasksRepositoryMock.findById.mockResolvedValue(mockTaskData);
			TasksRepositoryMock.remove.mockResolvedValue(undefined);

			await tasksService.remove(taskId, userId);

			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledWith(
				userId,
				USERS_MESSAGES.USER_NOT_FOUND,
				TASKS_PATHS.DELETE_TASK,
			);
			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledTimes(1);
			expect(TasksRepositoryMock.findById).toHaveBeenCalledWith(taskId);
			expect(TasksRepositoryMock.findById).toHaveBeenCalledTimes(1);
			expect(TasksRepositoryMock.remove).toHaveBeenCalledWith(taskId);
			expect(TasksRepositoryMock.remove).toHaveBeenCalledTimes(1);
		});

		it('should throw error when user does not exist', async () => {
			UserServiceMock.getUserOrThrow.mockRejectedValue(
				new HttpError(
					HttpErrorCode.NOT_FOUND,
					USERS_MESSAGES.USER_NOT_FOUND,
					TASKS_PATHS.DELETE_TASK,
				),
			);

			await expect(tasksService.remove(taskId, userId)).rejects.toThrow(HttpError);

			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledWith(
				userId,
				USERS_MESSAGES.USER_NOT_FOUND,
				TASKS_PATHS.DELETE_TASK,
			);
			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledTimes(1);
			expect(TasksRepositoryMock.findById).not.toHaveBeenCalled();
			expect(TasksRepositoryMock.remove).not.toHaveBeenCalled();
		});

		it('should throw error when task does not exist', async () => {
			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			TasksRepositoryMock.findById.mockResolvedValue(null);

			await expect(tasksService.remove(taskId, userId)).rejects.toThrow(HttpError);

			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledTimes(1);
			expect(TasksRepositoryMock.findById).toHaveBeenCalledWith(taskId);
			expect(TasksRepositoryMock.findById).toHaveBeenCalledTimes(1);
			expect(TasksRepositoryMock.remove).not.toHaveBeenCalled();
		});

		it('should throw error when user is not the creator of the task', async () => {
			const anotherUserId = 99;
			const taskWithDifferentCreator: TaskModel = {
				...mockTaskData,
				createUserId: 50,
			};

			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			TasksRepositoryMock.findById.mockResolvedValue(taskWithDifferentCreator);

			await expect(tasksService.remove(taskId, anotherUserId)).rejects.toThrow(HttpError);

			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledWith(
				anotherUserId,
				USERS_MESSAGES.USER_NOT_FOUND,
				TASKS_PATHS.DELETE_TASK,
			);
			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledTimes(1);
			expect(TasksRepositoryMock.findById).toHaveBeenCalledWith(taskId);
			expect(TasksRepositoryMock.findById).toHaveBeenCalledTimes(1);
			expect(TasksRepositoryMock.remove).not.toHaveBeenCalled();
		});

		it('should throw error when user is not the creator of the task', async () => {
			const anotherUserId = 99;
			const taskWithDifferentCreator: TaskModel = {
				...mockTaskData,
				createUserId: 50,
			};

			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			TasksRepositoryMock.findById.mockResolvedValue(taskWithDifferentCreator);

			await expect(tasksService.remove(taskId, anotherUserId)).rejects.toThrow(
				TASKS_MESSAGES.TASK_BAN_ON_DELETE,
			);

			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledWith(
				anotherUserId,
				USERS_MESSAGES.USER_NOT_FOUND,
				TASKS_PATHS.DELETE_TASK,
			);
			expect(TasksRepositoryMock.findById).toHaveBeenCalledWith(taskId);
			expect(TasksRepositoryMock.remove).not.toHaveBeenCalled();
		});

		it('should throw error when task does not exist', async () => {
			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			TasksRepositoryMock.findById.mockResolvedValue(null);

			await expect(tasksService.remove(taskId, userId)).rejects.toThrow(
				TASKS_MESSAGES.TASK_NOT_FOUND,
			);

			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledWith(
				userId,
				USERS_MESSAGES.USER_NOT_FOUND,
				TASKS_PATHS.DELETE_TASK,
			);
			expect(TasksRepositoryMock.findById).toHaveBeenCalledWith(taskId);
			expect(TasksRepositoryMock.remove).not.toHaveBeenCalled();
		});

		it('should successfully remove task even when executorUserId is null', async () => {
			const taskWithoutExecutor: TaskModel = {
				...mockTaskData,
				executorUserId: null,
			};

			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			TasksRepositoryMock.findById.mockResolvedValue(taskWithoutExecutor);
			TasksRepositoryMock.remove.mockResolvedValue(undefined);

			await tasksService.remove(taskId, userId);

			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledTimes(1);
			expect(TasksRepositoryMock.findById).toHaveBeenCalledWith(taskId);
			expect(TasksRepositoryMock.remove).toHaveBeenCalledWith(taskId);
			expect(TasksRepositoryMock.remove).toHaveBeenCalledTimes(1);
		});

		it('should successfully remove task when description is null', async () => {
			const taskWithoutDescription: TaskModel = {
				...mockTaskData,
				description: null,
			};

			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			TasksRepositoryMock.findById.mockResolvedValue(taskWithoutDescription);
			TasksRepositoryMock.remove.mockResolvedValue(undefined);

			await tasksService.remove(taskId, userId);

			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledTimes(1);
			expect(TasksRepositoryMock.findById).toHaveBeenCalledWith(taskId);
			expect(TasksRepositoryMock.remove).toHaveBeenCalledWith(taskId);
			expect(TasksRepositoryMock.remove).toHaveBeenCalledTimes(1);
		});

		it('should throw error when taskId is invalid (repository returns null)', async () => {
			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			TasksRepositoryMock.findById.mockResolvedValue(null);

			await expect(tasksService.remove(taskId, userId)).rejects.toThrow(HttpError);

			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledTimes(1);
			expect(TasksRepositoryMock.findById).toHaveBeenCalledWith(taskId);
			expect(TasksRepositoryMock.remove).not.toHaveBeenCalled();
		});
	});

	describe('assignTaskUser', () => {
		const userId = 1;
		const taskId = 100;
		const executorUserId = 2;

		const mockUser = {
			id: userId,
			name: 'user',
			email: 'user@bk.ru',
			hasPassword: 'hashedPassword',
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const mockExecutorUser = {
			id: executorUserId,
			name: 'executor',
			email: 'executor@bk.ru',
			hasPassword: 'hashedPassword',
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const mockTaskData: TaskModel = {
			id: taskId,
			title: 'task-title',
			description: 'task-description',
			dueDate: new Date('2024-12-31'),
			status: TaskStatus.CREATED,
			completedAt: null,
			projectId: 10,
			createUserId: userId,
			executorUserId: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const assignTaskUserData = {
			userId: userId,
			info: {
				taskId: taskId,
				executorUserId: executorUserId,
			},
		};

		it('should successfully assign task when user is creator', async () => {
			UserServiceMock.getUserOrThrow.mockResolvedValueOnce(mockUser);
			UserServiceMock.getUserOrThrow.mockResolvedValueOnce(mockExecutorUser);
			TasksRepositoryMock.findById.mockResolvedValue(mockTaskData);
			TasksRepositoryMock.assignTaskUser.mockResolvedValue(undefined);

			await tasksService.assignTaskUser(assignTaskUserData);

			expect(UserServiceMock.getUserOrThrow).toHaveBeenNthCalledWith(
				1,
				userId,
				USERS_MESSAGES.USER_NOT_FOUND_CREATER,
				TASKS_PATHS.ASSIGN_TASK_USER,
			);
			expect(UserServiceMock.getUserOrThrow).toHaveBeenNthCalledWith(
				2,
				executorUserId,
				USERS_MESSAGES.USER_NOT_FOUND_EXECUTOR,
				TASKS_PATHS.ASSIGN_TASK_USER,
			);
			expect(TasksRepositoryMock.findById).toHaveBeenCalledWith(taskId);
			expect(TasksRepositoryMock.assignTaskUser).toHaveBeenCalledWith({
				taskId: taskId,
				executorUserId: executorUserId,
			});
		});

		it('should successfully assign task when user is not creator but assigns another executor', async () => {
			const nonCreatorUserId = 99;
			const assignData = {
				userId: nonCreatorUserId,
				info: {
					taskId: taskId,
					executorUserId: executorUserId,
				},
			};

			UserServiceMock.getUserOrThrow.mockResolvedValueOnce({ ...mockUser, id: nonCreatorUserId });
			UserServiceMock.getUserOrThrow.mockResolvedValueOnce(mockExecutorUser);
			TasksRepositoryMock.findById.mockResolvedValue(mockTaskData);
			TasksRepositoryMock.assignTaskUser.mockResolvedValue(undefined);

			await tasksService.assignTaskUser(assignData);

			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledTimes(2);
			expect(TasksRepositoryMock.findById).toHaveBeenCalledWith(taskId);
			expect(TasksRepositoryMock.assignTaskUser).toHaveBeenCalledWith({
				taskId: taskId,
				executorUserId: executorUserId,
			});
		});

		it('should throw error when user does not exist', async () => {
			UserServiceMock.getUserOrThrow.mockRejectedValueOnce(
				new HttpError(
					HttpErrorCode.NOT_FOUND,
					USERS_MESSAGES.USER_NOT_FOUND_CREATER,
					TASKS_PATHS.ASSIGN_TASK_USER,
				),
			);

			await expect(tasksService.assignTaskUser(assignTaskUserData)).rejects.toThrow(HttpError);

			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledTimes(1);
			expect(TasksRepositoryMock.findById).not.toHaveBeenCalled();
			expect(TasksRepositoryMock.assignTaskUser).not.toHaveBeenCalled();
		});

		it('should throw error when executor user does not exist', async () => {
			UserServiceMock.getUserOrThrow.mockResolvedValueOnce(mockUser);
			UserServiceMock.getUserOrThrow.mockRejectedValueOnce(
				new HttpError(
					HttpErrorCode.NOT_FOUND,
					USERS_MESSAGES.USER_NOT_FOUND_EXECUTOR,
					TASKS_PATHS.ASSIGN_TASK_USER,
				),
			);

			await expect(tasksService.assignTaskUser(assignTaskUserData)).rejects.toThrow(HttpError);

			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledTimes(2);
			expect(TasksRepositoryMock.findById).not.toHaveBeenCalled();
			expect(TasksRepositoryMock.assignTaskUser).not.toHaveBeenCalled();
		});

		it('should throw error when task does not exist', async () => {
			UserServiceMock.getUserOrThrow.mockResolvedValueOnce(mockUser);
			UserServiceMock.getUserOrThrow.mockResolvedValueOnce(mockExecutorUser);
			TasksRepositoryMock.findById.mockResolvedValue(null);

			await expect(tasksService.assignTaskUser(assignTaskUserData)).rejects.toThrow(HttpError);

			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledTimes(2);
			expect(TasksRepositoryMock.findById).toHaveBeenCalledWith(taskId);
			expect(TasksRepositoryMock.assignTaskUser).not.toHaveBeenCalled();
		});

		it('should throw FORBIDDEN error when user is not creator but tries to assign themselves', async () => {
			const nonCreatorUserId = 99;
			const assignDataWithSelfAssign = {
				userId: nonCreatorUserId,
				info: {
					taskId: taskId,
					executorUserId: nonCreatorUserId,
				},
			};

			UserServiceMock.getUserOrThrow.mockResolvedValueOnce({ ...mockUser, id: nonCreatorUserId });
			UserServiceMock.getUserOrThrow.mockResolvedValueOnce({
				...mockExecutorUser,
				id: nonCreatorUserId,
			});
			TasksRepositoryMock.findById.mockResolvedValue(mockTaskData);

			await expect(tasksService.assignTaskUser(assignDataWithSelfAssign)).rejects.toThrow(
				new HttpError(
					HttpErrorCode.FORBIDDEN,
					TASKS_MESSAGES.BAN_ON_ASSIGN_TASK_USER,
					TASKS_PATHS.ASSIGN_TASK_USER,
				),
			);

			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledTimes(2);
			expect(TasksRepositoryMock.findById).toHaveBeenCalledWith(taskId);
			expect(TasksRepositoryMock.assignTaskUser).not.toHaveBeenCalled();
		});

		it('should throw error when repository assignTaskUser fails', async () => {
			UserServiceMock.getUserOrThrow.mockResolvedValueOnce(mockUser);
			UserServiceMock.getUserOrThrow.mockResolvedValueOnce(mockExecutorUser);
			TasksRepositoryMock.findById.mockResolvedValue(mockTaskData);
			TasksRepositoryMock.assignTaskUser.mockRejectedValue(new Error('Database error'));

			await expect(tasksService.assignTaskUser(assignTaskUserData)).rejects.toThrow(
				'Внутренняя ошибка сервера',
			);

			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledTimes(2);
			expect(TasksRepositoryMock.findById).toHaveBeenCalledWith(taskId);
			expect(TasksRepositoryMock.assignTaskUser).toHaveBeenCalled();
		});
	});
});
