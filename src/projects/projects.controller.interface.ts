import { NextFunction, Request, Response } from 'express';
import { ICreateResponse } from './types';

export interface IProjectsController {
	create(req: Request, res: Response, next: NextFunction): Promise<ICreateResponse>;
}
