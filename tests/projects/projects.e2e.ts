import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import { App } from '../../src/app';
import { boot } from '../../src/main';
import { PrismaService } from '../../src/common/database/prisma.service';
import { ILogger } from '../../src/common/logger/logger.interface';
import request from 'supertest';

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

        const registerResponse = await request(application.app)
            .post('/api/auth/register')
            .send(testUser);

        authToken = registerResponse.body.accessToken;
        userId = registerResponse.body.id;
    });

    afterAll(async () => {
        if (prismaService) {
            await prismaService.disconnect();
        }
        if (application) {
            application.close();
        }
    });

    beforeEach(async () => {
        await prismaService.client.projectModel.deleteMany();
    });

    describe('POST /api/projects', () => {

        it('should create a new project with valid data', async () => {

            const response = await request(application.app)
                .post('/api/projects')
                .set('Authorization', `Bearer ${authToken}`)
                .send(validProject)
                .expect(201);

            expect(response.body).toEqual({});

            const project = await prismaService.client.projectModel.findFirst({
                where: {
                    name: validProject.name,
                    userId: userId
                }
            });

            expect(project).toBeDefined();
            expect(project?.name).toBe(validProject.name);
        });

        it('should create project without description', async () => {
            const projectWithoutDesc = {
                name: 'Project Without Description',
            };

            const response = await request(application.app)
                .post('/api/projects')
                .set('Authorization', `Bearer ${authToken}`)
                .send(projectWithoutDesc)
                .expect(201);

            expect(response.body).toEqual({});

            const project = await prismaService.client.projectModel.findFirst({
                where: {
                    name: projectWithoutDesc.name,
                    userId: userId
                }
            });

            expect(project).toBeDefined();
            expect(project?.description).toBeNull();
        });

        it('should return 401 when no authorization token provided', async () => {
            await request(application.app)
                .post('/api/projects')
                .send(validProject)
                .expect(401);
        });

        it('should return 401 when invalid token provided', async () => {
            await request(application.app)
                .post('/api/projects')
                .set('Authorization', 'Bearer invalid-token')
                .send(validProject)
                .expect(401);
        });

        it('should return 400 when project name is missing', async () => {
            const invalidProject = {
                description: 'Project without name'
            };

            await request(application.app)
                .post('/api/projects')
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
                .post('/api/projects')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidProject)
                .expect(400);
        });
    });

    describe('GET /api/projects/user - getAllProjectsByUserId', () => {
        it('should return 401 when no token provided', async () => {
            await request(application.app)
                .get('/api/projects/user')
                .expect(401);
        });

        it('should return empty array when user has no projects', async () => {
            const response = await request(application.app)
                .get('/api/projects/user')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toEqual([]);
        });

        it('should return projects when user has projects', async () => {
            await request(application.app)
                .post('/api/projects')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Project 1',
                    description: 'Description 1',
                })
                .expect(201);

            await request(application.app)
                .post('/api/projects')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Project 2',
                    description: 'Description 2',
                })
                .expect(201);

            const response = await request(application.app)
                .get('/api/projects/user')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveLength(2);
            expect(response.body[0]).toHaveProperty('id');
            expect(response.body[0]).toHaveProperty('name');
            expect(response.body[0]).toHaveProperty('description');
       
            expect(response.body[0].name).toBe('Project 1');
            expect(response.body[1].name).toBe('Project 2');
        });

        it('should return only user\'s own projects (not other users\' projects)', async () => {

            await request(application.app)
                .post('/api/projects')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'User 1 Project',
                    description: 'Description',
                })
                .expect(201);


            const secondUserRegister = await request(application.app)
                .post('/api/auth/register')
                .send({
                    name: 'User 2',
                    email: 'user2@example.com',
                    password: 'password123',
                });

            const secondUserToken = secondUserRegister.body.accessToken;

            await request(application.app)
                .post('/api/projects')
                .set('Authorization', `Bearer ${secondUserToken}`)
                .send({
                    name: 'User 2 Project',
                    description: 'Description',
                })
                .expect(201);


            const response = await request(application.app)
                .get('/api/projects/user')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveLength(1);
            expect(response.body[0].name).toBe('User 1 Project');
        });

        it('should return projects with correct structure', async () => {

            await request(application.app)
                .post('/api/projects')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Test Project',
                    description: 'Test Description',
                })
                .expect(201);

            const response = await request(application.app)
                .get('/api/projects/user')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body[0]).toEqual({
                id: expect.any(Number),
                name: 'Test Project',
                description: 'Test Description',
            });
        });

        it('should return 401 with invalid token', async () => {
            await request(application.app)
                .get('/api/projects/user')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
        });

        it('should return 401 with malformed token', async () => {
            await request(application.app)
                .get('/api/projects/user')
                .set('Authorization', 'WrongScheme token')
                .expect(401);
        });

    })
});