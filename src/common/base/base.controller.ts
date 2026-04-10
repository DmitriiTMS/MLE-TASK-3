import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { TYPES } from '../types/types';
import { ILogger } from '../logger/logger.interface';
import { Router, Response } from 'express';
import { IControllerRoute } from './route.interface';
import { HttpCodeSuccessful } from './constants';


@injectable()
export abstract class BaseController {
	private readonly _router: Router;
	private _basePath: string;

	constructor(@inject(TYPES.ILogger) protected readonly logger: ILogger) {
		this._router = Router();
	}

	get router(): Router {
		return this._router;
	}

	public get basePath(): string {
		return this._basePath;
	}

	public set basePath(path: string) {
		this._basePath = path;
	}

	public send<T>(res: Response, code: number, data: T): Response<T> {
		res.type('application/json');
		return res.status(code).json(data) as Response<T>;
	}

	public created<T>(res: Response, data: T): Response<T> {
		this.logger.log('created')
		return this.send(res, HttpCodeSuccessful.CREATED, data);
	}

	public ok<T>(res: Response, data: T): Response<T> {
		this.logger.log('ok')
		return this.send(res, HttpCodeSuccessful.OK, data);
	}

	protected bindRoutes(routes: IControllerRoute[]): void {
		for (const route of routes) {
			const fullPath = this.basePath ? `${this.basePath}${route.path}` : route.path;
			this.logger.log(`[${route.method.toUpperCase()}] ${fullPath}`);
			const middleware = route.middlewares?.map((m) => m.execute.bind(m));
			const handler = route.func.bind(this);
			const pipeline = middleware ? [...middleware, handler] : handler;
			this.router[route.method](route.path, pipeline);
		}
	}
}
