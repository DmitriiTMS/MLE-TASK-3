import 'reflect-metadata';
import express, { Express, json, NextFunction, Response, Request, urlencoded } from 'express';
import cors from 'cors';
import { Server } from 'http';
import { ILogger } from './common/logger/logger.interface';
import { IExeptionFilter } from './common/error/exeption.filter.interface';
import { inject, injectable } from 'inversify';
import { TYPES } from './common/types/types';
import { AuthController } from './auth/auth.controller';
import { AuthPath } from './auth/constants';

@injectable()
export class App {
	app: Express;
	server!: Server;
	port: number;

	constructor(
		@inject(TYPES.ILogger) private readonly logger: ILogger,
		@inject(TYPES.IExeptionFilter) private readonly exeptionFilter: IExeptionFilter,
		@inject(TYPES.AuthController) private readonly authController: AuthController,
	) {
		this.app = express();
		this.port = 4200;
		this.configureMiddleware();
	}

	private configureMiddleware(): void {
		this.app.use(cors());

		this.app.use(json({}));
		this.app.use(urlencoded({ extended: true }));

		this.app.use((req: Request, _res: Response, next: NextFunction) => {
			this.logger.log(`[${req.method}] ${req.path}`);
			next();
		});
	}

	useRoutes(): void {
		this.app.use(AuthPath.BASE_AUTH, this.authController.router);
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
