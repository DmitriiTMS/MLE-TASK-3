import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { BaseController } from '../common/base/base.controller';
import { TYPES } from '../common/types/types';
import { ILogger } from '../common/logger/logger.interface';
import { NextFunction, Request, Response } from 'express';
import { JwtService } from '../auth/jwt/jwt.service';
import { HttpError } from '../common/error/http-error';
import { HttpErrorCode, HttpErrorMessages } from '../common/error/constants';
import { ITimeLogsController } from './time-logs.controller.interface';
import { BASE_TIME_LOGS_PATH, TIME_LOGS_PATHS } from './constants';


@injectable()
export class TimeLogsController extends BaseController implements ITimeLogsController {
	constructor(
		@inject(TYPES.ILogger) logger: ILogger,
		@inject(TYPES.JwtService) private readonly jwtService: JwtService,
	) {
		super(logger);
		this.basePath = BASE_TIME_LOGS_PATH;
		this.bindRoutes([
			
			{
				path: TIME_LOGS_PATHS.START,
				method: 'get',
				func: this.start,
				// middlewares: [
				// 	new AuthMiddleware(this.jwtService, logger),
				// 	new ValidateMiddleware(logger, TaskIdDto, 'params'),
				// 	new ValidateMiddleware(logger, StatusTaskDto, 'body'),
				// ],
			},
		]);
	}



	async start(
		req: Request<object, object, object>,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		console.log('hi');
        
		this.noContent(res, {});
	}
}
