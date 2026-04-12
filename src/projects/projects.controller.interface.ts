import { NextFunction, Request, Response } from 'express';

export interface IProjectsController {
	create(req: Request, res: Response, next: NextFunction): Promise<void>;
	getAllProjectsByUserId(req: Request, res: Response, next: NextFunction): Promise<void>;
	getProjectByUserId(req: Request, res: Response, next: NextFunction): Promise<void>;
	update(req: Request, res: Response, next: NextFunction): Promise<void>;
	remove(req: Request, res: Response, next: NextFunction): Promise<void>;
	createTaskForProject(req: Request, res: Response, next: NextFunction): Promise<void>;
}
