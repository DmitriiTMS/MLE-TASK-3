import { NextFunction, Request, Response } from 'express';

export interface IAuthController {
	register(req: Request, res: Response, next: NextFunction): Promise<void>;
	login(req: Request, res: Response, next: NextFunction): Promise<void>;
	refresh(req: Request, res: Response, next: NextFunction): Promise<void>;
	logout(req: Request, res: Response, next: NextFunction): Promise<void>;
	getMe(req: Request, res: Response, next: NextFunction): Promise<void>;
}
