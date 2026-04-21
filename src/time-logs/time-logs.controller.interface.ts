import { NextFunction, Request, Response } from 'express';

export interface ITimeLogsController {
    getDeveloperTimeLogs(req: Request, res: Response, next: NextFunction): Promise<void>;
}