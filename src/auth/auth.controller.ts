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
			{
				path: AUTH_PATH.REFRESH_TOKEN,
				method: 'post',
				func: this.refresh,
			},
			{
				path: AUTH_PATH.LOGOUT,
				method: 'post',
				func: this.logout,
			},
			{
				path: AUTH_PATH.GET_ME,
				method: 'get',
				func: this.getMe,
				middlewares: [new AuthMiddleware(this.jwtService)],
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
					AUTH_PATH.REGISTER,
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
				new HttpError(
					HttpErrorCode.UNAUTHORIZED,
					HttpErrorMessages[HttpErrorCode.UNAUTHORIZED],
					AUTH_PATH.LOGIN,
				),
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

	async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
		const refreshToken = req.cookies.refreshToken;
		if (!refreshToken) {
			return next(
				new HttpError(
					HttpErrorCode.TOKEN_MISSING,
					HttpErrorMessages[HttpErrorCode.TOKEN_MISSING],
					AUTH_PATH.REFRESH_TOKEN,
				),
			);
		}

		const tokens = await this.authService.refreshTokens(refreshToken);

		if (!tokens) {
			return next(
				new HttpError(
					HttpErrorCode.TOKEN_INVALID,
					HttpErrorMessages[HttpErrorCode.TOKEN_INVALID],
					AUTH_PATH.REFRESH_TOKEN,
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

	async logout(_req: Request, res: Response): Promise<void> {
		res.clearCookie('refreshToken');
		this.ok(res, { message: 'Logout successful' });
	}

	async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
		if (!req.user?.email) {
			return;
		}
		const result = await this.authService.getMe(req.user?.email);
		if (!result) {
			return next(
				new HttpError(
					HttpErrorCode.CONFLICT,
					HttpErrorMessages[HttpErrorCode.CONFLICT],
					AUTH_PATH.GET_ME,
				),
			);
		}
		this.ok(res, { id: result.id });
	}
}
