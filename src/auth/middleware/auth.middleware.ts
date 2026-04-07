import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { IMiddleware } from '../../common/middlewares/middleware.interface';
import { NextFunction, Request, Response } from 'express';
import { TYPES } from '../../common/types/types';
import { JwtService } from '../jwt/jwt.service';

@injectable()
export class AuthMiddleware implements IMiddleware {
	constructor(@inject(TYPES.JwtService) private readonly jwtService: JwtService) {}

	async execute(req: Request, res: Response, next: NextFunction): Promise<void> {
		const authHeader = req.headers.authorization;

		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			res.status(401).json({ message: 'Токен не передан' });
			return;
		}

		const token = authHeader.split(' ')[1];

		const decoded = this.jwtService.verifyAccessToken(token);
		if (!decoded) {
			res.status(401).json({ message: 'Не валидный токен' });
			return;
		}

		req.user = decoded;
		next();
	}
}
