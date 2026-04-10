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

// npm run test -- src/projects/projects.service.spec.ts

const UserServiceMock = {
    createUser: jest.fn(),
    getUserOrThrow: jest.fn(),
} as jest.Mocked<IUserService>;

const ProjectsRepositoryMock = {
    create: jest.fn(),
    getAllProjectsByUserId: jest.fn(),
    findById: jest.fn(),
} as jest.Mocked<IProjectsRepository>;

describe('ProjectsService', () => {
    let projectsService: IProjectsService;

    beforeEach(() => {
        const container = new Container();
        container.bind<IProjectsService>(TYPES.IProjectsService).to(ProjectsService);
        container.bind<IUserService>(TYPES.IUserService).toConstantValue(UserServiceMock);
        container.bind<IProjectsRepository>(TYPES.IProjectsRepository).toConstantValue(ProjectsRepositoryMock);

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

            UserServiceMock.getUserOrThrow.mockRejectedValue(new Error(HttpErrorMessages[HttpErrorCode.NOT_FOUND]));

            await expect(projectsService.create(createProjectDto, userId))
                .rejects
                .toThrow();
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

            const result = await projectsService.create(dto as any, userId);

            expect(ProjectsRepositoryMock.create).toHaveBeenCalledWith({
                name: 'project-name',
                description: undefined,
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
            { id: 1, name: 'Project 1', userId, description: 'Desc 1', createdAt: new Date(), updatedAt: new Date() },
            { id: 2, name: 'Project 2', userId, description: 'Desc 2', createdAt: new Date(), updatedAt: new Date() },
        ];

        it('should return projects when user exists and has projects', async () => {

            UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
            ProjectsRepositoryMock.getAllProjectsByUserId.mockResolvedValue(mockProjects);

            const result = await projectsService.getAllProjectsByUserId(userId);

            expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledWith(userId, PROJECTS_PATH.GET_ALL_PROJECTS_BY_USER_ID);
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
                PROJECTS_PATH.GET_ALL_PROJECTS_BY_USER_ID
            );

            UserServiceMock.getUserOrThrow.mockRejectedValue(error);

            await expect(projectsService.getAllProjectsByUserId(userId))
                .rejects
                .toThrow(HttpErrorMessages[HttpErrorCode.NOT_FOUND]);

            expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledWith(userId, PROJECTS_PATH.GET_ALL_PROJECTS_BY_USER_ID);
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
                PROJECTS_PATH.GET_PROJECT_BY_USER_ID
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
                PROJECTS_PATH.GET_PROJECT_BY_USER_ID
            );
            UserServiceMock.getUserOrThrow.mockRejectedValue(error);

            await expect(projectsService.getProjectByUserId(projectId, userId))
                .rejects
                .toThrow('User not found');

            expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledWith(
                userId,
                PROJECTS_PATH.GET_PROJECT_BY_USER_ID
            );
            expect(ProjectsRepositoryMock.findById).not.toHaveBeenCalled();
        });

        it('should throw error when project does not exist', async () => {

            UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
            ProjectsRepositoryMock.findById.mockResolvedValue(null);

            await expect(projectsService.getProjectByUserId(projectId, userId))
                .rejects
                .toThrow('Ресурс не найден');

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

            await expect(projectsService.getProjectByUserId(projectId, userId))
                .rejects
                .toThrow('Доступ запрещен');

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

            await expect(projectsService.getProjectByUserId(projectId, currentUserId))
                .rejects
                .toThrow('Доступ запрещен');

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

            await expect(projectsService.getProjectByUserId(projectId, userId))
                .rejects
                .toThrow('Database connection failed');
        });

        it('should call getUserOrThrow with correct parameters', async () => {

            UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
            ProjectsRepositoryMock.findById.mockResolvedValue(mockProjectData);

            await projectsService.getProjectByUserId(projectId, userId);

            expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledTimes(1);
            expect(UserServiceMock.getUserOrThrow).toHaveBeenCalledWith(
                userId,
                PROJECTS_PATH.GET_PROJECT_BY_USER_ID
            );
        });

        it('should call findById with correct projectId', async () => {

            UserServiceMock.getUserOrThrow.mockResolvedValue(mockUser);
            ProjectsRepositoryMock.findById.mockResolvedValue(mockProjectData);

            await projectsService.getProjectByUserId(projectId, userId);

            expect(ProjectsRepositoryMock.findById).toHaveBeenCalledTimes(1);
            expect(ProjectsRepositoryMock.findById).toHaveBeenCalledWith(projectId);
        });
    })

});
