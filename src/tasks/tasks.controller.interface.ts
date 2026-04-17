import { NextFunction, Request, Response } from 'express';

export interface ITasksController {
	getOneTask(req: Request, res: Response, next: NextFunction): Promise<void>;
	update(req: Request, res: Response, next: NextFunction): Promise<void>;
	remove(req: Request, res: Response, next: NextFunction): Promise<void>;
	assignTaskUser(req: Request, res: Response, next: NextFunction): Promise<void>;
}
