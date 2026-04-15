import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, jest } from '@jest/globals';
import { App } from '../../src/app';
import { boot } from '../../src/main';
import { PrismaService } from '../../src/common/database/prisma.service';
import { ILogger } from '../../src/common/logger/logger.interface';
import request from 'supertest';
import { BASE_PROJECTS_PATH, PROJECTS_PATH } from '../../src/projects/constants';
import { AUTH_PATHS, BASE_AUTH_PATH } from '../../src/auth/constants';
import { TaskStatus } from '@prisma/client';
import { BASE_TASKS_PATH, TASKS_PATHS } from '../../src/tasks/constants';


// npm run test:e2e -- tests/tasks/tasks.e2e.ts

const LoggerMock = {
    logger: undefined,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
} as jest.Mocked<ILogger>;

describe('TasksController', () => {
    let application: App;
    let prismaService: PrismaService;

    let authToken: string;
    let userId: number;
    let projectId: number;
    let executorUserId: number;
    let executorAuthToken: string;

    const testUser = {
        name: 'user',
        email: 'user@bk.ru',
        password: '1234',
    };

    const testExecutor = {
        name: 'executor',
        email: 'executor@bk.ru',
        password: '5678',
    };

    const validProject = {
        name: 'name-project',
        description: 'description-project',
    };

    const validTask = {
        title: 'Test Task',
        description: 'Test Description',
        dueDate: '2024-12-31T00:00:00.000Z',
        status: TaskStatus.CREATED,
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
        await prismaService.client.taskModel.deleteMany();
        await prismaService.client.projectModel.deleteMany();
        await prismaService.client.userModel.deleteMany();
    });



    describe(`POST ${BASE_PROJECTS_PATH}${PROJECTS_PATH.CREATE_TASKS_FOR_PROJECT} - create task for project`, () => {

        beforeEach(async () => {

            const registerResponse = await request(application.app)
                .post(`${BASE_AUTH_PATH}${AUTH_PATHS.REGISTER}`)
                .send(testUser);

            authToken = registerResponse.body.accessToken;
            userId = registerResponse.body.id;


            const executorRegisterResponse = await request(application.app)
                .post(`${BASE_AUTH_PATH}${AUTH_PATHS.REGISTER}`)
                .send(testExecutor);

            executorAuthToken = executorRegisterResponse.body.accessToken;
            executorUserId = executorRegisterResponse.body.id;

            const projectResponse = await request(application.app)
                .post(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.CREATE}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(validProject)
                .expect(201);

            projectId = projectResponse.body.projectId;
        });
        it('should successfully create a task with all fields provided', async () => {
            const taskData = {
                title: validTask.title,
                description: validTask.description,
                dueDate: validTask.dueDate,
                status: TaskStatus.CREATED,
                executorUserId: executorUserId,
            };

            const response = await request(application.app)
                .post(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.CREATE_TASKS_FOR_PROJECT.replace(':projectId', projectId.toString())}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(taskData)
                .expect(201);

            expect(response.body).toHaveProperty('taskId');
            expect(typeof response.body.taskId).toBe('number');
            expect(response.body.taskId).toBeGreaterThan(0);

            const task = await prismaService.client.taskModel.findFirst({
                where: {
                    id: response.body.taskId,
                    projectId: projectId,
                    createUserId: userId
                }
            });

            expect(task).toBeDefined();
            expect(task?.title).toBe(taskData.title);
            expect(task?.description).toBe(taskData.description);
            expect(task?.dueDate).toEqual(new Date(taskData.dueDate));
            expect(task?.status).toBe(taskData.status);
            expect(task?.executorUserId).toBe(executorUserId);
            expect(task?.projectId).toBe(projectId);
            expect(task?.createUserId).toBe(userId);
        });

        it('should successfully create a task without executorUserId', async () => {
            const taskDataWithoutExecutor = {
                title: 'Task without executor',
                description: 'Description',
                dueDate: '2024-12-31T00:00:00.000Z',
                status: TaskStatus.CREATED,
            };

            const response = await request(application.app)
                .post(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.CREATE_TASKS_FOR_PROJECT.replace(':projectId', projectId.toString())}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(taskDataWithoutExecutor)
                .expect(201);

            expect(response.body).toHaveProperty('taskId');
            expect(response.body.taskId).toBeGreaterThan(0);

            const task = await prismaService.client.taskModel.findFirst({
                where: { id: response.body.taskId }
            });

            expect(task?.executorUserId).toBeNull();
        });

        it('should successfully create a task without description', async () => {
            const taskDataWithoutDescription = {
                title: 'Task without description',
                dueDate: '2024-12-31T00:00:00.000Z',
                status: TaskStatus.CREATED,
            };

            const response = await request(application.app)
                .post(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.CREATE_TASKS_FOR_PROJECT.replace(':projectId', projectId.toString())}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(taskDataWithoutDescription)
                .expect(201);

            const task = await prismaService.client.taskModel.findFirst({
                where: { id: response.body.taskId }
            });

            expect(task?.description).toBeNull();
        });

        it('should return 401 when no authorization token provided', async () => {
            await request(application.app)
                .post(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.CREATE_TASKS_FOR_PROJECT.replace(':projectId', projectId.toString())}`)
                .send(validTask)
                .expect(401);
        });

        it('should return 401 when invalid token provided', async () => {
            await request(application.app)
                .post(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.CREATE_TASKS_FOR_PROJECT.replace(':projectId', projectId.toString())}`)
                .set('Authorization', 'Bearer invalid-token')
                .send(validTask)
                .expect(401);
        });

        it('should return 404 when project does not exist', async () => {
            const nonExistentProjectId = 99999;

            const response = await request(application.app)
                .post(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.CREATE_TASKS_FOR_PROJECT.replace(':projectId', nonExistentProjectId.toString())}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(validTask)
                .expect(404);

            expect(response.body).toHaveProperty('message');
        });

        it('should return 404 when creator user does not exist (should not happen with valid token)', async () => {
            await prismaService.client.userModel.delete({
                where: { id: userId }
            });

            await request(application.app)
                .post(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.CREATE_TASKS_FOR_PROJECT.replace(':projectId', projectId.toString())}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(validTask)
                .expect(404);
        });

        it('should return 404 when executor user does not exist', async () => {
            const taskDataWithInvalidExecutor = {
                title: validTask.title,
                description: validTask.description,
                dueDate: validTask.dueDate,
                status: TaskStatus.CREATED,
                executorUserId: 99999,
            };

            const response = await request(application.app)
                .post(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.CREATE_TASKS_FOR_PROJECT.replace(':projectId', projectId.toString())}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(taskDataWithInvalidExecutor)
                .expect(404);

            expect(response.body).toHaveProperty('message');
        });

        it('should return 400 when title is missing', async () => {
            const invalidTask = {
                description: 'Task without title',
                dueDate: '2024-12-31T00:00:00.000Z',
                status: TaskStatus.CREATED,
            };

            await request(application.app)
                .post(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.CREATE_TASKS_FOR_PROJECT.replace(':projectId', projectId.toString())}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidTask)
                .expect(400);
        });

        it('should return 400 when dueDate is missing', async () => {
            const invalidTask = {
                title: 'Task without dueDate',
                description: 'Description',
                status: TaskStatus.CREATED,
            };

            await request(application.app)
                .post(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.CREATE_TASKS_FOR_PROJECT.replace(':projectId', projectId.toString())}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidTask)
                .expect(400);
        });

        it('should return 400 when status is invalid', async () => {
            const invalidTask = {
                title: 'Task with invalid status',
                description: 'Description',
                dueDate: '2024-12-31T00:00:00.000Z',
                status: 'INVALID_STATUS',
            };

            await request(application.app)
                .post(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.CREATE_TASKS_FOR_PROJECT.replace(':projectId', projectId.toString())}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidTask)
                .expect(400);
        });

        it('should return 400 when dueDate is invalid format', async () => {
            const invalidTask = {
                title: 'Task with invalid dueDate',
                description: 'Description',
                dueDate: 'invalid-date',
                status: TaskStatus.CREATED,
            };

            await request(application.app)
                .post(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.CREATE_TASKS_FOR_PROJECT.replace(':projectId', projectId.toString())}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidTask)
                .expect(400);
        });

        it('should create task with executorUserId as string (should convert to number)', async () => {
            const taskDataWithStringExecutor = {
                title: validTask.title,
                description: validTask.description,
                dueDate: validTask.dueDate,
                status: TaskStatus.CREATED,
                executorUserId: executorUserId,
            };

            const response = await request(application.app)
                .post(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.CREATE_TASKS_FOR_PROJECT.replace(':projectId', projectId.toString())}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(taskDataWithStringExecutor)
                .expect(201);

            const task = await prismaService.client.taskModel.findFirst({
                where: { id: response.body.taskId }
            });

            expect(task?.executorUserId).toBe(executorUserId);
        });
    });

    describe(`GET ${BASE_TASKS_PATH}${TASKS_PATHS.GET_ONE_TASK} - get one task`, () => {
        let taskId: number;

        beforeEach(async () => {

            const registerResponse = await request(application.app)
                .post(`${BASE_AUTH_PATH}${AUTH_PATHS.REGISTER}`)
                .send(testUser);

            authToken = registerResponse.body.accessToken;
            userId = registerResponse.body.id;

            const executorRegisterResponse = await request(application.app)
                .post(`${BASE_AUTH_PATH}${AUTH_PATHS.REGISTER}`)
                .send(testExecutor);

            executorAuthToken = executorRegisterResponse.body.accessToken;
            executorUserId = executorRegisterResponse.body.id;

            const projectResponse = await request(application.app)
                .post(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.CREATE}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(validProject)
                .expect(201);

            projectId = projectResponse.body.projectId;

            const taskData = {
                title: validTask.title,
                description: validTask.description,
                dueDate: validTask.dueDate,
                status: TaskStatus.CREATED,
                executorUserId: executorUserId,
            };

            const taskResponse = await request(application.app)
                .post(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.CREATE_TASKS_FOR_PROJECT.replace(':projectId', projectId.toString())}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(taskData)
                .expect(201);

            taskId = taskResponse.body.taskId;
        });

        it('should successfully get task when user is creator', async () => {
            const response = await request(application.app)
                .get(`${BASE_TASKS_PATH}${TASKS_PATHS.GET_ONE_TASK.replace(':taskId', taskId.toString())}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('id');
            expect(response.body.id).toBe(taskId);
            expect(response.body.title).toBe(validTask.title);
            expect(response.body.description).toBe(validTask.description);
            expect(response.body.dueDate).toBe(validTask.dueDate);
            expect(response.body.status).toBe(TaskStatus.CREATED);
            expect(response.body.completedAt).toBeNull();
            expect(response.body.projectId).toBe(projectId);
            expect(response.body.createUserId).toBe(userId);
            expect(response.body.executorUserId).toBe(executorUserId);
        });

        it('should successfully get task when user is executor', async () => {
            const response = await request(application.app)
                .get(`${BASE_TASKS_PATH}${TASKS_PATHS.GET_ONE_TASK.replace(':taskId', taskId.toString())}`)
                .set('Authorization', `Bearer ${executorAuthToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('id');
            expect(response.body.id).toBe(taskId);
            expect(response.body.title).toBe(validTask.title);
            expect(response.body.createUserId).toBe(userId);
            expect(response.body.executorUserId).toBe(executorUserId);
        });

        it('should return 401 when no authorization token provided', async () => {
            await request(application.app)
                .get(`${BASE_TASKS_PATH}${TASKS_PATHS.GET_ONE_TASK.replace(':taskId', taskId.toString())}`)
                .expect(401);
        });

        it('should return 401 when invalid token provided', async () => {
            await request(application.app)
                .get(`${BASE_TASKS_PATH}${TASKS_PATHS.GET_ONE_TASK.replace(':taskId', taskId.toString())}`)
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
        });

        it('should return 404 when task does not exist', async () => {
            const nonExistentTaskId = 99999;

            await request(application.app)
                .get(`${BASE_TASKS_PATH}${TASKS_PATHS.GET_ONE_TASK.replace(':taskId', nonExistentTaskId.toString())}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });

        it('should return 403 when user is not creator and not executor', async () => {

            const anotherUser = {
                name: 'another',
                email: 'another@bk.ru',
                password: '9012',
            };

            const anotherUserResponse = await request(application.app)
                .post(`${BASE_AUTH_PATH}${AUTH_PATHS.REGISTER}`)
                .send(anotherUser);

            const anotherUserToken = anotherUserResponse.body.accessToken;

            await request(application.app)
                .get(`${BASE_TASKS_PATH}${TASKS_PATHS.GET_ONE_TASK.replace(':taskId', taskId.toString())}`)
                .set('Authorization', `Bearer ${anotherUserToken}`)
                .expect(403);
        });

        it('should return task with project data when project exists', async () => {
            const response = await request(application.app)
                .get(`${BASE_TASKS_PATH}${TASKS_PATHS.GET_ONE_TASK.replace(':taskId', taskId.toString())}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('projectId');
            expect(response.body.projectId).toBe(projectId);
        });

        it('should return 400 when taskId is not a number', async () => {
            await request(application.app)
                .get(`${BASE_TASKS_PATH}${TASKS_PATHS.GET_ONE_TASK.replace(':taskId', 'invalid')}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(400);
        });
    });

    describe(`PUT ${BASE_TASKS_PATH}${TASKS_PATHS.UPDATE_TASK} - update task`, () => {
        let taskId: number;
        let taskIdWithoutExecutor: number;

        beforeEach(async () => {
            // Очистка перед каждым тестом
            await prismaService.client.taskModel.deleteMany();
            await prismaService.client.projectModel.deleteMany();
            await prismaService.client.userModel.deleteMany();

            // Регистрация создателя
            const registerResponse = await request(application.app)
                .post(`${BASE_AUTH_PATH}${AUTH_PATHS.REGISTER}`)
                .send(testUser);

            authToken = registerResponse.body.accessToken;
            userId = registerResponse.body.id;

            // Регистрация исполнителя
            const executorRegisterResponse = await request(application.app)
                .post(`${BASE_AUTH_PATH}${AUTH_PATHS.REGISTER}`)
                .send(testExecutor);

            executorAuthToken = executorRegisterResponse.body.accessToken;
            executorUserId = executorRegisterResponse.body.id;

            // Создание проекта
            const projectResponse = await request(application.app)
                .post(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.CREATE}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(validProject)
                .expect(201);

            projectId = projectResponse.body.projectId;

            // Создание задачи с исполнителем
            const taskData = {
                title: validTask.title,
                description: validTask.description,
                dueDate: validTask.dueDate,
                status: TaskStatus.CREATED,
                executorUserId: executorUserId,
            };

            const taskResponse = await request(application.app)
                .post(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.CREATE_TASKS_FOR_PROJECT.replace(':projectId', projectId.toString())}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(taskData)
                .expect(201);

            taskId = taskResponse.body.taskId;

            // Создание задачи без исполнителя
            const taskDataWithoutExecutor = {
                title: 'Task without executor',
                description: 'Description',
                dueDate: validTask.dueDate,
                status: TaskStatus.CREATED,
            };

            const taskWithoutExecutorResponse = await request(application.app)
                .post(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.CREATE_TASKS_FOR_PROJECT.replace(':projectId', projectId.toString())}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(taskDataWithoutExecutor)
                .expect(201);

            taskIdWithoutExecutor = taskWithoutExecutorResponse.body.taskId;
        });

        it('should successfully update task title when user is creator', async () => {
            const updateData = {
                title: 'Updated Task Title',
            };

            await request(application.app)
                .put(`${BASE_TASKS_PATH}${TASKS_PATHS.UPDATE_TASK.replace(':taskId', taskId.toString())}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(204);

            const updatedTask = await prismaService.client.taskModel.findFirst({
                where: { id: taskId }
            });

            expect(updatedTask?.title).toBe(updateData.title);
            expect(updatedTask?.description).toBe(validTask.description);
            expect(updatedTask?.status).toBe(TaskStatus.CREATED);
        });

        it('should successfully update task description when user is creator', async () => {
            const updateData = {
                description: 'Updated description text',
            };

            await request(application.app)
                .put(`${BASE_TASKS_PATH}${TASKS_PATHS.UPDATE_TASK.replace(':taskId', taskId.toString())}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(204);

            const updatedTask = await prismaService.client.taskModel.findFirst({
                where: { id: taskId }
            });

            expect(updatedTask?.description).toBe(updateData.description);
            expect(updatedTask?.title).toBe(validTask.title);
        });

        it('should successfully update task dueDate when user is creator', async () => {
            const updateData = {
                dueDate: '2025-12-31T00:00:00.000Z',
            };

            await request(application.app)
                .put(`${BASE_TASKS_PATH}${TASKS_PATHS.UPDATE_TASK.replace(':taskId', taskId.toString())}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(204);

            const updatedTask = await prismaService.client.taskModel.findFirst({
                where: { id: taskId }
            });

            expect(updatedTask?.dueDate).toEqual(new Date(updateData.dueDate));
        });

        it('should successfully update task status when user is creator', async () => {
            const updateData = {
                status: TaskStatus.IN_PROGRESS,
            };

            await request(application.app)
                .put(`${BASE_TASKS_PATH}${TASKS_PATHS.UPDATE_TASK.replace(':taskId', taskId.toString())}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(204);

            const updatedTask = await prismaService.client.taskModel.findFirst({
                where: { id: taskId }
            });

            expect(updatedTask?.status).toBe(TaskStatus.IN_PROGRESS);
        });

        it('should successfully update task executor when user is creator', async () => {
            const newExecutor = {
                name: 'newExecutor',
                email: 'newExecutor@bk.ru',
                password: '1234',
            };

            const newExecutorResponse = await request(application.app)
                .post(`${BASE_AUTH_PATH}${AUTH_PATHS.REGISTER}`)
                .send(newExecutor);

            const newExecutorId = newExecutorResponse.body.id;

            const updateData = {
                executorUserId: newExecutorId,
            };

            await request(application.app)
                .put(`${BASE_TASKS_PATH}${TASKS_PATHS.UPDATE_TASK.replace(':taskId', taskId.toString())}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(204);

            const updatedTask = await prismaService.client.taskModel.findFirst({
                where: { id: taskId }
            });

            expect(updatedTask?.executorUserId).toBe(newExecutorId);
        });

        it('should successfully update multiple fields at once when user is creator', async () => {
            const updateData = {
                title: 'New Title',
                description: 'New Description',
                dueDate: '2025-06-30T00:00:00.000Z',
                status: TaskStatus.COMPLETED,
            };

            await request(application.app)
                .put(`${BASE_TASKS_PATH}${TASKS_PATHS.UPDATE_TASK.replace(':taskId', taskId.toString())}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(204);

            const updatedTask = await prismaService.client.taskModel.findFirst({
                where: { id: taskId }
            });

            expect(updatedTask?.title).toBe(updateData.title);
            expect(updatedTask?.description).toBe(updateData.description);
            expect(updatedTask?.dueDate).toEqual(new Date(updateData.dueDate));
            expect(updatedTask?.status).toBe(TaskStatus.COMPLETED);
        });

        it('should return 401 when no authorization token provided', async () => {
            await request(application.app)
                .put(`${BASE_TASKS_PATH}${TASKS_PATHS.UPDATE_TASK.replace(':taskId', taskId.toString())}`)
                .send({ title: 'New Title' })
                .expect(401);
        });

        it('should return 401 when invalid token provided', async () => {
            await request(application.app)
                .put(`${BASE_TASKS_PATH}${TASKS_PATHS.UPDATE_TASK.replace(':taskId', taskId.toString())}`)
                .set('Authorization', 'Bearer invalid-token')
                .send({ title: 'New Title' })
                .expect(401);
        });

        it('should return 404 when task does not exist', async () => {
            const nonExistentTaskId = 99999;

            await request(application.app)
                .put(`${BASE_TASKS_PATH}${TASKS_PATHS.UPDATE_TASK.replace(':taskId', nonExistentTaskId.toString())}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ title: 'New Title' })
                .expect(404);
        });

        it('should return 403 when user is not the creator of the task', async () => {

            await request(application.app)
                .put(`${BASE_TASKS_PATH}${TASKS_PATHS.UPDATE_TASK.replace(':taskId', taskId.toString())}`)
                .set('Authorization', `Bearer ${executorAuthToken}`)
                .send({ title: 'New Title' })
                .expect(403);
        });

        it('should return 400 when taskId is not a number', async () => {
            await request(application.app)
                .put(`${BASE_TASKS_PATH}${TASKS_PATHS.UPDATE_TASK.replace(':taskId', 'invalid')}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ title: 'New Title' })
                .expect(400);
        });

        it('should return 400 when dueDate has invalid format', async () => {
            const updateData = {
                dueDate: 'invalid-date',
            };

            await request(application.app)
                .put(`${BASE_TASKS_PATH}${TASKS_PATHS.UPDATE_TASK.replace(':taskId', taskId.toString())}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(400);
        });

        it('should return 400 when status is invalid', async () => {
            const updateData = {
                status: 'INVALID_STATUS',
            };

            await request(application.app)
                .put(`${BASE_TASKS_PATH}${TASKS_PATHS.UPDATE_TASK.replace(':taskId', taskId.toString())}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(400);
        });

        it('should successfully update executorUserId to null (remove executor)', async () => {
            const updateData = {
                executorUserId: null,
            };

            await request(application.app)
                .put(`${BASE_TASKS_PATH}${TASKS_PATHS.UPDATE_TASK.replace(':taskId', taskId.toString())}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(204);

            const updatedTask = await prismaService.client.taskModel.findFirst({
                where: { id: taskId }
            });

            expect(updatedTask?.executorUserId).toBeNull();
        });

        it('should successfully update description to null', async () => {
            const updateData = {
                description: null,
            };

            await request(application.app)
                .put(`${BASE_TASKS_PATH}${TASKS_PATHS.UPDATE_TASK.replace(':taskId', taskIdWithoutExecutor.toString())}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(204);

            const updatedTask = await prismaService.client.taskModel.findFirst({
                where: { id: taskIdWithoutExecutor }
            });

            expect(updatedTask?.description).toBeNull();
        });

        it('should return 204 with empty body when update is successful', async () => {
            const response = await request(application.app)
                .put(`${BASE_TASKS_PATH}${TASKS_PATHS.UPDATE_TASK.replace(':taskId', taskId.toString())}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ title: 'Updated Title' })
                .expect(204);

            expect(response.body).toEqual({});
        });

        it('should not change other fields when updating only one field', async () => {
            const originalTask = await prismaService.client.taskModel.findFirst({
                where: { id: taskId }
            });

            await request(application.app)
                .put(`${BASE_TASKS_PATH}${TASKS_PATHS.UPDATE_TASK.replace(':taskId', taskId.toString())}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ title: 'Only Title Changed' })
                .expect(204);

            const updatedTask = await prismaService.client.taskModel.findFirst({
                where: { id: taskId }
            });

            expect(updatedTask?.title).toBe('Only Title Changed');
            expect(updatedTask?.description).toBe(originalTask?.description);
            expect(updatedTask?.dueDate).toEqual(originalTask?.dueDate);
            expect(updatedTask?.status).toBe(originalTask?.status);
            expect(updatedTask?.executorUserId).toBe(originalTask?.executorUserId);
        });
    });

    describe(`DELETE ${BASE_TASKS_PATH}${TASKS_PATHS.DELETE_TASK} - delete task`, () => {
        let taskId: number;

        beforeEach(async () => {

            await prismaService.client.taskModel.deleteMany();
            await prismaService.client.projectModel.deleteMany();
            await prismaService.client.userModel.deleteMany();

            const registerResponse = await request(application.app)
                .post(`${BASE_AUTH_PATH}${AUTH_PATHS.REGISTER}`)
                .send(testUser);

            authToken = registerResponse.body.accessToken;
            userId = registerResponse.body.id;


            const executorRegisterResponse = await request(application.app)
                .post(`${BASE_AUTH_PATH}${AUTH_PATHS.REGISTER}`)
                .send(testExecutor);

            executorAuthToken = executorRegisterResponse.body.accessToken;
            executorUserId = executorRegisterResponse.body.id;


            const projectResponse = await request(application.app)
                .post(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.CREATE}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(validProject)
                .expect(201);

            projectId = projectResponse.body.projectId;


            const taskData = {
                title: validTask.title,
                description: validTask.description,
                dueDate: validTask.dueDate,
                status: TaskStatus.CREATED,
                executorUserId: executorUserId,
            };

            const taskResponse = await request(application.app)
                .post(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.CREATE_TASKS_FOR_PROJECT.replace(':projectId', projectId.toString())}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(taskData)
                .expect(201);

            taskId = taskResponse.body.taskId;
        });

        it('should successfully delete task when user is creator', async () => {
            await request(application.app)
                .delete(`${BASE_TASKS_PATH}${TASKS_PATHS.DELETE_TASK.replace(':taskId', taskId.toString())}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(204);

            const deletedTask = await prismaService.client.taskModel.findFirst({
                where: { id: taskId }
            });

            expect(deletedTask).toBeNull();
        });

        it('should return 401 when no authorization token provided', async () => {
            await request(application.app)
                .delete(`${BASE_TASKS_PATH}${TASKS_PATHS.DELETE_TASK.replace(':taskId', taskId.toString())}`)
                .expect(401);
        });

        it('should return 401 when invalid token provided', async () => {
            await request(application.app)
                .delete(`${BASE_TASKS_PATH}${TASKS_PATHS.DELETE_TASK.replace(':taskId', taskId.toString())}`)
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
        });

        it('should return 404 when task does not exist', async () => {
            const nonExistentTaskId = 99999;

            await request(application.app)
                .delete(`${BASE_TASKS_PATH}${TASKS_PATHS.DELETE_TASK.replace(':taskId', nonExistentTaskId.toString())}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });

        it('should return 403 when user is not the creator of the task', async () => {

            await request(application.app)
                .delete(`${BASE_TASKS_PATH}${TASKS_PATHS.DELETE_TASK.replace(':taskId', taskId.toString())}`)
                .set('Authorization', `Bearer ${executorAuthToken}`)
                .expect(403);
        });

        it('should return 400 when taskId is not a number', async () => {
            await request(application.app)
                .delete(`${BASE_TASKS_PATH}${TASKS_PATHS.DELETE_TASK.replace(':taskId', 'invalid')}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(400);
        });

        it('should return 204 with empty body when deletion is successful', async () => {
            const response = await request(application.app)
                .delete(`${BASE_TASKS_PATH}${TASKS_PATHS.DELETE_TASK.replace(':taskId', taskId.toString())}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(204);

            expect(response.body).toEqual({});
        });

        it('should successfully delete task without executor (executorUserId is null)', async () => {

            const taskDataWithoutExecutor = {
                title: 'Task without executor',
                description: 'Description',
                dueDate: validTask.dueDate,
                status: TaskStatus.CREATED,
            };

            const taskWithoutExecutorResponse = await request(application.app)
                .post(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.CREATE_TASKS_FOR_PROJECT.replace(':projectId', projectId.toString())}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(taskDataWithoutExecutor)
                .expect(201);

            const taskWithoutExecutorId = taskWithoutExecutorResponse.body.taskId;

            await request(application.app)
                .delete(`${BASE_TASKS_PATH}${TASKS_PATHS.DELETE_TASK.replace(':taskId', taskWithoutExecutorId.toString())}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(204);

            const deletedTask = await prismaService.client.taskModel.findFirst({
                where: { id: taskWithoutExecutorId }
            });

            expect(deletedTask).toBeNull();
        });

        it('should successfully delete task without description', async () => {

            const taskDataWithoutDescription = {
                title: 'Task without description',
                dueDate: validTask.dueDate,
                status: TaskStatus.CREATED,
                executorUserId: executorUserId,
            };

            const taskWithoutDescriptionResponse = await request(application.app)
                .post(`${BASE_PROJECTS_PATH}${PROJECTS_PATH.CREATE_TASKS_FOR_PROJECT.replace(':projectId', projectId.toString())}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(taskDataWithoutDescription)
                .expect(201);

            const taskWithoutDescriptionId = taskWithoutDescriptionResponse.body.taskId;

            await request(application.app)
                .delete(`${BASE_TASKS_PATH}${TASKS_PATHS.DELETE_TASK.replace(':taskId', taskWithoutDescriptionId.toString())}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(204);

            const deletedTask = await prismaService.client.taskModel.findFirst({
                where: { id: taskWithoutDescriptionId }
            });

            expect(deletedTask).toBeNull();
        });

        it('should return 404 when trying to delete already deleted task', async () => {

            await request(application.app)
                .delete(`${BASE_TASKS_PATH}${TASKS_PATHS.DELETE_TASK.replace(':taskId', taskId.toString())}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(204);

            await request(application.app)
                .delete(`${BASE_TASKS_PATH}${TASKS_PATHS.DELETE_TASK.replace(':taskId', taskId.toString())}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });

        it('should not delete task when user is not authenticated', async () => {
            await request(application.app)
                .delete(`${BASE_TASKS_PATH}${TASKS_PATHS.DELETE_TASK.replace(':taskId', taskId.toString())}`)
                .expect(401);


            const task = await prismaService.client.taskModel.findFirst({
                where: { id: taskId }
            });
            expect(task).toBeDefined();
        });

        it('should not delete task when user is executor but not creator', async () => {
            await request(application.app)
                .delete(`${BASE_TASKS_PATH}${TASKS_PATHS.DELETE_TASK.replace(':taskId', taskId.toString())}`)
                .set('Authorization', `Bearer ${executorAuthToken}`)
                .expect(403);


            const task = await prismaService.client.taskModel.findFirst({
                where: { id: taskId }
            });
            expect(task).toBeDefined();
        });
    });
});