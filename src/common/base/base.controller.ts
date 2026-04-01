import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { TYPES } from '../types/types';
import { ILogger } from '../logger/logger.interface';
import { Router, Response } from 'express';
import { IControllerRoute } from './route.interface';
import { HttpCodeSuccessful } from './constants';
import { AuthPath } from '../../auth/constants';

@injectable()
export abstract class BaseController {
	private readonly _router: Router;

	constructor(@inject(TYPES.ILogger) protected readonly logger: ILogger) {
		this._router = Router();
	}

	get router(): Router {
		return this._router;
	}

	public send<T>(res: Response, code: number, message: T): Response<T> {
		res.type('application/json');
		return res.status(code).json(message) as Response<T>;
	}

	public created<T>(res: Response, message: T): Response<T> {
		return this.send(res, HttpCodeSuccessful.CREATED, message);
	}

	public ok<T>(res: Response, message: T): Response<T> {
		return this.send(res, HttpCodeSuccessful.OK, message);
	}

	protected bindRoutes(routes: IControllerRoute[]): void {
		for (const route of routes) {
			this.logger.log(`[${route.method.toUpperCase()}] ${AuthPath.BASE_AUTH}${route.path}`);
			const middleware = route.middlewares?.map((m) => m.execute.bind(m))
			const handler = route.func.bind(this);
			const pipeline = middleware ? [...middleware, handler] : handler;
			this.router[route.method](route.path, pipeline);
		}
	}
}
