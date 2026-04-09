import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import 'reflect-metadata';
import { ProjectModel } from '@prisma/client';
import { IUserRepository } from '../users/user.repository.interface';
import { Container } from 'inversify';
import { TYPES } from '../common/types/types';
import { IProjectsRepository } from './projects.repository.interface';
import { CreateProjectsDto } from './dto/create-projects.dto';
import { IProjectsService } from './projects.service.interface';
import { ProjectEntity } from './entity/project.entity';
import { ProjectsService } from './projects.service';

// npm run test -- src/projects/projects.service.spec.ts

const UserRepositoryMock = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
} as jest.Mocked<IUserRepository>;

const ProjectsRepositoryMock = {
    create: jest.fn(),
    findById: jest.fn(),
    findAllByUserId: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
} as jest.Mocked<IProjectsRepository>;

describe('ProjectsService', () => {
    let projectsService: IProjectsService;

    beforeEach(() => {
        const container = new Container();
        container.bind<IProjectsService>(TYPES.IProjectsService).to(ProjectsService);
        container.bind<IUserRepository>(TYPES.IUserRepository).toConstantValue(UserRepositoryMock);
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

            UserRepositoryMock.findById.mockResolvedValue(mockUser);
            ProjectsRepositoryMock.create.mockResolvedValue(mockSavedProject);

            const result = await projectsService.create(createProjectDto, userId);

            expect(UserRepositoryMock.findById).toHaveBeenCalledWith(userId);
            expect(UserRepositoryMock.findById).toHaveBeenCalledTimes(1);
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
            expect(result.userId).toBe(mockSavedProject.userId);
            expect(result.createdAt).toBe(mockSavedProject.createdAt);
            expect(result.updatedAt).toBe(mockSavedProject.updatedAt);
        });

        it('should throw error when user does not exist', async () => {

            UserRepositoryMock.findById.mockResolvedValue(null);

            await expect(projectsService.create(createProjectDto, userId))
                .rejects
                .toThrow();
            expect(UserRepositoryMock.findById).toHaveBeenCalledWith(userId);
            expect(ProjectsRepositoryMock.create).not.toHaveBeenCalled();
        });

        it('should create project without description (field missing)', async () => {
            const dto = { name: 'project-name' };

            UserRepositoryMock.findById.mockResolvedValue(mockUser);
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
                name: 'Test Project',
                description: undefined,
                userId: userId,
            });
            expect(result.name).toBe('Test Project');
            expect(result.description).toBeNull();
        });

    });

});
