import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { BaseController } from '../common/base/base.controller';
import { TYPES } from '../common/types/types';
import { ILogger } from '../common/logger/logger.interface';
import { NextFunction, Request, Response } from 'express';
import { AUTH_PATHS, BASE_AUTH_PATH } from './constants';
import { IAuthController } from './auth.controller.interface';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { IAuthService } from './auth.service.interface';
import { ValidateMiddleware } from '../common/middlewares/validate.middleware';
import { HttpError } from '../common/error/http-error';
import { HttpErrorCode, HttpErrorMessages } from '../common/error/constants';
import { AuthMiddleware } from './middleware/auth.middleware';
import { JwtService } from './jwt/jwt.service';

@injectable()
export class AuthController extends BaseController implements IAuthController {
	constructor(
		@inject(TYPES.ILogger) logger: ILogger,
		@inject(TYPES.IAuthService) private readonly authService: IAuthService,
		@inject(TYPES.JwtService) private readonly jwtService: JwtService,
	) {
		super(logger);
		this.basePath = BASE_AUTH_PATH;
		this.bindRoutes([
			{
				path: AUTH_PATHS.REGISTER,
				method: 'post',
				func: this.register,
				middlewares: [new ValidateMiddleware(logger, RegisterDto)],
			},
			{
				path: AUTH_PATHS.LOGIN,
				method: 'post',
				func: this.login,
				middlewares: [new ValidateMiddleware(logger, LoginDto)],
			},
			{
				path: AUTH_PATHS.REFRESH_TOKEN,
				method: 'post',
				func: this.refresh,
			},
			{
				path: AUTH_PATHS.LOGOUT,
				method: 'post',
				func: this.logout,
			},
			{
				path: AUTH_PATHS.GET_ME,
				method: 'get',
				func: this.getMe,
				middlewares: [new AuthMiddleware(this.jwtService, logger)],
			},
		]);
	}

	async register(
		req: Request<object, object, RegisterDto>,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		const result = await this.authService.register(req.body);

		if (!result) {
			return next(
				new HttpError(
					HttpErrorCode.CONFLICT,
					HttpErrorMessages[HttpErrorCode.CONFLICT],
					AUTH_PATHS.REGISTER,
				),
			);
		}
		res.cookie('refreshToken', result.refreshToken, {
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			maxAge: 7 * 24 * 60 * 60 * 1000,
		});
		this.created(res, { id: result.id, accessToken: result.accessToken });
	}

	async login(
		req: Request<object, object, LoginDto>,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		const result = await this.authService.login(req.body);
		if (!result) {
			return next(
				new HttpError(HttpErrorCode.UNAUTHORIZED, 'Ошибка авторизации', AUTH_PATHS.LOGIN),
			);
		}
		res.cookie('refreshToken', result.refreshToken, {
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			maxAge: 7 * 24 * 60 * 60 * 1000,
		});
		this.ok(res, { id: result.id, accessToken: result.accessToken });
	}

	refresh(req: Request, res: Response, next: NextFunction): void {
		const refreshToken = req.cookies.refreshToken;
		if (!refreshToken) {
			return next(
				new HttpError(
					HttpErrorCode.TOKEN_MISSING,
					HttpErrorMessages[HttpErrorCode.TOKEN_MISSING],
					AUTH_PATHS.REFRESH_TOKEN,
				),
			);
		}

		const tokens = this.authService.refreshTokens(refreshToken);

		if (!tokens) {
			return next(
				new HttpError(
					HttpErrorCode.TOKEN_INVALID,
					HttpErrorMessages[HttpErrorCode.TOKEN_INVALID],
					AUTH_PATHS.REFRESH_TOKEN,
				),
			);
		}

		res.cookie('refreshToken', tokens.refreshToken, {
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			maxAge: 7 * 24 * 60 * 60 * 1000,
		});

		this.ok(res, { accessToken: tokens.accessToken });
	}

	logout(_req: Request, res: Response): void {
		res.clearCookie('refreshToken');
		this.ok(res, { message: 'Logout successful' });
	}

	async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
		if (!req.user?.email) {
			return next(
				new HttpError(
					HttpErrorCode.UNAUTHORIZED,
					HttpErrorMessages[HttpErrorCode.UNAUTHORIZED],
					AUTH_PATHS.GET_ME,
				),
			);
		}
		const result = await this.authService.getMe(req.user?.email);
		if (!result) {
			return next(
				new HttpError(
					HttpErrorCode.CONFLICT,
					HttpErrorMessages[HttpErrorCode.CONFLICT],
					AUTH_PATHS.GET_ME,
				),
			);
		}
		this.ok(res, { id: result.id });
	}
}
