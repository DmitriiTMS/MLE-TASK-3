import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import { App } from '../../src/app';
import { boot } from '../../src/main';
import { PrismaService } from '../../src/common/database/prisma.service';
import { ILogger } from '../../src/common/logger/logger.interface';
import request from 'supertest';

// npm run test:e2e -- tests/auth/auth.e2e.ts

const LoggerMock = {
    logger: undefined,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
} as jest.Mocked<ILogger>;

describe('AuthController', () => {
    let application: App;
    let prismaService: PrismaService;

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

    beforeEach(async () => {
        await prismaService.client.userModel.deleteMany();
    });

    describe('POST /auth/register', () => {
        const testUser = {
            name: 'user',
            email: 'user@bk.ru',
            password: '1234',
        };

        it('should successfully register a new user', async () => {
            const response = await request(application.app)
                .post('/api/auth/register')
                .send(testUser)
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('accessToken');
            expect(typeof response.body.id).toBe('number');
            expect(typeof response.body.accessToken).toBe('string');

            const cookies = response.headers['set-cookie'];
            expect(cookies).toBeDefined();
            expect(cookies[0]).toContain('refreshToken');

            const user = await prismaService.client.userModel.findUnique({
                where: { email: testUser.email }
            });

            expect(user).toBeDefined();
            expect(user?.name).toBe(testUser.name);
            expect(user?.email).toBe(testUser.email);
            expect(user?.hasPassword).toBeDefined();
            expect(user?.hasPassword).not.toBe(testUser.password);
        });

        it('should return 409 if user already exists', async () => {
            await request(application.app)
                .post('/api/auth/register')
                .send(testUser)
                .expect(201);

            await request(application.app)
                .post('/api/auth/register')
                .send(testUser)
                .expect(409);
        });

        it('should return 400 if email is invalid', async () => {
            const invalidUser = {
                name: 'user',
                email: 'invalid-email',
                password: '1234',
            };

            await request(application.app)
                .post('/api/auth/register')
                .send(invalidUser)
                .expect(400);
        });

        it('should return 400 if name is missing', async () => {
            const invalidUser = {
                email: 'user1@bk.ru',
                password: '1234',
            };

            await request(application.app)
                .post('/api/auth/register')
                .send(invalidUser)
                .expect(400);
        });
    });

    describe('POST /auth/login', () => {
        const testUser = {
            name: 'user',
            email: 'user@bk.ru',
            password: '1234',
        };

        beforeEach(async () => {
            await request(application.app)
                .post('/api/auth/register')
                .send(testUser);
        });

        it('should successfully login with valid credentials', async () => {
            const response = await request(application.app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                })
                .expect(200);

            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('accessToken');
            expect(typeof response.body.id).toBe('number');

            const cookies = response.headers['set-cookie'];
            expect(cookies).toBeDefined();
            expect(cookies[0]).toContain('refreshToken');
        });

        it('should return 401 with wrong password', async () => {
            await request(application.app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: 'wrongpassword'
                })
                .expect(401);
        });

        it('should return 401 with non-existent email', async () => {
            await request(application.app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: '1234'
                })
                .expect(401);
        });

        it('should return 400 with invalid email format', async () => {
            await request(application.app)
                .post('/api/auth/login')
                .send({
                    email: 'invalid-email',
                    password: testUser.password
                })
                .expect(400);
        });
    });

    describe('POST /auth/refresh', () => {
        const testUser = {
            name: 'user',
            email: 'user@bk.ru',
            password: '1234',
        };
        let refreshToken: string;

        beforeEach(async () => {
            const response = await request(application.app)
                .post('/api/auth/register')
                .send(testUser);

            const cookies = response.headers['set-cookie'];
            if (cookies && cookies[0]) {
                refreshToken = cookies[0].split('=')[1].split(';')[0];
            }
        });

        it('should successfully refresh tokens', async () => {
            const response = await request(application.app)
                .post('/api/auth/refresh-token')
                .set('Cookie', [`refreshToken=${refreshToken}`])
                .expect(200);

            expect(response.body).toHaveProperty('accessToken');
            expect(typeof response.body.accessToken).toBe('string');

            const cookies = response.headers['set-cookie'];
            expect(cookies).toBeDefined();
            expect(cookies[0]).toContain('refreshToken');
        });

        it('should return 401 with missing refresh token', async () => {
            await request(application.app)
                .post('/api/auth/refresh-token')
                .expect(401);
        });

        it('should return 498 with invalid refresh token', async () => {

            await request(application.app)
                .post('/api/auth/refresh-token')
                .set('Cookie', ['refreshToken=invalid-token'])
                .expect(498);
        });
    });

    describe('GET /auth/get-me', () => {
        const testUser = {
            name: 'user',
            email: 'user@bk.ru',
            password: '1234',
        };
        let accessToken: string;

        beforeEach(async () => {
            const response = await request(application.app)
                .post('/api/auth/register')
                .send(testUser);

            accessToken = response.body.accessToken;
        });

        it('should return user info with valid token', async () => {
            const response = await request(application.app)
                .get('/api/auth/get-me')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('id');
            expect(typeof response.body.id).toBe('number');
        });

        it('should return 401 with missing token', async () => {
            await request(application.app)
                .get('/api/auth/get-me')
                .expect(401);
        });

        it('should return 401 with invalid token', async () => {
            await request(application.app)
                .get('/api/auth/get-me')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
        });
    });

    describe('POST /auth/logout', () => {
        const testUser = {
            name: 'user',
            email: 'user@bk.ru',
            password: '1234',
        };
        let accessToken: string;
        let refreshToken: string;

        beforeEach(async () => {
            const response = await request(application.app)
                .post('/api/auth/register')
                .send(testUser);

            accessToken = response.body.accessToken;
            const cookies = response.headers['set-cookie'];
            if (cookies && cookies[0]) {
                refreshToken = cookies[0].split('=')[1].split(';')[0];
            }
        });

        it('should successfully logout and clear cookies', async () => {
            const response = await request(application.app)
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${accessToken}`)
                .set('Cookie', [`refreshToken=${refreshToken}`])
                .expect(200);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toBe('Logout successful');

            const cookies = response.headers['set-cookie'];
            expect(cookies).toBeDefined();
            expect(cookies[0]).toContain('refreshToken=;');
        });

        it('should still work without authentication', async () => {
            const response = await request(application.app)
                .post('/api/auth/logout')
                .expect(200);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toBe('Logout successful');
        });
    });
});