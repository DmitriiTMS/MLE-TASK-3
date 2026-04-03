import 'reflect-metadata';
import { NextFunction, Request, Response } from 'express';
import { IExeptionFilter } from './exeption.filter.interface';
import { ILogger } from '../logger/logger.interface';
import { HttpError } from './http-error';
import { inject, injectable } from 'inversify';
import { TYPES } from '../types/types';

@injectable()
export class ExeptionFilter implements IExeptionFilter {
	constructor(@inject(TYPES.ILogger) private readonly logger: ILogger) {}

	catch(err: Error | HttpError, _req: Request, res: Response, next: NextFunction): void {
		if (err instanceof HttpError) {
			this.logger.error(`[${err.context}] Ошибка [${err.statusCode}] : ${err.message}`);
			res.status(err.statusCode).send({ message: err.message });
		} else {
			this.logger.error(`${err.message}`);
			res.status(500).send({ message: err.message });
		}
	}
}
