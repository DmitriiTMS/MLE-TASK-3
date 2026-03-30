import express, { Express, Request, Response } from 'express';
import { Server } from 'http';
import { ILogger } from './common/logger/logger.interface';

export class App {
	app: Express;
	server!: Server;
	port: number;

	constructor(private readonly logger: ILogger) {
		this.app = express();
		this.port = 4200;
	}

	useRoutes(): void {
		this.app.get('/start', (req: Request, res: Response): void => {
			res.send({ message: 'START' });
		});
	}

	init(): void {
		this.useRoutes();
		this.server = this.app.listen(this.port);
		this.logger.log(`Server start on http://localhost:${this.port}`);
	}
}
