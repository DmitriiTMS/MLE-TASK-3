import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { BaseController } from '../common/base/base.controller';
import { TYPES } from '../common/types/types';
import { ILogger } from '../common/logger/logger.interface';
import { NextFunction, Request, Response } from 'express';
import { IProjectsController } from './projects.controller.interface';
import { BASE_PROJECTS_PATH, PROJECTS_PATH } from './constants';
import { CreateProjectsDto } from './dto/create-projects.dto';
import { ValidateMiddleware } from '../common/middlewares/validate.middleware';
import { JwtService } from '../auth/jwt/jwt.service';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';
import { ProjectsService } from './projects.service';
import { HttpError } from '../common/error/http-error';
import { HttpErrorCode, HttpErrorMessages } from '../common/error/constants';
import { ProjectEntity } from './entity/project.entity';
import { ProjectIdDto } from './dto/projectId.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateTaskDto } from '../tasks/dto/create-task.dto';
import { TasksService } from '../tasks/tasks.service';

@injectable()
export class ProjectsController extends BaseController implements IProjectsController {
	constructor(
		@inject(TYPES.ILogger) logger: ILogger,
		@inject(TYPES.JwtService) private readonly jwtService: JwtService,
		@inject(TYPES.IProjectsService) private readonly projectsService: ProjectsService,
		@inject(TYPES.ITasksService) private readonly tasksService: TasksService,
	) {
		super(logger);
		this.basePath = BASE_PROJECTS_PATH;
		this.bindRoutes([
			{
				path: PROJECTS_PATH.GET_ALL_PROJECTS_BY_USER_ID,
				method: 'get',
				func: this.getAllProjectsByUserId,
				middlewares: [new AuthMiddleware(this.jwtService, logger)],
			},
			{
				path: PROJECTS_PATH.GET_PROJECT_BY_USER_ID,
				method: 'get',
				func: this.getProjectByUserId,
				middlewares: [
					new AuthMiddleware(this.jwtService, logger),
					new ValidateMiddleware(logger, ProjectIdDto, 'params'),
				],
			},
			{
				path: PROJECTS_PATH.CREATE,
				method: 'post',
				func: this.create,
				middlewares: [
					new AuthMiddleware(this.jwtService, logger),
					new ValidateMiddleware(logger, CreateProjectsDto),
				],
			},
			{
				path: PROJECTS_PATH.UPDATE_PROJECT,
				method: 'patch',
				func: this.update,
				middlewares: [
					new AuthMiddleware(this.jwtService, logger),
					new ValidateMiddleware(logger, ProjectIdDto, 'params'),
					new ValidateMiddleware(logger, UpdateProjectDto),
				],
			},
			{
				path: PROJECTS_PATH.REMOVE_PROJECT,
				method: 'delete',
				func: this.remove,
				middlewares: [
					new AuthMiddleware(this.jwtService, logger),
					new ValidateMiddleware(logger, ProjectIdDto, 'params'),
				],
			},

			{
				path: PROJECTS_PATH.CREATE_TASKS_FOR_PROJECT,
				method: 'post',
				func: this.createTaskForProject,
				middlewares: [
					new AuthMiddleware(this.jwtService, logger),
					new ValidateMiddleware(logger, ProjectIdDto, 'params'),
					new ValidateMiddleware(logger, CreateTaskDto),
				],
			},
		]);
	}

	async getAllProjectsByUserId(req: Request, res: Response, next: NextFunction): Promise<void> {
		if (!req.user?.userId) {
			return next(
				new HttpError(
					HttpErrorCode.UNAUTHORIZED,
					HttpErrorMessages[HttpErrorCode.UNAUTHORIZED],
					PROJECTS_PATH.CREATE,
				),
			);
		}
		const { userId } = req.user;
		const projects: ProjectEntity[] = await this.projectsService.getAllProjectsByUserId(userId);
		const response = projects.map((project) => project.toResponse());
		this.ok(res, response);
	}

	async getProjectByUserId(
		req: Request<{ projectId: string }, object, object>,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		const projectId = parseInt(req.params.projectId);

		if (!req.user?.userId) {
			return next(
				new HttpError(
					HttpErrorCode.UNAUTHORIZED,
					HttpErrorMessages[HttpErrorCode.UNAUTHORIZED],
					PROJECTS_PATH.CREATE,
				),
			);
		}
		const { userId } = req.user;
		const project = await this.projectsService.getProjectByUserId(projectId, userId);

		this.ok(res, project.toResponse());
	}

	async create(
		req: Request<object, object, CreateProjectsDto>,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		const { name, description } = req.body;

		if (!req.user?.userId) {
			return next(
				new HttpError(
					HttpErrorCode.UNAUTHORIZED,
					HttpErrorMessages[HttpErrorCode.UNAUTHORIZED],
					PROJECTS_PATH.CREATE,
				),
			);
		}
		const { userId } = req.user;
		const project = await this.projectsService.create({ name, description }, userId);
		this.created(res, { projectId: project.id });
	}

	async update(
		req: Request<{ projectId: string }, object, UpdateProjectDto>,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		if (!req.user?.userId) {
			return next(
				new HttpError(
					HttpErrorCode.UNAUTHORIZED,
					HttpErrorMessages[HttpErrorCode.UNAUTHORIZED],
					PROJECTS_PATH.UPDATE_PROJECT,
				),
			);
		}
		const { userId } = req.user;
		const projectId = parseInt(req.params.projectId);
		await this.projectsService.update(userId, projectId, req.body);
		this.noContent(res, {});
	}

	async remove(
		req: Request<{ projectId: string }, object, object>,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		if (!req.user?.userId) {
			return next(
				new HttpError(
					HttpErrorCode.UNAUTHORIZED,
					HttpErrorMessages[HttpErrorCode.UNAUTHORIZED],
					PROJECTS_PATH.REMOVE_PROJECT,
				),
			);
		}
		const { userId } = req.user;
		const projectId = parseInt(req.params.projectId);
		await this.projectsService.remove(projectId, userId);
		this.noContent(res, {});
	}

	async createTaskForProject(
		req: Request<{ projectId: string }, object, CreateTaskDto>,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		if (!req.user?.userId) {
			return next(
				new HttpError(
					HttpErrorCode.UNAUTHORIZED,
					HttpErrorMessages[HttpErrorCode.UNAUTHORIZED],
					PROJECTS_PATH.CREATE_TASKS_FOR_PROJECT,
				),
			);
		}
		const { userId } = req.user;
		const projectId = parseInt(req.params.projectId);
		const data = {
			createUserId: userId,
			projectId,
			title: req.body.title,
			dueDate: new Date(req.body.dueDate),
			completedAt: req.body.completedAt ? new Date(req.body.completedAt) : undefined,
			description: req.body.description,
			executorUserId: req.body.executorUserId ? Number(req.body.executorUserId) : undefined,
			status: req.body.status,
		};

		const task = await this.tasksService.createTask(data);
		this.created(res, { taskId: task.id });
	}
}
