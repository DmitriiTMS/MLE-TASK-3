import 'reflect-metadata';
import express, { Express, json, NextFunction, Response, Request, urlencoded } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { Server } from 'http';
import { ILogger } from './common/logger/logger.interface';
import { IExeptionFilter } from './common/error/exeption.filter.interface';
import { inject, injectable } from 'inversify';
import { TYPES } from './common/types/types';
import { AuthController } from './auth/auth.controller';
import { BASE_AUTH_PATH } from './auth/constants';
import { IConfigService } from './common/config/config.service.interface';
import { PrismaService } from './common/database/prisma.service';
import cookieParser from 'cookie-parser';
import { ProjectsController } from './projects/projects.controller';
import { BASE_PROJECTS_PATH } from './projects/constants';
import { TasksController } from './tasks/tasks.controller';
import { BASE_TASKS_PATH } from './tasks/constants';
import { TimeLogsController } from './time-logs/time-logs.controller';
import { BASE_TIME_LOGS_PATH } from './time-logs/constants';

@injectable()
export class App {
	app: Express;
	server!: Server;

	constructor(
		@inject(TYPES.IConfigService) private readonly configService: IConfigService,
		@inject(TYPES.ILogger) private readonly logger: ILogger,
		@inject(TYPES.PrismaService) private readonly prismaService: PrismaService,
		@inject(TYPES.IExeptionFilter) private readonly exeptionFilter: IExeptionFilter,
		@inject(TYPES.IAuthController) private readonly authController: AuthController,
		@inject(TYPES.IProjectsController) private readonly projectsController: ProjectsController,
		@inject(TYPES.ITasksController) private readonly tasksController: TasksController,
		@inject(TYPES.ITimeLogsController) private readonly timeLogsController: TimeLogsController,
	) {
		this.app = express();
		this.configureMiddleware();
	}

	private configureMiddleware(): void {
		this.app.use(helmet());
		this.app.use(cors({ credentials: true }));
		this.app.use(cookieParser());
		this.app.use(json());
		this.app.use(urlencoded({ extended: true }));

		this.app.use((req: Request, _res: Response, next: NextFunction) => {
			this.logger.log(`[${req.method}] ${req.path}`);
			next();
		});
	}

	private useRoutes(): void {
		this.app.use(BASE_AUTH_PATH, this.authController.router);
		this.app.use(BASE_PROJECTS_PATH, this.projectsController.router);
		this.app.use(BASE_TASKS_PATH, this.tasksController.router);
		this.app.use(BASE_TIME_LOGS_PATH, this.timeLogsController.router);
	}

	private useExeptionFilters(): void {
		this.app.use(this.exeptionFilter.catch.bind(this.exeptionFilter));
	}

	public async init(): Promise<void> {
		const port = this.configService.get<string>('PORT');
		try {
			if (!port) {
				this.logger.error('PORT is not defined in environment variables');
				process.exit(1);
			}
			this.useRoutes();
			this.useExeptionFilters();
			await this.prismaService.connect();
			this.server = this.app.listen(port);
			this.logger.log(`Server start on ${port} port`);
		} catch (error: any) {
			this.logger.error(`Failed to start server: ${error.message}`);
			process.exit(1);
		}
	}

	public close(): void {
		this.server.close();
	}
}
