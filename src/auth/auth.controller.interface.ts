import { NextFunction, Request, Response } from 'express';
import { User } from '../users/entitys/user.entity';

export interface IAuthController {
    register(req: Request, res: Response, next: NextFunction): Promise<User>
    login(req: Request, res: Response, next: NextFunction): Promise<void>
}