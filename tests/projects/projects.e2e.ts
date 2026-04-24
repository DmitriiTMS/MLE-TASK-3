import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, jest } from '@jest/globals';
import { App } from '../../src/app';
import { boot } from '../../src/main';
import { PrismaService } from '../../src/common/database/prisma.service';
import { ILogger } from '../../src/common/logger/logger.interface';
import request from 'supertest';
import { BASE_PROJECTS_PATH, PROJECTS_MESSAGES, PROJECTS_PATH } from '../../src/projects/constants';
import { AUTH_PATHS, BASE_AUTH_PATH } from '../../src/auth/constants';


// npm run test:e2e -- tests/projects/projects.e2e.ts

const LoggerMock = {
    logger: undefined,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
} as jest.Mocked<ILogger>;

describe('ProjectsController', () => {
    let application: App;
    let prismaService: PrismaService;

    let authToken: string;
    let userId: number;

    const testUser = {
        name: 'user',
        email: 'user@bk.ru',
        password: '1234',
    };

    const validProject = {
        name: 'name-project',
        description: 'description-project',
    };

    beforeAll(async () => {
        prismaService = new PrismaService(LoggerMock);
        await prismaService.connect();

        const { app } = await boot;
        application = app;

    });

    afterAll(async () => {
        if (prismaService) {
            await prismaService.disconnect();
        }
        if (application) {
            application.close();
        }
    });



    afterEach(async () => {
        await prismaService.client.projectModel.deleteMany();
        await prismaService.client.userModel.deleteMany();
    });

    describe(`POST ${BASE_PROJECTS_PATH}${PROJECTS_PATH.CREATE} - create`, () => {

        beforeEach(async () => {
            const registerResponse = await request(application.app)
                .post(`${BASE_AUTH_PATH}${AUTH_PATHS.REGISTER}`)
                .send(testUser);

            authToken = registerResponse.body.accessToken;
            userId = registerResponse.body.id;
        });

        it('should create a new project with valid data', async () => {
            const response = await request(application.app)
                .post(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.CREATE}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(validProject)
                .expect(201);

            expect(response.body).toHaveProperty('projectId');
            expect(typeof response.body.projectId).toBe('number');

            expect(response.body.projectId).toBeGreaterThan(0);

            const project = await prismaService.client.projectModel.findFirst({
                where: {
                    name: validProject.name,
                    userId: userId
                }
            });

            expect(project).toBeDefined();
            expect(project?.name).toBe(validProject.name);
            expect(project?.id).toBe(response.body.projectId);
        });

        it('should create project without description', async () => {
            const projectWithoutDesc = {
                name: 'Project Without Description',
            };

            const response = await request(application.app)
                .post(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.CREATE}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(projectWithoutDesc)
                .expect(201);

            expect(response.body).toHaveProperty('projectId');
            expect(typeof response.body.projectId).toBe('number');
            expect(response.body.projectId).toBeGreaterThan(0);

            const project = await prismaService.client.projectModel.findFirst({
                where: {
                    name: projectWithoutDesc.name,
                    userId: userId
                }
            });

            expect(project).toBeDefined();
            expect(project?.description).toBeNull();
            expect(project?.id).toBe(response.body.projectId);
        });

        it('should return 401 when no authorization token provided', async () => {
            await request(application.app)
                .post(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.CREATE}`)
                .send(validProject)
                .expect(401);
        });

        it('should return 401 when invalid token provided', async () => {
            await request(application.app)
                .post(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.CREATE}`)
                .set('Authorization', 'Bearer invalid-token')
                .send(validProject)
                .expect(401);
        });

        it('should return 400 when project name is missing', async () => {
            const invalidProject = {
                description: 'Project without name'
            };

            await request(application.app)
                .post(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.CREATE}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidProject)
                .expect(400);
        });

        it('should return 400 when project name is empty string', async () => {
            const invalidProject = {
                name: '',
                description: 'Project with empty name'
            };

            await request(application.app)
                .post(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.CREATE}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidProject)
                .expect(400);
        });
    });

    
    describe(`GET ${BASE_PROJECTS_PATH}${PROJECTS_PATH.GET_ALL_PROJECTS_BY_USER_ID} - getAllProjectsByUserId`, () => {
        beforeEach(async () => {
            const registerResponse = await request(application.app)
                .post(`${BASE_AUTH_PATH}${AUTH_PATHS.REGISTER}`)
                .send(testUser);

            authToken = registerResponse.body.accessToken;
            userId = registerResponse.body.id;
        });

        it('should return 401 when no token provided', async () => {
            await request(application.app)
                .get(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.GET_ALL_PROJECTS_BY_USER_ID}`)
                .expect(401);
        });

        it('should return empty array when user has no projects', async () => {
            const response = await request(application.app)
                .get(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.GET_ALL_PROJECTS_BY_USER_ID}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toEqual([]);
        });

        it('should return projects when user has projects', async () => {
            await request(application.app)
                .post(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.CREATE}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Project 1',
                    description: 'Description 1',
                })
                .expect(201);

            await request(application.app)
                .post(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.CREATE}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Project 2',
                    description: 'Description 2',
                })
                .expect(201);

            const response = await request(application.app)
                .get(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.GET_ALL_PROJECTS_BY_USER_ID}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveLength(2);
            expect(response.body[0]).toHaveProperty('id');
            expect(response.body[0]).toHaveProperty('name');
            expect(response.body[0]).toHaveProperty('description');
            expect(response.body[0]).toHaveProperty('tasks');
            expect(response.body[0].tasks).toBeInstanceOf(Array);

            expect(response.body[0].name).toBe('Project 1');
            expect(response.body[1].name).toBe('Project 2');
        });

        it('should return only user\'s own projects (not other users\' projects)', async () => {
            await request(application.app)
                .post(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.CREATE}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'User 1 Project',
                    description: 'Description',
                })
                .expect(201);

            const secondUserRegister = await request(application.app)
                .post(`${BASE_AUTH_PATH}${AUTH_PATHS.REGISTER}`)
                .send({
                    name: 'User 2',
                    email: 'user2@example.com',
                    password: 'password123',
                });

            const secondUserToken = secondUserRegister.body.accessToken;

            await request(application.app)
                .post(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.CREATE}`)
                .set('Authorization', `Bearer ${secondUserToken}`)
                .send({
                    name: 'User 2 Project',
                    description: 'Description',
                })
                .expect(201);

            const response = await request(application.app)
                .get(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.GET_ALL_PROJECTS_BY_USER_ID}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveLength(1);
            expect(response.body[0].name).toBe('User 1 Project');
        });

        it('should return projects with correct structure (tasks array may be empty)', async () => {
            await request(application.app)
                .post(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.CREATE}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Test Project',
                    description: 'Test Description',
                })
                .expect(201);

            const response = await request(application.app)
                .get(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.GET_ALL_PROJECTS_BY_USER_ID}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body[0]).toMatchObject({
                id: expect.any(Number),
                name: 'Test Project',
                description: 'Test Description',
                userId: userId,
                tasks: expect.any(Array)
            });

            expect(response.body[0]).toHaveProperty('createdAt');
            expect(response.body[0]).toHaveProperty('updatedAt');
        });

        it('should return projects with tasks array (may be empty by default)', async () => {
            await request(application.app)
                .post(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.CREATE}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Project Without Tasks',
                    description: 'Description',
                })
                .expect(201);

            const response = await request(application.app)
                .get(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.GET_ALL_PROJECTS_BY_USER_ID}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body[0]).toHaveProperty('tasks');
            expect(Array.isArray(response.body[0].tasks)).toBe(true);
        });

        it('should return 401 with invalid token', async () => {
            await request(application.app)
                .get(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.GET_ALL_PROJECTS_BY_USER_ID}`)
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
        });

        it('should return 401 with malformed token', async () => {
            await request(application.app)
                .get(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.GET_ALL_PROJECTS_BY_USER_ID}`)
                .set('Authorization', 'WrongScheme token')
                .expect(401);
        });

        it('should return 401 when user is not authenticated', async () => {
            await request(application.app)
                .get(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.GET_ALL_PROJECTS_BY_USER_ID}`)
                .expect(401);
        });
    });

    describe(`GET ${BASE_PROJECTS_PATH}${PROJECTS_PATH.GET_PROJECT_BY_USER_ID} - getProjectByUserId`, () => {

        let projectId: number;

        beforeEach(async () => {
            const registerResponse = await request(application.app)
                .post(`${BASE_AUTH_PATH}${AUTH_PATHS.REGISTER}`)
                .send(testUser);

            authToken = registerResponse.body.accessToken;
            userId = registerResponse.body.id;

            const projectResponse = await request(application.app)
                .post(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.CREATE}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Test Project',
                    description: 'Test Description',
                });

            projectId = projectResponse.body.projectId;
            console.log('Project created with ID:', projectId);
        });

        it('should return project by id for owner', async () => {
            const response = await request(application.app)
                .get(`${BASE_PROJECTS_PATH}/${projectId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('id', projectId);
            expect(response.body).toHaveProperty('name', 'Test Project');
            expect(response.body).toHaveProperty('description', 'Test Description');
        });

        it('should return 401 when no token provided', async () => {
            await request(application.app)
                .get(`${BASE_PROJECTS_PATH}/${projectId}`)
                .expect(401);
        });

        it('should return 404 when project does not exist', async () => {
            const nonExistentId = 99999;

            const response = await request(application.app)
                .get(`${BASE_PROJECTS_PATH}/${nonExistentId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('message');
        });

        it('should return 403 when user tries to access someone else\'s project', async () => {
            const secondUserRegister = await request(application.app)
                .post(`${BASE_AUTH_PATH}${AUTH_PATHS.REGISTER}`)
                .send({
                    name: 'User 2',
                    email: 'user2@example.com',
                    password: 'password123',
                });

            const secondUserToken = secondUserRegister.body.accessToken;

            const secondProjectResponse = await request(application.app)
                .post(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.CREATE}`)
                .set('Authorization', `Bearer ${secondUserToken}`)
                .send({
                    name: 'Second User Project',
                    description: 'Second Description',
                });

            const secondProjectId = secondProjectResponse.body.projectId;

            const response = await request(application.app)
                .get(`${BASE_PROJECTS_PATH}/${secondProjectId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(403);
            expect(response.body).toHaveProperty('message');
        });

        it('should return 400 when projectId is not a number', async () => {
            const response = await request(application.app)
                .get(`${BASE_PROJECTS_PATH}/invalid-id`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('errors');
            expect(response.body.errors[0].field).toBe('projectId');
        });

        it('should return correct project structure', async () => {
            const response = await request(application.app)
                .get(`${BASE_PROJECTS_PATH}/${projectId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                id: expect.any(Number),
                name: expect.any(String),
                description: expect.any(String),
            });
            expect(response.body.id).toBe(projectId);
            expect(response.body.name).toBe('Test Project');
            expect(response.body.description).toBe('Test Description');
        });
    });

    describe(`PATCH ${BASE_PROJECTS_PATH}${PROJECTS_PATH.UPDATE_PROJECT} - update`, () => {
        let projectId: number;

        beforeEach(async () => {
            const registerResponse = await request(application.app)
                .post(`${BASE_AUTH_PATH}${AUTH_PATHS.REGISTER}`)
                .send(testUser);

            authToken = registerResponse.body.accessToken;
            userId = registerResponse.body.id;

            const projectResponse = await request(application.app)
                .post(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.CREATE}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Original Project Name',
                    description: 'Original Description',
                });

            projectId = projectResponse.body.projectId;
        });

        it('should successfully update both name and description', async () => {
            const updateData = {
                name: 'Updated Project Name',
                description: 'Updated Description',
            };

            const response = await request(application.app)
                .patch(`${BASE_PROJECTS_PATH}/${projectId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(204);

            expect(response.body).toEqual({});

            const updatedProject = await prismaService.client.projectModel.findFirst({
                where: { id: projectId }
            });

            expect(updatedProject).toBeDefined();
            expect(updatedProject?.name).toBe('Updated Project Name');
            expect(updatedProject?.description).toBe('Updated Description');
        });

        it('should successfully update only name', async () => {
            const updateData = {
                name: 'Only Name Updated',
            };

            const response = await request(application.app)
                .patch(`${BASE_PROJECTS_PATH}/${projectId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(204);

            expect(response.body).toEqual({});

            const updatedProject = await prismaService.client.projectModel.findFirst({
                where: { id: projectId }
            });

            expect(updatedProject).toBeDefined();
            expect(updatedProject?.name).toBe('Only Name Updated');
            expect(updatedProject?.description).toBe('Original Description');
        });

        it('should successfully update only description', async () => {
            const updateData = {
                description: 'Only Description Updated',
            };

            const response = await request(application.app)
                .patch(`${BASE_PROJECTS_PATH}/${projectId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(204);

            expect(response.body).toEqual({});

            const updatedProject = await prismaService.client.projectModel.findFirst({
                where: { id: projectId }
            });

            expect(updatedProject).toBeDefined();
            expect(updatedProject?.name).toBe('Original Project Name');
            expect(updatedProject?.description).toBe('Only Description Updated');
        });

        it('should update description to null', async () => {
            const updateData = {
                description: null,
            };

            const response = await request(application.app)
                .patch(`${BASE_PROJECTS_PATH}/${projectId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(204);

            expect(response.body).toEqual({});

            const updatedProject = await prismaService.client.projectModel.findFirst({
                where: { id: projectId }
            });

            expect(updatedProject).toBeDefined();
            expect(updatedProject?.name).toBe('Original Project Name');
            expect(updatedProject?.description).toBeNull();
        });

        it('should update name to empty string', async () => {
            const updateData = {
                name: '',
            };

            const response = await request(application.app)
                .patch(`${BASE_PROJECTS_PATH}/${projectId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(204);

            expect(response.body).toEqual({});

            const updatedProject = await prismaService.client.projectModel.findFirst({
                where: { id: projectId }
            });

            expect(updatedProject).toBeDefined();
            expect(updatedProject?.name).toBe('');
            expect(updatedProject?.description).toBe('Original Description');
        });

        it('should return 401 when no authorization token provided', async () => {
            const updateData = { name: 'New Name' };

            await request(application.app)
                .patch(`${BASE_PROJECTS_PATH}/${projectId}`)
                .send(updateData)
                .expect(401);
        });

        it('should return 401 when invalid token provided', async () => {
            const updateData = { name: 'New Name' };

            await request(application.app)
                .patch(`${BASE_PROJECTS_PATH}/${projectId}`)
                .set('Authorization', 'Bearer invalid-token')
                .send(updateData)
                .expect(401);
        });

        it('should return 401 with malformed token', async () => {
            const updateData = { name: 'New Name' };

            await request(application.app)
                .patch(`${BASE_PROJECTS_PATH}/${projectId}`)
                .set('Authorization', 'WrongScheme token')
                .send(updateData)
                .expect(401);
        });

        it('should return 404 when project does not exist', async () => {
            const nonExistentId = 99999;
            const updateData = { name: 'New Name' };

            const response = await request(application.app)
                .patch(`${BASE_PROJECTS_PATH}/${nonExistentId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(404);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toBe(PROJECTS_MESSAGES.PROJECT_NOT_FOUND);
        });

        it('should return 403 when user tries to update someone else\'s project', async () => {
            const secondUserRegister = await request(application.app)
                .post(`${BASE_AUTH_PATH}${AUTH_PATHS.REGISTER}`)
                .send({
                    name: 'User 2',
                    email: 'user2@example.com',
                    password: 'password123',
                });

            const secondUserToken = secondUserRegister.body.accessToken;

            const secondProjectResponse = await request(application.app)
                .post(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.CREATE}`)
                .set('Authorization', `Bearer ${secondUserToken}`)
                .send({
                    name: 'Second User Project',
                    description: 'Second Description',
                });

            const secondProjectId = secondProjectResponse.body.projectId;
            const updateData = { name: 'Hacked Name' };

            const response = await request(application.app)
                .patch(`${BASE_PROJECTS_PATH}/${secondProjectId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(403);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toBe('Доступ запрещен');

            const projectStillSame = await prismaService.client.projectModel.findFirst({
                where: { id: secondProjectId }
            });

            expect(projectStillSame).toBeDefined();
            expect(projectStillSame?.name).toBe('Second User Project');
        });

        it('should return 400 when projectId is not a number', async () => {
            const updateData = { name: 'New Name' };

            const response = await request(application.app)
                .patch(`${BASE_PROJECTS_PATH}/invalid-id`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(400);

            expect(response.body).toHaveProperty('errors');
            expect(response.body.errors[0].field).toBe('projectId');
        });

        it('should return 204 with empty body on successful update', async () => {
            const updateData = { name: 'New Name' };

            const response = await request(application.app)
                .patch(`${BASE_PROJECTS_PATH}/${projectId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(204);

            expect(response.body).toEqual({});
            expect(response.text).toBe('');
        });

        it('should handle updating with empty object (no changes)', async () => {
            const updateData = {};

            const response = await request(application.app)
                .patch(`${BASE_PROJECTS_PATH}/${projectId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(204);

            expect(response.body).toEqual({});

            const project = await prismaService.client.projectModel.findFirst({
                where: { id: projectId }
            });

            expect(project?.name).toBe('Original Project Name');
            expect(project?.description).toBe('Original Description');
        });

        it('should update project and verify updatedAt changed', async () => {
            const originalProject = await prismaService.client.projectModel.findFirst({
                where: { id: projectId }
            });

            const originalUpdatedAt = originalProject?.updatedAt;

            await new Promise(resolve => setTimeout(resolve, 1000));

            const updateData = { name: 'Updated Name' };

            await request(application.app)
                .patch(`${BASE_PROJECTS_PATH}/${projectId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(204);

            const updatedProject = await prismaService.client.projectModel.findFirst({
                where: { id: projectId }
            });

            expect(updatedProject?.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt?.getTime() || 0);
        });

        it('should validate name max length (100 characters)', async () => {
            const longName = 'A'.repeat(101);
            const updateData = { name: longName };

            const response = await request(application.app)
                .patch(`${BASE_PROJECTS_PATH}/${projectId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(400);

            expect(response.body).toHaveProperty('errors');
            expect(response.body.errors[0].field).toBe('name');
        });

        it('should validate description max length (1000 characters)', async () => {
            const longDescription = 'A'.repeat(1001);
            const updateData = { description: longDescription };

            const response = await request(application.app)
                .patch(`${BASE_PROJECTS_PATH}/${projectId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(400);

            expect(response.body).toHaveProperty('errors');
            expect(response.body.errors[0].field).toBe('description');
        });

        it('should validate name is string', async () => {
            const updateData = { name: 123 };

            const response = await request(application.app)
                .patch(`${BASE_PROJECTS_PATH}/${projectId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(400);

            expect(response.body).toHaveProperty('errors');
        });

        it('should validate description is string', async () => {
            const updateData = { description: 123 };

            const response = await request(application.app)
                .patch(`${BASE_PROJECTS_PATH}/${projectId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(400);

            expect(response.body).toHaveProperty('errors');
        });

        it('should update project when only description is provided as empty string', async () => {
            const updateData = { description: '' };

            const response = await request(application.app)
                .patch(`${BASE_PROJECTS_PATH}/${projectId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(204);

            expect(response.body).toEqual({});

            const updatedProject = await prismaService.client.projectModel.findFirst({
                where: { id: projectId }
            });

            expect(updatedProject?.description).toBe('');
        });

        it('should not update project if user is not authenticated', async () => {
            const updateData = { name: 'New Name' };

            await request(application.app)
                .patch(`${BASE_PROJECTS_PATH}/${projectId}`)
                .send(updateData)
                .expect(401);

            const project = await prismaService.client.projectModel.findFirst({
                where: { id: projectId }
            });

            expect(project?.name).toBe('Original Project Name');
        });
    });

    describe(`DELETE ${BASE_PROJECTS_PATH}${PROJECTS_PATH.REMOVE_PROJECT} - remove`, () => {
        let projectId: number;

        beforeEach(async () => {
            const registerResponse = await request(application.app)
                .post(`${BASE_AUTH_PATH}${AUTH_PATHS.REGISTER}`)
                .send(testUser);

            authToken = registerResponse.body.accessToken;
            userId = registerResponse.body.id;

            const projectResponse = await request(application.app)
                .post(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.CREATE}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Project To Delete',
                    description: 'This project will be deleted',
                });

            projectId = projectResponse.body.projectId;
        });

        it('should successfully delete project when user is owner', async () => {
            const response = await request(application.app)
                .delete(`${BASE_PROJECTS_PATH}/${projectId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(204);

            expect(response.body).toEqual({});

            const deletedProject = await prismaService.client.projectModel.findFirst({
                where: { id: projectId }
            });

            expect(deletedProject).toBeNull();
        });

        it('should return 401 when no authorization token provided', async () => {
            await request(application.app)
                .delete(`${BASE_PROJECTS_PATH}/${projectId}`)
                .expect(401);
        });

        it('should return 401 when invalid token provided', async () => {
            await request(application.app)
                .delete(`${BASE_PROJECTS_PATH}/${projectId}`)
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
        });

        it('should return 401 with malformed token', async () => {
            await request(application.app)
                .delete(`${BASE_PROJECTS_PATH}/${projectId}`)
                .set('Authorization', 'WrongScheme token')
                .expect(401);
        });

        it('should return 404 when project does not exist', async () => {
            const nonExistentId = 99999;

            const response = await request(application.app)
                .delete(`${BASE_PROJECTS_PATH}/${nonExistentId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toBe(PROJECTS_MESSAGES.PROJECT_NOT_FOUND);
        });

        it('should return 403 when user tries to delete someone else\'s project', async () => {
            const secondUserRegister = await request(application.app)
                .post(`${BASE_AUTH_PATH}${AUTH_PATHS.REGISTER}`)
                .send({
                    name: 'User 2',
                    email: 'user2@example.com',
                    password: 'password123',
                });

            const secondUserToken = secondUserRegister.body.accessToken;

            const secondProjectResponse = await request(application.app)
                .post(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.CREATE}`)
                .set('Authorization', `Bearer ${secondUserToken}`)
                .send({
                    name: 'Second User Project',
                    description: 'Second Description',
                });

            const secondProjectId = secondProjectResponse.body.projectId;

            const response = await request(application.app)
                .delete(`${BASE_PROJECTS_PATH}/${secondProjectId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(403);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toBe('Доступ запрещен');

            const projectStillExists = await prismaService.client.projectModel.findFirst({
                where: { id: secondProjectId }
            });

            expect(projectStillExists).toBeDefined();
            expect(projectStillExists?.id).toBe(secondProjectId);
        });

        it('should return 400 when projectId is not a number', async () => {
            const response = await request(application.app)
                .delete(`${BASE_PROJECTS_PATH}/invalid-id`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(400);

            expect(response.body).toHaveProperty('errors');
            expect(response.body.errors[0].field).toBe('projectId');
        });

        it('should return 400 when projectId is empty', async () => {
            const response = await request(application.app)
                .delete(`${BASE_PROJECTS_PATH}/`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });

        it('should return 204 with empty body on successful deletion', async () => {
            const response = await request(application.app)
                .delete(`${BASE_PROJECTS_PATH}/${projectId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(204);

            expect(response.body).toEqual({});

            expect(response.text).toBe('');
        });

        it('should delete project with null description', async () => {
            const projectWithoutDescResponse = await request(application.app)
                .post(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.CREATE}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Project Without Description',
                });

            const projectWithoutDescId = projectWithoutDescResponse.body.projectId;

            const projectBeforeDelete = await prismaService.client.projectModel.findFirst({
                where: { id: projectWithoutDescId }
            });

            expect(projectBeforeDelete).toBeDefined();
            expect(projectBeforeDelete?.description).toBeNull();

            await request(application.app)
                .delete(`${BASE_PROJECTS_PATH}/${projectWithoutDescId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(204);

            const projectAfterDelete = await prismaService.client.projectModel.findFirst({
                where: { id: projectWithoutDescId }
            });

            expect(projectAfterDelete).toBeNull();
        });

        it('should allow deleting multiple projects sequentially', async () => {
            const project1Response = await request(application.app)
                .post(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.CREATE}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ name: 'Project 1' });

            const project2Response = await request(application.app)
                .post(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.CREATE}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ name: 'Project 2' });

            const project1Id = project1Response.body.projectId;
            const project2Id = project2Response.body.projectId;

            await request(application.app)
                .delete(`${BASE_PROJECTS_PATH}/${project1Id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(204);

            let deletedProject = await prismaService.client.projectModel.findFirst({
                where: { id: project1Id }
            });
            expect(deletedProject).toBeNull();

            const remainingProject = await prismaService.client.projectModel.findFirst({
                where: { id: project2Id }
            });
            expect(remainingProject).toBeDefined();
            expect(remainingProject?.name).toBe('Project 2');

            await request(application.app)
                .delete(`${BASE_PROJECTS_PATH}/${project2Id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(204);

            deletedProject = await prismaService.client.projectModel.findFirst({
                where: { id: project2Id }
            });
            expect(deletedProject).toBeNull();
        });

        it('should not delete project if token belongs to different user', async () => {
            const secondUserRegister = await request(application.app)
                .post(`${BASE_AUTH_PATH}${AUTH_PATHS.REGISTER}`)
                .send({
                    name: 'Attacker User',
                    email: 'attacker@example.com',
                    password: 'password123',
                });

            const attackerToken = secondUserRegister.body.accessToken;

            const response = await request(application.app)
                .delete(`${BASE_PROJECTS_PATH}/${projectId}`)
                .set('Authorization', `Bearer ${attackerToken}`)
                .expect(403);

            expect(response.body).toHaveProperty('message');

            const projectStillExists = await prismaService.client.projectModel.findFirst({
                where: { id: projectId }
            });

            expect(projectStillExists).toBeDefined();
            expect(projectStillExists?.name).toBe('Project To Delete');
        });

        it('should handle deletion of already deleted project', async () => {
            await request(application.app)
                .delete(`${BASE_PROJECTS_PATH}/${projectId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(204);

            await request(application.app)
                .delete(`${BASE_PROJECTS_PATH}/${projectId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });

        it('should return 401 when user is not authenticated (no user object)', async () => {
            const response = await request(application.app)
                .delete(`${BASE_PROJECTS_PATH}/${projectId}`)
                .expect(401);

            expect(response.body).toHaveProperty('message');
        });

        it('should delete project and verify it no longer appears in GET requests', async () => {
            await request(application.app)
                .delete(`${BASE_PROJECTS_PATH}/${projectId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(204);

            const getAllResponse = await request(application.app)
                .get(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.GET_ALL_PROJECTS_BY_USER_ID}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            const deletedProjectExists = getAllResponse.body.some(
                (project: any) => project.id === projectId
            );
            expect(deletedProjectExists).toBe(false);
        });

        it('should delete project and verify it cannot be accessed by ID', async () => {
            await request(application.app)
                .delete(`${BASE_PROJECTS_PATH}/${projectId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(204);

            await request(application.app)
                .get(`${BASE_PROJECTS_PATH}/${projectId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });
    });
});