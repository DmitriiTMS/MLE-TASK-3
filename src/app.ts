import 'reflect-metadata';
import express, { Express, NextFunction, Request, Response } from 'express';
import { Server } from 'http';
import { ILogger } from './common/logger/logger.interface';
import { IExeptionFilter } from './common/error/exeption.filter.interface';
import { HttpError } from './common/error/http-error';
import { HttpErrorCode, HttpErrorMessages } from './common/error/constants';
import { inject, injectable } from 'inversify';
import { TYPES } from './common/types/types';

@injectable()
export class App {
	app: Express;
	server!: Server;
	port: number;

	constructor(
		@inject(TYPES.ILogger) private readonly logger: ILogger,
		@inject(TYPES.IExeptionFilter) private readonly exeptionFilter: IExeptionFilter,
	) {
		this.app = express();
		this.port = 4200;
	}

	useRoutes(): void {
		this.app.get('/login', (req: Request, res: Response, next: NextFunction): void => {
			next(
				new HttpError(
					HttpErrorCode.UNAUTHORIZED,
					HttpErrorMessages[HttpErrorCode.UNAUTHORIZED],
					'/login',
				),
			);
		});
	}

	useExeptionFilters(): void {
		this.app.use(this.exeptionFilter.catch.bind(this.exeptionFilter));
	}

	init(): void {
		this.useRoutes();
		this.useExeptionFilters();
		this.server = this.app.listen(this.port);
		this.logger.log(`Server start on http://localhost:${this.port}`);
	}
}
