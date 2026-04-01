import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { BaseController } from '../common/base/base.controller';
import { TYPES } from '../common/types/types';
import { ILogger } from '../common/logger/logger.interface';
import { NextFunction, Request, Response } from 'express';
import { AuthPath } from './constants';
import { IAuthController } from './auth.controller.interface';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { IAuthService } from './auth.service.interface';

@injectable()
export class AuthController extends BaseController implements IAuthController{
	constructor(
        @inject(TYPES.ILogger) logger: ILogger,
        @inject(TYPES.IAuthService) private authService: IAuthService
    ) {
		super(logger);
		this.bindRoutes([
			{ path: AuthPath.REGISTER, method: 'post', func: this.register, middlewares: [] },
			{ path: AuthPath.LOGIN, method: 'post', func: this.login, middlewares: []  },
		]);
	}

	async register(req: Request<{}, {}, RegisterDto>, res: Response, next: NextFunction): Promise<any> {
        const user = await this.authService.register(req.body)
		this.created(res, user);
	}

	async login(req: Request<{}, {}, LoginDto>, res: Response, next: NextFunction): Promise<void> {
		const userData = {
			id: '1',
			email: 'user@example.com',
			password: '123',
			message: 'User login successfully',
		};
		this.ok(res, userData);
	}
}
