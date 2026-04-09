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

@injectable()
export class ProjectsController extends BaseController implements IProjectsController {
	constructor(
		@inject(TYPES.ILogger) logger: ILogger,
		@inject(TYPES.JwtService) private readonly jwtService: JwtService,
		@inject(TYPES.IProjectsService) private readonly projectsService: ProjectsService
	) {
		super(logger);
		this.basePath = BASE_PROJECTS_PATH;
		this.bindRoutes([
			{
				path: PROJECTS_PATH.CREATE,
				method: 'post',
				func: this.create,
				middlewares: [
					new AuthMiddleware(this.jwtService, logger),
					new ValidateMiddleware(logger, CreateProjectsDto),
				],
			},
		]);
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
		await this.projectsService.create({ name, description }, userId)
		this.ok(res, { message: 'Project created' });
	}
}
