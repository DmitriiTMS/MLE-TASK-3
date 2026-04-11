import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import 'reflect-metadata';
import { ProjectModel } from '@prisma/client';
import { Container } from 'inversify';
import { TYPES } from '../common/types/types';
import { IProjectsRepository } from './projects.repository.interface';
import { CreateProjectsDto } from './dto/create-projects.dto';
import { IProjectsService } from './projects.service.interface';
import { ProjectEntity } from './entity/project.entity';
import { ProjectsService } from './projects.service';
import { IUserService } from '../users/user.service.interface';
import { PROJECTS_PATH } from './constants';
import { HttpErrorCode, HttpErrorMessages } from '../common/error/constants';
import { HttpError } from '../common/error/http-error';
import { UpdateProjectDto } from './dto/update-project.dto';

// npm run test -- src/projects/projects.service.spec.ts

const UserServiceMock = {
	createUser: jest.fn(),
	getUserOrThrow: jest.fn(),
} as jest.Mocked<IUserService>;

const ProjectsRepositoryMock = {
	create: jest.fn(),
	getAllProjectsByUserId: jest.fn(),
	findById: jest.fn(),
	remove: jest.fn(),
	update: jest.fn(),
} as jest.Mocked<IProjectsRepository>;

describe('ProjectsService', () => {
	let projectsService: IProjectsService;

	beforeEach(() => {
		const container = new Container();
		container.bind<IProjectsService>(TYPES.IProjectsService).to(ProjectsService);
		container.bind<IUserService>(TYPES.IUserService).toConstantValue(UserServiceMock);
		container
			.bind<IProjectsRepository>(TYPES.IProjectsRepository)
			.toConstantValue(ProjectsRepositoryMock);

		projectsService = container.get<IProjectsService>(TYPES.IProjectsService);

		jest.clearAllMocks();
	});

	describe('create', () => {
		const createProjectDto: CreateProjectsDto = {
			name: 'project-name',
			description: 'project-description',
		};

		const userId = 1;

		const mockUser = {
			id: 1,
			name: 'user',
			email: 'user@bk.ru',
			hasPassword: 'hashedPassword',
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const mockSavedProject: ProjectModel = {
			id: 10,
			name: 'project-name',
			description: 'project-description',
			userId: 1,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		it('should successfully create a project when user exists', async () => {
			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			ProjectsRepositoryMock.create.mockResolvedValue(mockSavedProject);

			const result = await projectsService.create(createProjectDto, userId);

			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledWith(userId, PROJECTS_PATH.CREATE);
			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledTimes(1);
			expect(ProjectsRepositoryMock.create).toHaveBeenCalledWith({
				name: createProjectDto.name,
				description: createProjectDto.description,
				userId: userId,
			});
			expect(ProjectsRepositoryMock.create).toHaveBeenCalledTimes(1);
			expect(result).toBeInstanceOf(ProjectEntity);
			expect(result.id).toBe(mockSavedProject.id);
			expect(result.name).toBe(mockSavedProject.name);
			expect(result.description).toBe(mockSavedProject.description);
			expect(result.createdAt).toBe(mockSavedProject.createdAt);
			expect(result.updatedAt).toBe(mockSavedProject.updatedAt);
		});

		it('should throw error when user does not exist', async () => {
			UserServiceMock.getUserOrThrow.mockRejectedValue(
				new Error(HttpErrorMessages[HttpErrorCode.NOT_FOUND]),
			);

			await expect(projectsService.create(createProjectDto, userId)).rejects.toThrow();
			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledWith(userId, PROJECTS_PATH.CREATE);
			expect(ProjectsRepositoryMock.create).not.toHaveBeenCalled();
		});

		it('should create project without description (field missing)', async () => {
			const dto = { name: 'project-name' };

			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			const savedProjectWithoutDescription: ProjectModel = {
				id: 11,
				name: 'project-name',
				description: null,
				userId: userId,
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			ProjectsRepositoryMock.create.mockResolvedValue(savedProjectWithoutDescription);

			const result = await projectsService.create(dto as CreateProjectsDto, userId);

			expect(ProjectsRepositoryMock.create).toHaveBeenCalledWith({
				name: 'project-name',
				description: null,
				userId: userId,
			});
			expect(ProjectsRepositoryMock.create).toHaveBeenCalledTimes(1);
			expect(result.id).toBe(savedProjectWithoutDescription.id);
			expect(result.name).toBe(savedProjectWithoutDescription.name);
			expect(result.description).toBeNull();
			expect(result.createdAt).toBe(savedProjectWithoutDescription.createdAt);
			expect(result.updatedAt).toBe(savedProjectWithoutDescription.updatedAt);
			expect(result.userId).toBe(savedProjectWithoutDescription.userId);
		});
	});

	describe('getAllProjectsByUserId', () => {
		const userId = 1;
		const mockUser = {
			id: 1,
			name: 'user',
			email: 'user@bk.ru',
			hasPassword: 'hashedPassword',
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		const mockProjects = [
			{
				id: 1,
				name: 'Project 1',
				userId,
				description: 'Desc 1',
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				id: 2,
				name: 'Project 2',
				userId,
				description: 'Desc 2',
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		];

		it('should return projects when user exists and has projects', async () => {
			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			ProjectsRepositoryMock.getAllProjectsByUserId.mockResolvedValue(mockProjects);

			const result = await projectsService.getAllProjectsByUserId(userId);

			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledWith(
				userId,
				PROJECTS_PATH.GET_ALL_PROJECTS_BY_USER_ID,
			);
			expect(ProjectsRepositoryMock.getAllProjectsByUserId).toHaveBeenCalledWith(userId);
			expect(result).toHaveLength(2);
			expect(result[0]).toBeInstanceOf(ProjectEntity);
			expect(result[0].id).toBe(1);
			expect(result[0].name).toBe('Project 1');
			expect(result[1].id).toBe(2);
		});

		it('should return empty array when user exists but has no projects', async () => {
			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			ProjectsRepositoryMock.getAllProjectsByUserId.mockResolvedValue([]);

			const result = await projectsService.getAllProjectsByUserId(userId);

			expect(result).toEqual([]);
			expect(result).toHaveLength(0);
			expect(ProjectsRepositoryMock.getAllProjectsByUserId).toHaveBeenCalledWith(userId);
		});

		it('should throw error when user does not exist', async () => {
			const userId = 999;
			const error = new HttpError(
				HttpErrorCode.NOT_FOUND,
				HttpErrorMessages[HttpErrorCode.NOT_FOUND],
				PROJECTS_PATH.GET_ALL_PROJECTS_BY_USER_ID,
			);

			UserServiceMock.getUserOrThrow.mockRejectedValue(error);

			await expect(projectsService.getAllProjectsByUserId(userId)).rejects.toThrow(
				HttpErrorMessages[HttpErrorCode.NOT_FOUND],
			);

			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledWith(
				userId,
				PROJECTS_PATH.GET_ALL_PROJECTS_BY_USER_ID,
			);
			expect(ProjectsRepositoryMock.getAllProjectsByUserId).not.toHaveBeenCalled();
		});
	});

	describe('getProjectById', () => {
		const userId = 1;
		const projectId = 10;
		const mockUser = {
			id: 1,
			name: 'user',
			email: 'user@bk.ru',
			hasPassword: 'hashedPassword',
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const mockProjectData: ProjectModel = {
			id: projectId,
			name: 'Test Project',
			description: 'Test Description',
			userId: userId,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		it('should return project when user exists and is owner', async () => {
			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			ProjectsRepositoryMock.findById.mockResolvedValue(mockProjectData);

			const result = await projectsService.getProjectByUserId(projectId, userId);

			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledWith(
				userId,
				PROJECTS_PATH.GET_PROJECT_BY_USER_ID,
			);
			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledTimes(1);

			expect(ProjectsRepositoryMock.findById).toHaveBeenCalledWith(projectId);
			expect(ProjectsRepositoryMock.findById).toHaveBeenCalledTimes(1);

			expect(result).toBeInstanceOf(ProjectEntity);
			expect(result.id).toBe(projectId);
			expect(result.name).toBe('Test Project');
			expect(result.description).toBe('Test Description');
			expect(result.userId).toBe(userId);
		});

		it('should throw error when user does not exist', async () => {
			const error = new HttpError(
				HttpErrorCode.NOT_FOUND,
				'User not found',
				PROJECTS_PATH.GET_PROJECT_BY_USER_ID,
			);
			UserServiceMock.getUserOrThrow.mockRejectedValue(error);

			await expect(projectsService.getProjectByUserId(projectId, userId)).rejects.toThrow(
				'User not found',
			);

			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledWith(
				userId,
				PROJECTS_PATH.GET_PROJECT_BY_USER_ID,
			);
			expect(ProjectsRepositoryMock.findById).not.toHaveBeenCalled();
		});

		it('should throw error when project does not exist', async () => {
			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			ProjectsRepositoryMock.findById.mockResolvedValue(null);

			await expect(projectsService.getProjectByUserId(projectId, userId)).rejects.toThrow(
				'Ресурс не найден',
			);

			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalled();
			expect(ProjectsRepositoryMock.findById).toHaveBeenCalledWith(projectId);
		});

		it('should throw error when user is not the owner', async () => {
			const differentUserId = 999;
			const projectWithDifferentOwner = {
				...mockProjectData,
				userId: differentUserId,
			};

			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			ProjectsRepositoryMock.findById.mockResolvedValue(projectWithDifferentOwner);

			await expect(projectsService.getProjectByUserId(projectId, userId)).rejects.toThrow(
				'Доступ запрещен',
			);

			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalled();
			expect(ProjectsRepositoryMock.findById).toHaveBeenCalledWith(projectId);
		});

		it('should throw error when user is owner but project belongs to another user', async () => {
			const ownerUserId = 2;
			const currentUserId = 1;

			const projectOfAnotherUser: ProjectModel = {
				...mockProjectData,
				id: projectId,
				userId: ownerUserId,
				name: 'Another User Project',
			};

			const currentUser = {
				id: currentUserId,
				name: 'user',
				email: 'user@bk.ru',
				hasPassword: 'hashedPassword',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			UserServiceMock.getUserOrThrow.mockResolvedValue(currentUser);
			ProjectsRepositoryMock.findById.mockResolvedValue(projectOfAnotherUser);

			await expect(projectsService.getProjectByUserId(projectId, currentUserId)).rejects.toThrow(
				'Доступ запрещен',
			);

			expect(ProjectsRepositoryMock.findById).toHaveBeenCalledWith(projectId);
		});

		it('should return correct project entity structure', async () => {
			const expectedProject = {
				id: projectId,
				name: 'Test Project',
				description: 'Test Description',
			};

			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			ProjectsRepositoryMock.findById.mockResolvedValue(mockProjectData);

			const result = await projectsService.getProjectByUserId(projectId, userId);
			const response = result.toResponse();

			expect(response).toMatchObject(expectedProject);
		});

		it('should handle repository error gracefully', async () => {
			const dbError = new Error('Database connection failed');
			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			ProjectsRepositoryMock.findById.mockRejectedValue(dbError);

			await expect(projectsService.getProjectByUserId(projectId, userId)).rejects.toThrow(
				'Database connection failed',
			);
		});

		it('should call getUserOrThrow with correct parameters', async () => {
			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			ProjectsRepositoryMock.findById.mockResolvedValue(mockProjectData);

			await projectsService.getProjectByUserId(projectId, userId);

			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledTimes(1);
			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledWith(
				userId,
				PROJECTS_PATH.GET_PROJECT_BY_USER_ID,
			);
		});

		it('should call findById with correct projectId', async () => {
			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			ProjectsRepositoryMock.findById.mockResolvedValue(mockProjectData);

			await projectsService.getProjectByUserId(projectId, userId);

			expect(ProjectsRepositoryMock.findById).toHaveBeenCalledTimes(1);
			expect(ProjectsRepositoryMock.findById).toHaveBeenCalledWith(projectId);
		});
	});

	describe('update', () => {
		const userId = 1;
		const projectId = 10;
		const updateDto = {
			name: 'Updated Project Name',
			description: 'Updated Description',
		};

		const mockUser = {
			id: 1,
			name: 'user',
			email: 'user@bk.ru',
			hasPassword: 'hashedPassword',
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const mockProjectData: ProjectModel = {
			id: projectId,
			name: 'Original Project',
			description: 'Original Description',
			userId: userId,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		it('should successfully update project when user exists and is owner', async () => {
			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			ProjectsRepositoryMock.findById.mockResolvedValue(mockProjectData);
			ProjectsRepositoryMock.update.mockResolvedValue(undefined);

			await projectsService.update(userId, projectId, updateDto);

			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledWith(
				userId,
				PROJECTS_PATH.UPDATE_PROJECT,
			);
			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledTimes(1);

			expect(ProjectsRepositoryMock.findById).toHaveBeenCalledWith(projectId);
			expect(ProjectsRepositoryMock.findById).toHaveBeenCalledTimes(1);

			expect(ProjectsRepositoryMock.update).toHaveBeenCalledWith(projectId, {
				name: updateDto.name,
				description: updateDto.description,
			});
			expect(ProjectsRepositoryMock.update).toHaveBeenCalledTimes(1);
		});

		it('should successfully update only name when description is not provided', async () => {
			const updateNameOnly: UpdateProjectDto = { name: 'New Name Only' };

			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			ProjectsRepositoryMock.findById.mockResolvedValue(mockProjectData);
			ProjectsRepositoryMock.update.mockResolvedValue(undefined);

			await projectsService.update(userId, projectId, updateNameOnly);

			expect(ProjectsRepositoryMock.update).toHaveBeenCalledWith(projectId, {
				name: 'New Name Only',
			});
		});

		it('should successfully update only description when name is not provided', async () => {
			const updateDescOnly = { description: 'New Description Only' };

			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			ProjectsRepositoryMock.findById.mockResolvedValue(mockProjectData);
			ProjectsRepositoryMock.update.mockResolvedValue(undefined);

			await projectsService.update(userId, projectId, updateDescOnly);

			expect(ProjectsRepositoryMock.update).toHaveBeenCalledWith(projectId, {
				name: undefined,
				description: 'New Description Only',
			});
		});

		it('should update with empty object (no fields to update)', async () => {
			const emptyUpdate = {};

			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			ProjectsRepositoryMock.findById.mockResolvedValue(mockProjectData);
			ProjectsRepositoryMock.update.mockResolvedValue(undefined);

			await projectsService.update(userId, projectId, emptyUpdate);

			expect(ProjectsRepositoryMock.update).toHaveBeenCalledWith(projectId, {
				name: undefined,
				description: undefined,
			});
		});

		it('should throw error when user does not exist', async () => {
			const error = new HttpError(
				HttpErrorCode.NOT_FOUND,
				HttpErrorMessages[HttpErrorCode.NOT_FOUND],
				PROJECTS_PATH.UPDATE_PROJECT,
			);
			UserServiceMock.getUserOrThrow.mockRejectedValue(error);

			await expect(projectsService.update(userId, projectId, updateDto)).rejects.toThrow(
				HttpErrorMessages[HttpErrorCode.NOT_FOUND],
			);

			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledWith(
				userId,
				PROJECTS_PATH.UPDATE_PROJECT,
			);
			expect(ProjectsRepositoryMock.findById).not.toHaveBeenCalled();
			expect(ProjectsRepositoryMock.update).not.toHaveBeenCalled();
		});

		it('should throw error when project does not exist', async () => {
			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			ProjectsRepositoryMock.findById.mockResolvedValue(null);

			await expect(projectsService.update(userId, projectId, updateDto)).rejects.toThrow(
				HttpErrorMessages[HttpErrorCode.NOT_FOUND],
			);

			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledWith(
				userId,
				PROJECTS_PATH.UPDATE_PROJECT,
			);
			expect(ProjectsRepositoryMock.findById).toHaveBeenCalledWith(projectId);
			expect(ProjectsRepositoryMock.update).not.toHaveBeenCalled();
		});

		it('should throw error when user is not the project owner', async () => {
			const differentUserId = 999;
			const projectWithDifferentOwner = {
				...mockProjectData,
				userId: differentUserId,
			};

			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			ProjectsRepositoryMock.findById.mockResolvedValue(projectWithDifferentOwner);

			await expect(projectsService.update(userId, projectId, updateDto)).rejects.toThrow(
				HttpErrorMessages[HttpErrorCode.FORBIDDEN],
			);

			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledWith(
				userId,
				PROJECTS_PATH.UPDATE_PROJECT,
			);
			expect(ProjectsRepositoryMock.findById).toHaveBeenCalledWith(projectId);
			expect(ProjectsRepositoryMock.update).not.toHaveBeenCalled();
		});

		it('should throw FORBIDDEN error when trying to update project owned by another user', async () => {
			const ownerUserId = 2;
			const currentUserId = 1;

			const projectOfAnotherUser: ProjectModel = {
				...mockProjectData,
				id: projectId,
				userId: ownerUserId,
				name: 'Another User Project',
			};

			const currentUser = {
				id: currentUserId,
				name: 'current user',
				email: 'current@bk.ru',
				hasPassword: 'hashedPassword',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			UserServiceMock.getUserOrThrow.mockResolvedValue(currentUser);
			ProjectsRepositoryMock.findById.mockResolvedValue(projectOfAnotherUser);

			await expect(projectsService.update(projectId, currentUserId, updateDto)).rejects.toThrow(
				HttpErrorMessages[HttpErrorCode.FORBIDDEN],
			);

			expect(ProjectsRepositoryMock.update).not.toHaveBeenCalled();
		});

		it('should handle repository update error gracefully', async () => {
			const dbError = new Error('Database connection failed');
			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			ProjectsRepositoryMock.findById.mockResolvedValue(mockProjectData);
			ProjectsRepositoryMock.update.mockRejectedValue(dbError);

			await expect(projectsService.update(userId, projectId, updateDto)).rejects.toThrow(
				HttpErrorMessages[HttpErrorCode.INTERNAL_SERVER_ERROR],
			);

			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalled();
			expect(ProjectsRepositoryMock.findById).toHaveBeenCalledWith(projectId);
			expect(ProjectsRepositoryMock.update).toHaveBeenCalledWith(projectId, {
				name: updateDto.name,
				description: updateDto.description,
			});
		});

		it('should call getUserOrThrow with correct UPDATE_PROJECT path', async () => {
			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			ProjectsRepositoryMock.findById.mockResolvedValue(mockProjectData);
			ProjectsRepositoryMock.update.mockResolvedValue(undefined);

			await projectsService.update(userId, projectId, updateDto);

			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledTimes(1);
			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledWith(
				userId,
				PROJECTS_PATH.UPDATE_PROJECT,
			);
		});

		it('should call findById with correct projectId', async () => {
			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			ProjectsRepositoryMock.findById.mockResolvedValue(mockProjectData);
			ProjectsRepositoryMock.update.mockResolvedValue(undefined);

			await projectsService.update(userId, projectId, updateDto);

			expect(ProjectsRepositoryMock.findById).toHaveBeenCalledTimes(1);
			expect(ProjectsRepositoryMock.findById).toHaveBeenCalledWith(projectId);
		});

		it('should call update with correct parameters', async () => {
			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			ProjectsRepositoryMock.findById.mockResolvedValue(mockProjectData);
			ProjectsRepositoryMock.update.mockResolvedValue(undefined);

			await projectsService.update(userId, projectId, updateDto);

			expect(ProjectsRepositoryMock.update).toHaveBeenCalledTimes(1);
			expect(ProjectsRepositoryMock.update).toHaveBeenCalledWith(projectId, {
				name: updateDto.name,
				description: updateDto.description,
			});
		});

		it('should handle project with null description during update', async () => {
			const projectWithNullDesc: ProjectModel = {
				...mockProjectData,
				description: null,
			};

			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			ProjectsRepositoryMock.findById.mockResolvedValue(projectWithNullDesc);
			ProjectsRepositoryMock.update.mockResolvedValue(undefined);

			await projectsService.update(userId, projectId, { description: 'New Description' });

			expect(ProjectsRepositoryMock.update).toHaveBeenCalledWith(projectId, {
				name: undefined,
				description: 'New Description',
			});
		});

		it('should handle updating description to null', async () => {
			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			ProjectsRepositoryMock.findById.mockResolvedValue(mockProjectData);
			ProjectsRepositoryMock.update.mockResolvedValue(undefined);

			await projectsService.update(userId, projectId, { description: null as any });

			expect(ProjectsRepositoryMock.update).toHaveBeenCalledWith(projectId, {
				name: undefined,
				description: null,
			});
		});

		it('should handle updating name to empty string', async () => {
			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			ProjectsRepositoryMock.findById.mockResolvedValue(mockProjectData);
			ProjectsRepositoryMock.update.mockResolvedValue(undefined);

			await projectsService.update(userId, projectId, { name: '' });

			expect(ProjectsRepositoryMock.update).toHaveBeenCalledWith(projectId, {
				name: '',
				description: undefined,
			});
		});

		it('should handle large projectId values', async () => {
			const largeProjectId = 999999999;

			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			ProjectsRepositoryMock.findById.mockResolvedValue({
				...mockProjectData,
				id: largeProjectId,
			});
			ProjectsRepositoryMock.update.mockResolvedValue(undefined);

			await projectsService.update(userId, largeProjectId, updateDto);

			expect(ProjectsRepositoryMock.findById).toHaveBeenCalledWith(largeProjectId);
			expect(ProjectsRepositoryMock.update).toHaveBeenCalledWith(largeProjectId, {
				name: updateDto.name,
				description: updateDto.description,
			});
		});

		it('should call updateFields on project entity with correct parameters', async () => {
			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			ProjectsRepositoryMock.findById.mockResolvedValue(mockProjectData);
			ProjectsRepositoryMock.update.mockResolvedValue(undefined);

			const updateFieldsSpy = jest.spyOn(ProjectEntity.prototype, 'updateFields');

			await projectsService.update(userId, projectId, updateDto);

			expect(updateFieldsSpy).toHaveBeenCalledWith({
				name: updateDto.name,
				description: updateDto.description,
			});

			updateFieldsSpy.mockRestore();
		});

		it('should throw INTERNAL_SERVER_ERROR when update fails with non-HttpError', async () => {
			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			ProjectsRepositoryMock.findById.mockResolvedValue(mockProjectData);
			ProjectsRepositoryMock.update.mockRejectedValue(new Error('Some database error'));

			await expect(projectsService.update(userId, projectId, updateDto)).rejects.toThrow(
				HttpErrorMessages[HttpErrorCode.INTERNAL_SERVER_ERROR],
			);
		});
	});

	describe('remove', () => {
		const userId = 1;
		const projectId = 10;
		const mockUser = {
			id: 1,
			name: 'user',
			email: 'user@bk.ru',
			hasPassword: 'hashedPassword',
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const mockProjectData: ProjectModel = {
			id: projectId,
			name: 'Test Project',
			description: 'Test Description',
			userId: userId,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		it('should successfully remove project when user exists and is owner', async () => {
			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			ProjectsRepositoryMock.findById.mockResolvedValue(mockProjectData);
			ProjectsRepositoryMock.remove.mockResolvedValue(undefined);

			await projectsService.remove(projectId, userId);

			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledWith(
				userId,
				PROJECTS_PATH.REMOVE_PROJECT,
			);
			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledTimes(1);

			expect(ProjectsRepositoryMock.findById).toHaveBeenCalledWith(projectId);
			expect(ProjectsRepositoryMock.findById).toHaveBeenCalledTimes(1);

			expect(ProjectsRepositoryMock.remove).toHaveBeenCalledWith(projectId);
			expect(ProjectsRepositoryMock.remove).toHaveBeenCalledTimes(1);
		});

		it('should throw error when user does not exist', async () => {
			const error = new HttpError(
				HttpErrorCode.NOT_FOUND,
				'User not found',
				PROJECTS_PATH.REMOVE_PROJECT,
			);
			UserServiceMock.getUserOrThrow.mockRejectedValue(error);

			await expect(projectsService.remove(projectId, userId)).rejects.toThrow('User not found');

			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledWith(
				userId,
				PROJECTS_PATH.REMOVE_PROJECT,
			);
			expect(ProjectsRepositoryMock.findById).not.toHaveBeenCalled();
			expect(ProjectsRepositoryMock.remove).not.toHaveBeenCalled();
		});

		it('should throw error when project does not exist', async () => {
			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			ProjectsRepositoryMock.findById.mockResolvedValue(null);

			await expect(projectsService.remove(projectId, userId)).rejects.toThrow(
				HttpErrorMessages[HttpErrorCode.NOT_FOUND],
			);

			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledWith(
				userId,
				PROJECTS_PATH.REMOVE_PROJECT,
			);
			expect(ProjectsRepositoryMock.findById).toHaveBeenCalledWith(projectId);
			expect(ProjectsRepositoryMock.remove).not.toHaveBeenCalled();
		});

		it('should throw error when user is not the project owner', async () => {
			const differentUserId = 999;
			const projectWithDifferentOwner = {
				...mockProjectData,
				userId: differentUserId,
			};

			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			ProjectsRepositoryMock.findById.mockResolvedValue(projectWithDifferentOwner);

			await expect(projectsService.remove(projectId, userId)).rejects.toThrow(
				HttpErrorMessages[HttpErrorCode.FORBIDDEN],
			);

			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledWith(
				userId,
				PROJECTS_PATH.REMOVE_PROJECT,
			);
			expect(ProjectsRepositoryMock.findById).toHaveBeenCalledWith(projectId);
			expect(ProjectsRepositoryMock.remove).not.toHaveBeenCalled();
		});

		it('should throw FORBIDDEN error when trying to remove project owned by another user', async () => {
			const ownerUserId = 2;
			const currentUserId = 1;

			const projectOfAnotherUser: ProjectModel = {
				...mockProjectData,
				id: projectId,
				userId: ownerUserId,
				name: 'Another User Project',
			};

			const currentUser = {
				id: currentUserId,
				name: 'user',
				email: 'user@bk.ru',
				hasPassword: 'hashedPassword',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			UserServiceMock.getUserOrThrow.mockResolvedValue(currentUser);
			ProjectsRepositoryMock.findById.mockResolvedValue(projectOfAnotherUser);

			await expect(projectsService.remove(projectId, currentUserId)).rejects.toThrow(
				HttpErrorMessages[HttpErrorCode.FORBIDDEN],
			);

			expect(ProjectsRepositoryMock.findById).toHaveBeenCalledWith(projectId);
			expect(ProjectsRepositoryMock.remove).not.toHaveBeenCalled();
		});

		it('should handle repository findById error gracefully', async () => {
			const dbError = new Error('Database connection failed');
			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			ProjectsRepositoryMock.findById.mockRejectedValue(dbError);

			await expect(projectsService.remove(projectId, userId)).rejects.toThrow(
				'Database connection failed',
			);

			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalled();
			expect(ProjectsRepositoryMock.findById).toHaveBeenCalledWith(projectId);
			expect(ProjectsRepositoryMock.remove).not.toHaveBeenCalled();
		});

		it('should handle repository remove error gracefully', async () => {
			const dbError = new Error('Failed to delete project');
			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			ProjectsRepositoryMock.findById.mockResolvedValue(mockProjectData);
			ProjectsRepositoryMock.remove.mockRejectedValue(dbError);

			await expect(projectsService.remove(projectId, userId)).rejects.toThrow(
				'Failed to delete project',
			);

			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalled();
			expect(ProjectsRepositoryMock.findById).toHaveBeenCalledWith(projectId);
			expect(ProjectsRepositoryMock.remove).toHaveBeenCalledWith(projectId);
		});

		it('should call getUserOrThrow with correct REMOVE_PROJECT path', async () => {
			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			ProjectsRepositoryMock.findById.mockResolvedValue(mockProjectData);
			ProjectsRepositoryMock.remove.mockResolvedValue(undefined);

			await projectsService.remove(projectId, userId);

			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledTimes(1);
			expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledWith(
				userId,
				PROJECTS_PATH.REMOVE_PROJECT,
			);
		});

		it('should call findById with correct projectId', async () => {
			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			ProjectsRepositoryMock.findById.mockResolvedValue(mockProjectData);
			ProjectsRepositoryMock.remove.mockResolvedValue(undefined);

			await projectsService.remove(projectId, userId);

			expect(ProjectsRepositoryMock.findById).toHaveBeenCalledTimes(1);
			expect(ProjectsRepositoryMock.findById).toHaveBeenCalledWith(projectId);
		});

		it('should call remove with correct projectId', async () => {
			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			ProjectsRepositoryMock.findById.mockResolvedValue(mockProjectData);
			ProjectsRepositoryMock.remove.mockResolvedValue(undefined);

			await projectsService.remove(projectId, userId);

			expect(ProjectsRepositoryMock.remove).toHaveBeenCalledTimes(1);
			expect(ProjectsRepositoryMock.remove).toHaveBeenCalledWith(projectId);
		});

		it('should not call remove if project does not exist', async () => {
			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			ProjectsRepositoryMock.findById.mockResolvedValue(null);

			await expect(projectsService.remove(projectId, userId)).rejects.toThrow(
				HttpErrorMessages[HttpErrorCode.NOT_FOUND],
			);

			expect(ProjectsRepositoryMock.remove).not.toHaveBeenCalled();
		});

		it('should not call remove if user is not owner', async () => {
			const differentUserId = 999;
			const projectWithDifferentOwner = {
				...mockProjectData,
				userId: differentUserId,
			};

			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			ProjectsRepositoryMock.findById.mockResolvedValue(projectWithDifferentOwner);

			await expect(projectsService.remove(projectId, userId)).rejects.toThrow(
				HttpErrorMessages[HttpErrorCode.FORBIDDEN],
			);

			expect(ProjectsRepositoryMock.remove).not.toHaveBeenCalled();
		});

		it('should handle project with null description', async () => {
			const projectWithNullDescription: ProjectModel = {
				...mockProjectData,
				description: null,
			};

			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			ProjectsRepositoryMock.findById.mockResolvedValue(projectWithNullDescription);
			ProjectsRepositoryMock.remove.mockResolvedValue(undefined);

			await projectsService.remove(projectId, userId);

			expect(ProjectsRepositoryMock.findById).toHaveBeenCalledWith(projectId);
			expect(ProjectsRepositoryMock.remove).toHaveBeenCalledWith(projectId);
		});

		it('should handle removal of project with empty description', async () => {
			const projectWithEmptyDescription: ProjectModel = {
				...mockProjectData,
				description: '',
			};

			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			ProjectsRepositoryMock.findById.mockResolvedValue(projectWithEmptyDescription);
			ProjectsRepositoryMock.remove.mockResolvedValue(undefined);

			await projectsService.remove(projectId, userId);

			expect(ProjectsRepositoryMock.remove).toHaveBeenCalledWith(projectId);
		});

		it('should verify isOwnedBy is called with correct userId', async () => {
			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			ProjectsRepositoryMock.findById.mockResolvedValue(mockProjectData);
			ProjectsRepositoryMock.remove.mockResolvedValue(undefined);

			await projectsService.remove(projectId, userId);

			expect(ProjectsRepositoryMock.remove).toHaveBeenCalledWith(projectId);
		});

		it('should handle large projectId values', async () => {
			const largeProjectId = 999999999;
			const mockProjectWithLargeId: ProjectModel = {
				...mockProjectData,
				id: largeProjectId,
			};

			UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
			ProjectsRepositoryMock.findById.mockResolvedValue(mockProjectWithLargeId);
			ProjectsRepositoryMock.remove.mockResolvedValue(undefined);

			await projectsService.remove(largeProjectId, userId);

			expect(ProjectsRepositoryMock.findById).toHaveBeenCalledWith(largeProjectId);
			expect(ProjectsRepositoryMock.remove).toHaveBeenCalledWith(largeProjectId);
		});

		it('should handle when userId is valid but project belongs to different user', async () => {
			const ownerUserId = 5;
			const currentUserId = 3;

			const projectOfOtherUser: ProjectModel = {
				...mockProjectData,
				userId: ownerUserId,
			};

			const currentUser = {
				id: currentUserId,
				name: 'current user',
				email: 'current@bk.ru',
				hasPassword: 'hashedPassword',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			UserServiceMock.getUserOrThrow.mockResolvedValue(currentUser);
			ProjectsRepositoryMock.findById.mockResolvedValue(projectOfOtherUser);

			await expect(projectsService.remove(projectId, currentUserId)).rejects.toThrow(
				HttpErrorMessages[HttpErrorCode.FORBIDDEN],
			);

			expect(ProjectsRepositoryMock.remove).not.toHaveBeenCalled();
		});
	});
});
