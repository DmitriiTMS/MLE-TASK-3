import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { BaseController } from '../common/base/base.controller';
import { TYPES } from '../common/types/types';
import { ILogger } from '../common/logger/logger.interface';
import { NextFunction, Request, Response } from 'express';
import { IProjectsController } from './projects.controller.interface';
import { PROJECTS_PATH } from './constants';
import { CreateProjectsDto } from './dto/create-projects.dto';
import { ICreateResponse } from './types';
import { ValidateMiddleware } from '../common/middlewares/validate.middleware';
import { JwtService } from '../auth/jwt/jwt.service';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';

@injectable()
export class ProjectsController extends BaseController implements IProjectsController {
	constructor(
		@inject(TYPES.ILogger) logger: ILogger,
		@inject(TYPES.JwtService) private readonly jwtService: JwtService,
	) {
		super(logger);
		this.bindRoutes([
			{
				path: PROJECTS_PATH.CREATE,
				method: 'post',
				func: this.create,
				middlewares: [
					new ValidateMiddleware(logger, CreateProjectsDto),
					new AuthMiddleware(this.jwtService),
				],
			},
		]);
	}

	async create(
		req: Request<object, object, CreateProjectsDto>,
		res: Response,
		next: NextFunction,
	): Promise<ICreateResponse> {
		console.log(req?.user);

		return { id: 1 };
	}
}
