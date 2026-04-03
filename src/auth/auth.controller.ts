import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { BaseController } from '../common/base/base.controller';
import { TYPES } from '../common/types/types';
import { ILogger } from '../common/logger/logger.interface';
import { NextFunction, Request, Response } from 'express';
import { AUTH_PATH } from './constants';
import { IAuthController } from './auth.controller.interface';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { IAuthService } from './auth.service.interface';
import { ValidateMiddleware } from '../common/middlewares/validate.middleware';
import { HttpError } from '../common/error/http-error';
import { HttpErrorCode, HttpErrorMessages } from '../common/error/constants';

@injectable()
export class AuthController extends BaseController implements IAuthController {
	constructor(
		@inject(TYPES.ILogger) logger: ILogger,
		@inject(TYPES.IAuthService) private authService: IAuthService,
	) {
		super(logger);
		this.bindRoutes([
			{
				path: AUTH_PATH.REGISTER,
				method: 'post',
				func: this.register,
				middlewares: [new ValidateMiddleware(logger, RegisterDto)],
			},
			{
				path: AUTH_PATH.LOGIN,
				method: 'post',
				func: this.login,
				middlewares: [new ValidateMiddleware(logger, LoginDto)],
			},
		]);
	}

	async register(
		req: Request<object, object, RegisterDto>,
		res: Response,
		next: NextFunction,
	): Promise<{ id: number; name: string } | void> {
		const result = await this.authService.register(req.body);
		if (!result) {
			return next(
				new HttpError(
					HttpErrorCode.CONFLICT,
					HttpErrorMessages[HttpErrorCode.CONFLICT],
					AUTH_PATH.REGISTER,
				),
			);
		}
		this.created(res, { id: result.id, name: result.name });
	}

	async login(
		req: Request<object, object, LoginDto>,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		const result = await this.authService.validateUser(req.body);
		if (!result) {
			return next(
				new HttpError(
					HttpErrorCode.UNAUTHORIZED,
					HttpErrorMessages[HttpErrorCode.UNAUTHORIZED],
					AUTH_PATH.LOGIN,
				),
			);
		}
		this.ok(res, {});
	}
}
