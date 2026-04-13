import { NextFunction, Request, Response } from 'express';

export interface ITasksController {
	getOneTask(req: Request, res: Response, next: NextFunction): Promise<void>;
}
