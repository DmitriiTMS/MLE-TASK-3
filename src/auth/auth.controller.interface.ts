import { NextFunction, Request, Response } from 'express';

export interface IAuthController {
	register(
		req: Request,
		res: Response,
		next: NextFunction,
	): Promise<{ id: number; name: string } | void>;
	login(req: Request, res: Response, next: NextFunction): Promise<void>;
}
