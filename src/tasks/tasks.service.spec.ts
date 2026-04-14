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
				PROJECTS_PATH.GET_PROJECT_BY_USER_ID,
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
				PROJECTS_PATH.GET_PROJECT_BY_USER_ID,
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
});
