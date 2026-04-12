import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { IMiddleware } from '../../common/middlewares/middleware.interface';
import { NextFunction, Request, Response } from 'express';
import { TYPES } from '../../common/types/types';
import { JwtService } from '../jwt/jwt.service';
import { ILogger } from '../../common/logger/logger.interface';

@injectable()
export class AuthMiddleware implements IMiddleware {
	constructor(
		@inject(TYPES.JwtService) private readonly jwtService: JwtService,
		@inject(TYPES.ILogger) private readonly logger?: ILogger,
	) {}

	async execute(req: Request, res: Response, next: NextFunction): Promise<void> {
		const authHeader = req.headers.authorization;

		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			const message = { message: 'Токен не передан' };
			res.status(401).json(message);
			this.logger?.error(message);
			return;
		}

		const token = authHeader.split(' ')[1];

		const decoded = this.jwtService.verifyAccessToken(token);
		if (!decoded) {
			const message = { message: 'Не валидный токен' };
			res.status(401).json(message);
			this.logger?.error(message);
			return;
		}

		req.user = decoded;
		next();
	}
}
