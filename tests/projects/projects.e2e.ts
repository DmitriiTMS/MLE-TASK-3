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

    describe('POST /projects', () => {

        it('should create a new project with valid data', async () => {

            const response = await request(application.app)
                .post('/api/projects')
                .set('Authorization', `Bearer ${authToken}`)
                .send(validProject)
                .expect(200);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toBe('Project created');

            const project = await prismaService.client.projectModel.findFirst({
                where: {
                    name: validProject.name,
                    userId: userId
                }
            });

            expect(project).toBeDefined();
            expect(project?.name).toBe(validProject.name);
            expect(project?.description).toBe(validProject.description);
            expect(project?.userId).toBe(userId);
            expect(project?.createdAt).toBeDefined();
            expect(project?.updatedAt).toBeDefined();
        });

        it('should create project without description', async () => {
            const projectWithoutDesc = {
                name: 'Project Without Description',
            };

            const response = await request(application.app)
                .post('/api/projects')
                .set('Authorization', `Bearer ${authToken}`)
                .send(projectWithoutDesc)
                .expect(200);

            expect(response.body.message).toBe('Project created');

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


});