import { NextFunction, Request, Response } from 'express';

export interface ITimeLogsController {
	getDeveloperTimeLogs(req: Request, res: Response): Promise<void>;
	getProjectTimeLogs(req: Request, res: Response): Promise<void>;
}
