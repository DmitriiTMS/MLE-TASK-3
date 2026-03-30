import { NextFunction, Request, Response } from 'express';
import { IExeptionFilter } from './exeption.filter.interface';
import { ILogger } from '../logger/logger.interface';
import { HttpError } from './http-error';

export class ExeptionFilter implements IExeptionFilter {
	constructor(private readonly logger: ILogger) {}

	catch(err: Error | HttpError, req: Request, res: Response, next: NextFunction): void {
		if (err instanceof HttpError) {
			this.logger.error(`[${err.context}] Ошибка [${err.statusCode}] : ${err.message}`);
			res.status(err.statusCode).send({ message: err.message });
		} else {
			this.logger.error(`${err.message}`);
			res.status(500).send({ message: err.message });
		}
	}
}
