import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { BaseController } from '../common/base/base.controller';
import { TYPES } from '../common/types/types';
import { ILogger } from '../common/logger/logger.interface';
import { NextFunction, Request, Response } from 'express';
import { AuthPath } from './constants';

@injectable()
export class AuthController extends BaseController {
	constructor(@inject(TYPES.ILogger) logger: ILogger) {
		super(logger);
		this.bindRoutes([
			{ path: AuthPath.REGISTER, method: 'post', func: this.register },
			{ path: AuthPath.LOGIN, method: 'post', func: this.login },
		]);
	}

	register(req: Request, res: Response, next: NextFunction): void {
		const userData = {
			id: '1',
			email: 'user@example.com',
			password: '123',
			message: 'User registered successfully',
		};
		this.created(res, userData);
	}

	login(req: Request, res: Response, next: NextFunction): void {
		const userData = {
			id: '1',
			email: 'user@example.com',
			password: '123',
			message: 'User login successfully',
		};
		this.ok(res, userData);
	}
}
