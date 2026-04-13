import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { BaseController } from '../common/base/base.controller';
import { ITasksController } from './tasks.controller.interface';
import { TYPES } from '../common/types/types';
import { ILogger } from '../common/logger/logger.interface';
import { BASE_TASKS_PATH, TASKS_PATHS } from './constants';
import { NextFunction, Request, Response } from 'express';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';
import { JwtService } from '../auth/jwt/jwt.service';
import { ValidateMiddleware } from '../common/middlewares/validate.middleware';
import { TaskIdDto } from './dto/taskId.dto';
import { HttpError } from '../common/error/http-error';
import { HttpErrorCode, HttpErrorMessages } from '../common/error/constants';
import { TasksService } from './tasks.service';

@injectable()
export class TasksController extends BaseController implements ITasksController {
	constructor(
		@inject(TYPES.ILogger) logger: ILogger,
		@inject(TYPES.JwtService) private readonly jwtService: JwtService,
		@inject(TYPES.ITasksService) private readonly tasksService: TasksService,
	) {
		super(logger);
		this.basePath = BASE_TASKS_PATH;
		this.bindRoutes([
			{
				path: TASKS_PATHS.GET_ONE_TASK,
				method: 'get',
				func: this.getOneTask,
				middlewares: [
					new AuthMiddleware(this.jwtService, logger),
					new ValidateMiddleware(logger, TaskIdDto, 'params'),
				],
			},
		]);
	}

	async getOneTask(
		req: Request<{ taskId: string }, object, object>,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		const taskId = parseInt(req.params.taskId);
		if (!req.user?.userId) {
			return next(
				new HttpError(
					HttpErrorCode.UNAUTHORIZED,
					HttpErrorMessages[HttpErrorCode.UNAUTHORIZED],
					TASKS_PATHS.GET_ONE_TASK,
				),
			);
		}
		const { userId } = req.user;
		const task = await this.tasksService.getOneTask(userId, taskId);
		this.ok(res, task.toResponse());
	}
}
