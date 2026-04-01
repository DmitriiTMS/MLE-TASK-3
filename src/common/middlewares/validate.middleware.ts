import { Request, Response, NextFunction } from "express";
import { IMiddleware } from "./middleware.interface";

export class ValidateMiddleware implements IMiddleware {
    execute(req: Request, res: Response, next: NextFunction): void { }
    
}