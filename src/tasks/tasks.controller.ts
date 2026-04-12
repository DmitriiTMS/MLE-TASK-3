import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { BaseController } from '../common/base/base.controller';
import { ITasksController } from './tasks.controller.interface';
import { TYPES } from '../common/types/types';
import { ILogger } from '../common/logger/logger.interface';
import { BASE_TASKS_PATH } from './constants';
import { NextFunction, Request, Response } from 'express';

@injectable()
export class TasksController extends BaseController implements ITasksController {
	constructor(@inject(TYPES.ILogger) logger: ILogger) {
		super(logger);
		this.basePath = BASE_TASKS_PATH;
		this.bindRoutes([
			{
				path: '',
				method: 'post',
				func: this.create,
				// middlewares: [new ValidateMiddleware(logger, RegisterDto)],
			},
		]);
	}

	create(_req: Request, res: Response, next: NextFunction) {
		console.log('start');
		this.ok(res, {});
	}
}
