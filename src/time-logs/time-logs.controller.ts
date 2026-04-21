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
import { AuthMiddleware } from '../auth/middleware/auth.middleware';
import { ValidateMiddleware } from '../common/middlewares/validate.middleware';
import { DeveloperIdDto } from './dto/developer-id.dto';
import { GetDeveloperTimeLogsDto, PeriodType } from './dto/get-developer-time-logs.dto';
import { IResponseGetDeveloperTime, ITimeLogFilters } from './types';
import { ITimeLogsRepository } from './time-logs.repository.interface';


@injectable()
export class TimeLogsController extends BaseController implements ITimeLogsController {
	constructor(
		@inject(TYPES.ILogger) logger: ILogger,
		@inject(TYPES.JwtService) private readonly jwtService: JwtService,
		@inject(TYPES.ITimeLogsRepository) private readonly timeLogsRepository: ITimeLogsRepository,
	) {
		super(logger);
		this.basePath = BASE_TIME_LOGS_PATH;
		this.bindRoutes([

			{
				path: TIME_LOGS_PATHS.GET_DEVELOPER_TIME_LOGS,
				method: 'get',
				func: this.getDeveloperTimeLogs,
				middlewares: [
					new AuthMiddleware(this.jwtService, logger),
					new ValidateMiddleware(logger, DeveloperIdDto, 'params'),
					new ValidateMiddleware(logger, GetDeveloperTimeLogsDto, 'query'),
				],
			},
		]);
	}

	async getDeveloperTimeLogs(
		req: Request<{ developerId: string }, object, object>,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		if (!req.user?.userId) {
			return next(
				new HttpError(
					HttpErrorCode.UNAUTHORIZED,
					HttpErrorMessages[HttpErrorCode.UNAUTHORIZED],
					TIME_LOGS_PATHS.GET_DEVELOPER_TIME_LOGS,
				),
			);
		}

		const developerId = parseInt(req.params.developerId);

		let startDate: Date | undefined;
		let endDate: Date | undefined;

		const period = req.query.period as string;

		if (period && period !== PeriodType.ALL) {
			if (Object.values(PeriodType).includes(period as PeriodType)) {
				const dateRange = this.getDateRangeByPeriod(period as PeriodType);
				startDate = dateRange.startDate;
				endDate = dateRange.endDate;
			}
		}
		else if (!period || period === PeriodType.ALL) {
			startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
			endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
		}

		const filters: ITimeLogFilters = {
			developerId,
			projectId: req.query.projectId ? parseInt(req.query.projectId as string, 10) : undefined,
			startDate,
			endDate
		};

		const result: IResponseGetDeveloperTime = await this.timeLogsRepository.getDeveloperTimeLogs(filters)
		this.ok(res, result);
	}

	private getDateRangeByPeriod(period: PeriodType): { startDate: Date; endDate: Date } {
		const now = new Date();
		switch (period) {
			case PeriodType.WEEK:
				const startWeek = new Date(now);
				const dayOfWeek = now.getDay();
				startWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
				startWeek.setHours(0, 0, 0, 0);
				const endWeek = new Date(startWeek);
				endWeek.setDate(startWeek.getDate() + 6);
				endWeek.setHours(23, 59, 59, 999);
				return { startDate: startWeek, endDate: endWeek };
			case PeriodType.MONTH:
				const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
				const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
				return { startDate: startMonth, endDate: endMonth };
			default:
				const defaultStart = new Date(now);
				defaultStart.setDate(now.getDate() - 7);
				return { startDate: defaultStart, endDate: now };
		}
	}
}
